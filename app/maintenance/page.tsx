"use client";

import { useState } from "react";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600"] });

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    // Store in localStorage for now (can be replaced with actual API)
    try {
      const existingEmails = JSON.parse(localStorage.getItem("sovseal_waitlist") || "[]");
      if (!existingEmails.includes(email)) {
        existingEmails.push(email);
        localStorage.setItem("sovseal_waitlist", JSON.stringify(existingEmails));
      }
      
      setStatus("success");
      setMessage("You're on the list. We'll notify you when the seal is ready.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a1628] text-white ${inter.className}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#102a43]/50 via-transparent to-[#d4af37]/5" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-[#d4af37]/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-[#102a43]/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo/Brand Mark */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center shadow-2xl shadow-[#d4af37]/20">
            <svg className="w-10 h-10 text-[#0a1628]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl text-center">
          {/* Transition Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-[#d4af37] bg-[#d4af37]/10 rounded-full border border-[#d4af37]/20">
            <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse" />
            Transformation in Progress
          </div>

          {/* Headline */}
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 ${playfair.className}`}>
            <span className="text-slate-400">Lockdrop is</span>{" "}
            <span className="text-white">evolving.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-4">
            We are transitioning to{" "}
            <span className={`text-[#d4af37] font-semibold ${playfair.className}`}>SovSeal</span>
          </p>
          
          <p className={`text-lg text-slate-400 mb-2 ${playfair.className} italic`}>
            The Sovereign Protocol for Digital Legacy
          </p>

          <p className="text-slate-500 mb-12 max-w-lg mx-auto">
            The vault is currently being upgraded to institutional-grade security. 
            Your digital legacy deserves nothing less.
          </p>

          {/* Email Capture Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === "loading" || status === "success"}
                  className="w-full px-5 py-4 bg-[#102a43]/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/20 transition-all disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#0a1628] font-semibold rounded-xl hover:from-[#e5c04a] hover:to-[#d4af37] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[#d4af37]/20"
              >
                {status === "loading" ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining...
                  </span>
                ) : status === "success" ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Joined
                  </span>
                ) : (
                  "Notify Me"
                )}
              </button>
            </div>

            {/* Status Message */}
            {message && (
              <p className={`mt-4 text-sm ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {message}
              </p>
            )}
          </form>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Zero-Knowledge Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Client-Side Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Blockchain-Enforced</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center text-slate-600 text-sm">
          <p>Guaranteed by math, not corporations.</p>
        </div>
      </div>
    </div>
  );
}
