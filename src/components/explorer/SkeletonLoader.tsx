import React from "react";

interface SkeletonLoaderProps {
  viewMode: "grid" | "list";
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ viewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="py-4 px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg bg-slate-200 shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="w-16 h-5 bg-slate-100 rounded-full" />
            <div className="w-20 h-4 bg-slate-100 rounded hidden sm:block" />
            <div className="w-16 h-4 bg-slate-100 rounded hidden md:block" />
            <div className="w-12 h-6 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-3"
        >
          {/* Top thumbnail skeleton */}
          <div className="h-36 bg-slate-100 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-200" />
          </div>
          {/* Details skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="flex gap-2">
              <div className="h-3 bg-slate-200 rounded-full w-16" />
              <div className="h-3 bg-slate-100 rounded-full w-12" />
            </div>
            <div className="flex gap-1 pt-2">
              <div className="h-4 bg-slate-100 rounded w-10" />
              <div className="h-4 bg-slate-100 rounded w-12" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-3 bg-slate-100 rounded w-12" />
              <div className="h-3 bg-slate-100 rounded w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
