// src/App.jsx
// Main application with routing - Desktop-first design

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/shared/Navbar';
import Toast from './components/shared/Toast';
import Monitor from './pages/Monitor';
import WorkflowBuilder from './pages/WorkflowBuilder';

function App() {
    return (
        <BrowserRouter>
            <div className="h-screen w-screen overflow-hidden bg-[#0f1419] text-slate-100 flex flex-col">
                <Navbar />
                <main className="flex-1 min-h-0 overflow-hidden">
                    <Routes>
                        <Route path="/" element={<Monitor />} />
                        <Route path="/workflow-builder" element={<WorkflowBuilder />} />
                    </Routes>
                </main>
                <Toast />
            </div>
        </BrowserRouter>
    );
}

export default App;
