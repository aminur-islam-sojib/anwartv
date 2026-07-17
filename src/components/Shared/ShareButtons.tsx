"use client";

import { useState, useEffect } from "react";
import { Link2, Check } from "lucide-react";

export default function ShareButtons() {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    const timer = setTimeout(() => {
      setShareUrl(url);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-slate-100 py-4 my-8 gap-4">
      <span className="text-sm font-bold text-slate-700">এই খবরটি শেয়ার করুন:</span>
      <div className="flex items-center gap-3">
        {/* Facebook Share */}
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-xl text-xs font-bold hover:bg-[#165ec9] hover:-translate-y-0.5 active:translate-y-0 transition duration-200 shadow-sm"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
          </svg>
          Facebook
        </a>

        {/* Twitter/X Share */}
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#0F1419] text-white rounded-xl text-xs font-bold hover:bg-black hover:-translate-y-0.5 active:translate-y-0 transition duration-200 shadow-sm"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Twitter / X
        </a>

        {/* Copy Link */}
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 border hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${
            copied
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              কপি হয়েছে
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 text-slate-500" />
              লিংক কপি
            </>
          )}
        </button>
      </div>
    </div>
  );
}
