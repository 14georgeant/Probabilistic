
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
                    perspective: 1000px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                .dna-container {
                    width: 120px;
                    height: 320px;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: spin 8s linear infinite;
                }
                .base-pair-container {
                    position: absolute;
                    width: 100%;
                    height: 2px;
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
                    /* Animation applies to the content so it doesn't conflict with the container's rotation */
                    animation: expand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .node {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .node-left {
                    left: 0;
                }
                .node-right {
                    right: 0;
                }
            `}</style>

            <div className="dna-scene">
                <div className="dna-container">
                    {Array.from({ length: 40 }).map((_, i) => {
                        // Alternate between Cyan (Blue-ish) and Emerald (Green-ish)
                        const isCyan = i % 2 === 0;
                        
                        // Colors
                        const colorLeft = isCyan ? '#22D3EE' : '#34D399'; // Cyan-400 / Emerald-400
                        const colorRight = isCyan ? '#A5F3FC' : '#6EE7B7'; // Cyan-200 / Emerald-300
                        const lineColor = isCyan ? 'rgba(34, 211, 238, 0.25)' : 'rgba(52, 211, 153, 0.25)';

                        return (
                            <div 
                                key={i} 
                                className="base-pair-container"
                                style={{
                                    top: `${i * 8}px`, // Denser packing (8px spacing)
                                    transform: `rotateY(${i * 24}deg)`, // Tight coil
                                }}
                            >
                                <div 
                                    className="base-pair-content"
                                    style={{ 
                                        animationDelay: `${i * 0.04}s`,
                                        background: lineColor
                                    }}
                                >
                                    <div 
                                        className="node node-left" 
                                        style={{ 
                                            background: colorLeft,
                                            boxShadow: `0 0 8px ${colorLeft}` 
                                        }} 
                                    />
                                    <div 
                                        className="node node-right" 
                                        style={{ 
                                            background: colorRight,
                                            boxShadow: `0 0 8px ${colorRight}` 
                                        }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="h-6 font-mono text-cyan-400 text-sm tracking-[0.2em] font-bold text-center">
                {text}<span className="animate-pulse">_</span>
            </div>
            
            <div className="absolute bottom-8 text-[10px] text-gray-600 font-mono uppercase">
                System v1.0.0
            </div>
        </div>
    );
};

export default DNAStartup;
