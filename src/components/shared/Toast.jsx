// src/components/shared/Toast.jsx
// Toast notification component

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import useSimulationStore from '../../stores/useSimulationStore';

const ICONS = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
};

const STYLES = {
    success: 'border-green-500/50 bg-green-500/20 text-green-400',
    warning: 'border-orange-500/50 bg-orange-500/20 text-orange-400',
    error: 'border-red-500/50 bg-red-500/20 text-red-400',
    info: 'border-blue-500/50 bg-blue-500/20 text-blue-400',
};

function Toast() {
    const { showToast, toastMessage, toastType, hideToast } = useSimulationStore();

    const Icon = ICONS[toastType] || Info;
    const style = STYLES[toastType] || STYLES.info;

    if (!showToast) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-2xl ${style}`}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium max-w-xs">{toastMessage}</span>
                <button
                    onClick={hideToast}
                    className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default Toast;
