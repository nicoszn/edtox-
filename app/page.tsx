import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolsGrid from "@/components/ToolsGrid";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ background: "var(--color-bg)", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar />
      <Hero />
      <ToolsGrid />
      <HowItWorks />
      <Features />
      <Footer />
    </main>
  );
}
