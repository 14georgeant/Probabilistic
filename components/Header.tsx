
import React from 'react';
import { Logo } from './Logo';

interface HeaderProps {
    onOpenTerms?: () => void;
    onOpenTerminal?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenTerms, onOpenTerminal }) => {
    return (
        <header className="bg-gray-800 shadow-lg border-b border-gray-700 relative z-30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center group select-none">
                         <div className="relative shrink-0">
                            <Logo className="h-9 w-9 text-cyan-400 mr-3" />
                         </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-tight">Probabilistic Outcome Analyzer</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                         {onOpenTerminal && (
                            <button 
                                onClick={onOpenTerminal}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700/50 rounded-lg transition-all"
                                title="Open Terminal"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </button>
                        )}
                        
                        {onOpenTerms && (
                            <button 
                                onClick={onOpenTerms}
                                className="text-xs text-gray-500 hover:text-gray-300 uppercase font-bold tracking-wider transition-colors"
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