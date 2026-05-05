/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";

const PHASE_LABELS: Record<string, string> = {
  RAW_MATERIALS:   "Preparation",
  DESIGN:          "In Progress",
  PRINTING:        "Production",
  POST_PRINTING:   "Review & QC",
  PAYMENT_PENDING: "Awaiting Payment",
};

// Column header accent colors matching the spec
const PHASE_HEADER_STYLES: Record<string, { bg: string; text: string; badge: string; badgeText: string }> = {
  RAW_MATERIALS:   { bg: "bg-slate-100",  text: "text-slate-700",  badge: "bg-slate-200",  badgeText: "text-slate-600" },
  DESIGN:          { bg: "bg-purple-50",  text: "text-purple-700", badge: "bg-purple-200", badgeText: "text-purple-700" },
  PRINTING:        { bg: "bg-blue-50",    text: "text-blue-700",   badge: "bg-blue-200",   badgeText: "text-blue-700" },
  POST_PRINTING:   { bg: "bg-cyan-50",    text: "text-cyan-700",   badge: "bg-cyan-200",   badgeText: "text-cyan-700" },
  PAYMENT_PENDING: { bg: "bg-amber-50",   text: "text-amber-700",  badge: "bg-amber-200",  badgeText: "text-amber-700" },
};

const PHASE_BORDER: Record<string, string> = {
  RAW_MATERIALS:   "border-t-[#64748B]",
  DESIGN:          "border-t-[#8B5CF6]",
  PRINTING:        "border-t-[#2563EB]",
  POST_PRINTING:   "border-t-[#06B6D4]",
  PAYMENT_PENDING: "border-t-[#D97706]",
};

export function KanbanColumn({ 
  id, 
  cards, 
  isAdmin,
  onDelete,
  onMarkComplete,
  onMarkPaymentPending,
}: { 
  id: string; 
  cards: any[]; 
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onMarkPaymentPending: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const styles = PHASE_HEADER_STYLES[id] || PHASE_HEADER_STYLES.RAW_MATERIALS;
  const topBorderClass = PHASE_BORDER[id] || "border-t-slate-400";

  return (
    <div className={`flex flex-col flex-shrink-0 w-80 rounded-xl h-full max-h-[calc(100vh-140px)] border border-slate-200 shadow-sm border-t-4 ${topBorderClass} overflow-hidden bg-white`}>
      {/* Column Header */}
      <div className={`p-3 border-b border-slate-200 flex justify-between items-center ${styles.bg}`}>
        <h3 className={`font-bold text-sm uppercase tracking-wide ${styles.text}`}>
          {PHASE_LABELS[id] || id}
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge} ${styles.badgeText}`}>
          {cards.length}
        </span>
      </div>

      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
          isOver ? 'bg-slate-100 shadow-inner' : 'bg-slate-50/50'
        }`}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard 
              key={card.id} 
              card={card} 
              isAdmin={isAdmin}
              onDelete={onDelete}
              onMarkComplete={onMarkComplete}
              onMarkPaymentPending={onMarkPaymentPending}
            />
          ))}
        </SortableContext>
        
        {cards.length === 0 && (
          <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 mt-2">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}
