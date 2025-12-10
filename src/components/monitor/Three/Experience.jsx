import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
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

            {/* Handle Focus/Isolate Animation */}
            <FocusHandler />

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

// Sub-component to handle camera animation
function FocusHandler() {
    const { isExpanded, selectedObjectName } = useMonitorStore();
    const { camera, scene, controls } = useThree();

    // Camera Animation Logic
    useFrame((state, delta) => {
        if (!controls) return;

        if (isExpanded && selectedObjectName) {
            // Find target
            const targetObj = scene.getObjectByName(selectedObjectName);
            if (targetObj) {
                // Get Center
                const box = new THREE.Box3().setFromObject(targetObj);
                const center = box.getCenter(new THREE.Vector3());

                // Smoothly move target
                controls.target.lerp(center, 4 * delta);
                controls.update();
            }
        }
    });

    // Handle "Isolate" Visual Effect
    useEffect(() => {
        scene.traverse((obj) => {
            if (obj.isMesh) {
                if (!obj.userData.originalMaterial) {
                    // Save original if not saved yet (though we did it in parent useEffect)
                    // But safety first
                    obj.userData.originalMaterial = obj.material.clone();
                }

                if (isExpanded && selectedObjectName) {
                    // Check if this obj belongs to selected group
                    const group = findMeaningfulGroup(obj);
                    const isSelected = group.name === selectedObjectName;

                    if (!isSelected) {
                        // Make transparent/ghost
                        // We need to clone material to not affect shared materials
                        // Actually, for performance, shared materials are better,
                        // but for per-object transparency we might need unique mats
                        // or modify the shared one if it's unique enough.
                        // Let's assume simplest: clone
                        const ghostMat = obj.userData.originalMaterial.clone();
                        ghostMat.transparent = true;
                        ghostMat.opacity = 0.1;
                        obj.material = ghostMat;
                    } else {
                        // Restore original
                        obj.material = obj.userData.originalMaterial;
                    }
                } else {
                    // Restore all
                    obj.material = obj.userData.originalMaterial;
                }
            }
        });
    }, [isExpanded, selectedObjectName, scene]);

    return null;
}
