// src/stores/useSimulationStore.js
// State management for simulation functionality

import { create } from 'zustand';
import { logAlert } from '../services/database';
import { createThresholdAlert } from '../services/notificationService';
import { generateSensorData } from '../services/sensorSimulator';
import { buildAdjacencyMap, evaluateCondition } from '../services/workflowEngine';

const useSimulationStore = create((set, get) => ({
    // === SIMULATION CONTROL ===
    simulationRunning: false,
    simulationSpeed: 2, // seconds between ticks
    simulationTickCount: 0,

    // === SENSOR DATA ===
    currentSensorValues: [],

    // === ALERTS ===
    alertFeed: [],
    latestAlertEquipment: '',
    showAlertFeed: true,

    // === TOAST ===
    toastMessage: '',
    toastType: 'info',
    showToast: false,

    // === CACHED WORKFLOW DATA ===
    cachedNodes: [],
    cachedEdges: [],

    // === ACTIONS ===

    setSimulationSpeed: (speed) => {
        set({ simulationSpeed: parseInt(speed) || 2 });
    },

    startSimulation: (nodes, edges) => {
        const { simulationRunning } = get();

        if (simulationRunning) {
            console.log('[Simulation] Already running');
            return false;
        }

        // Validate workflow
        let hasConfiguredEquipment = false;
        let hasConnectedAction = false;

        for (const node of nodes) {
            if (!node.data?.is_action && node.data?.configured) {
                hasConfiguredEquipment = true;
                for (const edge of edges) {
                    if (edge.source === node.id) {
                        hasConnectedAction = true;
                        break;
                    }
                }
            }
        }

        if (!hasConfiguredEquipment) {
            get().showToastMessage('Configure at least one equipment node first', 'warning');
            return false;
        }

        if (!hasConnectedAction) {
            get().showToastMessage('Connect equipment to an action node first', 'warning');
            return false;
        }

        set({
            cachedNodes: nodes,
            cachedEdges: edges,
            simulationTickCount: 0,
            simulationRunning: true,
        });

        get().showToastMessage(`🚀 Simulation started! Updates every ${get().simulationSpeed}s`, 'success');
        return true;
    },

    stopSimulation: () => {
        set({
            simulationRunning: false,
            currentSensorValues: [],
            latestAlertEquipment: '',
        });
        get().showToastMessage('Simulation stopped', 'info');
    },

    simulationTick: async () => {
        const { simulationRunning, cachedNodes, cachedEdges, simulationTickCount } = get();

        if (!simulationRunning || !cachedNodes.length) {
            return;
        }

        const newTick = simulationTickCount + 1;

        // Generate sensor data
        const { dataDict, dataList } = generateSensorData(cachedNodes, newTick);

        set({
            simulationTickCount: newTick,
            currentSensorValues: dataList,
        });

        console.log(`[Simulation] Tick ${newTick}: ${dataList.length} sensors`);

        // Evaluate workflow and trigger actions
        await get().evaluateAndTrigger(dataDict, newTick);
    },

    evaluateAndTrigger: async (sensorData, tick) => {
        const { cachedNodes, cachedEdges } = get();

        const adjacency = buildAdjacencyMap(cachedEdges);
        const nodesMap = Object.fromEntries(cachedNodes.map(n => [n.id, n]));

        for (const node of cachedNodes) {
            if (node.data?.is_action) continue;

            const config = node.data?.config || {};
            if (!config.sensor_type) continue;

            const equipmentId = config.equipment_id || node.id;
            const sensorType = config.sensor_type;
            const operator = config.operator || '>';
            const threshold = parseFloat(config.threshold || 0);

            const sensorKey = `${equipmentId}.${sensorType}`;
            const currentValue = sensorData[sensorKey];

            if (currentValue === undefined) continue;

            const triggered = evaluateCondition(currentValue, operator, threshold);

            if (triggered) {
                const specificId = config.specific_equipment_id;
                if (specificId) {
                    set({ latestAlertEquipment: specificId });
                }

                const connectedIds = adjacency[node.id] || [];

                for (const actionId of connectedIds) {
                    const actionNode = nodesMap[actionId];
                    if (actionNode) {
                        await get().executeAction(node, actionNode, currentValue, threshold, sensorType);
                    }
                }
            }
        }
    },

    executeAction: async (triggerNode, actionNode, value, threshold, sensorType) => {
        const actionConfig = actionNode.data?.config || {};
        const actionType = actionNode.data?.category || '';
        const equipmentName = triggerNode.data?.label || 'Equipment';
        const severity = actionConfig.severity || 'warning';

        // Prepare alert data
        const alertData = {
            equipment: equipmentName,
            sensor: sensorType,
            value,
            threshold,
            severity,
        };

        let results = [];
        let recipient = '';

        // Use new alert service for email and whatsapp
        if (actionType === 'email' || actionType === 'whatsapp') {
            try {
                results = await processAlertAction(alertData, actionConfig);
                recipient = actionConfig.email || actionConfig.phone_number || '';
            } catch (error) {
                console.error(`[${actionType.toUpperCase()}] Error:`, error);
                results = [{ type: actionType, success: false, error: error.message }];
            }
        } else if (actionType === 'alert') {
            // System alert - just log it
            recipient = 'system';
            results = [{ type: 'system', success: true, result: { message_id: 'system' } }];
            console.log(`[SYSTEM ALERT] ${equipmentName} - ${sensorType}=${value}`);
        } else if (actionType === 'webhook') {
            // Webhook - use existing service
            recipient = actionConfig.webhook_url || '';
            if (recipient) {
                const { sendWebhook } = await import('../services/notificationService');
                const result = await sendWebhook(recipient, {
                    equipment: equipmentName,
                    sensor: sensorType,
                    value,
                    threshold,
                    severity,
                    timestamp: new Date().toISOString(),
                });
                results = [{ type: 'webhook', success: result?.success || false, result }];
                console.log(`[WEBHOOK] Sent to ${recipient}`);
            }
        }

        const success = results.some(r => r.success);

        // Add to alert feed
        const alertEntry = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toLocaleTimeString(),
            equipment: equipmentName,
            sensor: sensorType,
            value,
            threshold,
            action_type: actionType,
            recipient,
            severity,
            success,
        };

        set(state => ({
            alertFeed: [alertEntry, ...state.alertFeed.slice(0, 19)],
        }));

        // Show toast
        const emoji = severity === 'critical' ? '🔴' : '🟡';
        get().showToastMessage(
            `${emoji} ALERT: ${equipmentName} ${sensorType}=${value} (>${threshold})`,
            severity === 'critical' ? 'error' : 'warning'
        );

        // Log to database
        const alertText = createThresholdAlert({
            equipmentName,
            sensor: sensorType,
            value,
            threshold,
            unit: actionConfig.unit || '',
            severity,
        });
        logAlert('', actionType, recipient, alertText.text, success ? 'sent' : 'failed');
    },

    toggleAlertFeed: () => {
        set(state => ({ showAlertFeed: !state.showAlertFeed }));
    },

    clearAlertFeed: () => {
        set({ alertFeed: [], latestAlertEquipment: '' });
    },

    showToastMessage: (message, type = 'info') => {
        set({
            toastMessage: message,
            toastType: type,
            showToast: true,
        });

        // Auto-hide after 4 seconds
        setTimeout(() => {
            set({ showToast: false });
        }, 4000);
    },

    hideToast: () => {
        set({ showToast: false });
    },
}));

export default useSimulationStore;
