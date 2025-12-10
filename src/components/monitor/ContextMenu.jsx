// src/components/monitor/ContextMenu.jsx
// Floating context menu overlay for selected equipment

import { AlertTriangle, Cpu, Gauge, Thermometer, X, ZoomIn, ZoomOut } from 'lucide-react';
import useMonitorStore from '../../stores/useMonitorStore';
import { getStatusColor } from '../../utils/designTokens';

function ContextMenu() {
    const {
        selectedObjectName,
        equipmentTemp,
        equipmentPressure,
        equipmentStatus,
        equipmentRul,
        equipmentLine,
        isExpanded,
        clearSelection,
        toggleExpand,
        handleQuickAction,
    } = useMonitorStore();

    if (!selectedObjectName) return null;

    const statusColor = getStatusColor(equipmentStatus);

    return (
        <div className="glass-panel-premium rounded-xl overflow-hidden animate-fade-in w-full max-w-xs">
            {/* Header */}
            <div className="p-3 border-b border-slate-600/30 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-white truncate">{selectedObjectName}</h3>
                        <p className="text-xs text-slate-400">{equipmentLine}</p>
                    </div>
                </div>
                <button
                    onClick={clearSelection}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors flex-shrink-0"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Status + Metrics Row */}
            <div className="p-3 flex items-center gap-3">
                {/* Status Badge */}
                <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                    style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                        border: `1px solid ${statusColor}50`,
                    }}
                >
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: statusColor }}
                    />
                    {equipmentStatus}
                </div>

                {/* Quick Metrics */}
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-orange-400" />
                        <span className="text-white font-medium">{equipmentTemp}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-blue-400" />
                        <span className="text-white font-medium">{equipmentPressure} PSI</span>
                    </div>
                </div>
            </div>

            {/* Health Bar */}
            <div className="px-3 pb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Remaining Life</span>
                    <span className="text-white font-medium">{equipmentRul} days</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${Math.min(100, equipmentRul)}%`,
                            backgroundColor: equipmentRul > 60 ? '#22c55e' : equipmentRul > 30 ? '#f97316' : '#ef4444',
                        }}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-2 border-t border-slate-600/30 flex gap-2">
                <button
                    onClick={toggleExpand}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs font-medium"
                >
                    {isExpanded ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
                    {isExpanded ? 'Restore' : 'Focus'}
                </button>
                <button
                    onClick={() => handleQuickAction('STOP')}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium"
                >
                    <AlertTriangle className="w-3 h-3" />
                    E-Stop
                </button>
            </div>
        </div>
    );
}

export default ContextMenu;
