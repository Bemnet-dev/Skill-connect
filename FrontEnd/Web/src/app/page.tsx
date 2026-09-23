import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { StatStrip } from "@/components/home/StatStrip";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Step 2: Hero & KPI Strip */}
        <Hero />
        <StatStrip />

        {/* Subsequent sections placeholder */}
        <section className="flex min-h-[30vh] items-center justify-center bg-white border-t border-gray-100">
          <div className="text-center py-12">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase mb-2">
              Next Up: Step 3
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Most Popular Vacancies &amp; How It Works
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Ready to implement upon your confirmation.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
