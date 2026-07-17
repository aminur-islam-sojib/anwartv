export default function NewsDetailLoading() {
    return (
        <article className="max-w-4xl mx-auto px-4 py-8 font-sans">
            <div className="mb-4">
                <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mb-6 space-y-2">
                <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="mb-8 h-10 w-full animate-pulse rounded bg-slate-100" />
            <div className="mb-8 aspect-video w-full animate-pulse rounded-2xl bg-slate-100" />
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 w-full animate-pulse rounded bg-slate-100"
                    />
                ))}
            </div>
        </article>
    );
}