import HomePage from "@/components/Home/Home";
import PublicHomepage from "@/components/Home/Home2";
import Header from "@/components/layout/header";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <main>
        {/* <HomePage /> */}
        <Header />
        <PublicHomepage />
      </main>
    </div>
  );
}
