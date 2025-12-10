// src/components/monitor/ThreeViewer.jsx
// Pure Three.js 3D viewer with mesh selection and highlighting

import { useCallback, useEffect, useRef } from 'react';
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

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
        fillLight.position.set(-10, 5, -10);
        scene.add(fillLight);

        // Grid helper (optional, for reference)
        const gridHelper = new THREE.GridHelper(20, 20, 0x1a2332, 0x1a2332);
        gridHelper.position.y = -0.01;
        scene.add(gridHelper);

        // Load GLB model
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

                // Enable shadows and store original materials
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Store original material for later restoration
                        originalMaterialsRef.current.set(child.uuid, child.material.clone());
                    }
                });

                scene.add(model);
                controls.update();

                console.log('Model loaded successfully');
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                console.log(`Loading model: ${percent}%`);
            },
            (error) => {
                console.error('Error loading model:', error);
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

    // Handle click for mesh selection
    const handleClick = useCallback((event) => {
        if (!containerRef.current || !modelRef.current || !cameraRef.current) return;

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

            // Traverse up to find the main equipment group (not just the mesh)
            // Stop if we hit the scene or a root object that is too generic
            while (targetObject.parent && targetObject.parent !== modelRef.current && targetObject.parent.type !== 'Scene') {
                // Logic: if parent has a specific name, it might be the group. 
                // In GLTF, usually logical groups are parents of meshes.
                targetObject = targetObject.parent;
            }

            // Clean up the name for display
            const rawName = targetObject.name || 'Equipment';
            const cleanName = rawName.replace(/_/g, ' ').replace(/Node/g, '').replace(/Mesh/g, '').trim();

            handle3DSelection(targetObject.name); // Store raw name for identifying 3D object
            // You might want to store clean name separately or derived in store, 
            // but for now we keep ID consistent.
        } else {
            handle3DSelection(null);
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
        const alertMaterial = targetMesh.material.clone();
        alertMaterial.emissive = new THREE.Color(0xff0000);
        alertMaterial.emissiveIntensity = 1;

        let flashCount = 0;

        if (flashIntervalRef.current) {
            clearInterval(flashIntervalRef.current);
        }

        flashIntervalRef.current = setInterval(() => {
            flashCount++;
            if (flashCount % 2 === 0) {
                targetMesh.material = originalMaterial ? originalMaterial.clone() : targetMesh.material;
            } else {
                targetMesh.material = alertMaterial;
            }

            if (flashCount >= 8) {
                clearInterval(flashIntervalRef.current);
                if (originalMaterial) {
                    targetMesh.material = originalMaterial.clone();
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

        const model = modelRef.current;

        // Reset previous selection
        if (selectedMeshRef.current) {
            // Restore all children if it was a group
            selectedMeshRef.current.traverse((child) => {
                if (child.isMesh) {
                    const original = originalMaterialsRef.current.get(child.uuid);
                    if (original) {
                        child.material = original.clone();
                    }
                    if (child.userData.wireframe) {
                        child.remove(child.userData.wireframe);
                        child.userData.wireframe = null;
                    }
                }
            });
            selectedMeshRef.current = null;
        }

        if (!selectedObjectName) return;

        // Find the object by name (it might be a group now)
        const targetObject = model.getObjectByName(selectedObjectName);

        if (targetObject) {
            selectedMeshRef.current = targetObject;

            // Highlight all meshes in this object/group
            targetObject.traverse((child) => {
                if (child.isMesh) {
                    // Create bright highlight material
                    const highlightMaterial = child.material.clone();
                    highlightMaterial.emissive = new THREE.Color(0x00ffff);
                    highlightMaterial.emissiveIntensity = 0.8;
                    highlightMaterial.transparent = true;
                    highlightMaterial.opacity = 1;
                    child.material = highlightMaterial;

                    // Add wireframe
                    const wireframeMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.4,
                    });
                    const wireframeMesh = new THREE.Mesh(child.geometry, wireframeMaterial);
                    wireframeMesh.scale.setScalar(1.01);
                    child.add(wireframeMesh);
                    child.userData.wireframe = wireframeMesh;
                }
            });
        }
    }, [selectedObjectName]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative cursor-pointer"
            onClick={handleClick}
        >
            {/* Loading overlay (shows briefly) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-[#0a0e14] opacity-0 transition-opacity duration-500" id="loading-overlay">
                <div className="text-blue-400 text-sm">Loading 3D Model...</div>
            </div>

            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 text-xs text-slate-500 pointer-events-none">
                Click on equipment to inspect • Drag to rotate • Scroll to zoom
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0f1419]/30 via-transparent to-transparent" />
        </div>
    );
}

export default ThreeViewer;
