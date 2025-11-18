
import React from 'react';
import { AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ResultsDisplayProps {
    result: AnalysisResult | null;
    insights: string;
    isLoading: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, insights, isLoading }) => {

    const handleExport = () => {
        if (!result) return;

        const exportData = {
            appName: "Probabilistic Outcome Analyzer",
            owner: "ANTHONY GEORGE KIBUE",
            contact: "gjoekabz98@gmail.com",
            date: new Date().toISOString(),
            targetOutcome: result.outcomeName,
            highestProbability: `${(result.highestProbability * 100).toFixed(2)}%`,
            optimalPath: result.bestCombination.map(c => ({
                variable: c.variableName,
                choice: c.stateName
            })),
            aiInsights: insights
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `POA_Analysis_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                <p className="text-lg font-semibold text-gray-300">Calculating optimal path...</p>
                <p className="text-sm text-gray-400">Querying Gemini for strategic insights...</p>
            </div>
        );
    }
    
    if (!result) {
        return (
            <div className="flex items-center justify-center h-full text-center text-gray-400">
                <p>Your analysis results and AI insights will appear here.</p>
            </div>
        );
    }
    
    const chartData = [
        { name: 'Highest Probability', value: result.highestProbability * 100, remaining: 100 - (result.highestProbability * 100) }
    ];

    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('####')) return <h4 key={index} className="text-lg font-semibold mt-4 mb-1 text-cyan-300">{line.replace('####', '').trim()}</h4>;
            if (line.startsWith('###')) return <h3 key={index} className="text-xl font-bold mt-4 mb-2 text-cyan-400">{line.replace('###', '').trim()}</h3>;
            if (line.startsWith('##')) return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-cyan-400">{line.replace('##', '').trim()}</h2>;
            if (line.startsWith('#')) return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-cyan-400">{line.replace('#', '').trim()}</h1>;
            if (line.startsWith('- **')) {
                 const boldText = line.match(/\*\*(.*?)\*\*/)?.[1] || '';
                 const restOfText = line.replace(`- **${boldText}**`, '');
                 return <p key={index} className="mb-2"><strong className="font-semibold text-white">{boldText}</strong>{restOfText}</p>;
            }
            if (line.startsWith('- ')) return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
            return <p key={index} className="mb-2 text-gray-300">{line}</p>;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider bg-gray-700 hover:bg-gray-600 text-cyan-400 hover:text-cyan-300 py-2 px-4 rounded-md border border-gray-600 transition-all shadow-sm"
                    title="Download results as JSON"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export JSON
                </button>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-3">Optimal Path for "{result.outcomeName}"</h3>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                    <ul className="space-y-2">
                        {result.bestCombination.map((item, index) => (
                            <li key={index} className="flex items-center">
                                <span className="text-cyan-400 font-semibold mr-2 w-1/3">{item.variableName}:</span>
                                <span className="text-white">{item.stateName}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-3">Highest Probability</h3>
                <div className="h-40 w-full bg-gray-700/50 p-4 rounded-lg">
                   <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#E5E7EB' }}
                                formatter={(value) => [`${(value as number).toFixed(2)}%`, 'Probability']}
                            />
                            <Bar dataKey="value" stackId="a" fill="#22d3ee" radius={[4, 0, 0, 4]}>
                                <Cell fill="#22d3ee" />
                            </Bar>
                             <Bar dataKey="remaining" stackId="a" fill="#4b5563" radius={[0, 4, 4, 0]}>
                                <Cell fill="#4b5563" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <p className="text-center text-4xl font-bold mt-2">{(result.highestProbability * 100).toFixed(2)}%</p>
            </div>

            {insights && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                        </svg>
                        Gemini Strategic Insights
                    </h3>
                    <div className="prose prose-invert bg-gray-700/50 p-4 rounded-lg text-gray-300">
                        {renderMarkdown(insights)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsDisplay;
