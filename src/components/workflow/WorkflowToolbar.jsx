// src/components/workflow/WorkflowToolbar.jsx
// Toolbar with workflow controls

import {
    Check, Clock,
    FileText,
    FolderOpen,
    PanelLeft,
    PanelLeftClose,
    Play,
    Plus,
    Save,
    Square, Trash2
} from 'lucide-react';
import useSimulationStore from '../../stores/useSimulationStore';
import useWorkflowStore from '../../stores/useWorkflowStore';

function WorkflowToolbar() {
    const {
        currentWorkflowName,
        currentWorkflowStatus,
        savedWorkflows,
        showEquipmentPanel,
        showWorkflowList,
        nodes,
        edges,
        setWorkflowName,
        saveWorkflow,
        newWorkflow,
        loadWorkflow,
        deleteWorkflow,
        clearWorkflow,
        toggleEquipmentPanel,
        toggleWorkflowList,
    } = useWorkflowStore();

    const {
        simulationRunning,
        startSimulation,
        stopSimulation,
    } = useSimulationStore();

    const handleToggleSimulation = () => {
        if (simulationRunning) {
            stopSimulation();
        } else {
            const success = startSimulation(nodes, edges);
            if (success) {
                console.log('Simulation started from workflow builder');
            }
        }
    };

    const handleSave = () => {
        const success = saveWorkflow();
        if (success) {
            console.log('Workflow saved');
        }
    };

    return (
        <div className="h-14 border-b border-slate-700/50 bg-slate-900/80 flex items-center px-4 gap-3">
            {/* Toggle Panel */}
            <button
                onClick={toggleEquipmentPanel}
                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                title={showEquipmentPanel ? 'Hide panel' : 'Show panel'}
            >
                {showEquipmentPanel ? (
                    <PanelLeftClose className="w-5 h-5" />
                ) : (
                    <PanelLeft className="w-5 h-5" />
                )}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-700"></div>

            {/* Workflow Name */}
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={currentWorkflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="bg-transparent border-none text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-2 py-1"
                />
                <StatusBadge status={currentWorkflowStatus} />
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* New */}
                <ToolbarButton
                    icon={Plus}
                    label="New"
                    onClick={newWorkflow}
                />

                {/* Save */}
                <ToolbarButton
                    icon={Save}
                    label="Save"
                    onClick={handleSave}
                    variant="primary"
                />

                {/* Load */}
                <div className="relative">
                    <ToolbarButton
                        icon={FolderOpen}
                        label="Load"
                        onClick={toggleWorkflowList}
                    />

                    {/* Dropdown */}
                    {showWorkflowList && (
                        <WorkflowDropdown
                            workflows={savedWorkflows}
                            onLoad={loadWorkflow}
                            onDelete={deleteWorkflow}
                            onClose={toggleWorkflowList}
                        />
                    )}
                </div>

                {/* Clear */}
                <ToolbarButton
                    icon={Trash2}
                    label="Clear"
                    onClick={clearWorkflow}
                    variant="danger"
                />

                {/* Separator */}
                <div className="h-6 w-px bg-slate-700"></div>

                {/* Run/Stop Simulation */}
                <button
                    onClick={handleToggleSimulation}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${simulationRunning
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        }`}
                >
                    {simulationRunning ? (
                        <>
                            <Square className="w-4 h-4" />
                            Stop Simulation
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Run Simulation
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function ToolbarButton({ icon: Icon, label, onClick, variant = 'default' }) {
    const variants = {
        default: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
        primary: 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20',
        danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/20',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${variants[variant]}`}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function StatusBadge({ status }) {
    const config = {
        draft: { icon: Clock, color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
        active: { icon: Check, color: 'text-green-400 bg-green-500/20 border-green-500/30' },
    };

    const { icon: Icon, color } = config[status] || config.draft;

    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${color}`}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
}

function WorkflowDropdown({ workflows, onLoad, onDelete, onClose }) {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Dropdown */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-400">Saved Workflows</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {workflows.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            No saved workflows
                        </div>
                    ) : (
                        workflows.map((wf) => (
                            <div
                                key={wf.id}
                                className="flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors group"
                            >
                                <button
                                    onClick={() => {
                                        onLoad(wf.id);
                                        onClose();
                                    }}
                                    className="flex-1 text-left"
                                >
                                    <div className="text-sm text-white">{wf.name}</div>
                                    <div className="text-xs text-slate-500">{wf.updated_at}</div>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(wf.id);
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default WorkflowToolbar;
