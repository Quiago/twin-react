import { Html } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import useMonitorStore from '../../../stores/useMonitorStore';
import useWorkflowStore from '../../../stores/useWorkflowStore';

export default function EquipmentLabel({ name, type, scene }) {
    const [position, setPosition] = useState([0, 0, 0]);
    const navigate = useNavigate();
    const { createEmptyWorkflow } = useWorkflowStore();
    const { openModal } = useMonitorStore();

    useEffect(() => {
        // Find the object position to place the label
        let target = null;
        scene.traverse(o => {
            if (o.name === name) target = o;
        });

        if (target) {
            const box = new THREE.Box3().setFromObject(target);
            const center = box.getCenter(new THREE.Vector3());
            // Move it slightly up
            center.y = box.max.y + 0.5;
            setPosition([center.x, center.y, center.z]);
        }
    }, [name, scene]);

    const handleCreateWorkflow = () => {
        // Create a workflow for this component
        const workflowId = createEmptyWorkflow(`Maintenance: ${name}`);
        console.log(`Created workflow ${workflowId} for ${name}`);
        // Navigate to workflow builder (assuming route exists) or just notify
        // For now, let's just log it or maybe open a toast
    };

    if (!name) return null;

    return (
        <Html position={position} center distanceFactor={10} zIndexRange={[100, 0]}>
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-sm min-w-[200px] text-left transform transition-all duration-200">
                <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {type}
                    </span>
                    <span className="text-xs text-emerald-400">● Running</span>
                </div>

                {/* Quick Knowledge Info */}
                <div className="text-[10px] text-slate-400 mb-3 grid grid-cols-2 gap-x-2 gap-y-1">
                    <span>Temp: 45°C</span>
                    <span>Vib: 0.2mm/s</span>
                    <span>Hrs: 1240</span>
                    <span>Eff: 98%</span>
                </div>

                <div className="border-t border-slate-700 pt-2 flex flex-col gap-1">
                    <button
                        onClick={() => {
                            handleCreateWorkflow();
                            navigate('/workflow-builder');
                        }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-2 rounded w-full transition-colors flex items-center justify-center gap-1"
                    >
                        <span>⚡</span> Create Workflow
                    </button>
                    <button
                        onClick={() => openModal('manual')}
                        className="text-xs hover:bg-slate-700 text-slate-300 py-1 px-2 rounded w-full text-left"
                    >
                        View Manual
                    </button>
                    <button
                        onClick={() => openModal('history')}
                        className="text-xs hover:bg-slate-700 text-slate-300 py-1 px-2 rounded w-full text-left"
                    >
                        History Logs
                    </button>
                </div>
            </div>
        </Html>
    );
}
