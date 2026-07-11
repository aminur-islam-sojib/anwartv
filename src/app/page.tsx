import HomePage from "@/components/Home/Home";
import Header from "@/components/layout/header";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <main>
        <Header />
        <HomePage />
      </main>
    </div>
  );
}
