// src/components/monitor/ChatPanel.jsx
// AI Chat panel with streaming support

import { Bot, CheckCircle, Loader2, Send, Trash2, User, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import useAgentStore from '../../stores/useAgentStore';

function ChatPanel() {
    const {
        chatHistory,
        chatInput,
        isThinking,
        isStreaming,
        awaitingApproval,
        pendingWorkflow,
        setChatInput,
        sendMessage,
        clearChat,
        approveWorkflow,
        rejectWorkflow,
    } = useAgentStore();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isStreaming]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (chatInput.trim() && !isThinking) {
            sendMessage();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-white">Nexus AI</h3>
                        <p className="text-xs text-slate-400">
                            {isThinking ? 'Thinking...' : 'Online'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                    title="Clear chat"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((message, idx) => (
                    <ChatMessage key={idx} message={message} isStreaming={isStreaming && idx === chatHistory.length - 1} />
                ))}

                {/* Workflow Approval Buttons */}
                {awaitingApproval && pendingWorkflow && (
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={approveWorkflow}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                        </button>
                        <button
                            onClick={rejectWorkflow}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Nexus AI..."
                        disabled={isThinking}
                        className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || isThinking}
                        className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isThinking ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ChatMessage({ message, isStreaming }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isUser
                        ? 'bg-slate-600'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Bubble */}
            <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/50'
                    }`}
            >
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                    {message.content || (isStreaming && '▋')}
                </div>
                {message.time && (
                    <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
                        {message.time}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPanel;
