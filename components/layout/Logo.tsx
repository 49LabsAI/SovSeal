/**
 * Logo - Lockdrop logo component
 *
 * Requirements: 11.1
 */

"use client";

import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function Logo({ size = "md", showIcon = true }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-5xl",
  };

  const iconSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 64, height: 64 },
  };

  return (
    <div className="flex items-center space-x-2">
      {showIcon && (
        <Image
          src="/logo.png"
          alt="Lockdrop logo"
          width={iconSizes[size].width}
          height={iconSizes[size].height}
          className="object-contain"
          priority
        />
      )}
      <span
        className={`${sizeClasses[size]} bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text font-bold text-transparent`}
      >
        Lockdrop
      </span>
    </div>
  );
}
