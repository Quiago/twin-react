// src/App.jsx
// Main application with routing - Desktop-first design

import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/shared/Navbar';
import Toast from './components/shared/Toast';

// Lazy load pages for better performance
const Monitor = lazy(() => import('./pages/Monitor'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));

// Loading fallback component
function LoadingScreen() {
    return (
        <div className="h-full w-full flex items-center justify-center bg-[#0f1419]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm">Loading...</p>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <div className="h-screen w-screen overflow-hidden bg-[#0f1419] text-slate-100 flex flex-col">
                <Navbar />
                <main className="flex-1 min-h-0 overflow-hidden">
                    <Suspense fallback={<LoadingScreen />}>
                        <Routes>
                            <Route path="/" element={<Monitor />} />
                            <Route path="/workflow-builder" element={<WorkflowBuilder />} />
                        </Routes>
                    </Suspense>
                </main>
                <Toast />
            </div>
        </BrowserRouter>
    );
}

export default App;
