/**
 * Footer - App footer component (minimal for authenticated routes)
 */

"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-dark-800 bg-dark-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-dark-500 sm:flex-row">
          <div className="flex items-center gap-4">
            <Link href="/" className="transition-colors hover:text-dark-300">
              © {currentYear} SovSeal
            </Link>
            <span className="hidden sm:inline">•</span>
            <a
              href="https://github.com/radebe49/sovseal"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-dark-300"
            >
              GitHub
            </a>
            <span className="hidden sm:inline">•</span>
            <a
              href="https://github.com/radebe49/sovseal/blob/main/docs/SECURITY_AUDIT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-dark-300"
            >
              Security
            </a>
          </div>
          <p className="text-xs text-dark-600">
            Guaranteed by math, not corporations
          </p>
        </div>
      </div>
    </footer>
  );
}
