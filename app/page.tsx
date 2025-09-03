"use client";

import { useState } from "react";

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
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-0 h-0 ml-[2px]" 
                   style={{
                     borderLeft: "8px solid white",
                     borderTop: "6px solid transparent",
                     borderBottom: "6px solid transparent"
                   }}>
              </div>
            )}
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
