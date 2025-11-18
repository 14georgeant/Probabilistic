
import React, { useState } from 'react';

interface TermsModalProps {
    onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('terms');
    const [isChecked, setIsChecked] = useState(false);

    const handleAccept = () => {
        if (isChecked) {
            onAccept();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl border border-cyan-500/30 flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-700 bg-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Probabilistic Outcome Analyzer</h2>
                    <p className="text-gray-400 text-sm">Please review and accept our Terms and Privacy Policy to continue.</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${
                            activeTab === 'terms'
                                ? 'bg-gray-700/50 text-cyan-400 border-b-2 border-cyan-400'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                        }`}
                    >
                        Terms & Conditions
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${
                            activeTab === 'privacy'
                                ? 'bg-gray-700/50 text-cyan-400 border-b-2 border-cyan-400'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                        }`}
                    >
                        Privacy Policy
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto p-6 bg-gray-900/50 text-gray-300 text-sm leading-relaxed space-y-4 custom-scrollbar">
                    {activeTab === 'terms' ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Terms and Conditions</h3>
                            <p>Last updated: {new Date().toLocaleDateString()}</p>
                            
                            <h4 className="font-bold text-white mt-4">1. Introduction</h4>
                            <p>Welcome to the Probabilistic Outcome Analyzer ("the Application"). By accessing or using the Application, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Application.</p>

                            <h4 className="font-bold text-white mt-4">2. Intellectual Property Rights</h4>
                            <p>The Application and its original content, features, and functionality are and will remain the exclusive property of <strong>ANTHONY GEORGE KIBUE</strong>. The Application is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Anthony George Kibue.</p>

                            <h4 className="font-bold text-white mt-4">3. Use License</h4>
                            <p>Permission is granted to temporarily download one copy of the materials (information or software) on the Application for personal, non-commercial transitory viewing only.</p>

                            <h4 className="font-bold text-white mt-4">4. AI-Generated Content Disclaimer</h4>
                            <p>This Application utilizes Artificial Intelligence (Google Gemini API) to generate insights and variables. You acknowledge that:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>AI predictions are probabilistic and not guaranteed facts.</li>
                                <li>The Owner is not liable for any business, financial, or personal decisions made based on these insights.</li>
                                <li>You should verify all AI-generated information independently.</li>
                            </ul>

                            <h4 className="font-bold text-white mt-4">5. Limitation of Liability</h4>
                            <p>In no event shall Anthony George Kibue, nor his partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Application.</p>

                            <h4 className="font-bold text-white mt-4">6. Governing Law</h4>
                            <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction of the Owner, without regard to its conflict of law provisions.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Privacy Policy</h3>
                            <p>Last updated: {new Date().toLocaleDateString()}</p>

                            <h4 className="font-bold text-white mt-4">1. Data Collection and Usage</h4>
                            <p>We prioritize your privacy. This Application functions primarily as a client-side tool. We do not store your personal data, variable definitions, or outcomes on our own persistent servers.</p>

                            <h4 className="font-bold text-white mt-4">2. Third-Party Services (Google Gemini)</h4>
                            <p>To provide analysis and insights, this Application transmits user-generated text inputs (such as variable names and outcome goals) to Google's Gemini API.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Data sent to the API is used solely for the purpose of generating the requested response.</li>
                                <li>Please do not submit sensitive personal information (PII), passwords, or financial secrets into the input fields.</li>
                                <li>Google's use of data is governed by the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google Privacy Policy</a>.</li>
                            </ul>

                            <h4 className="font-bold text-white mt-4">3. Local Storage</h4>
                            <p>This Application uses your device's Local Storage to save your preferences (such as your acceptance of these terms). This data stays on your device and is not transmitted to us.</p>

                            <h4 className="font-bold text-white mt-4">4. Security</h4>
                            <p>We strive to use commercially acceptable means to protect your information, but remember that no method of transmission over the internet, or method of electronic storage is 100% secure. We perform automated checks to prevent malicious inputs, but we cannot guarantee absolute security.</p>

                            <h4 className="font-bold text-white mt-4">5. Contact Us</h4>
                            <p>If you have any questions about this Privacy Policy, please contact the app owner, Anthony George Kibue, at <a href="mailto:gjoekabz98@gmail.com" className="text-cyan-400 underline">gjoekabz98@gmail.com</a>.</p>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-700 bg-gray-800">
                    <div className="flex items-center mb-4">
                        <input
                            id="terms-checkbox"
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="w-5 h-5 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                        />
                        <label htmlFor="terms-checkbox" className="ml-3 text-sm text-gray-300 cursor-pointer select-none">
                            I have read and agree to the <span className="text-white font-semibold">Terms and Conditions</span> and <span className="text-white font-semibold">Privacy Policy</span>.
                        </label>
                    </div>
                    <button
                        onClick={handleAccept}
                        disabled={!isChecked}
                        className={`w-full py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                            isChecked
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/25'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Continue to App
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
