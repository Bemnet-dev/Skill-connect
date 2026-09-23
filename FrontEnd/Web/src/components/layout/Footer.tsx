import { Briefcase, MapPin, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

const quickLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

const candidateLinks = [
  { label: "Browse Jobs", href: "/find-job" },
  { label: "Browse Employers", href: "/browse-employers" },
  { label: "Candidate Dashboard", href: "/dashboard" },
  { label: "Saved Jobs", href: "/saved-jobs" },
];

const employerLinks = [
  { label: "Post a Job", href: "/post-job" },
  { label: "Browse Candidates", href: "/browse-candidates" },
  { label: "Employers Dashboard", href: "/employer-dashboard" },
  { label: "Applications", href: "/applications" },
];

const supportLinks = [
  { label: "Faqs", href: "/faqs" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

interface FooterLinkGroupProps {
  title: string;
  links: { label: string; href: string }[];
}

function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label === "Contact" && (
                <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              )}
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* ── Main Footer ── */}
      <div className="mx-auto max-w-[1320px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* ── Brand Column ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Briefcase className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                MyJob
              </span>
            </Link>

            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2 text-gray-400">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                <span>
                  Call now:{" "}
                  <a
                    href="tel:+13195550115"
                    className="font-medium text-white hover:text-primary transition-colors"
                  >
                    (319) 555-0115
                  </a>
                </span>
              </p>
              <p className="flex items-start gap-2 text-gray-400 leading-relaxed">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                <span>
                  6391 Elgin St. Celina, Delaware 10299, New York, United States
                  of America
                </span>
              </p>
            </div>
          </div>

          {/* ── Link Columns ── */}
          <FooterLinkGroup title="Quick Link" links={quickLinks} />
          <FooterLinkGroup title="Candidate" links={candidateLinks} />
          <FooterLinkGroup title="Employers" links={employerLinks} />
          <FooterLinkGroup title="Support" links={supportLinks} />
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-700/50">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-gray-500 sm:flex-row lg:px-6">
          <p>
            &copy; {new Date().getFullYear()} MyJob. All Rights Reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy-policy"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-300 transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
