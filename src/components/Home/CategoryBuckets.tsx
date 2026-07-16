import Image from "next/image";
import Link from "next/link";
import CategoryBucket from "./CategoryBucket";

interface Article {
  slug: string;
  title: string;
  coverImage?: { url: string };
}

interface CategoryBucketsProps {
  politics: Article | null;
  sports: Article | null;
}

export default function CategoryBuckets({ politics, sports }: CategoryBucketsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Politics Block */}
      {politics && (
        <CategoryBucket cat={politics} catName="জাতীয় ও রাজনীতি" borderColor="border-[#cc0000]" />
      )}

      {/* Sports Block */}
      {sports && (
        <CategoryBucket cat={sports} catName="খেলাধুলা" borderColor="border-green-500" />

      )}
    </section>
  );
}