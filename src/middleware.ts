import { type NextRequest } from "next/server";
import { updateSession } from "./utils/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - root path for login/onboarding
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|$).*)",
  ],
};
