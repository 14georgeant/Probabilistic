import React, { useEffect, useRef, useState, memo } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

const TradaysCalendar: React.FC = () => {
    const financeWidgetRef = useRef<HTMLDivElement>(null);
    const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
    const [customSymbol, setCustomSymbol] = useState('');
    
    // Unique ID for the TradingView container to avoid conflicts
    const chartContainerId = useRef(`tradingview_${Math.random().toString(36).substring(7)}`);

    // 1. Google Finance Interface Replacement (Market Overview Widget)
    useEffect(() => {
        if (financeWidgetRef.current) {
            financeWidgetRef.current.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = "tradingview-widget-container";
            
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
            script.async = true;
            script.type = 'text/javascript';
            script.innerHTML = JSON.stringify({
                "colorTheme": "dark",
                "dateRange": "12M",
                "showChart": true,
                "locale": "en",
                "largeChartUrl": "",
                "isTransparent": true,
                "showSymbolLogo": true,
                "showFloatingTooltip": false,
                "width": "100%",
                "height": "500",
                "plotLineColorGrowing": "rgba(16, 185, 129, 1)",
                "plotLineColorFalling": "rgba(239, 68, 68, 1)",
                "gridLineColor": "rgba(240, 243, 250, 0)",
                "scaleFontColor": "rgba(120, 123, 134, 1)",
                "belowLineFillColorGrowing": "rgba(16, 185, 129, 0.12)",
                "belowLineFillColorFalling": "rgba(239, 68, 68, 0.12)",
                "symbolActiveColor": "rgba(33, 150, 243, 0.12)",
                "tabs": [
                    {
                        "title": "Indices",
                        "symbols": [
                            { "s": "FOREXCOM:SPXUSD", "d": "S&P 500" },
                            { "s": "FOREXCOM:NSXUSD", "d": "Nasdaq 100" },
                            { "s": "FOREXCOM:DJI", "d": "Dow 30" },
                            { "s": "INDEX:NKY", "d": "Nikkei 225" },
                            { "s": "INDEX:DEU40", "d": "DAX Index" },
                            { "s": "FOREXCOM:UKXGBP", "d": "FTSE 100" }
                        ],
                        "originalTitle": "Indices"
                    },
                    {
                        "title": "Commodities",
                        "symbols": [
                            { "s": "CME_MINI:ES1!", "d": "E-Mini S&P" },
                            { "s": "COMEX:GC1!", "d": "Gold" },
                            { "s": "NYMEX:CL1!", "d": "Crude Oil" },
                            { "s": "NYMEX:NG1!", "d": "Natural Gas" },
                            { "s": "CBOT:ZC1!", "d": "Corn" }
                        ],
                        "originalTitle": "Futures"
                    },
                    {
                        "title": "Forex",
                        "symbols": [
                            { "s": "FX:EURUSD", "d": "EUR/USD" },
                            { "s": "FX:GBPUSD", "d": "GBP/USD" },
                            { "s": "FX:USDJPY", "d": "USD/JPY" },
                            { "s": "FX:USDCHF", "d": "USD/CHF" },
                            { "s": "FX:AUDUSD", "d": "AUD/USD" },
                            { "s": "FX:USDCAD", "d": "USD/CAD" }
                        ],
                        "originalTitle": "Forex"
                    }
                ]
            });
            wrapper.appendChild(script);
            financeWidgetRef.current.appendChild(wrapper);
        }
    }, []);

    // 2. TradingView Widget Injection (Advanced Chart)
    useEffect(() => {
        const scriptId = 'tradingview-widget-script';
        
        const initWidget = () => {
            if (window.TradingView && document.getElementById(chartContainerId.current)) {
                 const container = document.getElementById(chartContainerId.current);
                 if(container) container.innerHTML = '';

                 new window.TradingView.widget({
                     "autosize": true,
                     "symbol": selectedSymbol,
                     "interval": "D",
                     "timezone": "Etc/UTC",
                     "theme": "dark",
                     "style": "1",
                     "locale": "en",
                     "toolbar_bg": "#f1f3f6",
                     "enable_publishing": false,
                     "allow_symbol_change": true,
                     "container_id": chartContainerId.current,
                     "hide_side_toolbar": false,
                     "details": true,
                     "hotlist": true,
                     "calendar": false 
                 });
             }
        }

        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = initWidget;
            document.head.appendChild(script);
        } else {
            if (window.TradingView) {
                initWidget();
            } else {
                const interval = setInterval(() => {
                    if (window.TradingView) {
                        clearInterval(interval);
                        initWidget();
                    }
                }, 100);
                setTimeout(() => clearInterval(interval), 5000);
            }
        }
    }, [selectedSymbol]);

    const popularAssets = [
        { name: 'EUR/USD', symbol: 'EURUSD' },
        { name: 'GBP/USD', symbol: 'GBPUSD' },
        { name: 'USD/JPY', symbol: 'USDJPY' },
        { name: 'Gold', symbol: 'XAUUSD' },
        { name: 'Bitcoin', symbol: 'BTCUSD' },
        { name: 'S&P 500', symbol: 'SPX500' },
        { name: 'Nasdaq', symbol: 'NAS100' },
        { name: 'Oil', symbol: 'USOIL' }
    ];

    const handleSymbolSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customSymbol.trim()) {
            setSelectedSymbol(customSymbol.toUpperCase());
            setCustomSymbol('');
        }
    };

    return (
        <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Google Finance Interface Section */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col relative group">
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-900 to-transparent z-10 pointer-events-none"></div>
                
                {/* Redirect Header Overlay */}
                <div className="bg-blue-900/90 p-4 flex justify-between items-center cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => window.open('https://www.google.com/finance', '_blank')}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full">
                             <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div>
                            <h3 className="text-md font-bold text-white">Google Finance Interface</h3>
                            <p className="text-xs text-blue-200">Click header to open full site ↗</p>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>

                {/* Market Overview Widget behaving as Interface Preview */}
                <div className="relative h-[500px] w-full bg-[#131722]">
                    <div ref={financeWidgetRef} className="w-full h-full"></div>
                </div>
            </div>

            {/* Live Chart Section */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-gray-800/80 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            Live Market Chart
                        </h3>
                        
                        <form onSubmit={handleSymbolSubmit} className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={customSymbol}
                                onChange={(e) => setCustomSymbol(e.target.value)}
                                placeholder="Search Symbol (e.g. TSLA)"
                                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                            <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                                Go
                            </button>
                        </form>
                    </div>

                    {/* Asset Selector */}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                        {popularAssets.map(asset => (
                            <button
                                key={asset.symbol}
                                onClick={() => setSelectedSymbol(asset.symbol)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all ${
                                    selectedSymbol === asset.symbol 
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50' 
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-200 hover:border-gray-500'
                                }`}
                            >
                                {asset.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[600px] w-full relative bg-[#131722]">
                    {/* Container for the TradingView Widget */}
                    <div id={chartContainerId.current} className="w-full h-full" />
                </div>
            </div>
        </div>
    );
};

export default memo(TradaysCalendar);