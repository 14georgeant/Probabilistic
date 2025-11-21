
import React, { useEffect, useState } from 'react';

interface DNAStartupProps {
    onComplete: () => void;
}

const DNAStartup: React.FC<DNAStartupProps> = ({ onComplete }) => {
    const [isFading, setIsFading] = useState(false);
    const [text, setText] = useState('');
    const fullText = "SEQUENCING PROBABILITIES...";

    useEffect(() => {
        // Typewriter effect for text
        let i = 0;
        const interval = setInterval(() => {
            if (i <= fullText.length) {
                setText(fullText.substring(0, i));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 50);

        // Sequence for fading out
        const timer = setTimeout(() => {
            setIsFading(true);
            setTimeout(() => {
                onComplete();
            }, 800); // Wait for fade transition to finish
        }, 3500); // Duration of animation

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center transition-opacity duration-800 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                @keyframes expand {
                    0% { transform: scaleX(0); opacity: 0; }
                    100% { transform: scaleX(1); opacity: 1; }
                }
                .dna-scene {
                    perspective: 800px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                .dna-container {
                    width: 140px;
                    height: 320px;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: spin 6s linear infinite;
                }
                .base-pair-container {
                    position: absolute;
                    width: 100%;
                    height: 1px; /* Thinner lines (was 2px) */
                    left: 0;
                    transform-style: preserve-3d;
                    transform-origin: center;
                }
                .base-pair-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transform-style: preserve-3d;
                    opacity: 0;
                    animation: expand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    border-radius: 1px;
                }
                .node {
                    position: absolute;
                    width: 4px; /* Smaller nodes (was 6px) */
                    height: 4px; /* Smaller nodes (was 6px) */
                    border-radius: 50%;
                    top: 50%;
                    transform: translateY(-50%);
                    /* Glow removed */
                }
                .node-left {
                    left: -2px; /* Adjusted for size */
                }
                .node-right {
                    right: -2px; /* Adjusted for size */
                }
            `}</style>

            <div className="dna-scene">
                <div className="dna-container">
                    {Array.from({ length: 40 }).map((_, i) => {
                        // Alternate between Cyan (Blue) and Green (Emerald)
                        const isCyan = i % 2 === 0;
                        
                        // Solid distinct colors
                        const colorNodeLeft = isCyan ? '#0891b2' : '#059669'; // Darker shade for depth
                        const colorNodeRight = isCyan ? '#22d3ee' : '#34d399'; // Lighter shade
                        
                        // Solid gradient for the bar, no transparency/glow
                        const lineGradient = isCyan 
                            ? 'linear-gradient(90deg, #0891b2 0%, #22d3ee 100%)'
                            : 'linear-gradient(90deg, #059669 0%, #34d399 100%)';

                        return (
                            <div 
                                key={i} 
                                className="base-pair-container"
                                style={{
                                    top: `${i * 8}px`, 
                                    transform: `rotateY(${i * 20}deg)`,
                                }}
                            >
                                <div 
                                    className="base-pair-content"
                                    style={{ 
                                        animationDelay: `${i * 0.03}s`,
                                        background: lineGradient,
                                        // Box shadow removed
                                    }}
                                >
                                    <div 
                                        className="node node-left" 
                                        style={{ 
                                            backgroundColor: colorNodeLeft,
                                        }} 
                                    />
                                    <div 
                                        className="node node-right" 
                                        style={{ 
                                            backgroundColor: colorNodeRight,
                                        }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="h-6 font-mono text-cyan-400 text-sm tracking-[0.2em] font-bold text-center relative z-10">
                {text}<span className="animate-pulse">_</span>
            </div>
            
            <div className="absolute bottom-8 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                System Initializing
            </div>
        </div>
    );
};

export default DNAStartup;
