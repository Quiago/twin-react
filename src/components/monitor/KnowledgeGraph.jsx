// src/components/monitor/KnowledgeGraph.jsx
// Equipment dependency visualization

import { ChevronRight, Network, Package } from 'lucide-react';
import { useMemo } from 'react';
import useMonitorStore from '../../stores/useMonitorStore';
import { GRAPH_COLORS } from '../../utils/designTokens';

function KnowledgeGraph() {
    const {
        selectedObjectName,
        equipmentDependsOn,
        equipmentAffects,
        equipmentProduct,
        equipmentRul,
    } = useMonitorStore();

    // Build graph data
    const graphData = useMemo(() => {
        const upstream = equipmentDependsOn.map((name, i) => ({
            id: `up-${i}`,
            name,
            type: 'upstream',
        }));

        const downstream = equipmentAffects.map((name, i) => ({
            id: `down-${i}`,
            name,
            type: 'downstream',
        }));

        return { upstream, downstream };
    }, [equipmentDependsOn, equipmentAffects]);

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Network className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-white">Knowledge Graph</h3>
                    <p className="text-xs text-slate-400">Dependencies & Traceability</p>
                </div>
            </div>

            {/* Graph Visualization */}
            <div className="flex-1 p-3 overflow-hidden">
                <div className="h-full flex items-center justify-center gap-4">
                    {/* Upstream */}
                    <div className="flex flex-col gap-2">
                        {graphData.upstream.map((node) => (
                            <GraphNode key={node.id} name={node.name} type="upstream" />
                        ))}
                    </div>

                    {/* Arrows In */}
                    <div className="flex flex-col gap-2">
                        {graphData.upstream.map((node) => (
                            <ChevronRight
                                key={node.id}
                                className="w-4 h-4 text-orange-400"
                            />
                        ))}
                    </div>

                    {/* Selected Node */}
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="px-4 py-2 rounded-lg border-2 text-center"
                            style={{
                                backgroundColor: `${GRAPH_COLORS.selected}20`,
                                borderColor: GRAPH_COLORS.selected,
                            }}
                        >
                            <div className="text-xs font-bold text-blue-400 truncate max-w-[100px]">
                                {selectedObjectName}
                            </div>
                        </div>

                        {/* RUL Indicator */}
                        <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 transform -rotate-90">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="rgba(100,116,139,0.3)"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke={equipmentRul > 60 ? '#22c55e' : equipmentRul > 30 ? '#f97316' : '#ef4444'}
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(equipmentRul / 100) * 125.6} 125.6`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">{equipmentRul}d</span>
                            </div>
                        </div>
                    </div>

                    {/* Arrows Out */}
                    <div className="flex flex-col gap-2">
                        {graphData.downstream.map((node) => (
                            <ChevronRight
                                key={node.id}
                                className="w-4 h-4 text-green-400"
                            />
                        ))}
                    </div>

                    {/* Downstream */}
                    <div className="flex flex-col gap-2">
                        {graphData.downstream.map((node) => (
                            <GraphNode key={node.id} name={node.name} type="downstream" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-2 border-t border-slate-700/30">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800/50">
                    <Package className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs text-slate-400">Product:</span>
                    <span className="text-xs text-white truncate">{equipmentProduct}</span>
                </div>
            </div>
        </div>
    );
}

function GraphNode({ name, type }) {
    const color = type === 'upstream' ? GRAPH_COLORS.upstream : GRAPH_COLORS.downstream;

    return (
        <div
            className="px-2 py-1 rounded text-[10px] font-medium truncate max-w-[80px]"
            style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}50`,
            }}
            title={name}
        >
            {name}
        </div>
    );
}

export default KnowledgeGraph;
