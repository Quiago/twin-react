// src/components/monitor/ThreeViewer.jsx
// Pure Three.js 3D viewer with mesh selection and highlighting

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import useMonitorStore from '../../stores/useMonitorStore';
import useSimulationStore from '../../stores/useSimulationStore';

function ThreeViewer() {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const modelRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const selectedMeshRef = useRef(null);
    const originalMaterialsRef = useRef(new Map());
    const animationIdRef = useRef(null);
    const flashMeshRef = useRef(null);
    const flashIntervalRef = useRef(null);
    const mouseDownPosRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    const { handle3DSelection, selectedObjectName, jsCommand, setJsCommand } = useMonitorStore();
    const { latestAlertEquipment } = useSimulationStore();

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e14);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(8, 6, 8);
        cameraRef.current = camera;

        // Renderer - Optimized settings for faster initial load
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced from 2
        renderer.shadowMap.enabled = false; // Disabled initially for performance
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 3;
        controls.maxDistance = 30;
        controls.target.set(0, 1, 0);
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = false; // Disabled for performance
        scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
        fillLight.position.set(-10, 5, -10);
        scene.add(fillLight);

        // Grid helper (optional, for reference)
        const gridHelper = new THREE.GridHelper(20, 20, 0x1a2332, 0x1a2332);
        gridHelper.position.y = -0.01;
        scene.add(gridHelper);

        // Load GLB model with progress tracking
        const loader = new GLTFLoader();
        loader.load(
            '/pharmaceutical_manufacturing_machinery.glb',
            (gltf) => {
                const model = gltf.scene;
                modelRef.current = model;

                // Center and scale model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5 / maxDim;

                model.scale.setScalar(scale);
                model.position.sub(center.multiplyScalar(scale));
                model.position.y += size.y * scale / 2;

                // Store original materials (shadows disabled for performance)
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = false;
                        child.receiveShadow = false;
                        // Store reference to original material (don't clone yet to avoid stack overflow)
                        // We'll clone only when needed during highlight
                        if (!originalMaterialsRef.current.has(child.uuid)) {
                            originalMaterialsRef.current.set(child.uuid, child.material);
                        }
                    }
                });

                scene.add(model);
                controls.update();

                setIsModelLoaded(true);
                setLoadingProgress(100);
                console.log('Model loaded successfully');
            },
            (progress) => {
                if (progress.total > 0) {
                    // Cap at 100% to prevent display issues
                    const percent = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
                    setLoadingProgress(percent);
                    console.log(`Loading model: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading model:', error);
                setIsModelLoaded(true); // Hide loading screen even on error
            }
        );

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (flashIntervalRef.current) {
                clearInterval(flashIntervalRef.current);
            }
            renderer.dispose();
            controls.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Track mouse down position
    const handleMouseDown = useCallback((event) => {
        mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
        isDraggingRef.current = false;
    }, []);

    // Detect if user is dragging
    const handleMouseMove = useCallback((event) => {
        if (mouseDownPosRef.current) {
            const dx = event.clientX - mouseDownPosRef.current.x;
            const dy = event.clientY - mouseDownPosRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If mouse moved more than 5px, consider it a drag
            if (distance > 5) {
                isDraggingRef.current = true;
            }
        }
    }, []);

    // Handle click for mesh selection (only if not dragging)
    const handleClick = useCallback((event) => {
        try {
            // Don't select if user was dragging
            if (isDraggingRef.current) {
                console.log('[ThreeViewer] Click ignored - user was dragging');
                isDraggingRef.current = false;
                return;
            }

            if (!containerRef.current || !modelRef.current || !cameraRef.current) {
                console.warn('[ThreeViewer] Missing refs for click handling');
                return;
            }

            const container = containerRef.current;
            const rect = container.getBoundingClientRect();

            // Calculate normalized device coordinates
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Raycast
            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
            const intersects = raycasterRef.current.intersectObject(modelRef.current, true);

            if (intersects.length > 0) {
                let targetObject = intersects[0].object;
                console.log('[ThreeViewer] Clicked object:', targetObject.name);

                // Traverse up to find the first meaningful equipment group
                // Stop at the FIRST significant parent (not the highest)
                let currentObject = targetObject;
                let equipmentGroup = null;

                // Walk up the tree to find the first meaningful group
                while (currentObject && currentObject !== modelRef.current) {
                    // Check if this object has a meaningful name
                    if (currentObject.name &&
                        currentObject.name !== '' &&
                        !currentObject.name.includes('_Mesh') &&
                        !currentObject.name.includes('_primitive') &&
                        !currentObject.name.endsWith('_Node') &&
                        currentObject.name !== 'Scene' &&
                        currentObject.name !== 'RootNode') {

                        equipmentGroup = currentObject;
                        console.log('[ThreeViewer] Found equipment group:', currentObject.name);
                        // STOP here - don't keep going up
                        break;
                    }
                    currentObject = currentObject.parent;
                }

                // If no meaningful group found, use the clicked object itself
                if (!equipmentGroup) {
                    equipmentGroup = targetObject;
                    console.log('[ThreeViewer] No parent group found, using clicked object:', targetObject.name);
                }

                console.log('[ThreeViewer] Final selected equipment:', equipmentGroup.name);

                if (equipmentGroup && equipmentGroup.name && equipmentGroup.name !== '') {
                    console.log('[ThreeViewer] Calling handle3DSelection with:', equipmentGroup.name);
                    handle3DSelection(equipmentGroup.name);
                } else {
                    console.warn('[ThreeViewer] Equipment group has no valid name, deselecting');
                    handle3DSelection(null);
                }
            } else {
                console.log('[ThreeViewer] No intersection found, deselecting');
                handle3DSelection(null);
            }
        } catch (error) {
            console.error('[ThreeViewer] Error handling click:', error);
            console.error('[ThreeViewer] Error stack:', error.stack);
            // Don't crash the app, just log the error
            // Try to clear selection to recover from error state
            try {
                handle3DSelection(null);
            } catch (e) {
                console.error('[ThreeViewer] Failed to clear selection after error:', e);
            }
        }
    }, [handle3DSelection]);

    // Handle alert flashing
    useEffect(() => {
        if (!latestAlertEquipment || !modelRef.current) return;

        const model = modelRef.current;

        // Find mesh to flash
        let targetMesh = null;
        model.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes(latestAlertEquipment.toLowerCase())) {
                targetMesh = child;
            }
        });

        if (!targetMesh) return;

        flashMeshRef.current = targetMesh;
        const originalMaterial = originalMaterialsRef.current.get(targetMesh.uuid);

        // Create alert material without cloning to avoid stack overflow
        const alertMaterial = new THREE.MeshStandardMaterial({
            color: originalMaterial?.color || 0xffffff,
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 1,
            metalness: originalMaterial?.metalness || 0,
            roughness: originalMaterial?.roughness || 0.5,
        });

        let flashCount = 0;

        if (flashIntervalRef.current) {
            clearInterval(flashIntervalRef.current);
        }

        flashIntervalRef.current = setInterval(() => {
            flashCount++;
            if (flashCount % 2 === 0) {
                // Restore original material
                targetMesh.material = originalMaterial || targetMesh.material;
            } else {
                targetMesh.material = alertMaterial;
            }

            if (flashCount >= 8) {
                clearInterval(flashIntervalRef.current);
                // Restore original material
                if (originalMaterial) {
                    targetMesh.material = originalMaterial;
                }
            }
        }, 250);

        return () => {
            if (flashIntervalRef.current) {
                clearInterval(flashIntervalRef.current);
            }
        };
    }, [latestAlertEquipment]);

    // Handle isolate/restore commands
    useEffect(() => {
        if (!jsCommand || !modelRef.current || !cameraRef.current || !controlsRef.current) return;

        const camera = cameraRef.current;
        const controls = controlsRef.current;

        if (jsCommand === 'restore') {
            camera.position.set(8, 6, 8);
            controls.target.set(0, 1, 0);
            controls.update();
        } else if (jsCommand.startsWith('isolate:')) {
            // Zoom to selected object
            const targetName = jsCommand.split(':')[1];
            const model = modelRef.current;

            model.traverse((child) => {
                if (child.isMesh && child.name.toLowerCase().includes(targetName.toLowerCase())) {
                    const box = new THREE.Box3().setFromObject(child);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);

                    camera.position.copy(center).add(new THREE.Vector3(maxDim * 2, maxDim, maxDim * 2));
                    controls.target.copy(center);
                    controls.update();
                }
            });
        }

        setJsCommand('');
    }, [jsCommand, setJsCommand]);

    // Handle mesh selection highlight (Group support)
    useEffect(() => {
        if (!modelRef.current) return;

        try {
            const model = modelRef.current;

            // Reset previous selection
            if (selectedMeshRef.current) {
                try {
                    // Restore all children if it was a group
                    selectedMeshRef.current.traverse((child) => {
                        if (child.isMesh) {
                            const original = originalMaterialsRef.current.get(child.uuid);
                            if (original) {
                                // Restore the original material directly (no cloning)
                                child.material = original;
                            }
                        }
                    });
                } catch (error) {
                    console.error('[ThreeViewer] Error restoring previous selection:', error);
                }
                selectedMeshRef.current = null;
            }

            if (!selectedObjectName) return;

            // Find the object by name (it might be a group now)
            let targetObject = model.getObjectByName(selectedObjectName);

            // If exact match not found, try to find by partial match (case insensitive)
            if (!targetObject) {
                console.warn('[ThreeViewer] Exact match not found, trying partial match for:', selectedObjectName);
                model.traverse((child) => {
                    if (!targetObject && child.name &&
                        child.name.toLowerCase().includes(selectedObjectName.toLowerCase())) {
                        targetObject = child;
                        console.log('[ThreeViewer] Found partial match:', child.name);
                    }
                });
            }

            if (!targetObject) {
                console.warn('[ThreeViewer] Object not found (even with partial match):', selectedObjectName);
                // Don't crash - just log available names for debugging
                const availableNames = [];
                model.traverse((child) => {
                    if (child.name && child.name !== '' && child.isMesh) {
                        availableNames.push(child.name);
                    }
                });
                console.log('[ThreeViewer] Available mesh names:', availableNames.slice(0, 20));
                return;
            }

            selectedMeshRef.current = targetObject;

            // Highlight all meshes in this object/group
            targetObject.traverse((child) => {
                if (child.isMesh && child.material) {
                    try {
                        // Store original if not already stored
                        if (!originalMaterialsRef.current.has(child.uuid)) {
                            originalMaterialsRef.current.set(child.uuid, child.material);
                        }

                        // Create a new simple material for highlighting
                        // Avoid cloning to prevent stack overflow with circular references
                        const originalMat = child.material;
                        const highlightMaterial = new THREE.MeshStandardMaterial({
                            color: originalMat.color || 0xffffff,
                            emissive: new THREE.Color(0x00ffff),
                            emissiveIntensity: 1.2,  // Increased for better visibility
                            transparent: true,
                            opacity: 1,
                            metalness: originalMat.metalness || 0,
                            roughness: originalMat.roughness || 0.5,
                        });

                        child.material = highlightMaterial;

                        // Don't add wireframe - it can cause hierarchy issues
                        // Just use the bright emissive material for highlighting
                    } catch (error) {
                        console.error('[ThreeViewer] Error highlighting mesh:', child.name, error);
                    }
                }
            });

            console.log('[ThreeViewer] Successfully highlighted:', selectedObjectName);
        } catch (error) {
            console.error('[ThreeViewer] Error in selection effect:', error);
        }
    }, [selectedObjectName]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative cursor-pointer"
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
        >
            {/* Loading overlay with progress bar */}
            {!isModelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14] z-10">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="text-blue-400 text-sm mb-2">Loading 3D Model...</div>
                        <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <div className="text-slate-500 text-xs mt-2">{loadingProgress}%</div>
                        <div className="text-slate-600 text-xs mt-1">
                            {loadingProgress < 100 ? 'Downloading model (23 MB)...' : 'Processing...'}
                        </div>
                    </div>
                </div>
            )}

            {/* Info overlay */}
            {isModelLoaded && (
                <div className="absolute bottom-4 left-4 text-xs text-slate-500 pointer-events-none">
                    Click on equipment to inspect • Drag to rotate • Scroll to zoom
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0f1419]/30 via-transparent to-transparent" />
        </div>
    );
}

export default ThreeViewer;
