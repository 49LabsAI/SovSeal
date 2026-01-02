"use client";

import Link from "next/link";
import Image from "next/image";
// Direct imports to avoid barrel export issues
import { MarketingNav } from "../layout/MarketingNav";
import { MarketingFooter } from "../layout/MarketingFooter";
import { AuroraBackground } from "../ui/AuroraBackground";
import {
  ShieldCheckIcon,
  ClockIcon,
  CloudIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export function MarketingPageContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
          <AuroraBackground />

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-8 animate-fade-in">
              <Image
                src="/logo.png"
                alt="SovSeal"
                width={80}
                height={80}
                className="mx-auto"
                priority
              />
            </div>

            <h1 className="mb-6 animate-slide-up font-display text-5xl font-bold md:text-6xl lg:text-7xl">
              <span className="gradient-text">Lock</span>
              <span className="text-dark-100"> a moment.</span>
              <br />
              <span className="gradient-text">Unlock</span>
              <span className="text-dark-100"> a memory.</span>
            </h1>

            <p
              className="mx-auto mb-10 max-w-2xl animate-slide-up text-xl text-dark-300 md:text-2xl"
              style={{ animationDelay: "0.1s" }}
            >
              Time-locked audio and video messages. Encrypted in your browser.
              Delivered exactly when you decide. No servers. No shortcuts. Just
              you and time.
            </p>

            <div
              className="flex animate-slide-up flex-col items-center justify-center gap-4 sm:flex-row"
              style={{ animationDelay: "0.2s" }}
            >
              <Link
                href="/app"
                className="btn-primary group flex items-center gap-2 px-8 py-4 text-lg"
              >
                Launch App
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div
              className="mt-12 flex animate-fade-in flex-wrap justify-center gap-3"
              style={{ animationDelay: "0.4s" }}
            >
              <span className="trust-badge">
                <ShieldCheckIcon className="h-4 w-4 text-brand-400" />
                AES-256 Encryption
              </span>
              <span className="trust-badge">
                <LockClosedIcon className="h-4 w-4 text-brand-400" />
                Open Source
              </span>
              <span className="trust-badge">
                <CloudIcon className="h-4 w-4 text-brand-400" />
                Decentralized
              </span>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-dark-900/50 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-dark-400">
                Three simple steps to send messages to the future
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <StepCard
                num="1"
                title="Create"
                description="Record or upload your audio/video message. Set a recipient and choose when it unlocks."
              />
              <StepCard
                num="2"
                title="Store"
                description="Your message is encrypted in your browser and stored on decentralized IPFS. No one can read it."
              />
              <StepCard
                num="3"
                title="Unlock"
                description="When the time comes, the recipient decrypts and views the message. Blockchain guarantees the timing."
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
                Privacy by Design
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-dark-400">
                Every layer of SovSeal is built to protect your privacy
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FeatureCard
                icon={<LockClosedIcon className="h-6 w-6" />}
                title="Client-Side Encryption"
                description="All encryption happens in your browser using AES-256-GCM. No plaintext data ever leaves your device."
              />
              <FeatureCard
                icon={<ClockIcon className="h-6 w-6" />}
                title="Time-Locked Delivery"
                description="Blockchain consensus enforces unlock conditions. Messages can only be decrypted after the specified time."
              />
              <FeatureCard
                icon={<CloudIcon className="h-6 w-6" />}
                title="Decentralized Storage"
                description="Encrypted messages are stored on IPFS via Storacha Network. No central authority controls your data."
              />
              <FeatureCard
                icon={<ShieldCheckIcon className="h-6 w-6" />}
                title="Blockchain Verified"
                description="Message metadata is anchored on Polkadot for transparency, immutability, and trustless verification."
              />
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="bg-dark-900/50 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Built on Trusted Infrastructure
            </h2>
            <p className="mb-12 text-lg text-dark-400">
              Powered by industry-leading decentralized technologies
            </p>

            <TechLogosCarousel />
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">
              Ready to send a message to the future?
            </h2>
            <p className="mb-8 text-lg text-dark-400">
              Sign in and create your first time-locked message in minutes.
            </p>
            <Link
              href="/app"
              className="btn-primary group inline-flex items-center gap-2 px-10 py-4 text-lg"
            >
              Get Started
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function StepCard({
  num,
  title,
  description,
}: {
  num: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card-glass group p-8 text-center transition-transform hover:scale-[1.02]">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 transition-shadow group-hover:shadow-glow">
        <span className="font-display text-3xl font-bold text-brand-400">
          {num}
        </span>
      </div>
      <h3 className="mb-3 font-display text-xl font-semibold">{title}</h3>
      <p className="text-dark-400">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card-glass group flex gap-4 p-6 transition-colors hover:border-brand-500/40">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-400 transition-shadow group-hover:shadow-glow">
        {icon}
      </div>
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-dark-400">{description}</p>
      </div>
    </div>
  );
}

const techLogos = [
  { name: "Polkadot", src: "/logos/polkadotnew.svg" },
  { name: "IPFS", src: "/logos/ipfsnew.svg" },
  { name: "Storacha", src: "/logos/storachanew.svg" },
  { name: "Talisman", src: "/logos/talismannew.svg" },
];

function TechLogosCarousel() {
  return (
    <div className="relative mx-auto w-full overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-dark-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-dark-900 to-transparent" />

      <div className="flex w-max animate-slide-logos">
        {/* First set */}
        {techLogos.map((logo, index) => (
          <div
            key={`first-${logo.name}-${index}`}
            className="flex-shrink-0 px-12 opacity-70 transition-opacity hover:opacity-100"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={140}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {techLogos.map((logo, index) => (
          <div
            key={`second-${logo.name}-${index}`}
            className="flex-shrink-0 px-12 opacity-70 transition-opacity hover:opacity-100"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={140}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
