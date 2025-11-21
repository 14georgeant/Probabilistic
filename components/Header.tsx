
import React, { useEffect, useState } from 'react';

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
        <header className="bg-gray-800 shadow-lg border-b border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                         <svg className="h-8 w-8 text-cyan-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                        <h1 className="text-2xl font-bold text-white tracking-tight hidden md:block">Probabilistic Outcome Analyzer</h1>
                        <h1 className="text-xl font-bold text-white tracking-tight md:hidden">Outcome Analyzer</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {onOpenTerminal && (
                            <button 
                                onClick={onOpenTerminal}
                                className="text-sm font-mono bg-gray-900 hover:bg-black text-green-400 border border-green-500/50 px-3 py-1.5 rounded transition-colors hidden sm:block"
                            >
                                &gt;_ Gemini CLI
                            </button>
                        )}

                        {installPrompt && (
                            <button 
                                onClick={handleInstallClick}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold py-2 px-4 rounded-full transition-colors shadow-lg flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9.75V1.5m0 0L8.25 5.25M12 1.5 15.75 5.25" />
                                </svg>
                                Install App
                            </button>
                        )}
                        {onOpenTerms && (
                            <button 
                                onClick={onOpenTerms}
                                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                            >
                                Privacy & Terms
                            </button>
                        )}
                        <a href="mailto:gjoekabz98@gmail.com" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors hidden sm:block">
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
