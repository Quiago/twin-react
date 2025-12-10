// src/pages/WorkflowBuilder.jsx
// Workflow Builder page with ReactFlow canvas

import { useEffect } from 'react';
import ConfigPanel from '../components/workflow/ConfigPanel';
import EquipmentPanel from '../components/workflow/EquipmentPanel';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import WorkflowToolbar from '../components/workflow/WorkflowToolbar';
import useWorkflowStore from '../stores/useWorkflowStore';

function WorkflowBuilder() {
    const { loadEquipment, showConfigPanel, showEquipmentPanel } = useWorkflowStore();

    // Load equipment on mount
    useEffect(() => {
        loadEquipment();
    }, [loadEquipment]);

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <WorkflowToolbar />

            {/* Main Content */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Equipment Panel - Left */}
                {showEquipmentPanel && (
                    <div className="w-[280px] h-full flex-shrink-0 border-r border-slate-700/50 overflow-hidden">
                        <EquipmentPanel />
                    </div>
                )}

                {/* Canvas - Center */}
                <div className="flex-1 min-w-0 h-full relative">
                    <WorkflowCanvas />
                </div>

                {/* Config Panel - Right */}
                {showConfigPanel && (
                    <div className="w-[320px] h-full flex-shrink-0 border-l border-slate-700/50 overflow-hidden">
                        <ConfigPanel />
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkflowBuilder;
