export default function GlobalLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#cc0000]" />
                <p className="text-sm font-medium text-slate-500">লোড হচ্ছে...</p>
            </div>
        </div>
    );
}