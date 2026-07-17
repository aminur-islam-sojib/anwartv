import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

interface Article {
    slug: string;
    title: string;
    coverImage?: { url: string };
}

interface CategoryBucketsProps {
    cat: Article | null;
    catName: string;
    borderColor?: string;
}


const CategoryBucket = ({ cat, catName, borderColor = "border-black" }: CategoryBucketsProps) => {
    return (
        <div className="space-y-4">
            <div className={`flex items-center justify-between border-b-3 ${borderColor} pb-2`}>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    {catName}
                </h3>
            </div>
            <article className="group space-y-2">
                <Link
                    href={`/news/${cat?.slug}`}
                    className="block overflow-hidden rounded-xl relative aspect-video w-full bg-slate-100"
                >
                    <Image
                        src={cat?.coverImage?.url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"}
                        alt={cat?.title || " "}
                        fill
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </Link>
                <Link href={`/news/${cat?.slug}`}>
                    <h4 className="text-base font-black text-slate-800 hover:text-[#cc0000] transition-colors leading-snug">
                        {cat?.title}
                    </h4>
                </Link>
            </article>
        </div>
    )
}

export default CategoryBucket