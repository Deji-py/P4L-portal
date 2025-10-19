/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type UserRole = "aggregator" | "bulk_trader" | "farmer";

const ROLE_COOKIE_NAME = "user_role";

/**
 * Extract role from pathname
 */
function getRoleFromPathname(pathname: string): UserRole | null {
  if (pathname.includes("/aggregator")) return "aggregator";
  if (pathname.includes("/bulk_trader") || pathname.includes("/bulk_trader"))
    return "bulk_trader";
  if (pathname.includes("/farmer")) return "farmer";
  return null;
}

function getRoleBasePath(role: UserRole): string {
  if (role === "aggregator") return "/dashboard/aggregator";
  if (role === "bulk_trader") return "/dashboard/bulk_trader";
  if (role === "farmer") return "/dashboard/farmers";
  return "/";
}

function getUserAccessibleRoutes(role: UserRole): string[] {
  if (role === "aggregator") {
    return ["/dashboard/aggregator"];
  }
  if (role === "bulk_trader") {
    return ["/dashboard/bulk_trader", "/dashboard/bulk_trader"];
  }
  if (role === "farmer") {
    return ["/dashboard/farmers"];
  }
  return [];
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = [
    "/",
    "/signup",
    "/login",
    "/login/aggregator",
    "/login/bulk_trader",
    "/login/farmer",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If no user, redirect to home unless on public route
  if (userError || !user) {
    if (isPublicRoute) {
      return supabaseResponse;
    }

    if (userError) {
      console.error("Error fetching user:", userError.message);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Get role from cookie
  const roleCookie = request.cookies.get(ROLE_COOKIE_NAME);
  const userRole = roleCookie?.value as UserRole | undefined;

  // If user is authenticated but no role cookie, log them out
  if (!userRole) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Error during logout:", error);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "no_role");
    url.searchParams.set("message", "Session expired. Please log in again.");

    const response = NextResponse.redirect(url);
    response.cookies.delete(ROLE_COOKIE_NAME);
    return response;
  }

  const roleBasePath = getRoleBasePath(userRole);
  const accessibleRoutes = getUserAccessibleRoutes(userRole);

  // Check if user is trying to access a dashboard route
  if (pathname.startsWith("/dashboard")) {
    // Check if the path matches their authorized role's routes
    const hasAccess = accessibleRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!hasAccess) {
      // User is trying to access a dashboard that doesn't match their role
      const requestedRole = getRoleFromPathname(pathname);

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        console.error("Error during logout:", error);
      }

      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "role_mismatch");
      url.searchParams.set(
        "message",
        `You are logged in as a ${userRole}, but tried to access the ${
          requestedRole || "unauthorized"
        } dashboard. Please select the correct role.`
      );

      const response = NextResponse.redirect(url);
      response.cookies.delete(ROLE_COOKIE_NAME);
      return response;
    }
  }

  // If user is authenticated and on root path ("/"), redirect to their dashboard
  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = roleBasePath;
    return NextResponse.redirect(url);
  }

  // If authenticated user is on a login page, redirect to their dashboard
  if (pathname.startsWith("/login") && user) {
    const url = request.nextUrl.clone();
    url.pathname = roleBasePath;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
