import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to handle maintenance mode redirect
 * 
 * When NEXT_PUBLIC_MAINTENANCE_MODE is set to "true" in Vercel environment variables,
 * all requests (except the maintenance page itself and static assets) will be
 * redirected to /maintenance.
 * 
 * To enable: Set NEXT_PUBLIC_MAINTENANCE_MODE=true in Vercel Project Settings
 * To disable: Remove the variable or set it to "false"
 */
export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;

  // Paths that should always be accessible
  const allowedPaths = [
    "/maintenance",
    "/_next",
    "/api",
    "/favicon",
    "/logo",
    "/site.webmanifest",
  ];

  // Check if current path should be allowed through
  const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path));
  
  // Allow static files (images, fonts, etc.)
  const isStaticFile = pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/);

  if (maintenanceMode && !isAllowedPath && !isStaticFile) {
    // Redirect to maintenance page
    const maintenanceUrl = new URL("/maintenance", request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  // If not in maintenance mode but user is on maintenance page, redirect to home
  if (!maintenanceMode && pathname === "/maintenance") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
