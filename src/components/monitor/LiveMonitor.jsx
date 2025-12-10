// src/components/monitor/LiveMonitor.jsx
// Live sensor data monitor strip with integrated alerts

import { Activity, AlertCircle, Bell, ChevronDown, ChevronUp, Play, Square, Zap } from 'lucide-react';
import { useState } from 'react';
import useSimulationStore from '../../stores/useSimulationStore';
import useWorkflowStore from '../../stores/useWorkflowStore';

function LiveMonitor() {
    const [alertsExpanded, setAlertsExpanded] = useState(false);

    const {
        simulationRunning,
        currentSensorValues,
        simulationTickCount,
        simulationSpeed,
        alertFeed,
        startSimulation,
        stopSimulation,
        setSimulationSpeed,
    } = useSimulationStore();

    const { nodes, edges } = useWorkflowStore();

    const handleToggleSimulation = () => {
        if (simulationRunning) {
            stopSimulation();
        } else {
            startSimulation(nodes, edges);
        }
    };

    const criticalAlerts = alertFeed.filter(a => a.severity === 'critical').length;
    const warningAlerts = alertFeed.filter(a => a.severity === 'warning').length;

    return (
        <div className="border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm flex flex-col">
            {/* Main Strip */}
            <div className="h-[80px] flex">
                {/* Control Panel */}
                <div className="w-[180px] p-3 border-r border-slate-700/50 flex flex-col justify-center gap-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-white">Live Monitor</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleSimulation}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${simulationRunning
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                        >
                            {simulationRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            {simulationRunning ? 'Stop' : 'Start'}
                        </button>
                        <select
                            value={simulationSpeed}
                            onChange={(e) => setSimulationSpeed(e.target.value)}
                            className="bg-slate-800 border border-slate-600/50 rounded px-1.5 py-1 text-xs text-white w-12"
                        >
                            <option value="1">1s</option>
                            <option value="2">2s</option>
                            <option value="5">5s</option>
                        </select>
                    </div>
                </div>

                {/* Sensor Cards - Scrollable */}
                <div className="flex-1 overflow-x-auto min-w-0">
                    <div className="h-full flex items-center gap-2 px-3">
                        {currentSensorValues.length === 0 ? (
                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                {simulationRunning ? 'Waiting for data...' : 'Configure a workflow and start simulation'}
                            </div>
                        ) : (
                            currentSensorValues.map((sensor, idx) => (
                                <SensorCard key={idx} sensor={sensor} />
                            ))
                        )}
                    </div>
                </div>

                {/* Alert Summary */}
                <button
                    onClick={() => setAlertsExpanded(!alertsExpanded)}
                    className="w-[120px] p-3 border-l border-slate-700/50 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/50 transition-colors flex-shrink-0"
                >
                    <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${criticalAlerts > 0 ? 'text-red-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-medium text-white">{alertFeed.length}</span>
                        {alertsExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />}
                    </div>
                    <div className="flex gap-2 text-[10px]">
                        {criticalAlerts > 0 && (
                            <span className="text-red-400">{criticalAlerts} critical</span>
                        )}
                        {warningAlerts > 0 && (
                            <span className="text-orange-400">{warningAlerts} warn</span>
                        )}
                    </div>
                </button>
            </div>

            {/* Expanded Alerts */}
            {alertsExpanded && alertFeed.length > 0 && (
                <div className="border-t border-slate-700/50 p-2 max-h-[150px] overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                        {alertFeed.slice(0, 10).map((alert) => (
                            <AlertChip key={alert.id} alert={alert} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SensorCard({ sensor }) {
    const isAlert = sensor.is_alert;
    const isWarning = sensor.status === 'warning';

    return (
        <div
            className={`flex-shrink-0 w-[140px] p-2.5 rounded-lg bg-slate-800/70 border transition-all ${isAlert
                    ? 'border-red-500/50 shadow-lg shadow-red-500/20'
                    : isWarning
                        ? 'border-orange-500/50'
                        : 'border-slate-600/50'
                }`}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">{sensor.equipment}</span>
                <Activity className={`w-3 h-3 flex-shrink-0 ${isAlert ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div className="text-[10px] text-slate-500 mb-1">{sensor.key}</div>
            <div className="flex items-baseline gap-1">
                <span className={`text-sm font-bold ${isAlert ? 'text-red-400' : 'text-white'}`}>
                    {sensor.value}
                </span>
                <span className="text-[10px] text-slate-600">/ {sensor.threshold}</span>
            </div>
            <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isAlert ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                    style={{ width: `${Math.min(100, sensor.progress_pct)}%` }}
                />
            </div>
        </div>
    );
}

function AlertChip({ alert }) {
    const isCritical = alert.severity === 'critical';

    return (
        <div
            className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${isCritical
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
        >
            <AlertCircle className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{alert.equipment}</span>
            <span className="text-slate-500">{alert.timestamp}</span>
        </div>
    );
}

export default LiveMonitor;
