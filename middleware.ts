import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	// Remove cookie-based auth check - it doesn't work in iframes
	// Authentication is now handled client-side using useSession() hook
	return NextResponse.next();
}

export const config = {
	runtime: "nodejs",
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};