import { FileText, History, X } from 'lucide-react';
import useMonitorStore from '../../stores/useMonitorStore';

export default function InfoModal() {
    const { activeModal, modalData, closeModal, selectedObjectName } = useMonitorStore();

    if (!activeModal || !modalData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${activeModal === 'manual' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {activeModal === 'manual' ? <FileText size={20} /> : <History size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white capitalize">{activeModal} View</h2>
                            <p className="text-xs text-slate-400">{selectedObjectName}</p>
                        </div>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0f1419]">
                    {activeModal === 'manual' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                                <div>
                                    <h1 className="text-xl font-bold text-slate-100">{modalData.title}</h1>
                                    <p className="text-sm text-slate-500">Version: {modalData.version}</p>
                                </div>
                                <span className="text-xs text-slate-500">Updated: {modalData.lastUpdated}</span>
                            </div>

                            <div className="grid gap-6">
                                {modalData.sections?.map((section, idx) => (
                                    <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                        <h3 className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">{section.title}</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">{section.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-white">Maintenance Log</h3>
                                <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors text-slate-300">
                                    Export CSV
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-slate-700/50">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-800 text-slate-400 font-medium">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                                        {modalData.events?.map((event) => (
                                            <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-slate-400 font-mono">{event.date}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${event.type === 'Alert' ? 'bg-red-500/20 text-red-400' :
                                                            event.type === 'Maintenance' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-slate-700 text-slate-300'
                                                        }`}>
                                                        {event.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-300">{event.description}</td>
                                                <td className="p-3 text-slate-500">{event.user}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
