"use client";

import { useState, useEffect } from "react";

interface ScrapedData {
  url: string;
  title: string;
  description: string;
  content: string;
}

export default function Onboarding() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [thinkingStep, setThinkingStep] = useState(0);
  const [thinkingText, setThinkingText] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);

  const thinkingMessages = [
    "Analyzing your website...",
    "Extracting content structure...",
    "Processing page metadata...",
    "Understanding your design...",
    "Evaluating user experience...",
    "Finalizing analysis..."
  ];

  // Typing animation for messages
  useEffect(() => {
    if (!loading) return;
    
    let timeoutId: NodeJS.Timeout;
    setDisplayText("");
    setIsTyping(true);
    
    const typeMessage = (message: string, index: number = 0) => {
      if (index <= message.length) {
        setDisplayText(message.slice(0, index));
        timeoutId = setTimeout(() => typeMessage(message, index + 1), 50);
      } else {
        setIsTyping(false);
      }
    };
    
    typeMessage(thinkingText);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [thinkingText, loading]);
  
  // Progress and message management
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setThinkingStep(0);
      return;
    }
    
    setThinkingStep(0);
    setThinkingText(thinkingMessages[0]);
    setProgress(0);
    
    const messageInterval = setInterval(() => {
      setThinkingStep((prev) => {
        const next = prev < thinkingMessages.length - 1 ? prev + 1 : prev;
        if (next < thinkingMessages.length) {
          setThinkingText(thinkingMessages[next]);
        }
        return next;
      });
    }, 3000);
    
    // Smooth progress increment
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 3 + 1; // Random increment between 1-4%
        return Math.min(prev + increment, 95); // Cap at 95% until completion
      });
    }, 200);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setScrapedData(null);
    setShowManualForm(false);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setScrapedData(result.data);
      } else {
        setError(result.error || 'Failed to scrape the website');
        setShowManualForm(true);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setShowManualForm(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-white font-[family-name:var(--font-geist-sans)] p-5 overflow-hidden" 
           style={{
             background: "radial-gradient(ellipse at center, #3a1a00 0%, #2a1500 25%, #1f0f00 50%, #150a00 75%, #0a0500 100%)"
           }}>
        
        {/* Animated Background Neural Network */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating AI nodes */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-30"
              style={{
                background: "linear-gradient(45deg, #ff6b35, #f7931e)",
                width: `${Math.random() * 6 + 3}px`,
                height: `${Math.random() * 6 + 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `aiFloat ${4 + Math.random() * 6}s ease-in-out infinite ${Math.random() * 3}s`,
                boxShadow: "0 0 10px rgba(255, 107, 53, 0.3)"
              }}
            />
          ))}
          
          {/* Connecting neural paths */}
          <svg className="absolute inset-0 w-full h-full">
            {[...Array(15)].map((_, i) => (
              <line
                key={i}
                x1={`${Math.random() * 100}%`}
                y1={`${Math.random() * 100}%`}
                x2={`${Math.random() * 100}%`}
                y2={`${Math.random() * 100}%`}
                stroke="rgba(255, 107, 53, 0.1)"
                strokeWidth="1"
                style={{ 
                  animation: `neuralPulse ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
                }}
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-[600px] w-full">
          {/* Enhanced AI Logo with Holographic Effect */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Main logo */}
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white relative overflow-hidden"
                   style={{
                     background: "linear-gradient(45deg, #ff6b35, #f7931e)",
                     animation: "logoGlow 3s ease-in-out infinite",
                     boxShadow: "0 0 40px rgba(255, 107, 53, 0.6)"
                   }}>
                G
                {/* Scanning line effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                     style={{ animation: "scan 2s linear infinite" }}></div>
              </div>
              
              {/* Multiple rotating orbital rings */}
              <div className="absolute -inset-4 rounded-full border-2 border-orange-400/20"
                   style={{ animation: "orbit1 4s linear infinite" }}></div>
              <div className="absolute -inset-8 rounded-full border border-orange-300/15"
                   style={{ animation: "orbit2 6s linear infinite reverse" }}></div>
              <div className="absolute -inset-12 rounded-full border border-orange-200/10"
                   style={{ animation: "orbit3 8s linear infinite" }}></div>
            </div>
          </div>

          {/* Advanced AI Brain Visualization */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-40 h-20">
              {/* Central processing core */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500"
                   style={{ animation: "corePulse 1.5s ease-in-out infinite" }}></div>
              
              {/* Neural network layers */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-orange-400"
                  style={{
                    left: `${15 + (i % 4) * 25}%`,
                    top: `${10 + Math.floor(i / 4) * 30}%`,
                    animation: `neuronPulse ${1.2 + Math.random() * 0.8}s ease-in-out infinite ${i * 0.1}s`,
                    opacity: 0.7
                  }}
                />
              ))}
              
              {/* Dynamic synaptic connections */}
              <svg className="absolute inset-0 w-full h-full">
                {[...Array(20)].map((_, i) => (
                  <line
                    key={i}
                    x1={`${20 + (i % 4) * 25}%`}
                    y1={`${15 + Math.floor(i / 4) * 30}%`}
                    x2="50%"
                    y2="50%"
                    stroke="rgba(255, 107, 53, 0.4)"
                    strokeWidth="1.5"
                    style={{ 
                      animation: `synapseFlow ${1.5 + Math.random() * 1}s ease-in-out infinite ${i * 0.05}s`
                    }}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* AI Status with typing effect */}
          <h2 className="text-4xl font-light mb-6 tracking-[-0.02em]">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              AI Agent Analyzing
            </span>
          </h2>
          
          {/* Typing message display */}
          <div className="mb-8 min-h-[60px] flex items-center justify-center">
            <p className="text-xl text-white/90 mb-2 transition-all duration-300 font-mono">
              {displayText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-8 max-w-[400px] mx-auto">
            <div className="flex justify-between text-sm text-white/70 mb-2">
              <span>Analysis Progress</span>
              <span className="text-orange-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, #ff6b35, #f7931e, #ff6b35)",
                  width: `${progress}%`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite"
                }}
              />
            </div>
          </div>

          {/* Step indicators with better animations */}
          <div className="flex justify-center gap-3 mb-8">
            {thinkingMessages.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  i <= thinkingStep ? 'bg-orange-400 scale-110' : 'bg-white/20 scale-100'
                }`}
                style={{
                  animation: i <= thinkingStep ? 'stepPulse 2s ease-in-out infinite' : 'none',
                  boxShadow: i <= thinkingStep ? '0 0 15px rgba(255, 107, 53, 0.6)' : 'none'
                }}
              />
            ))}
          </div>

          {/* URL being analyzed with enhanced styling */}
          <div className="mt-8 p-6 rounded-xl border border-orange-500/30 backdrop-blur-lg"
               style={{
                 background: "rgba(255, 107, 53, 0.1)",
                 boxShadow: "0 8px 32px rgba(255, 107, 53, 0.2)"
               }}>
            <p className="text-sm text-orange-200 mb-2 font-semibold">Analyzing Website:</p>
            <p className="text-orange-100 font-mono break-all text-lg">{url}</p>
          </div>
        </div>

        <style jsx>{`
          @keyframes aiFloat {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
            25% { transform: translateY(-15px) translateX(10px) rotate(90deg); opacity: 0.7; }
            50% { transform: translateY(-30px) translateX(0px) rotate(180deg); opacity: 1; }
            75% { transform: translateY(-15px) translateX(-10px) rotate(270deg); opacity: 0.7; }
          }
          @keyframes logoGlow {
            0%, 100% { box-shadow: 0 0 40px rgba(255, 107, 53, 0.6); }
            50% { box-shadow: 0 0 60px rgba(255, 107, 53, 0.9), 0 0 100px rgba(255, 107, 53, 0.4); }
          }
          @keyframes scan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes orbit1 {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes orbit2 {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes orbit3 {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes corePulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
          }
          @keyframes neuronPulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes synapseFlow {
            0% { stroke-dasharray: 0 10; }
            50% { stroke-dasharray: 5 5; }
            100% { stroke-dasharray: 10 0; }
          }
          @keyframes neuralPulse {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.3; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes stepPulse {
            0%, 100% { opacity: 1; transform: scale(1.1); }
            50% { opacity: 0.7; transform: scale(1.3); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-white font-[family-name:var(--font-geist-sans)] p-5" 
         style={{
           background: "radial-gradient(ellipse at center, #3a1a00 0%, #2a1500 25%, #1f0f00 50%, #150a00 75%, #0a0500 100%)"
         }}>
      <div className="text-center max-w-[600px] w-full">
        <h1 className="text-[3.5rem] font-normal mb-4 tracking-[-0.02em]">
          Share your project
        </h1>
        
        <div className="text-xl text-white/80 mb-12 flex items-center justify-center gap-2">
          Show{" "}
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold text-white" 
               style={{
                 background: "linear-gradient(45deg, #ff6b35, #f7931e)"
               }}>
            G
          </div>{" "}
          Gentura agents your website
        </div>

        <form onSubmit={handleSubmit} className="flex items-center max-w-[450px] mx-auto p-1 rounded-xl border border-white/20 mb-8"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)"
              }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="awesomeproject.com"
            disabled={loading}
            className="flex-1 bg-transparent border-none px-5 py-4 text-white text-base outline-none placeholder:text-white/50 h-12 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-12 h-12 rounded-lg border-none flex items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(255,107,53,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            style={{
              background: "linear-gradient(45deg, #ff6b35, #f7931e)"
            }}
          >
            <div className="w-0 h-0 ml-[2px]" 
                 style={{
                   borderLeft: "8px solid white",
                   borderTop: "6px solid transparent",
                   borderBottom: "6px solid transparent"
                 }}>
            </div>
          </button>
        </form>

        {/* Manual Form when scraping fails */}
        {showManualForm && (
          <div className="w-full max-w-[600px] mx-auto p-6 rounded-xl border border-white/20 mb-8"
               style={{
                 background: "rgba(255, 255, 255, 0.05)",
                 backdropFilter: "blur(10px)"
               }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2 text-white">Let's get you set up</h2>
              <p className="text-white/70 mb-4">Failed to get the page. Please enter details manually.</p>
              
              <div className="flex items-center justify-center gap-2 text-orange-200">
                <span>✨ Auto-filled from your website</span>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (productName.trim() && productDescription.trim()) {
                setScrapedData({
                  url: url,
                  title: productName,
                  description: productDescription,
                  content: productDescription
                });
                setShowManualForm(false);
                setError("");
              }
            }} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter your product name"
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Product Description</label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe what your product does and its key features..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors resize-none"
                  required
                />
                <p className="text-xs text-white/50 mt-1">{productDescription.length} / 5000 characters</p>
              </div>

              <button
                type="submit"
                disabled={!productName.trim() || !productDescription.trim()}
                className="w-full py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(255,107,53,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                style={{
                  background: "linear-gradient(45deg, #ff6b35, #f7931e)"
                }}
              >
                Continue with Manual Entry →
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setError("");
                  setUrl("");
                  setProductName("");
                  setProductDescription("");
                }}
                className="w-full py-2 px-4 rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors"
                style={{
                  background: "rgba(255, 255, 255, 0.1)"
                }}
              >
                Try Another URL
              </button>
            </form>
          </div>
        )}

        {/* Scraped Data Display */}
        {scrapedData && (
          <div className="text-left p-6 rounded-lg border border-white/20 max-w-[600px] mx-auto"
               style={{
                 background: "rgba(255, 255, 255, 0.05)",
                 backdropFilter: "blur(10px)"
               }}>
            <h2 className="text-2xl font-semibold mb-4 text-white">{scrapedData.title}</h2>
            
            <div className="mb-4">
              <p className="text-sm text-white/60 mb-1">URL:</p>
              <a href={scrapedData.url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-300 hover:text-blue-200 underline break-all">
                {scrapedData.url}
              </a>
            </div>

            <div className="mb-4">
              <p className="text-sm text-white/60 mb-1">Description:</p>
              <p className="text-white/80">{scrapedData.description}</p>
            </div>

            <div>
              <p className="text-sm text-white/60 mb-1">Content Preview:</p>
              <p className="text-white/70 text-sm leading-relaxed">
                {scrapedData.content.length > 500 
                  ? `${scrapedData.content.substring(0, 500)}...` 
                  : scrapedData.content}
              </p>
            </div>

            <button 
              onClick={() => {
                setScrapedData(null);
                setUrl("");
                setProductName("");
                setProductDescription("");
                setShowManualForm(false);
              }}
              className="mt-4 px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors"
              style={{
                background: "rgba(255, 255, 255, 0.1)"
              }}
            >
              Analyze Another Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
