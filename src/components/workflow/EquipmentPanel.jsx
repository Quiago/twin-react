// src/components/workflow/EquipmentPanel.jsx
// Draggable equipment and action nodes panel

import {
    ArrowRight,
    Bell,
    Box,
    ChevronDown, ChevronRight,
    CircleDot,
    Globe,
    GripVertical,
    Mail,
    MessageCircle,
    Package,
    Scan,
    Search
} from 'lucide-react';
import { useState } from 'react';
import useWorkflowStore from '../../stores/useWorkflowStore';

const ICONS = {
    analyzer: Scan,
    robot: Box,
    centrifuge: CircleDot,
    storage: Package,
    conveyor: ArrowRight,
    whatsapp: MessageCircle,
    email: Mail,
    alert: Bell,
    webhook: Globe,
};

function EquipmentPanel() {
    const [equipmentOpen, setEquipmentOpen] = useState(true);
    const [actionsOpen, setActionsOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        equipmentCategories,
        actionCategories,
        startDrag,
        cancelDrag,
    } = useWorkflowStore();

    const handleDragStart = (key, isAction) => (event) => {
        console.log('[EquipmentPanel] Drag started:', key, 'isAction:', isAction);
        event.dataTransfer.effectAllowed = 'move';
        // Store the data in the transfer object
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ key, isAction }));
        event.dataTransfer.setData('text/plain', key);
        startDrag(key, isAction);
    };

    const handleDragEnd = (event) => {
        console.log('[EquipmentPanel] Drag ended, dropEffect:', event.dataTransfer.dropEffect);
        // Only cancel drag if it wasn't dropped successfully
        // The drop handler will clear draggedType if successful
        setTimeout(() => {
            cancelDrag();
        }, 200);
    };

    // Filter categories
    const filteredEquipment = equipmentCategories.filter(
        (cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredActions = actionCategories.filter(
        (cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50">
                <h3 className="font-semibold text-sm text-white mb-2">Components</h3>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Equipment Section */}
                <Section
                    title="Equipment"
                    isOpen={equipmentOpen}
                    onToggle={() => setEquipmentOpen(!equipmentOpen)}
                    color="blue"
                >
                    <div className="grid grid-cols-2 gap-2">
                        {filteredEquipment.map((cat) => (
                            <DraggableNode
                                key={cat.key}
                                category={cat}
                                onDragStart={handleDragStart(cat.key, false)}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>
                </Section>

                {/* Actions Section */}
                <Section
                    title="Actions"
                    isOpen={actionsOpen}
                    onToggle={() => setActionsOpen(!actionsOpen)}
                    color="green"
                >
                    <div className="grid grid-cols-2 gap-2">
                        {filteredActions.map((cat) => (
                            <DraggableNode
                                key={cat.key}
                                category={cat}
                                isAction
                                onDragStart={handleDragStart(cat.key, true)}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>
                </Section>
            </div>

            {/* Help */}
            <div className="p-3 border-t border-slate-700/50">
                <div className="text-xs text-slate-500">
                    Drag components to the canvas to build workflows
                </div>
            </div>
        </div>
    );
}

function Section({ title, isOpen, onToggle, color, children }) {
    const colorClasses = {
        blue: 'text-blue-400',
        green: 'text-green-400',
    };

    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800/50 transition-colors"
            >
                <span className={`text-xs font-medium ${colorClasses[color]}`}>
                    {title}
                </span>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
            </button>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    );
}

function DraggableNode({ category, isAction, onDragStart, onDragEnd }) {
    const Icon = ICONS[category.key] || Box;

    const colorMap = {
        purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30',
        blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30',
        cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30',
        green: 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30',
        yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30',
        red: 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30',
        gray: 'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30',
    };

    const colorClass = colorMap[category.color] || colorMap.gray;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${colorClass}`}
        >
            <GripVertical className="w-3 h-3 opacity-50" />
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium truncate">{category.name}</span>
        </div>
    );
}

export default EquipmentPanel;
