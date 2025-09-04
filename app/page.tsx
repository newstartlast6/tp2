"use client";

import { useState, useEffect } from "react";

interface ScrapedData {
  url: string;
  title: string;
  description: string;
  content: string;
}

interface MarketingReport {
  productName: string;
  category: string;
  userPersona: {
    demographics: string;
    whereTheyHangOut: string;
    mindset: string;
  };
  painPoints: string[];
  valueProposition: string;
  contentPillars: Array<{
    pillar: string;
    description: string;
  }>;
  postTypes: string[];
  weeklyCalendar: {
    monday: string;
    wednesday: string;
    friday: string;
    sunday: string;
  };
  hashtagStyle: {
    tone: string;
    exampleHashtags: string[];
  };
  engagementStrategy: string[];
  metricsToTrack: string[];
  keyTakeaway: string;
}

export default function Onboarding() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [marketingReport, setMarketingReport] = useState<MarketingReport | null>(null);
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
    "Identifying target audience...",
    "Generating marketing strategy...",
    "Creating social media plan...",
    "Finalizing AI report..."
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
    setMarketingReport(null);
    setProgress(0);

    try {
      // Step 1: Scrape the website
      const scrapeResponse = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.text();
        
        if (scrapeResponse.status === 403) {
          setShowManualForm(true);
          setError("This website requires manual information. Please fill out the form below:");
          setLoading(false);
          setProgress(100);
          return;
        }
        
        throw new Error(errorData || "Failed to analyze website");
      }

      const scraped = await scrapeResponse.json();
      setScrapedData(scraped);
      setProgress(60);

      // Step 2: Generate marketing report
      const reportResponse = await fetch("/api/marketing-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrapedData: scraped,
          productName: scraped.title,
          productDescription: scraped.description
        }),
      });

      if (!reportResponse.ok) {
        throw new Error("Failed to generate marketing report");
      }

      const response = await reportResponse.json();
      setMarketingReport(response.report || response);
      setProgress(100);

    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productDescription.trim()) return;

    setLoading(true);
    setError("");
    setProgress(0);

    try {
      // Create mock scraped data from manual input
      const mockScrapedData = {
        url: url,
        title: productName,
        description: productDescription,
        content: `${productName}: ${productDescription}`
      };

      setScrapedData(mockScrapedData);
      setProgress(50);

      // Generate marketing report
      const reportResponse = await fetch("/api/marketing-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrapedData: mockScrapedData,
          productName,
          productDescription
        }),
      });

      if (!reportResponse.ok) {
        throw new Error("Failed to generate marketing report");
      }

      const response = await reportResponse.json();
      setMarketingReport(response.report || response);
      setProgress(100);
      setShowManualForm(false);

    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f172a 100%)"
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Loading State */}
        {loading && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center animate-bounce">
                <span className="text-xl">🚀</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                TractionPilot
              </h1>
            </div>

            <div className="space-y-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="min-h-[60px] flex items-center justify-center">
                <div className="text-lg text-white/90 font-medium">
                  {displayText}
                  {isTyping && <span className="animate-pulse">|</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form - Only show when not loading and no report */}
        {!loading && !marketingReport && !showManualForm && (
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/25">
                <span className="text-2xl font-bold">🚀</span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  TractionPilot
                </h1>
                <p className="text-white/60 text-sm">AI Marketing Intelligence</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Get Your Marketing Strategy
                </h2>
                <p className="text-white/70">
                  Enter your website URL and get a comprehensive AI-powered marketing report in seconds.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-website.com"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="w-full py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(255,107,53,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  style={{
                    background: "linear-gradient(45deg, #ff6b35, #f7931e)"
                  }}
                >
                  Analyze Website →
                </button>
              </form>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Form - Show when automatic scraping fails */}
        {showManualForm && !loading && !marketingReport && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <span className="text-xl">✏️</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Manual Entry Required</h2>
            </div>

            <p className="text-white/70 mb-6">
              We couldn't automatically analyze this website. Please provide some basic information:
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Product/Company Name"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Brief description of what your product/service does..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                  required
                />
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

        {error && !showManualForm && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
            {error}
          </div>
        )}
      </div>

      {/* Marketing Report Display */}
      {marketingReport && scrapedData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="w-full max-w-[1100px] mx-auto">
              {/* Professional Report Header */}
              <div className="text-center mb-16 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-600/10 rounded-3xl blur-3xl"></div>
                <div className="relative bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-orange-500/25 rounded-3xl p-10">
                  <div className="flex items-center justify-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                      <span className="text-4xl font-bold text-white">🚀</span>
                    </div>
                    <div className="text-left">
                      <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                        Marketing Intelligence Report
                      </h1>
                      <p className="text-orange-200/80 text-xl font-medium mt-2">AI-Powered Strategic Analysis</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white">{marketingReport.productName}</h2>
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-500/15 border border-orange-500/30 rounded-full">
                      <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-orange-300 font-semibold text-lg">{marketingReport.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                {/* Section 1: Executive Summary */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-emerald-500/25 rounded-2xl p-8 hover:border-emerald-400/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
                        <p className="text-emerald-200/70 text-lg">Strategic Overview & Key Insights</p>
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                      <p className="text-xl text-emerald-100 font-medium leading-relaxed italic">
                        "{marketingReport.valueProposition}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Audience Analysis */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-blue-500/25 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Audience Analysis</h2>
                        <p className="text-blue-200/70 text-lg">Understanding Your Target Market</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-blue-200 mb-4">Target Persona</h3>
                        <div className="space-y-4 text-white/90">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <strong className="text-blue-300 text-lg min-w-[140px]">Demographics:</strong> 
                            <span className="text-lg">{marketingReport.userPersona.demographics}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <strong className="text-blue-300 text-lg min-w-[140px]">Platforms:</strong> 
                            <span className="text-lg">{marketingReport.userPersona.whereTheyHangOut}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <strong className="text-blue-300 text-lg min-w-[140px]">Mindset:</strong> 
                            <span className="text-lg leading-relaxed">{marketingReport.userPersona.mindset}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-red-200 mb-4 flex items-center gap-2">
                          <span>💔</span> Key Pain Points
                        </h3>
                        <ul className="space-y-3">
                          {marketingReport.painPoints.map((point, index) => (
                            <li key={index} className="text-white/90 flex items-start gap-3 text-lg">
                              <span className="text-red-400 mt-1 text-xl">•</span>
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Content Strategy */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-purple-500/25 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
                        <span className="text-2xl">📱</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Content Strategy</h2>
                        <p className="text-purple-200/70 text-lg">Building Your Content Foundation</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-purple-200 mb-4">Content Pillars</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {marketingReport.contentPillars.map((pillar, index) => (
                            <div key={index} className="p-5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <h4 className="font-bold text-purple-300 mb-3 text-lg">{pillar.pillar}</h4>
                              <p className="text-white/80 leading-relaxed">{pillar.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-purple-200 mb-4 flex items-center gap-2">
                          <span>📝</span> Post Types & Formats
                        </h3>
                        <ul className="space-y-3">
                          {marketingReport.postTypes.map((type, index) => (
                            <li key={index} className="text-white/90 flex items-start gap-3 text-lg">
                              <span className="text-purple-400 mt-1 text-xl">•</span>
                              <span className="leading-relaxed">{type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Publishing Schedule */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-cyan-500/25 rounded-2xl p-8 hover:border-cyan-400/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-xl shadow-cyan-500/25">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Publishing Schedule</h2>
                        <p className="text-cyan-200/70 text-lg">Strategic Content Calendar</p>
                      </div>
                    </div>

                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-cyan-200 mb-6">Weekly Content Calendar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <strong className="text-cyan-300 text-lg">Monday</strong>
                          </div>
                          <span className="text-white/90 text-lg">{marketingReport.weeklyCalendar.monday}</span>
                        </div>
                        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <strong className="text-cyan-300 text-lg">Wednesday</strong>
                          </div>
                          <span className="text-white/90 text-lg">{marketingReport.weeklyCalendar.wednesday}</span>
                        </div>
                        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <strong className="text-cyan-300 text-lg">Friday</strong>
                          </div>
                          <span className="text-white/90 text-lg">{marketingReport.weeklyCalendar.friday}</span>
                        </div>
                        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <strong className="text-cyan-300 text-lg">Sunday</strong>
                          </div>
                          <span className="text-white/90 text-lg">{marketingReport.weeklyCalendar.sunday}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Engagement & Growth */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-pink-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-pink-500/25 rounded-2xl p-8 hover:border-pink-400/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-xl shadow-pink-500/25">
                        <span className="text-2xl">🤝</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Engagement & Growth</h2>
                        <p className="text-pink-200/70 text-lg">Building Community & Tracking Success</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-pink-200 mb-4 flex items-center gap-2">
                          <span>#️⃣</span> Hashtag & Caption Style
                        </h3>
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <strong className="text-pink-300 text-lg min-w-[100px]">Style:</strong> 
                            <span className="text-white/90 text-lg">{marketingReport.hashtagStyle.tone}</span>
                          </div>
                          <div>
                            <strong className="text-pink-300 text-lg">Example hashtags:</strong>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {marketingReport.hashtagStyle.exampleHashtags.map((tag, index) => (
                                <span key={index} className="px-3 py-2 rounded-lg bg-pink-500/20 text-pink-200 font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-pink-200 mb-4">Engagement Tactics</h3>
                        <ul className="space-y-3">
                          {marketingReport.engagementStrategy.map((strategy, index) => (
                            <li key={index} className="text-white/90 flex items-start gap-3 text-lg">
                              <span className="text-pink-400 mt-1 text-xl">•</span>
                              <span className="leading-relaxed">{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-pink-200 mb-4 flex items-center gap-2">
                          <span>📊</span> Key Metrics to Track
                        </h3>
                        <ul className="space-y-3">
                          {marketingReport.metricsToTrack.map((metric, index) => (
                            <li key={index} className="text-white/90 flex items-start gap-3 text-lg">
                              <span className="text-pink-400 mt-1 text-xl">•</span>
                              <span className="leading-relaxed">{metric}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 6: Key Takeaway */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/15 to-orange-600/15 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 hover:border-orange-400/50 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/25">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Key Takeaway</h2>
                        <p className="text-orange-200/70 text-lg">Your Strategic Action Item</p>
                      </div>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6">
                      <p className="text-xl text-orange-100 font-medium leading-relaxed">{marketingReport.keyTakeaway}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <button 
                    onClick={() => {
                      setMarketingReport(null);
                      setScrapedData(null);
                      setUrl("");
                      setProductName("");
                      setProductDescription("");
                      setShowManualForm(false);
                      setError("");
                    }}
                    className="px-8 py-4 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all duration-300 text-lg font-medium hover:bg-white/5"
                  >
                    Analyze Another Website
                  </button>
                  <a 
                    href={scrapedData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-8 py-4 rounded-xl text-white font-medium transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_30px_rgba(255,107,53,0.4)] text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}