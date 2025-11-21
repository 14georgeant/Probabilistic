
import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface HeaderProps {
    onOpenTerms?: () => void;
    onOpenTerminal?: () => void;
}

const HelixIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 0c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" className="opacity-20" />
        <path d="M18 12c0 3.31-2.69 6-6 6s-6-2.69-6-6" />
        <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" className="opacity-50" />
        <path d="M14.83 9.17a4 4 0 0 0-5.66 5.66" />
        <path d="M14.83 14.83a4 4 0 0 0-5.66-5.66" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ onOpenTerms, onOpenTerminal }) => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;

        // Show the install prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setInstallPrompt(null);
        });
    };

    return (
        <header className="bg-gray-800 shadow-lg border-b border-gray-700 relative z-30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center group select-none">
                         <div className="relative shrink-0">
                            <Logo className="h-9 w-9 text-cyan-400 mr-3" />
                         </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight hidden md:block">Probabilistic Outcome Analyzer</h1>
                            {/* Minimalistic Mobile Header */}
                            <h1 className="font-bold text-white tracking-tight md:hidden flex flex-col leading-none">
                                <span className="text-[10px] text-cyan-400 uppercase tracking-[0.15em] mb-0.5">Probabilistic</span>
                                <span className="text-lg">Outcome Analyzer</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {onOpenTerminal && (
                            <button 
                                onClick={onOpenTerminal}
                                className="text-xs sm:text-sm font-mono bg-gray-900 hover:bg-black text-green-400 border border-green-500/50 px-3 py-1.5 rounded transition-colors hidden sm:block"
                            >
                                &gt;_ CLI
                            </button>
                        )}

                        {installPrompt && (
                            <button 
                                onClick={handleInstallClick}
                                className="bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-2 rounded-full transition-all shadow-lg hover:shadow-cyan-500/30 group relative"
                                aria-label="Install App"
                                title="Download / Install App"
                            >
                                <HelixIcon className="w-6 h-6 animate-spin-slow group-hover:rotate-180 transition-transform duration-700" />
                                <span className="absolute top-full right-0 mt-2 bg-gray-900 text-xs px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700">
                                    Download App
                                </span>
                            </button>
                        )}
                        {onOpenTerms && (
                            <button 
                                onClick={onOpenTerms}
                                className="text-xs sm:text-sm text-gray-400 hover:text-cyan-400 transition-colors hidden sm:block"
                            >
                                Terms
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
