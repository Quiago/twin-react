// src/components/monitor/ModelViewer.jsx
// 3D Model Viewer wrapper using @google/model-viewer

import '@google/model-viewer';
import { useCallback, useEffect, useRef } from 'react';
import useMonitorStore from '../../stores/useMonitorStore';
import useSimulationStore from '../../stores/useSimulationStore';

function ModelViewer() {
    const viewerRef = useRef(null);
    const flashIntervalRef = useRef(null);

    const { handle3DSelection, jsCommand, setJsCommand } = useMonitorStore();
    const { latestAlertEquipment } = useSimulationStore();

    // Handle click on model using model-viewer's native hit testing
    const handleModelClick = useCallback(async (event) => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const rect = viewer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        try {
            // Use model-viewer's positionAndNormalFromPoint for hit testing
            const hit = viewer.positionAndNormalFromPoint(x, y);

            if (hit) {
                // Get a simulated equipment name based on click position
                // In production, you'd map positions to actual equipment names
                const equipmentName = getEquipmentFromPosition(hit.position);
                if (equipmentName) {
                    handle3DSelection(equipmentName);
                    return;
                }
            }
            // No hit - clear selection
            handle3DSelection(null);
        } catch (e) {
            console.log('Click detection:', e.message);
            handle3DSelection(null);
        }
    }, [handle3DSelection]);

    // Map 3D position to equipment name (simplified)
    function getEquipmentFromPosition(position) {
        // This is a simplified version - in production you'd have actual mesh positions
        // For demo purposes, we simulate equipment detection based on rough position zones
        const { x, y, z } = position;

        // Simulate different equipment zones
        if (x > 0 && x < 2 && z > -1 && z < 1) {
            return 'Centrifuge_01';
        } else if (x > 2 && x < 4 && z > -1 && z < 1) {
            return 'Centrifuge_02';
        } else if (x < 0 && x > -2 && z > 0) {
            return 'Analyzer_Chemical_01';
        } else if (x < -2 && z > 0) {
            return 'Analyzer_Spectral_01';
        } else if (z < -1 && x > 0) {
            return 'Cartesian_Robot_01';
        } else if (z < -1 && x < 0) {
            return 'Cartesian_Robot_02';
        } else if (y > 1) {
            return 'Storage_Tank_01';
        } else if (z > 2) {
            return 'Conveyor_Main';
        }

        // Default - return a random equipment for demo
        const equipment = [
            'Centrifuge_01', 'Centrifuge_02', 'Analyzer_Chemical_01',
            'Cartesian_Robot_01', 'Storage_Tank_01', 'Conveyor_Main'
        ];
        return equipment[Math.floor(Math.random() * equipment.length)];
    }

    // Handle alerts - flash the camera/model
    useEffect(() => {
        if (!latestAlertEquipment || !viewerRef.current) return;

        const viewer = viewerRef.current;

        // Flash effect using exposure changes
        let flashCount = 0;
        const originalExposure = viewer.getAttribute('exposure') || '0.8';

        if (flashIntervalRef.current) {
            clearInterval(flashIntervalRef.current);
        }

        flashIntervalRef.current = setInterval(() => {
            flashCount++;
            if (flashCount % 2 === 0) {
                viewer.setAttribute('exposure', originalExposure);
            } else {
                viewer.setAttribute('exposure', '2'); // Bright flash
            }

            if (flashCount >= 6) {
                clearInterval(flashIntervalRef.current);
                viewer.setAttribute('exposure', originalExposure);
            }
        }, 300);

        return () => {
            if (flashIntervalRef.current) {
                clearInterval(flashIntervalRef.current);
            }
        };
    }, [latestAlertEquipment]);

    // Handle JS commands (camera orbit changes for isolate)
    useEffect(() => {
        if (!jsCommand || !viewerRef.current) return;

        const viewer = viewerRef.current;

        if (jsCommand === 'restore') {
            // Reset to default view
            viewer.setAttribute('camera-orbit', '45deg 55deg 105%');
            viewer.setAttribute('field-of-view', 'auto');
        } else if (jsCommand.startsWith('isolate:')) {
            // Zoom in for "isolate" effect
            viewer.setAttribute('camera-orbit', '0deg 75deg 60%');
            viewer.setAttribute('field-of-view', '30deg');
        }

        setJsCommand('');
    }, [jsCommand, setJsCommand]);

    return (
        <div className="w-full h-full bg-[#0a0e14] relative">
            <model-viewer
                ref={viewerRef}
                src="/pharmaceutical_manufacturing_machinery.glb"
                alt="Pharmaceutical Manufacturing Plant"
                camera-controls
                auto-rotate
                auto-rotate-delay="5000"
                rotation-per-second="10deg"
                environment-image="neutral"
                shadow-intensity="0.5"
                exposure="0.8"
                camera-orbit="45deg 55deg 105%"
                min-camera-orbit="auto auto 50%"
                max-camera-orbit="auto auto 200%"
                onClick={handleModelClick}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0a0e14',
                }}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0f1419]/50 via-transparent to-transparent" />

            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 text-xs text-slate-500">
                Click on equipment to inspect
            </div>
        </div>
    );
}

export default ModelViewer;
