interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const COL_WIDTHS = ["w-8", "w-24", "w-32", "w-40", "w-20", "w-16", "w-24", "w-20"];

export function TableSkeleton({ rows = 8, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="bg-white border border-[#D8D4C0] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[#EEEEDD] border-b border-[#D8D4C0]">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={`skeleton h-3 ${COL_WIDTHS[i % COL_WIDTHS.length]} rounded`} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-[#EEF0E8]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 px-4 py-4 items-center">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={`skeleton h-3.5 ${COL_WIDTHS[colIdx % COL_WIDTHS.length]} rounded`}
                style={{ animationDelay: `${rowIdx * 80}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
