import { MapPin, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const suggestions = [
  { label: "Designer", href: "/find-job?q=designer" },
  { label: "Programing", href: "/find-job?q=programming" },
  { label: "Digital Marketing", href: "/find-job?q=digital-marketing", highlighted: true },
  { label: "Video", href: "/find-job?q=video" },
  { label: "Animation", href: "/find-job?q=animation" },
];

export function Hero() {
  return (
    <section className="relative bg-gray-50 overflow-hidden">
      <div className="mx-auto flex max-w-[1320px] flex-col-reverse items-center gap-8 px-4 py-16 lg:flex-row lg:gap-12 lg:px-6 lg:py-24">
        {/* ── Left Content ── */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-[2.5rem] leading-[1.2] font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]">
            Find a job that suits
            <br />
            your interest &amp; skills.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-500 mx-auto lg:mx-0">
            Aliquam vitae turpis in diam convallis finibus in at risus. Nullam
            in scelerisque leo, eget sollicitudin velit bestibulum.
          </p>

          {/* ── Compound Search Bar ── */}
          <div className="mt-8 flex flex-col gap-3 rounded-lg bg-white p-2 shadow-elevated sm:flex-row sm:items-center sm:gap-0">
            {/* Job Title Input */}
            <div className="flex flex-1 items-center gap-2.5 px-4 py-2.5">
              <Search className="h-5 w-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Job title, Keyword..."
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                aria-label="Job title or keyword"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200 shrink-0" />

            {/* Location Input */}
            <div className="flex flex-1 items-center gap-2.5 px-4 py-2.5">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Your Location"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                aria-label="Location"
              />
            </div>

            {/* Find Job Button */}
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-[4px] bg-primary px-8 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.98] shadow-sm shrink-0"
            >
              Find Job
            </button>
          </div>

          {/* ── Suggestions ── */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1 text-sm lg:justify-start">
            <span className="text-gray-400">Suggestion:</span>
            {suggestions.map((s, i) => (
              <span key={s.label}>
                <Link
                  href={s.href}
                  className={`transition-colors ${s.highlighted
                    ? "font-medium text-primary hover:text-primary-hover"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {s.label}
                </Link>
                {i < suggestions.length - 1 && (
                  <span className="text-gray-300">,</span>
                )}
              </span>
            ))}
            <span className="text-gray-300">.</span>
          </div>
        </div>

        {/* ── Right Illustration ── */}
        <div className="relative flex-shrink-0 w-full max-w-[480px] lg:max-w-[520px]">
          <Image
            src="/hero-img.png"
            alt="Professional working on a laptop surrounded by creative icons"
            width={520}
            height={400}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}
