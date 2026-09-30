import { Suspense } from "react";
import { ToastContainer } from "@/components/feedback/Toast";

/**
 * Auth Route Group Layout
 *
 * Wraps /login and /verify-otp with a centered shell.
 * ToastContainer sits here so OTP/login errors surface on these pages.
 * No Header/Footer — auth pages are intentionally chrome-free.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Brand bar */}
      <div className="shrink-0 px-6 pt-8 pb-0">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-brand-navy font-bold text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="SkillConnect home"
        >
          {/* Replace with <Image> + logo asset when available */}
          <span className="text-primary">Skill</span>
          <span>Connect</span>
        </a>
      </div>

      {/* Centered content area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </main>

      {/* Footer note */}
      <footer className="shrink-0 text-center text-xs text-gray-400 pb-6">
        &copy; {new Date().getFullYear()} SkillConnect. All rights reserved.
      </footer>

      {/* Toast notifications */}
      <ToastContainer position="top-center" />
    </div>
  );
}
