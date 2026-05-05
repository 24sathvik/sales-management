"use client";

import { BrainCircuit, Sparkles } from "lucide-react";
import { AdvisorChat } from "../ai/AdvisorChat";
import { useEffect } from "react";

const QUICK_QUESTIONS = [
  "How can I improve net profit?",
  "Analyze my current margins",
  "I have overdue invoices — advice?",
  "How to price Wedding Cards?",
  "Reduce production costs",
  "Best revenue opportunity now?",
  "Improve cash flow",
  "Convert more quotations?",
  "Seasonal planning advice",
  "Staff productivity tips"
];

export function ZyOpsAdvisor() {
  
  const handleChipClick = (q: string) => {
     window.dispatchEvent(new CustomEvent('ZyOps:advisor:ask', { detail: { question: q } }));
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-card-border overflow-hidden mt-8">
      {/* Header */}
      <div className="px-6 py-4 bg-primary text-white flex items-center justify-between border-l-[3px] border-accent">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
               <BrainCircuit className="w-5 h-5 text-accent" />
            </div>
            <div>
               <h2 className="font-bold text-lg text-white flex items-center gap-2">
                 ZyOps Advisor <Sparkles className="w-3.5 h-3.5 text-accent" />
               </h2>
               <p className="text-xs text-slate-300">AI-powered print business consultant · 35 years of industry expertise</p>
            </div>
         </div>
         <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white/5 px-2 py-1 rounded">
               Powered by OpenAI
            </span>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row border-t border-card-border">
         {/* LEFT COLUMN: 38% */}
         <div className="lg:w-[38%] p-6 border-b lg:border-b-0 lg:border-r border-card-border bg-slate-50">
            <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">Ask about your business</h3>
            <div className="flex flex-wrap gap-2.5">
               {QUICK_QUESTIONS.map((q) => (
                 <button
                   key={q}
                   onClick={() => handleChipClick(q)}
                   className="px-3.5 py-2 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-accent hover:border-accent hover:text-white transition-all shadow-sm"
                 >
                   {q}
                 </button>
               ))}
            </div>
         </div>

         {/* RIGHT COLUMN: 62% */}
         <div className="lg:w-[62%]">
            <AdvisorChat isDrawer={false} className="border-none shadow-none rounded-none" />
         </div>
      </div>
    </div>
  );
}

