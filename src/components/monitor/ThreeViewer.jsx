import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import useMonitorStore from '../../stores/useMonitorStore';
import Experience from './Three/Experience';

const ThreeViewer = () => {
    const { handle3DSelection } = useMonitorStore();

    return (
        <div className="w-full h-full bg-[#0a0e14] relative text-white">
            <Canvas
                shadows
                camera={{ position: [5, 5, 5], fov: 45 }}
                onPointerMissed={(e) => {
                    // Only deselect if we clicked specifically on the canvas background, not bubbles
                    if (e.type === 'click') handle3DSelection(null);
                }}
            >
                <color attach="background" args={['#0a0e14']} />
                <Suspense fallback={null}>
                    <Experience />
                </Suspense>
            </Canvas>

            {/* Overlay gradient - cosmetic */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0f1419]/50 via-transparent to-transparent" />

            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 text-xs text-slate-500 pointer-events-none">
                Click on equipment to inspect • Three.js Engine
            </div>
        </div>
    );
};

export default ThreeViewer;
