/**
 * Footer - Main footer component with links
 *
 * Requirements: 11.1, 11.2
 */

"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-900 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              About Lockdrop
            </h3>
            <p className="text-sm text-gray-300">
              Lockdrop: Time-locked messages guaranteed by cryptography and
              blockchain consensus, not corporate promises.
            </p>
            <p className="text-xs text-gray-400 mt-2 italic">
              Guaranteed by math, not corporations
            </p>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.talisman.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Talisman Wallet
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.polkadot.io/paseo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Paseo Faucet
                </a>
              </li>
              <li>
                <a
                  href="https://storacha.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Storacha Network
                </a>
              </li>
              <li>
                <a
                  href="https://docs.storacha.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Storacha Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Privacy & Security Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              Privacy & Security
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Client-side encryption only</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Decentralized IPFS storage</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Blockchain-enforced unlocks</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>No plaintext data leaves browser</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© {currentYear} Lockdrop. Open source and decentralized.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://polkadot.network"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors"
              >
                Polkadot
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
