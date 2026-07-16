import Link from "next/link";
import { Newspaper } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
            <div className="rounded-full bg-slate-50 p-4">
                <Newspaper className="h-8 w-8 text-slate-400" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-900">
                    পেজটি খুঁজে পাওয়া যায়নি
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    আপনি যে সংবাদ বা পেজটি খুঁজছেন সেটি হয়তো সরিয়ে ফেলা হয়েছে অথবা লিংকটি ভুল।
                </p>
            </div>
            <Link
                href="/"
                className="mt-2 rounded-xl bg-[#cc0000] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a30000]"
            >
                হোমপেজে ফিরে যান
            </Link>
        </div>
    );
}