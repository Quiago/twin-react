// src/pages/Monitor.jsx
// Main monitoring dashboard - Desktop-first layout

import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatPanel from '../components/monitor/ChatPanel';
import ContextMenu from '../components/monitor/ContextMenu';
import InfoModal from '../components/monitor/InfoModal';
import LiveMonitor from '../components/monitor/LiveMonitor';
import ThreeViewer from '../components/monitor/ThreeViewer';
import useMonitorStore from '../stores/useMonitorStore';
import useSimulationStore from '../stores/useSimulationStore';

function Monitor() {
    const { selectedObjectName } = useMonitorStore();
    const { simulationRunning, simulationTick, simulationSpeed } = useSimulationStore();
    const intervalRef = useRef(null);
    const [chatOpen, setChatOpen] = useState(true);

    // Simulation ticker
    useEffect(() => {
        if (simulationRunning) {
            intervalRef.current = setInterval(() => {
                simulationTick();
            }, simulationSpeed * 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [simulationRunning, simulationSpeed, simulationTick]);

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Main Row - 3D Viewer + Sidebar */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* LEFT: 3D Viewer Area */}
                <div className="flex-1 min-w-0 relative">
                    <ThreeViewer />
                    <InfoModal />

                    {/* Overlay: Context Menu + Knowledge Graph */}
                    {selectedObjectName && (
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 w-80 max-w-[calc(100%-2rem)]">
                            <ContextMenu />
                            <KnowledgeGraphCompact />
                        </div>
                    )}
                </div>

                {/* RIGHT: Chat Panel (Desktop sidebar) */}
                <div
                    className={`h-full flex-shrink-0 border-l border-slate-700/50 bg-slate-900/95 transition-all duration-300 overflow-hidden ${chatOpen ? 'w-96' : 'w-0'
                        }`}
                >
                    {chatOpen && <ChatPanel />}
                </div>

                {/* Toggle Button for Chat */}
                <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className="absolute top-1/2 -translate-y-1/2 z-20 p-2 rounded-l-lg bg-slate-800 border border-r-0 border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    style={{ right: chatOpen ? '384px' : '0' }}
                >
                    {chatOpen ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                    )}
                </button>
            </div>

            {/* Bottom: Live Monitor Strip */}
            <div className="flex-shrink-0">
                <LiveMonitor />
            </div>
        </div>
    );
}

// Helper to clean names
const cleanName = (name) => {
    if (!name) return 'Unknown';
    return name.replace(/_/g, ' ').replace(/Node/g, '').replace(/Mesh/g, '').trim();
};

// Compact Knowledge Graph for overlay - Visual Version
function KnowledgeGraphCompact() {
    const {
        selectedObjectName,
        equipmentDependsOn,
        equipmentAffects,
        equipmentRul,
    } = useMonitorStore();

    if (!selectedObjectName) return null;

    const mainName = cleanName(selectedObjectName).split('-')[0];
    const upName = equipmentDependsOn[0] ? cleanName(equipmentDependsOn[0]).split('-')[0] : 'Start';
    const downName = equipmentAffects[0] ? cleanName(equipmentAffects[0]).split('-')[0] : 'End';

    // RUL Color
    const rulColor = equipmentRul > 60 ? '#22c55e' : equipmentRul > 30 ? '#f97316' : '#ef4444';

    return (
        <div className="glass-panel-premium rounded-xl p-4 w-full">
            <div className="text-xs font-medium text-slate-400 mb-3 flex justify-between items-center">
                <span>Process Flow</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">Live</span>
            </div>

            <div className="flex items-center justify-between relative px-2">
                {/* SVG Connections Background */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: '14px' }}>
                    <line x1="20%" y1="0" x2="50%" y2="0" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" />
                    <line x1="50%" y1="0" x2="80%" y2="0" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" />
                    {/* Animated flow dots */}
                    <circle r="2" fill="#3b82f6">
                        <animateMotion dur="2s" repeatCount="indefinite" path="M 60 0 L 150 0" />
                    </circle>
                    <circle r="2" fill="#3b82f6">
                        <animateMotion dur="2s" repeatCount="indefinite" begin="1s" path="M 170 0 L 260 0" />
                    </circle>
                </svg>

                {/* Nodes */}
                <div className="flex flex-col items-center gap-1 z-10 w-1/3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shadow-lg">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">{upName}</span>
                </div>

                <div className="flex flex-col items-center gap-1 z-10 w-1/3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] text-white font-bold truncate w-full text-center">{mainName}</span>
                    <div className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] text-slate-300 -mt-1">
                        RUL: <span style={{ color: rulColor }}>{equipmentRul}d</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 z-10 w-1/3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shadow-lg">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">{downName}</span>
                </div>
            </div>
        </div>
    );
}

export default Monitor;
