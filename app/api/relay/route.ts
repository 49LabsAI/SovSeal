/**
 * POST /api/relay
 *
 * Transaction relay endpoint for gasless transactions.
 * Accepts signed user intents and submits them via the relayer wallet.
 *
 * Rate limited to prevent abuse.
 */

import { NextRequest, NextResponse } from "next/server";
import { RelayerService } from "@/lib/paymaster/RelayerService";
import { PaymasterService } from "@/lib/paymaster/PaymasterService";
import type { SignedIntent } from "@/lib/paymaster/types";

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Check if gasless is enabled
        if (!PaymasterService.isEnabled()) {
            return NextResponse.json(
                { error: "Gasless transactions are not enabled" },
                { status: 503 }
            );
        }

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();
        const signedIntent = body as SignedIntent;

        // Validate required fields
        if (
            !signedIntent.intent ||
            !signedIntent.signature ||
            !signedIntent.nonce ||
            !signedIntent.timestamp
        ) {
            return NextResponse.json(
                { error: "Invalid request: missing required fields" },
                { status: 400 }
            );
        }

        // Validate intent fields
        const { intent } = signedIntent;
        if (
            !intent.encryptedKeyCID ||
            !intent.encryptedMessageCID ||
            !intent.messageHash ||
            !intent.unlockTimestamp ||
            !intent.recipient ||
            !intent.sender
        ) {
            return NextResponse.json(
                { error: "Invalid intent: missing required fields" },
                { status: 400 }
            );
        }

        // Check user eligibility for sponsorship
        const eligibility = await PaymasterService.checkEligibility(intent.sender);
        if (!eligibility.eligible) {
            return NextResponse.json(
                { error: eligibility.reason || "Not eligible for gas sponsorship" },
                { status: 403 }
            );
        }

        // Submit transaction via relayer
        const result = await RelayerService.submitTransaction(signedIntent);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            transactionHash: result.transactionHash,
            messageId: result.messageId,
            blockHash: result.blockHash,
        });
    } catch (error) {
        console.error("[relay] Error processing request:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    const enabled = PaymasterService.isEnabled();

    if (!enabled) {
        return NextResponse.json(
            { status: "disabled", message: "Gasless transactions not enabled" },
            { status: 503 }
        );
    }

    try {
        const balance = await RelayerService.getBalance();
        const hasBalance = balance > 0n;

        return NextResponse.json({
            status: hasBalance ? "healthy" : "low_balance",
            enabled: true,
            message: hasBalance
                ? "Relay service operational"
                : "Warning: Relayer balance low",
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: "error",
                message: "Failed to check relayer status",
            },
            { status: 500 }
        );
    }
}
