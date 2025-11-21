import React, { useEffect, useRef } from 'react';

const TradaysCalendar: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://www.tradays.com/c/js/widgets/calendar/widget.js?v=13';
            script.async = true;
            // Configuration for the widget
            script.innerHTML = JSON.stringify({
                "width": "100%",
                "height": "600px",
                "mode": "2", // 2 usually implies a specific view mode or includes chart, depending on widget version
                "theme": 1   // 1 = Dark theme, 0 = Light theme
            });
            
            // Clear any existing content and append the script
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        }
    }, []);

    return (
        <div className="w-full bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Economic Calendar (Forex & Energy)
                </h3>
                <span className="text-xs text-gray-500">Powered by Tradays</span>
            </div>
            <div ref={containerRef} className="w-full min-h-[600px] bg-gray-800">
                {/* Widget will be injected here */}
            </div>
        </div>
    );
};

export default TradaysCalendar;