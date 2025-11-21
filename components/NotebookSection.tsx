
import React, { useState } from 'react';

interface AddOn {
    name: string;
    icon: React.ReactNode;
    description: string;
    url?: string;
    onClick?: () => void;
}

interface NotebookSectionProps {
    mode: 'financial' | 'programmer' | 'health' | 'medical' | 'general';
    url: string;
    title: string;
    description: string;
    addons?: AddOn[];
}

const NotebookSection: React.FC<NotebookSectionProps> = ({ mode, url, title, description, addons }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);

    const getTheme = () => {
        switch (mode) {
            case 'financial': return {
                border: 'border-emerald-500/30',
                bg: 'bg-emerald-900/20',
                container: 'from-emerald-900/20 to-gray-900',
                hover: 'group-hover:bg-emerald-500/10',
                iconBg: 'bg-emerald-900/80',
                iconColor: 'text-emerald-400',
                btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20',
                badge: 'bg-emerald-500',
                glow: 'bg-emerald-500/10',
                text: 'text-emerald-100',
                accent: 'text-emerald-400'
            };
            case 'programmer': return {
                border: 'border-lime-500/30',
                bg: 'bg-lime-900/20',
                container: 'from-lime-900/20 to-gray-900',
                hover: 'group-hover:bg-lime-500/10',
                iconBg: 'bg-lime-900/80',
                iconColor: 'text-lime-400',
                btn: 'bg-lime-600 hover:bg-lime-500 shadow-lime-900/20',
                badge: 'bg-lime-500',
                glow: 'bg-lime-500/10',
                text: 'text-lime-100',
                accent: 'text-lime-400'
            };
            case 'medical': return {
                border: 'border-indigo-500/30',
                bg: 'bg-indigo-900/20',
                container: 'from-indigo-900/20 to-gray-900',
                hover: 'group-hover:bg-indigo-500/10',
                iconBg: 'bg-indigo-900/80',
                iconColor: 'text-indigo-400',
                btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20',
                badge: 'bg-indigo-500',
                glow: 'bg-indigo-500/10',
                text: 'text-indigo-100',
                accent: 'text-indigo-400'
            };
            case 'health': return {
                border: 'border-rose-500/30',
                bg: 'bg-rose-900/20',
                container: 'from-rose-900/20 to-gray-900',
                hover: 'group-hover:bg-rose-500/10',
                iconBg: 'bg-rose-900/80',
                iconColor: 'text-rose-400',
                btn: 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20',
                badge: 'bg-rose-500',
                glow: 'bg-rose-500/10',
                text: 'text-rose-100',
                accent: 'text-rose-400'
            };
            default: return {
                border: 'border-cyan-500/30',
                bg: 'bg-cyan-900/20',
                container: 'from-cyan-900/20 to-gray-900',
                hover: 'group-hover:bg-cyan-500/10',
                iconBg: 'bg-cyan-900/80',
                iconColor: 'text-cyan-400',
                btn: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20',
                badge: 'bg-cyan-500',
                glow: 'bg-cyan-500/10',
                text: 'text-cyan-100',
                accent: 'text-cyan-400'
            };
        }
    };

    const theme = getTheme();

    const handleLaunch = () => {
        // Open in a specialized popup to bypass X-Frame-Options (403)
        const w = 1280;
        const h = 800;
        const left = (window.screen.width / 2) - (w / 2);
        const top = (window.screen.height / 2) - (h / 2);
        
        // Use a unique window name per mode to allow multiple notebooks
        window.open(url, `poa_notebook_${mode}`, `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${w}, height=${h}, top=${top}, left=${left}`);
        setIsSessionActive(true);
    };

    return (
        <div className={`rounded-xl border ${theme.border} shadow-lg overflow-hidden mt-8 bg-gradient-to-br ${theme.container} animate-in slide-in-from-bottom duration-700`}>
            <div className="p-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-colors ${theme.glow}`}></div>
                
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-5">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border border-white/5 shadow-inner shrink-0 ${theme.iconBg}`}>
                             <svg className={`w-7 h-7 ${theme.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                {title}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider text-black ${theme.badge}`}>
                                    NOTEBOOK
                                </span>
                            </h3>
                            <p className={`text-sm mt-2 leading-relaxed max-w-2xl opacity-90 ${theme.text}`}>
                                {description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handleLaunch}
                            className={`whitespace-nowrap px-6 py-3 text-white text-sm font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${theme.btn}`}
                        >
                             {isSessionActive ? (
                                <>
                                    <span className="relative flex h-2 w-2 mr-1">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    Reconnect
                                </>
                            ) : (
                                <>
                                    <span>Initialize Workspace</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Session Dashboard */}
                <div className={`mt-6 bg-black/20 rounded-lg border border-white/5 p-4 backdrop-blur-sm transition-all ${isSessionActive ? 'opacity-100' : 'opacity-90'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${theme.accent}`}>
                                {isSessionActive ? 'Secure Workspace Active' : 'Workspace Ready'}
                            </h4>
                            {isSessionActive && <span className="text-[10px] text-gray-400 animate-pulse">● Live Connection</span>}
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono border border-gray-700 px-2 py-0.5 rounded">HTTPS // SECURE</span>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-400">
                             Google NotebookLM uses strict security protocols (X-Frame-Options) that prevent direct embedding. The workspace has been launched in a secure, dedicated window to ensure stability.
                        </p>
                    </div>

                    {/* Integrated Addons / Quick Links */}
                    {addons && addons.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Integrated Tools & Resources</h5>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {addons.map((addon, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => addon.onClick ? addon.onClick() : addon.url && window.open(addon.url, '_blank')}
                                        className={`text-left bg-gray-800/50 hover:bg-gray-700/80 border border-gray-700 hover:border-gray-600 p-3 rounded-lg cursor-pointer transition-all group/addon flex items-center gap-3`}
                                    >
                                        <div className={`p-1.5 rounded bg-gray-800 ${theme.accent}`}>
                                            {addon.icon}
                                        </div>
                                        <div className="overflow-hidden">
                                            <span className="block font-bold text-gray-200 text-xs group-hover/addon:text-white truncate">{addon.name}</span>
                                            <span className="block text-[10px] text-gray-500 truncate">{addon.description}</span>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotebookSection;
