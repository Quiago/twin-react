// ReactFlow canvas for workflow builder

import { useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    ReactFlowProvider,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import useWorkflowStore from '../../stores/useWorkflowStore';

// Define node types outside component to prevent re-creation
const nodeTypes = {};
const edgeTypes = {};

// Internal component to access ReactFlow context
function Flow() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        handleDrop,
        draggedType,
    } = useWorkflowStore();

    const { screenToFlowPosition } = useReactFlow();

    // Memoize default edge options
    const defaultEdgeOptions = useMemo(() => ({
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
    }), []);

    // Handle drag over - this is critical for drop to work
    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Handle drop on canvas
    const handleCanvasDrop = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            console.log('[WorkflowCanvas] Drop event triggered, draggedType:', draggedType);

            if (!draggedType) {
                console.warn('[WorkflowCanvas] Drop ignored - no draggedType set');
                return;
            }

            // Use screenToFlowPosition for accurate coordinates regardless of zoom/pan
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            console.log('[WorkflowCanvas] Drop position:', position);
            handleDrop(position.x, position.y);
        },
        [draggedType, handleDrop, screenToFlowPosition]
    );

    // Memoize node color function for minimap
    const nodeColor = useCallback((node) => {
        if (node.data?.is_action) return '#3b82f6';
        if (node.data?.configured) return '#22c55e';
        return '#64748b';
    }, []);

    return (
        <div
            id="workflow-canvas"
            className="w-full h-full bg-[#0d1117] relative"
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={handleCanvasDrop}
                onDragOver={handleDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
                connectionLineType="smoothstep"
                snapToGrid={true}
                snapGrid={[15, 15]}
                minZoom={0.2}
                maxZoom={2}
                deleteKeyCode={['Backspace', 'Delete']}
                selectNodesOnDrag={false}
                panOnDrag={[1, 2]}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant="dots"
                    gap={20}
                    size={1}
                    color="rgba(100, 116, 139, 0.15)"
                />
                <Controls
                    className="!bg-slate-800 !border-slate-600 !rounded-lg"
                    showInteractive={false}
                />
            </ReactFlow>

            {/* Drop Zone Indicator */}
            {draggedType && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500/50 bg-blue-500/5 flex items-center justify-center">
                    <div className="text-blue-400 text-sm font-medium bg-slate-900/80 px-4 py-2 rounded-lg">
                        Drop to add node
                    </div>
                </div>
            )}

            {/* Empty State */}
            {nodes.length === 0 && !draggedType && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-slate-500 text-lg mb-2">
                            Drag equipment from the left panel
                        </div>
                        <div className="text-slate-600 text-sm">
                            Connect equipment to actions to create workflows
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WorkflowCanvas() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}

export default WorkflowCanvas;
