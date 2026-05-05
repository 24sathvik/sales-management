import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full min-h-[300px] border-2 border-dashed border-[#D8D4C0] rounded-xl bg-[#FAFAF2]">
      <div className="text-[#9C9478] mb-4 [&>svg]:w-12 [&>svg]:h-12 opacity-60">
        {icon}
      </div>
      <h3 className="text-[18px] font-display font-bold text-[#1C1A14] mb-2">{title}</h3>
      <p className="text-[14px] text-[#6B6550] max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-gradient-to-r from-[#18A7AD] to-[#0F8A8F] text-white font-semibold rounded-md shadow-[0_4px_14px_rgba(24,167,173,0.35)] hover:shadow-[0_0_20px_rgba(24,167,173,0.20)] transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
