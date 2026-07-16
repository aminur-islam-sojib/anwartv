export default function ArticlesLoading() {
    return (
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
            <div className="mb-8 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="aspect-video animate-pulse bg-slate-100" />
                        <div className="space-y-3 p-5">
                            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
                            <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
                            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}