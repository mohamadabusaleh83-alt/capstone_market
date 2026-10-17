export default function ProjectCardSkeleton() {
  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between animate-pulse shadow-sm">
      <div className="space-y-4">
        {/* Header row: Category pill & match badge */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-800 rounded-md" />
          <div className="h-6 w-16 bg-slate-800 rounded-full" />
        </div>

        {/* Status badge & seats */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-slate-800 rounded-full" />
          <div className="h-4 w-14 bg-slate-800 rounded-md" />
        </div>

        {/* Capacity bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full" />

        {/* Title */}
        <div className="space-y-2 pt-1">
          <div className="h-5 w-3/4 bg-slate-800 rounded-lg" />
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
        </div>

        {/* Meta tags */}
        <div className="flex gap-3 bg-slate-800/40 p-2.5 rounded-xl">
          <div className="h-4 w-20 bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
        </div>

        {/* Skills box */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="h-3 w-28 bg-slate-800 rounded" />
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-14 bg-slate-800 rounded-md" />
            <div className="h-5 w-16 bg-slate-800 rounded-md" />
            <div className="h-5 w-12 bg-slate-800 rounded-md" />
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="pt-4 mt-2 border-t border-slate-800/60 flex items-center gap-2">
        <div className="h-9 flex-1 bg-slate-800 rounded-xl" />
        <div className="h-9 w-9 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
