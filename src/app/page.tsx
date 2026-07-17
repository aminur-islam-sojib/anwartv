import PublicHomepage from "@/components/Home/Home";
import Header from "@/components/layout/header";
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  return (
    <div>
      <main>
        <Header />
        <PublicHomepage />
        <Analytics />
      </main>
    </div>
  );
}
