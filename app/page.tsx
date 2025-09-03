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
  const [thinkingStep, setThinkingStep] = useState(0);
  const [thinkingText, setThinkingText] = useState("");

  const thinkingMessages = [
    "Analyzing your website...",
    "Extracting content structure...",
    "Processing page metadata...",
    "Understanding your design...",
    "Evaluating user experience...",
    "Finalizing analysis..."
  ];

  useEffect(() => {
    if (loading) {
      setThinkingStep(0);
      setThinkingText(thinkingMessages[0]);
      
      const interval = setInterval(() => {
        setThinkingStep((prev) => {
          const next = (prev + 1) % thinkingMessages.length;
          setThinkingText(thinkingMessages[next]);
          return next;
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setScrapedData(null);

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
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                background: "linear-gradient(45deg, #ff6b35, #f7931e)",
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-[600px] w-full">
          {/* Pulsing Gentura Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white animate-pulse"
                   style={{
                     background: "linear-gradient(45deg, #ff6b35, #f7931e)",
                     animation: "pulse 2s ease-in-out infinite"
                   }}>
                G
              </div>
              
              {/* Rotating rings around logo */}
              <div className="absolute inset-0 rounded-2xl border-2 border-orange-400/30 animate-spin"
                   style={{ animation: "spin 3s linear infinite" }}></div>
              <div className="absolute inset-2 rounded-xl border border-orange-300/20 animate-spin"
                   style={{ animation: "spin 4s linear infinite reverse" }}></div>
            </div>
          </div>

          {/* AI Brain Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-32 h-16">
              {/* Neural network nodes */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-orange-400"
                  style={{
                    left: `${20 + (i % 3) * 30}%`,
                    top: `${i < 3 ? 20 : 70}%`,
                    animation: `pulse ${1 + Math.random()}s ease-in-out infinite ${i * 0.2}s`
                  }}
                />
              ))}
              
              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full">
                {[...Array(5)].map((_, i) => (
                  <line
                    key={i}
                    x1={`${25 + (i % 2) * 30}%`}
                    y1="30%"
                    x2={`${35 + ((i + 1) % 2) * 30}%`}
                    y2="70%"
                    stroke="rgba(255, 107, 53, 0.3)"
                    strokeWidth="1"
                    style={{ 
                      animation: `pulse 2s ease-in-out infinite ${i * 0.3}s`
                    }}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Dynamic thinking text */}
          <h2 className="text-3xl font-light mb-4 tracking-[-0.02em]">
            AI Agent Analyzing
          </h2>
          
          <div className="mb-8">
            <p className="text-xl text-white/80 mb-2 transition-all duration-300">
              {thinkingText}
            </p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= thinkingStep ? 'bg-orange-400' : 'bg-white/20'
                  }`}
                  style={{
                    animation: i <= thinkingStep ? 'pulse 1.5s ease-in-out infinite' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Animated processing bars */}
          <div className="max-w-[300px] mx-auto space-y-3">
            {['Content Structure', 'Page Design', 'User Experience'].map((label, i) => (
              <div key={label} className="relative">
                <div className="flex justify-between text-sm text-white/60 mb-1">
                  <span>{label}</span>
                  <span className="text-orange-400">
                    {Math.min(100, (thinkingStep + 1) * 16 + i * 5)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full"
                     style={{ background: "rgba(255, 255, 255, 0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      background: "linear-gradient(90deg, #ff6b35, #f7931e)",
                      width: `${Math.min(100, (thinkingStep + 1) * 16 + i * 5)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* URL being analyzed */}
          <div className="mt-8 p-4 rounded-lg border border-white/20"
               style={{
                 background: "rgba(255, 255, 255, 0.05)",
                 backdropFilter: "blur(10px)"
               }}>
            <p className="text-sm text-white/60 mb-1">Analyzing:</p>
            <p className="text-orange-300 font-mono break-all">{url}</p>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/30"
               style={{
                 background: "rgba(239, 68, 68, 0.1)",
                 backdropFilter: "blur(10px)"
               }}>
            <p className="text-red-300">{error}</p>
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
