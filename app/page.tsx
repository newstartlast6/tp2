"use client";

import { useState } from "react";

export default function Onboarding() {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Submitted URL:", url);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-white font-[family-name:var(--font-geist-sans)]" 
         style={{
           background: "radial-gradient(ellipse at center, #3a1a00 0%, #2a1500 25%, #1f0f00 50%, #150a00 75%, #0a0500 100%)"
         }}>
      <div className="text-center max-w-[600px] px-5">
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

        <form onSubmit={handleSubmit} className="flex max-w-[450px] mx-auto p-1 rounded-xl border border-white/20"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)"
              }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="awesomeproject.com"
            className="flex-1 bg-transparent border-none px-5 py-4 text-white text-base outline-none placeholder:text-white/50"
          />
          <button
            type="submit"
            className="w-12 h-12 rounded-lg border-none flex items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(255,107,53,0.3)] active:translate-y-0"
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
      </div>
    </div>
  );
}
