// src/stores/useMonitorStore.js
// State management for the Monitor page

import { create } from 'zustand';

const useMonitorStore = create((set, get) => ({
    // === 3D SELECTION ===
    selectedObjectName: '',
    selectedObjectType: 'unknown',
    menuMode: 'main', // main, actions
    isExpanded: false,
    isAlertActive: false,

    // === JS COMMANDS (for model-viewer) ===
    jsCommand: '',

    // === MODALS ===
    activeModal: null, // 'manual', 'history', null
    modalData: null,

    // === EQUIPMENT PROPERTIES ===
    equipmentTemp: 0,
    equipmentPressure: 0,
    equipmentStatus: 'Unknown',
    equipmentRul: 0,
    equipmentLine: '',
    equipmentSensors: [],
    equipmentDependsOn: [],
    equipmentAffects: [],
    equipmentProduct: '',

    openModal: (type) => {
        const { selectedObjectName, selectedObjectType } = get();
        let data = {};

        if (type === 'manual') {
            data = {
                title: `${selectedObjectName} - Operating Manual`,
                version: 'v2.4.1',
                lastUpdated: '2025-10-15',
                sections: [
                    { title: 'Safety Procedures', content: 'Ensure E-Stop is disengaged before startup. Verify pressure valves are open.' },
                    { title: 'Normal Operation', content: 'Set desired RPM/Flow rate via the control panel. Monitor vibration levels continuously.' },
                    { title: 'Maintenance', content: 'Weekly lubrication of bearings required. Check sensor calibration monthly.' },
                    { title: 'Troubleshooting', content: 'If vibration > 3mm/s, initiate emergency shutdown sequence immediately.' }
                ]
            };
        } else if (type === 'history') {
            // Generate random history events
            const events = [];
            const types = ['Maintenance', 'Alert', 'Calibration', 'Operator'];
            for (let i = 0; i < 8; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i * 3);
                events.push({
                    id: i,
                    date: date.toISOString().split('T')[0],
                    type: types[Math.floor(Math.random() * types.length)],
                    description: `Routine check and verification of ${selectedObjectType} parameters.`,
                    user: `User-${Math.floor(Math.random() * 59) + 10}`
                });
            }
            data = { events };
        }

        set({ activeModal: type, modalData: data });
    },

    closeModal: () => set({ activeModal: null, modalData: null }),

    // === ACTIONS ===

    handle3DSelection: (objectName, objectType = 'unknown') => {
        if (!objectName) {
            set({
                selectedObjectName: '',
                selectedObjectType: 'unknown',
                menuMode: 'main',
                isExpanded: false,
                jsCommand: 'restore',
            });
            return;
        }

        // Simulate knowledge graph query with random data
        const rul = Math.floor(Math.random() * 58) + 40;
        const statuses = ['Optimal', 'Warning', 'Critical'];
        const lines = ['Alpha', 'Beta', 'Gamma'];
        const products = ['Vaccine Batch #99', 'Serum Vials 50ml', 'Antibiotic Strips'];

        set({
            selectedObjectName: objectName,
            selectedObjectType: objectType,
            menuMode: 'main',
            equipmentTemp: Math.round((Math.random() * 40 + 45) * 10) / 10,
            equipmentPressure: Math.round((Math.random() * 150 + 100) * 10) / 10,
            equipmentStatus: statuses[Math.floor(Math.random() * 3)],
            equipmentRul: rul,
            equipmentLine: `Line-${lines[Math.floor(Math.random() * 3)]}`,
            equipmentSensors: [
                `Vib-Sens-${Math.floor(Math.random() * 900) + 100}`,
                'Therm-Coupler-A',
                'Flow-Meter-X',
            ],
            equipmentDependsOn: [
                `Feeder-${Math.floor(Math.random() * 5) + 1}`,
                'Power-Unit-Main',
            ],
            equipmentAffects: [
                `Packager-${Math.floor(Math.random() * 10) + 10}`,
                'Quality-Gate-B',
            ],
            equipmentProduct: products[Math.floor(Math.random() * 3)],
        });
    },

    clearSelection: () => {
        set({
            selectedObjectName: '',
            selectedObjectType: 'unknown',
            menuMode: 'main',
            isExpanded: false,
            jsCommand: 'restore',
        });
    },

    setMenuMode: (mode) => set({ menuMode: mode }),

    toggleExpand: () => {
        const { isExpanded, selectedObjectName } = get();
        const newExpanded = !isExpanded;

        set({
            isExpanded: newExpanded,
            jsCommand: newExpanded
                ? `isolate:${selectedObjectName}`
                : 'restore',
        });
    },

    setJsCommand: (command) => set({ jsCommand: command }),

    handleQuickAction: (action) => {
        const { selectedObjectName } = get();
        console.log(`Executing '${action}' on ${selectedObjectName}`);

        if (action === 'STOP') {
            set({ equipmentStatus: 'Critical' });
        }
    },

    setAlertActive: (active) => set({ isAlertActive: active }),
}));

export default useMonitorStore;
