import React, { useState } from 'react';
import { analyzePriceAction } from '../services/geminiService';
import { Variable } from '../types';

interface PriceActionAnalyzerProps {
    onVariableGenerated: (variable: Variable) => void;
    onSecurityRisk: () => void;
    isOnline: boolean;
}

const PriceActionAnalyzer: React.FC<PriceActionAnalyzerProps> = ({ onVariableGenerated, onSecurityRisk, isOnline }) => {
    const [description, setDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size too large. Please use an image under 5MB.");
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleAnalyze = async () => {
        if (!isOnline) {
            setError('Offline mode. Connect to internet to analyze price action.');
            return;
        }
        if (!description.trim() && !selectedImage) {
            setError('Please provide a description OR upload a chart image to analyze.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let base64Image = undefined;
            let mimeType = undefined;
            
            if (selectedImage) {
                 base64Image = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        // remove data:image/xxx;base64, prefix
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedImage);
                 });
                 mimeType = selectedImage.type;
            }

            const variable = await analyzePriceAction(description, base64Image, mimeType);
            onVariableGenerated(variable);
            
            // Cleanup after success
            setDescription('');
            setSelectedImage(null);
            setImagePreview(null);
            
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Analysis failed.';
            if (msg.startsWith('SECURITY_RISK_DETECTED')) {
                onSecurityRisk();
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <p className="text-sm text-gray-400 mb-4">
                Describe the current <strong>Price Action, Chart Pattern, or Technical Indicators</strong>. 
                You can also upload a <strong>chart screenshot</strong> as an external reference.
                Gemini will analyze the pattern and create a probabilistic variable for your model.
            </p>
            
            {/* Image Upload Section */}
            <div className="flex items-center gap-3 mb-4">
                <label className="flex-shrink-0 cursor-pointer bg-gray-700 hover:bg-gray-600 text-emerald-400 hover:text-emerald-300 text-sm font-medium py-2 px-4 rounded-md border border-gray-600 hover:border-emerald-500/50 transition-all flex items-center gap-2 group shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Add External Reference (Image)
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                
                {imagePreview && (
                    <div className="relative group animate-in fade-in zoom-in duration-300">
                        <div className="relative rounded-md overflow-hidden border-2 border-emerald-500 shadow-lg">
                            <img src={imagePreview} alt="Reference" className="h-12 w-12 object-cover" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                        </div>
                        <button 
                            onClick={handleRemoveImage} 
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                            title="Remove Image"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                            {selectedImage?.name}
                        </div>
                    </div>
                )}
                
                <span className="text-xs text-gray-500 italic hidden sm:inline-block ml-2">
                    Supported: .png, .jpg, .webp
                </span>
            </div>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={selectedImage ? "Add optional context about the image (e.g., 'Daily timeframe, looking for reversal')..." : "e.g., Price broke the 200 EMA on the 4H timeframe, retested support at 1.0520, and formed a bullish engulfing candle..."}
                className="w-full h-32 bg-gray-700 border border-emerald-500/30 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none mb-4 transition-all"
                disabled={isLoading}
            />

            {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-2 text-sm rounded mb-3 animate-pulse">{error}</div>}

            <button
                onClick={handleAnalyze}
                disabled={isLoading || !isOnline}
                className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    isLoading || !isOnline
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing {selectedImage ? 'Multimodal Data' : 'Description'}...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Generate Variable from Analysis
                    </>
                )}
            </button>
        </div>
    );
};

export default PriceActionAnalyzer;