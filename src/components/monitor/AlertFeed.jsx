// src/components/monitor/AlertFeed.jsx
// Real-time alert feed display

import { AlertCircle, AlertTriangle, Bell, ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-react';
import useSimulationStore from '../../stores/useSimulationStore';

const SEVERITY_CONFIG = {
    critical: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
    },
    info: {
        icon: Info,
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
    },
};

function AlertFeed() {
    const { alertFeed, showAlertFeed, toggleAlertFeed, clearAlertFeed } = useSimulationStore();

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-white">Alerts</h3>
                        <p className="text-xs text-slate-400">{alertFeed.length} active</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearAlertFeed}
                        className="p-1.5 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                        title="Clear alerts"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleAlertFeed}
                        className="p-1.5 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                    >
                        {showAlertFeed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Alert List */}
            {showAlertFeed && (
                <div className="flex-1 overflow-y-auto">
                    {alertFeed.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            No alerts yet. Start a simulation to see alerts.
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {alertFeed.slice(0, 10).map((alert) => (
                                <AlertCard key={alert.id} alert={alert} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AlertCard({ alert }) {
    const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
    const Icon = config.icon;

    return (
        <div
            className={`p-2.5 rounded-lg border ${config.bg} ${config.border} transition-all hover:scale-[1.02]`}
        >
            <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white truncate">
                            {alert.equipment}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {alert.timestamp}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                        {alert.sensor}: <span className={config.color}>{alert.value}</span> &gt; {alert.threshold}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                            {alert.action_type}
                        </span>
                        {alert.success && (
                            <span className="text-[10px] text-green-400">✓ Sent</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AlertFeed;
