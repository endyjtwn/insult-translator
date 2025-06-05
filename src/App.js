import React, { useState, useEffect } from 'react';

// Main App component
const App = () => {
    // State variables for input, languages, translated text, loading, error, and spiciness level
    const [inputText, setInputText] = useState('');
    const [sourceLang, setSourceLang] = useState('en'); // Default source language
    const [targetLang, setTargetLang] = useState('es'); // Default target language
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false); // State for error modal
    const [spicinessLevel, setSpicinessLevel] = useState('spicy'); // Default spiciness level: 'spicy'

    // Available languages for translation
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese (Simplified)' },
        { code: 'ar', name: 'Arabic' },
        { code: 'ru', name: 'Russian' },
        { code: 'hi', name: 'Hindi' },
    ];

    // Function to handle translation and insult generation
    const translateAndSpice = async () => {
        setIsLoading(true);
        setError('');
        setTranslatedText('');
        setShowErrorModal(false); // Hide modal on new translation attempt

        if (!inputText.trim()) {
            setError('Please enter some text to translate.');
            setShowErrorModal(true);
            setIsLoading(false);
            return;
        }

        try {
            // Step 1: Perform the initial translation
            const translationPrompt = `Translate the following text from ${
                languages.find(lang => lang.code === sourceLang).name
            } to ${
                languages.find(lang => lang.code === targetLang).name
            }: '${inputText}'`;

            let chatHistory = [];
            chatHistory.push({ role: 'user', parts: [{ text: translationPrompt }] });

            const payload = { contents: chatHistory };
            const apiKey = ''; // API key is provided by the environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const translationResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const translationResult = await translationResponse.json();

            let baseTranslation = '';
            if (
                translationResult.candidates &&
                translationResult.candidates.length > 0 &&
                translationResult.candidates[0].content &&
                translationResult.candidates[0].content.parts &&
                translationResult.candidates[0].content.parts.length > 0
            ) {
                baseTranslation = translationResult.candidates[0].content.parts[0].text;
            } else {
                setError('Could not get a basic translation. Please try again.');
                setShowErrorModal(true);
                setIsLoading(false);
                return;
            }

            // Step 2: Add the insult/spice to the translated text based on spiciness level
            let insultIntensityDescription = '';
            switch (spicinessLevel) {
                case 'mild':
                    // For mild, we primarily want the translation, with minimal to no insult.
                    // We can either skip the insult step or ask for a very, very subtle tone.
                    // For simplicity and to ensure a translation is always returned,
                    // we'll set the translated text directly to the base translation here
                    // and skip the second API call for insult generation.
                    setTranslatedText(baseTranslation);
                    setIsLoading(false);
                    return; // Exit the function early for mild
                case 'spicy':
                    insultIntensityDescription = 'a slightly sarcastic, witty, or dismissive tone. Make it a subtle jab.';
                    break;
                case 'extra-hot':
                    insultIntensityDescription = 'a very cutting, rude, and dismissive insult. Be as harsh as possible without using vulgar language.';
                    break;
                default:
                    insultIntensityDescription = 'a witty and clever insult.'; // Fallback
            }

            const insultPrompt = `Take the following translated text: '${baseTranslation}'. Now, integrate ${insultIntensityDescription}. The insult should be integrated naturally into the translated sentence, not just appended. If the original text is already negative, make the insult even more cutting. The output should only be the spiced translation, nothing else.`;

            chatHistory = []; // Reset chat history for the new prompt
            chatHistory.push({ role: 'user', parts: [{ text: insultPrompt }] });

            const insultPayload = { contents: chatHistory };
            const insultResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(insultPayload),
            });

            const insultResult = await insultResponse.json();

            if (
                insultResult.candidates &&
                insultResult.candidates.length > 0 &&
                insultResult.candidates[0].content &&
                insultResult.candidates[0].content.parts &&
                insultResult.candidates[0].content.parts.length > 0
            ) {
                setTranslatedText(insultResult.candidates[0].content.parts[0].text);
            } else {
                // If insult generation fails, show the base translation with a warning
                setTranslatedText(`${baseTranslation} (Could not add spice, AI is too polite today.)`);
                setError('Could not add spice to the translation, but here is the base translation.');
                setShowErrorModal(true);
            }
        } catch (err) {
            console.error('Translation error:', err);
            setError('An error occurred during translation. Please try again later.');
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Modal for displaying errors
    const ErrorModal = ({ message, onClose }) => {
        if (!showErrorModal) return null;
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center border-t-4 border-red-500">
                    <h3 className="text-xl font-semibold text-red-700 mb-4">Error!</h3>
                    <p className="text-gray-700 mb-6">{message}</p>
                    <button
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 p-4 sm:p-8 font-inter flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-10 border border-gray-700">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    The Insulting Translator
                </h1>

                <div className="mb-6">
                    <label htmlFor="inputText" className="block text-lg font-medium text-gray-300 mb-2">
                        Enter Text:
                    </label>
                    <textarea
                        id="inputText"
                        className="w-full p-4 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-y min-h-[100px]"
                        placeholder="Type your brilliant thoughts here..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows="4"
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label htmlFor="sourceLang" className="block text-lg font-medium text-gray-300 mb-2">
                            Source Language:
                        </label>
                        <select
                            id="sourceLang"
                            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                        >
                            {languages.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="targetLang" className="block text-lg font-medium text-gray-300 mb-2">
                            Target Language:
                        </label>
                        <select
                            id="targetLang"
                            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                        >
                            {languages.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="spicinessLevel" className="block text-lg font-medium text-gray-300 mb-2">
                            Spiciness Level:
                        </label>
                        <select
                            id="spicinessLevel"
                            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                            value={spicinessLevel}
                            onChange={(e) => setSpicinessLevel(e.target.value)}
                        >
                            <option value="mild">Mild</option>
                            <option value="spicy">Spicy</option>
                            <option value="extra-hot">Extra Hot</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={translateAndSpice}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Spicing it up...
                        </>
                    ) : (
                        'Translate & Insult!'
                    )}
                </button>

                {translatedText && (
                    <div className="mt-8 p-6 bg-gray-700 rounded-lg border border-gray-600 shadow-inner">
                        <h2 className="text-xl font-semibold text-gray-200 mb-3">Your Spiced Translation:</h2>
                        <p className="text-gray-300 text-lg leading-relaxed italic">{translatedText}</p>
                    </div>
                )}
            </div>

            <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />
        </div>
    );
};

export default App;
