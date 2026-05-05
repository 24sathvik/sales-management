export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse w-full">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
      </div>

      {/* 6 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 h-[106px]">
            <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Row: Urgent + WIP Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 h-[280px]"></div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[280px]"></div>
      </div>

      {/* Row: Recent Invoices + Recent Quotations & Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 h-[380px]"></div>
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[220px]"></div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[140px]"></div>
        </div>
      </div>
    </div>
  );
}
