// src/components/shared/Navbar.jsx
// Navigation bar with page links

import { Activity, GitBranch, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function Navbar() {
    const linkClass = ({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
            ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`;

    return (
        <nav className="h-14 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-lg flex items-center px-6 gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    NEXUS
                </span>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-700"></div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
                <NavLink to="/" className={linkClass}>
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-medium">Monitor</span>
                </NavLink>

                <NavLink to="/workflow-builder" className={linkClass}>
                    <GitBranch className="w-4 h-4" />
                    <span className="text-sm font-medium">Workflow Builder</span>
                </NavLink>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-400">System Online</span>
            </div>
        </nav>
    );
}

export default Navbar;
