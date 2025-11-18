
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProductAnalysis, WeeklyPlan, UserProfile, HealthGoals } from './types';
import { analyzeProductWithGemini, findAndAnalyzeWithGoogleSearch, analyzeImageWithGemini, generateMealPlanWithGemini } from './services/geminiService';
import { BarcodeIcon, TypeIcon, UploadIcon, CloseIcon, MealPlanIcon, ProfileIcon } from './components/Icons';

declare const Html5Qrcode: any;

type AppState = 'home' | 'scanning' | 'manual' | 'upload' | 'loading' | 'result' | 'error' | 'mealPlanningSetup' | 'mealPlanResult' | 'profile';

type NeoBrutalButtonProps = {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
};

const NeoBrutalButton = ({ onClick, children, className = '', type = 'button' }: NeoBrutalButtonProps) => (
    <button
        type={type}
        onClick={onClick}
        className={`w-full bg-yellow-300 text-black font-bold uppercase p-4 border-2 border-black rounded-lg shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 flex items-center justify-center gap-3 text-lg md:text-xl ${className}`}
    >
        {children}
    </button>
);

const Header = ({ setAppState }: { setAppState: (state: AppState) => void }) => (
    <header className="relative w-full text-center p-6 bg-white border-b-4 border-black">
        <h1 className="text-4xl md:text-5xl font-extrabold text-black font-mono tracking-tighter">HEALTH IS WEALTH</h1>
        <p className="text-lg text-gray-700 font-mono mt-1">AI NUTRITIONIST SCANNER</p>
         <button onClick={() => setAppState('profile')} className="absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-white p-2 rounded-full border-2 border-black hover:bg-yellow-200" aria-label="Open Profile">
            <ProfileIcon className="w-6 h-6"/>
        </button>
    </header>
);

const HomeScreen = ({ setAppState }: { setAppState: (state: AppState) => void }) => (
    <div className="flex flex-col gap-6 p-6">
        {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
        <NeoBrutalButton onClick={() => setAppState('scanning')}><BarcodeIcon /> Scan Barcode</NeoBrutalButton>
        {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
        <NeoBrutalButton onClick={() => setAppState('manual')}><TypeIcon /> Enter Manually</NeoBrutalButton>
        {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
        <NeoBrutalButton onClick={() => setAppState('upload')}><UploadIcon /> Upload Photo</NeoBrutalButton>
        <div className="my-2 border-t-2 border-dashed border-black"></div>
        {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
        <NeoBrutalButton onClick={() => setAppState('mealPlanningSetup')} className="bg-blue-400"><MealPlanIcon /> AI Meal Planner</NeoBrutalButton>
    </div>
);

const ManualInputScreen = ({ onLookup }: { onLookup: (barcode: string) => void }) => {
    const [barcode, setBarcode] = useState('');

    const handleLookup = () => {
        if (barcode.trim()) {
            onLookup(barcode.trim());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleLookup();
    };


    return (
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <label htmlFor="barcode-input" className="font-bold text-lg font-mono">Enter Barcode</label>
            <input
                id="barcode-input"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g., 3017620422003"
                className="w-full p-3 border-2 border-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
            <NeoBrutalButton type="submit">Analyze</NeoBrutalButton>
        </form>
    );
};

const UploadScreen = ({ onAnalyze }: { onAnalyze: (file: File) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAnalyze(file);
        }
    };

    return (
        <div className="p-6">
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
            <NeoBrutalButton onClick={() => inputRef.current?.click()}>
                <UploadIcon /> Select Image
            </NeoBrutalButton>
        </div>
    );
};


const ScannerScreen = ({ onScanSuccess }: { onScanSuccess: (decodedText: string) => void }) => {
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        const qrCodeScanner = new Html5Qrcode("bar-code-reader");
        scannerRef.current = qrCodeScanner;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        qrCodeScanner.start({ facingMode: "environment" }, config, onScanSuccess, (errorMessage: string) => {
            // console.warn(`QR code scan error: ${errorMessage}`);
        }).catch((err: any) => {
            console.error(`Unable to start scanning, error: ${err}`);
        });

        return () => {
            if(scannerRef.current?.isScanning) {
                scannerRef.current.stop().then(() => console.log("Scanner stopped.")).catch((err:any) => console.error("Failed to stop scanner", err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="p-2 md:p-4">
            <div id="bar-code-reader" className="w-full border-2 border-black rounded-lg overflow-hidden"></div>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center p-10 gap-4">
        <div className="w-16 h-16 border-4 border-black border-t-yellow-300 rounded-full animate-spin"></div>
        <p className="font-mono text-lg font-bold">AI Analyzing...</p>
    </div>
);

const ResultScreen = ({ result }: { result: ProductAnalysis }) => {
    const getScoreColor = (score: number) => {
        if (score > 75) return 'bg-green-400';
        if (score > 40) return 'bg-yellow-400';
        return 'bg-red-400';
    };

    return (
        <div className="p-4 space-y-4">
            <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                <img src={result.imageUrl} alt={result.productName} className="w-full h-48 object-contain mx-auto mb-4 rounded-md" />
                <h2 className="text-2xl font-bold font-mono uppercase">{result.productName}</h2>
            </div>

            <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                <h3 className="font-bold font-mono text-xl mb-2">Health Score</h3>
                <div className="flex items-center gap-4">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-black border-2 border-black ${getScoreColor(result.score)}`}>
                        <span className="text-4xl font-bold">{result.score}</span>
                    </div>
                    <p className="text-gray-700 flex-1">/ 100</p>
                </div>
            </div>

            <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                <h3 className="font-bold font-mono text-xl mb-2">AI Nutritionist Note</h3>
                <p className="text-gray-800">{result.recommendation}</p>
            </div>

            <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                <h3 className="font-bold font-mono text-xl mb-2">Nutritional Info</h3>
                <ul className="space-y-2">
                    {Object.entries(result.organizedData).map(([key, value]) => (
                        <li key={key} className="flex justify-between border-b border-dashed border-gray-300 py-1 capitalize">
                            <span className="font-semibold">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                        </li>
                    ))}
                </ul>
            </div>
             {result.sources && result.sources.length > 0 && (
                <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                    <h3 className="font-bold font-mono text-xl mb-2">Sources</h3>
                    <ul className="list-disc list-inside space-y-1">
                        {result.sources.map((source, index) => (
                            <li key={index}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const MealPlannerSetupScreen = ({ onGenerate, historyCount }: { onGenerate: (goals: string, favorites: string, restrictions: string) => void; historyCount: number; }) => {
    const [goals, setGoals] = useState('');
    const [favorites, setFavorites] = useState('');
    const [restrictions, setRestrictions] = useState('');

    const handleGenerate = () => {
        onGenerate(goals, favorites, restrictions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerate();
    };


    return (
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-bold font-mono">AI Meal Planner</h2>
                <p className="text-gray-600">Tell the AI your preferences to generate a custom meal plan.</p>
                {historyCount > 0 && <p className="text-sm text-blue-600 mt-1">Based on your {historyCount} scanned items!</p>}
            </div>
            <div>
                <label htmlFor="goals" className="font-bold text-lg font-mono mb-1 block">Health Goals</label>
                <input id="goals" type="text" value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g., Lose weight, build muscle" className="w-full p-3 border-2 border-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
            </div>
            <div>
                <label htmlFor="favorites" className="font-bold text-lg font-mono mb-1 block">Favorite Foods</label>
                <textarea id="favorites" value={favorites} onChange={e => setFavorites(e.target.value)} placeholder="e.g., Chicken, broccoli, pasta" className="w-full p-3 border-2 border-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" rows={3}></textarea>
            </div>
            <div>
                <label htmlFor="restrictions" className="font-bold text-lg font-mono mb-1 block">Dietary Restrictions</label>
                <input id="restrictions" type="text" value={restrictions} onChange={e => setRestrictions(e.target.value)} placeholder="e.g., Vegetarian, gluten-free" className="w-full p-3 border-2 border-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
            <NeoBrutalButton type="submit">Generate Plan</NeoBrutalButton>
        </form>
    );
};

const MealPlanResultScreen = ({ plan }: { plan: WeeklyPlan }) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'list'>('plan');

    return (
        <div className="p-4 space-y-4">
            <div className="border-2 border-black rounded-lg bg-white p-2 shadow-[4px_4px_0px_#000]">
                <div className="flex border-b-2 border-black">
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`flex-1 p-3 font-bold font-mono uppercase ${activeTab === 'plan' ? 'bg-yellow-300' : 'bg-white'}`}
                    >
                        Meal Plan
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 p-3 font-bold font-mono uppercase border-l-2 border-black ${activeTab === 'list' ? 'bg-yellow-300' : 'bg-white'}`}
                    >
                        Shopping List
                    </button>
                </div>
                <div className="p-4">
                    {activeTab === 'plan' && (
                        <div className="space-y-4">
                            {plan.weeklyPlan.map(daily => (
                                <details key={daily.day} className="border-2 border-black rounded-lg bg-gray-50">
                                    <summary className="font-bold font-mono text-xl p-3 cursor-pointer select-none">{daily.day}</summary>
                                    <div className="p-3 border-t-2 border-black space-y-3">
                                        {Object.entries(daily.meals).map(([mealType, meal]) => (
                                            <div key={mealType}>
                                                <h4 className="font-bold capitalize">{mealType}: {meal.name}</h4>
                                                <p className="text-sm text-gray-700 mt-1">{meal.recipe}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Calories: {meal.nutrition.calories} | Protein: {meal.nutrition.protein}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    )}
                    {activeTab === 'list' && (
                        <div>
                             <ul className="space-y-2">
                                {plan.shoppingList.map((item, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <input type="checkbox" id={`item-${index}`} className="h-5 w-5 accent-yellow-400" />
                                        <label htmlFor={`item-${index}`} className="flex-1">{item.item} ({item.quantity}) - <span className="text-gray-500 text-sm">{item.category}</span></label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProfileScreen = ({
    profile,
    onUpdateProfile,
    history,
    onViewHistoryItem,
    onClearHistory
}: {
    profile: UserProfile | null;
    onUpdateProfile: (newProfile: UserProfile) => void;
    history: ProductAnalysis[];
    onViewHistoryItem: (item: ProductAnalysis) => void;
    onClearHistory: () => void;
}) => {
    const [goals, setGoals] = useState<HealthGoals>(profile?.goals || { calories: 2000, protein: 150, carbs: 200, fat: 70 });

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGoals({ ...goals, [e.target.name]: Number(e.target.value) || 0 });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({ goals });
        alert("Goals saved!");
    };

    return (
        <div className="p-4 space-y-6">
            <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                <h2 className="text-2xl font-bold font-mono mb-4">My Health Goals</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="calories" className="font-bold font-mono block mb-1">Calories</label>
                            <input type="number" name="calories" id="calories" value={goals.calories} onChange={handleGoalChange} className="w-full p-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        </div>
                        <div>
                            <label htmlFor="protein" className="font-bold font-mono block mb-1">Protein (g)</label>
                            <input type="number" name="protein" id="protein" value={goals.protein} onChange={handleGoalChange} className="w-full p-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        </div>
                        <div>
                            <label htmlFor="carbs" className="font-bold font-mono block mb-1">Carbs (g)</label>
                            <input type="number" name="carbs" id="carbs" value={goals.carbs} onChange={handleGoalChange} className="w-full p-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        </div>
                        <div>
                            <label htmlFor="fat" className="font-bold font-mono block mb-1">Fat (g)</label>
                            <input type="number" name="fat" id="fat" value={goals.fat} onChange={handleGoalChange} className="w-full p-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        </div>
                    </div>
                    {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
                    <NeoBrutalButton type="submit">Save Goals</NeoBrutalButton>
                </form>
            </div>

            <div className="border-2 border-black rounded-lg bg-white p-4 shadow-[4px_4px_0px_#000]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-mono">Scan History</h2>
                    {history.length > 0 && <button onClick={onClearHistory} className="text-sm text-red-600 hover:underline font-mono">Clear All</button>}
                </div>
                {history.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {history.map((item) => (
                            <li key={item.id} onClick={() => onViewHistoryItem(item)} className="flex items-center gap-4 p-2 border-2 border-black rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                                <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 object-contain bg-gray-100 rounded-md border border-gray-300" />
                                <div className="flex-1">
                                    <p className="font-bold font-mono">{item.productName}</p>
                                    <p className="text-sm text-gray-600">Score: {item.score}/100</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 font-mono">No items scanned yet. Start scanning to build your history!</p>
                )}
            </div>
        </div>
    );
};


export default function App() {
    const [appState, setAppState] = useState<AppState>('home');
    const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null);
    const [scannedHistory, setScannedHistory] = useState<ProductAnalysis[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('scannedHistory');
            if (savedHistory) setScannedHistory(JSON.parse(savedHistory));
            
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) setProfile(JSON.parse(savedProfile));
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('scannedHistory', JSON.stringify(scannedHistory));
    }, [scannedHistory]);

    useEffect(() => {
        if(profile) localStorage.setItem('userProfile', JSON.stringify(profile));
    }, [profile]);


    const handleProductLookup = useCallback(async (barcode: string) => {
        const historyItem = scannedHistory.find(item => item.barcode === barcode);
        if (historyItem) {
            setAnalysisResult(historyItem);
            setAppState('result');
            return;
        }

        setAppState('loading');
        setError(null);
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
            if (!response.ok) throw new Error("Product not found via Open Food Facts API.");

            const data = await response.json();
            if (data.status === 0 || !data.product) throw new Error("Product not found in Open Food Facts database.");
            
            const product = data.product;
            const hasNutritionalInfo = product.nutriments && Object.keys(product.nutriments).length > 0;
            const hasIngredients = product.ingredients_text && product.ingredients_text.length > 0;
    
            if (!hasNutritionalInfo && !hasIngredients) {
                throw new Error("Incomplete data from Open Food Facts; nutritional info or ingredients missing.");
            }
    
            const result = await analyzeProductWithGemini(product);
            const resultWithId = { ...result, id: barcode, barcode };
            setAnalysisResult(resultWithId);
            setScannedHistory(prev => [resultWithId, ...prev.filter(p => p.id !== barcode)]);
            setAppState('result');
        } catch (e) {
            console.warn("Open Food Facts failed or data was incomplete, falling back to Google Search:", e);
            try {
                const result = await findAndAnalyzeWithGoogleSearch(barcode);
                const resultWithId = { ...result, id: barcode, barcode };
                setAnalysisResult(resultWithId);
                setScannedHistory(prev => [resultWithId, ...prev.filter(p => p.id !== barcode)]);
                setAppState('result');
            } catch (geminiError) {
                console.error("Gemini lookup with Google Search failed:", geminiError);
                setError("Sorry, I couldn't find or analyze this product.");
                setAppState('error');
            }
        }
    }, [scannedHistory]);
    
    const handleImageAnalysis = useCallback(async (file: File) => {
        setAppState('loading');
        setError(null);
        try {
            const id = `image-${Date.now()}`;
            const result = await analyzeImageWithGemini(file);
            const resultWithId = { ...result, id };
            setAnalysisResult(resultWithId);
            setScannedHistory(prev => [resultWithId, ...prev.filter(p => p.id !== id)]);
            setAppState('result');
        } catch (geminiError) {
            console.error("Gemini image analysis failed:", geminiError);
            setError("Sorry, I couldn't analyze this image.");
            setAppState('error');
        }
    }, []);

    const handleGenerateMealPlan = useCallback(async (goals: string, favorites: string, restrictions: string) => {
        setAppState('loading');
        setError(null);
        try {
            const result = await generateMealPlanWithGemini(scannedHistory, goals, favorites, restrictions);
            setMealPlan(result);
            setAppState('mealPlanResult');
        } catch (err) {
            console.error("Meal plan generation failed:", err);
            setError("Sorry, I couldn't generate a meal plan.");
            setAppState('error');
        }
    }, [scannedHistory]);

    const onScanSuccess = useCallback((decodedText: string) => {
        if(appState === 'scanning'){
             handleProductLookup(decodedText);
        }
    }, [handleProductLookup, appState]);


    const resetApp = () => {
        setAppState('home');
        setAnalysisResult(null);
        setError(null);
        setMealPlan(null);
    };
    
    const handleViewHistoryItem = (item: ProductAnalysis) => {
        setAnalysisResult(item);
        setAppState('result');
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear your entire scan history? This cannot be undone.")) {
            setScannedHistory([]);
        }
    };


    const renderContent = () => {
        switch (appState) {
            case 'home':
                return <HomeScreen setAppState={setAppState} />;
            case 'scanning':
                return <ScannerScreen onScanSuccess={onScanSuccess} />;
            case 'manual':
                return <ManualInputScreen onLookup={handleProductLookup} />;
            case 'upload':
                return <UploadScreen onAnalyze={handleImageAnalysis} />;
            case 'loading':
                return <LoadingScreen />;
            case 'result':
                return analysisResult ? <ResultScreen result={analysisResult} /> : <div />;
            case 'mealPlanningSetup':
                return <MealPlannerSetupScreen onGenerate={handleGenerateMealPlan} historyCount={scannedHistory.length} />;
            case 'mealPlanResult':
                return mealPlan ? <MealPlanResultScreen plan={mealPlan} /> : <div />;
            case 'profile':
                return <ProfileScreen profile={profile} onUpdateProfile={setProfile} history={scannedHistory} onViewHistoryItem={handleViewHistoryItem} onClearHistory={handleClearHistory} />;
            case 'error':
                 return (
                    <div className="p-6 text-center">
                        <p className="text-red-600 font-bold text-lg mb-4">{error}</p>
                        {/* Fix: Added children to NeoBrutalButton to resolve missing property error. */}
                        <NeoBrutalButton onClick={resetApp}>Try Again</NeoBrutalButton>
                    </div>
                );
            default:
                return <HomeScreen setAppState={setAppState} />;
        }
    };
    
    const showBackButton = appState !== 'home' && appState !== 'loading';

    return (
        <div className="min-h-screen bg-yellow-50 font-sans">
            <div className="max-w-2xl mx-auto bg-white border-x-4 border-black">
                <Header setAppState={setAppState} />
                <main className="relative">
                    {showBackButton && (
                       <button onClick={resetApp} className="absolute top-2 right-2 z-10 bg-white p-2 rounded-full border-2 border-black hover:bg-yellow-200" aria-label="Close and return home">
                           <CloseIcon className="w-6 h-6"/>
                       </button>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
