"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-red-50 p-3">
                    <AlertTriangle className="h-6 w-6 text-[#cc0000]" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        দুঃখিত, একটি সমস্যা হয়েছে
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        পেজটি লোড করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।
                    </p>
                </div>
                <button
                    onClick={reset}
                    className="mt-2 flex items-center gap-2 rounded-xl bg-[#cc0000] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a30000]"
                >
                    <RotateCcw className="h-4 w-4" />
                    আবার চেষ্টা করুন
                </button>
            </div>
        </div>
    );
}