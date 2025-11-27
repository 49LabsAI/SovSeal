/**
 * Navigation - Main navigation component
 *
 * Requirements: 11.2, 11.4
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { Logo } from "./Logo";

export function Navigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard", requiresWallet: true },
    { href: "/create", label: "Create Message", requiresWallet: true },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-900 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Lockdrop home">
            <Logo size="md" />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isDisabled = link.requiresWallet && !isConnected;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs md:text-sm font-medium transition-colors px-2 py-1 rounded ${
                    isActive
                      ? "text-blue-400 bg-blue-900"
                      : isDisabled
                        ? "pointer-events-none cursor-not-allowed text-gray-600"
                        : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
                  }`}
                  aria-disabled={isDisabled}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Wallet Connect Button */}
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
