export default function DoctorLoading() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
                        <div className="h-4 w-40 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
                        <div className="h-10 w-24 bg-slate-200 rounded-xl" />
                    </div>
                </div>
                {/* Search */}
                <div className="h-12 w-full max-w-lg bg-slate-100 rounded-xl" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl" />
                            <div className="h-3 w-20 bg-slate-100 rounded-lg" />
                        </div>
                        <div className="h-7 w-16 bg-slate-200 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Tabs Skeleton */}
            <div className="mb-6">
                <div className="flex gap-2 mb-6">
                    <div className="h-11 w-44 bg-slate-200 rounded-xl" />
                    <div className="h-11 w-44 bg-slate-100 rounded-xl" />
                </div>
            </div>

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-5 w-5 bg-slate-100 rounded" />
                            <div className="h-5 w-36 bg-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                                    <div className="h-11 w-11 bg-slate-200 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-200 rounded" />
                                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                                    </div>
                                    <div className="h-9 w-20 bg-slate-200 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
