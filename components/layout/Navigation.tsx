/**
 * Navigation - App navigation component (for authenticated routes)
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load AuthButton to avoid pulling in Privy on initial load
const AuthButton = dynamic(
  () => import("@/components/auth/AuthButton").then((mod) => ({ default: mod.AuthButton })),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-20 animate-pulse rounded-lg bg-dark-800/50" />
    ),
  }
);

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/app", label: "Messages" },
    { href: "/app/create", label: "Create" },
    { href: "/app/settings", label: "Settings" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b border-dark-800/50 bg-dark-950/80 backdrop-blur-xl"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="SovSeal home"
          >
            <Image
              src="/logo.png"
              alt="SovSeal"
              width={32}
              height={32}
              className="transition-transform group-hover:scale-105"
            />
            <span className="gradient-text hidden font-display text-lg font-bold sm:inline">
              SovSeal
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/app" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-all sm:px-3 sm:text-sm ${
                    isActive
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-dark-300 hover:bg-dark-800/50 hover:text-dark-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Auth Button (Privy) - lazy loaded */}
            <div className="ml-2 sm:ml-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
