"use client";

import { useState, useEffect } from "react";
import { Sparkles, BrainCircuit, X } from "lucide-react";
import { AdvisorChat } from "./AdvisorChat";

const QUICK_QUESTIONS = [
  "Improve operations?",
  "Cash flow tips?",
  "Net profit advice",
  "Vendor negotiation"
];

export function FloatingAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPulse, setHasPulse] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("ZyOps_advisor_seen");
    if (!hasSeen) {
      setHasPulse(true);
    }
  }, []);

  const toggleAdvisor = () => {
    if (!isOpen && hasPulse) {
      setHasPulse(false);
      localStorage.setItem("ZyOps_advisor_seen", "true");
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleAdvisor}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent hover:bg-accent-dark text-white rounded-full shadow-[0_4px_12px_rgba(201,168,76,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 ${hasPulse ? 'animate-pulse' : ''}`}
        title="Ask ZyOps Advisor"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Slide-in Drawer overlay (Mobile click-away) */}
      {isOpen && (
         <div 
           className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity" 
           onClick={() => setIsOpen(false)} 
         />
      )}

      {/* Slide-in Drawer */}
      <div 
         className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-card-border transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
         <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-primary text-white flex items-center justify-between border-l-[3px] border-accent shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                     <BrainCircuit className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                     <h2 className="font-bold text-base text-white flex items-center gap-2">
                       ZyOps Advisor
                     </h2>
                  </div>
               </div>
               <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
               >
                  <X className="w-5 h-5 text-slate-300" />
               </button>
            </div>
            
            {/* Render Chat tightly contained to drawer constraints */}
            <div className="flex-1 overflow-hidden">
               <AdvisorChat isDrawer={true} quickQuestions={QUICK_QUESTIONS} />
            </div>
         </div>
      </div>
    </>
  );
}

