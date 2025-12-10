import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import useMonitorStore from '../../../stores/useMonitorStore';
import useSimulationStore from '../../../stores/useSimulationStore';
import { classifyEquipment, findMeaningfulGroup, flashGroup } from '../../../utils/equipment-utils';
import EquipmentLabel from './EquipmentLabel';

export default function Experience() {
    const glbPath = "/pharmaceutical_manufacturing_machinery.glb";
    const { scene } = useGLTF(glbPath);
    const { handle3DSelection, selectedObjectName, selectedObjectType } = useMonitorStore();
    const { latestAlertEquipment } = useSimulationStore();

    const [hovered, setHovered] = useState(null);

    // Refs for tracking flashing state
    const flashingRef = useRef({});

    // Process scene once loaded to add metadata or pre-process materials
    useEffect(() => {
        if (scene) {
            scene.traverse((obj) => {
                if (obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    // Ensure we have a way to identify original materials
                    obj.userData.originalMaterial = obj.material.clone();
                }
            });
        }
    }, [scene]);

    // Handle Alerts (Red Flash)
    useEffect(() => {
        if (!latestAlertEquipment) return;

        // Find the object
        let target = null;
        scene.traverse((obj) => {
            if (obj.name === latestAlertEquipment) target = obj;
        });

        if (target) {
            // Find meaningful group just in case
            const group = findMeaningfulGroup(target);

            // Flash Red
            const restore = flashGroup(group, 0xff0000);

            // Restore after 3 seconds
            const timer = setTimeout(() => {
                restore();
            }, 3000);
            return () => {
                restore();
                clearTimeout(timer);
            };
        }
    }, [latestAlertEquipment, scene]);

    // Handle Selection Highlight (Orange Flash on select)
    useEffect(() => {
        if (selectedObjectName) {
            let target = null;
            scene.traverse((obj) => {
                if (obj.name === selectedObjectName) target = obj;
            });

            if (target) {
                const group = findMeaningfulGroup(target);
                const restore = flashGroup(group, 0xffaa00);

                // Keep it highlighted? Or just flash? 
                // Let's just flash for feedback as per original request
                const timer = setTimeout(() => {
                    restore();
                }, 800);

                return () => {
                    restore();
                    clearTimeout(timer);
                };
            }
        }
    }, [selectedObjectName, scene]);

    const handleClick = (e) => {
        e.stopPropagation();
        const object = e.object;
        const group = findMeaningfulGroup(object);

        if (group) {
            const type = classifyEquipment(group.name);
            handle3DSelection(group.name, type);
            console.log("Selected:", group.name, "Type:", type);
        }
    };

    const handlePointerOver = (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        setHovered(e.object.name);
    };

    const handlePointerOut = (e) => {
        document.body.style.cursor = 'auto';
        setHovered(null);
    };

    return (
        <>
            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
            <Environment preset="city" />

            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

            {/* Main Model */}
            <primitive
                object={scene}
                scale={1}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            />

            {/* Interactive Label for selected item */}
            {selectedObjectName && (
                <EquipmentLabel
                    name={selectedObjectName}
                    type={selectedObjectType}
                    scene={scene}
                />
            )}
        </>
    );
}
