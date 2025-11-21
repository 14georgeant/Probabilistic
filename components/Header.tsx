
import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface HeaderProps {
    onOpenTerms?: () => void;
    onOpenTerminal?: () => void;
}

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
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-1.5 px-3 rounded-full transition-colors shadow-lg flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 mr-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9.75V1.5m0 0L8.25 5.25M12 1.5 15.75 5.25" />
                                </svg>
                                Install
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
