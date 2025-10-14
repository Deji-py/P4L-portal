/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type UserRole = "aggregator" | "bulk-trader" | null;

async function getUserRole(supabase: any, userId: string): Promise<UserRole> {
  try {
    // Check aggregators table
    const { data: aggregatorData, error: aggError } = await supabase
      .from("aggregators")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (aggregatorData?.role) {
      return aggregatorData.role as UserRole;
    }

    // Check bulk_traders table
    const { data: traderData, error: traderError } = await supabase
      .from("bulk_traders")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (traderData?.role) {
      return traderData.role as UserRole;
    }

    return null;
  } catch (error) {
    console.error("Unexpected error fetching user role:", error);
    return null;
  }
}

function getRoleBasePath(role: UserRole): string {
  if (role === "aggregator") return "/dashboard/aggregator";
  if (role === "bulk-trader") return "/dashboard/bulk-trader";
  return "/";
}

function getUserAccessibleRoutes(role: UserRole): string[] {
  if (role === "aggregator") {
    return ["/dashboard/aggregator"];
  }
  if (role === "bulk-trader") {
    return ["/dashboard/bulk-trader"];
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

  const publicRoutes = [
    "/",
    "/signup",
    "/login",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is trying to access a protected route, store which tab they were on
  if (!user && !isPublicRoute) {
    const roleFromPath = pathname.includes("aggregator")
      ? "aggregator"
      : pathname.includes("bulk-trader")
      ? "bulk-trader"
      : null;

    if (roleFromPath) {
      supabaseResponse.cookies.set("intended_role", roleFromPath, {
        maxAge: 60 * 5, // 5 minutes
        path: "/",
      });
    }
  }

  if (userError || !user) {
    if (isPublicRoute) {
      return supabaseResponse;
    }
    if (userError) {
      console.error("Error fetching user:", userError.message);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const userRole = await getUserRole(supabase, user.id);

  if (!userRole) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Error during logout:", error);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "unauthorized_role");
    url.searchParams.set("message", "User does not have an authorized role");

    const response = NextResponse.redirect(url);
    response.cookies.delete("intended_role");
    return response;
  }

  // Check if there's an intended role cookie (from before login)
  const intendedRole = request.cookies.get("intended_role")?.value as UserRole;

  // If user tried to access a different role's dashboard before login, log them out
  if (intendedRole && intendedRole !== userRole) {
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
      `You are logged in as a ${userRole}, but tried to access the ${intendedRole} tab. Please log in on the correct tab.`
    );

    const response = NextResponse.redirect(url);
    response.cookies.delete("intended_role");
    return response;
  }

  const roleBasePath = getRoleBasePath(userRole);
  const accessibleRoutes = getUserAccessibleRoutes(userRole);

  // Check if user is trying to access a protected route they don't have access to
  if (pathname.startsWith("/dashboard")) {
    if (!accessibleRoutes.some((route) => pathname.startsWith(route))) {
      const url = request.nextUrl.clone();
      url.pathname = roleBasePath;
      const response = NextResponse.redirect(url);
      response.cookies.delete("intended_role");
      return response;
    }
  }

  // If authenticated and on home page, redirect to role-based dashboard
  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = roleBasePath;
    const response = NextResponse.redirect(url);
    response.cookies.delete("intended_role");
    return response;
  }

  return supabaseResponse;
}
