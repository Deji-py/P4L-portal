/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type UserRole = "aggregator" | "bulk-trader" | "farmer";

interface RoleResolutionResult {
  role: UserRole | null;
  error?: string;
}

export const ROLE_COOKIE_NAME = "user_role";
export const INTENDED_ROLE_COOKIE_NAME = "intended_role";
export const ROLE_HASH_COOKIE_NAME = "user_role_hash";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const PERIODIC_VERIFICATION_RATE = 0.1; // 10% of requests

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/login/aggregator",
  "/login/bulk-trader",
  "/login/farmer",
  "/forgot-password",
  "/reset-password",
];

// ============================================================================
// ROLE CONFIGURATION
// ============================================================================

const ROLE_CONFIG: Record<UserRole, { basePath: string; tableName: string }> = {
  aggregator: {
    basePath: "/dashboard/aggregator",
    tableName: "aggregators",
  },
  "bulk-trader": {
    basePath: "/dashboard/bulk-trader",
    tableName: "bulk_traders",
  },
  farmer: {
    basePath: "/dashboard/farmers",
    tableName: "farmers",
  },
};

function getRoleBasePath(role: UserRole): string {
  return ROLE_CONFIG[role].basePath;
}

function getTableNameForRole(role: UserRole): string {
  return ROLE_CONFIG[role].tableName;
}

// ============================================================================
// DATABASE QUERIES
// ============================================================================

/**
 * Verify if user exists in a specific role's table
 * OPTIMIZED: Single targeted query - no fallback scanning
 *
 * @param supabase - Supabase client instance
 * @param userId - User's UUID
 * @param roleToVerify - The specific role to verify
 * @returns Promise<boolean> - true if user exists in role's table
 */
async function verifyUserRoleInDB(
  supabase: any,
  userId: string,
  roleToVerify: UserRole
): Promise<boolean> {
  try {
    const tableName = getTableNameForRole(roleToVerify);

    const { data, error } = await supabase
      .from(tableName)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(`[DB Error] Failed to verify ${tableName}:`, error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("[DB Error] Exception in verifyUserRoleInDB:", error);
    return false;
  }
}

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================

/**
 * Create a simple hash of userId + role for tamper detection
 * SECURITY: Detects manual cookie modifications
 */
function createRoleHash(userId: string, role: UserRole): string {
  // Simple hash using btoa (sufficient for tamper detection)
  // In production, consider using a proper HMAC with a secret key
  return btoa(`${userId}:${role}:${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
}

/**
 * Verify if role cookie has been tampered with
 * @returns true if cookie appears to be tampered with
 */
function isRoleCookieTampered(
  userId: string,
  roleCookie: string,
  hashCookie: string | undefined
): boolean {
  if (!hashCookie) {
    // No hash means old session or tampering - require verification
    return true;
  }

  const expectedHash = createRoleHash(userId, roleCookie as UserRole);
  return hashCookie !== expectedHash;
}

/**
 * Set secure user role cookie with tamper detection hash
 * SECURITY: Stores both role and verification hash
 */
function setUserRoleCookie(
  response: NextResponse,
  userId: string,
  role: UserRole
): void {
  const roleHash = createRoleHash(userId, role);

  // Set role cookie
  response.cookies.set(ROLE_COOKIE_NAME, role, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Set hash cookie to detect tampering
  response.cookies.set(ROLE_HASH_COOKIE_NAME, roleHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear all role-related cookies
 */
function clearRoleCookies(response: NextResponse): void {
  response.cookies.delete(ROLE_COOKIE_NAME);
  response.cookies.delete(INTENDED_ROLE_COOKIE_NAME);
  response.cookies.delete(ROLE_HASH_COOKIE_NAME);
}

// ============================================================================
// ROLE RESOLUTION
// ============================================================================

/**
 * Resolve and verify user role with optimized DB queries and tamper detection
 * STRATEGY:
 * 1. Intended role (after login) - verify specific table only
 * 2. Existing role cookie - check for tampering, verify if needed
 * 3. No role info - fail immediately (no fallback)
 *
 * SECURITY ENHANCEMENT:
 * - Detects manual cookie modifications via hash verification
 * - Forces immediate DB check if tampering detected
 * - Periodic verification for legitimate cookies (10% of requests)
 *
 * @returns RoleResolutionResult with role or error message
 */
async function resolveUserRole(
  supabase: any,
  userId: string,
  request: NextRequest,
  existingRoleCookie: string | undefined,
  intendedRoleCookie: string | undefined
): Promise<RoleResolutionResult> {
  // ========================================
  // PRIORITY 1: Handle intended_role (just after login)
  // ========================================
  if (intendedRoleCookie) {
    const intendedRole = intendedRoleCookie as UserRole;

    // FAST PATH: Only verify the intended role's specific table
    const isValidRole = await verifyUserRoleInDB(
      supabase,
      userId,
      intendedRole
    );

    if (isValidRole) {
      console.log(`[Auth] ✓ Verified intended role: ${intendedRole}`);
      return { role: intendedRole };
    }

    // User does NOT have access to the intended role - FAIL
    const errorMessage = `User is unauthorized to access ${intendedRole} dashboard`;
    console.error(`[Auth] ✗ ${errorMessage}`);
    return { role: null, error: errorMessage };
  }

  // ========================================
  // PRIORITY 2: Use existing user_role cookie
  // ========================================
  if (existingRoleCookie) {
    const existingRole = existingRoleCookie as UserRole;
    const roleHashCookie = request.cookies.get(ROLE_HASH_COOKIE_NAME)?.value;

    // SECURITY: Detect cookie tampering - verify immediately if hash doesn't match
    const isTampered = isRoleCookieTampered(
      userId,
      existingRoleCookie,
      roleHashCookie
    );

    if (isTampered) {
      console.warn(
        `[Auth] ⚠️ Role cookie tampering detected for user ${userId} - verifying with DB`
      );
      const isValid = await verifyUserRoleInDB(supabase, userId, existingRole);

      if (!isValid) {
        const errorMessage = `Role "${existingRole}" is invalid or has been tampered with.`;
        console.error(`[Auth] ✗ ${errorMessage}`);
        return { role: null, error: errorMessage };
      }

      console.log(`[Auth] ✓ Tampered cookie verified - role is valid`);
      return { role: existingRole };
    }

    // Periodic integrity check to catch role revocations (only if not tampered)
    // Only 10% of requests to minimize DB load
    if (Math.random() < PERIODIC_VERIFICATION_RATE) {
      const isValid = await verifyUserRoleInDB(supabase, userId, existingRole);

      if (!isValid) {
        const errorMessage = `Role "${existingRole}" is no longer valid. Access has been revoked.`;
        console.warn(`[Auth] ✗ ${errorMessage}`);
        return { role: null, error: errorMessage };
      }

      console.log(`[Auth] ✓ Periodic verification passed for ${existingRole}`);
    }

    return { role: existingRole };
  }

  // ========================================
  // PRIORITY 3: No role information - FAIL
  // ========================================
  const errorMessage = "No role information found. Please log in again.";
  console.error(`[Auth] ✗ ${errorMessage}`);
  return { role: null, error: errorMessage };
}

// ============================================================================
// REDIRECT HELPERS
// ============================================================================

/**
 * Create redirect response to user's dashboard
 */
function redirectToDashboard(
  request: NextRequest,
  role: UserRole
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = getRoleBasePath(role);
  return NextResponse.redirect(url);
}

/**
 * Create redirect response to home with error
 */
function redirectToHomeWithError(
  request: NextRequest,
  errorMessage: string
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("error", "unauthorized");
  url.searchParams.set("message", errorMessage);
  return NextResponse.redirect(url);
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Initialize Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Handle unauthenticated users
  if (userError || !user) {
    if (isPublicRoute) {
      return supabaseResponse;
    }

    if (userError) {
      console.error("[Auth] Error fetching user:", userError.message);
    }

    return redirectToHomeWithError(request, "Please log in to continue");
  }

  // ============================================================================
  // ROLE RESOLUTION FOR AUTHENTICATED USERS
  // ============================================================================

  const existingRoleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  const intendedRoleCookie = request.cookies.get(
    INTENDED_ROLE_COOKIE_NAME
  )?.value;

  // Resolve user role with optimized queries and tamper detection
  const { role: userRole, error: roleError } = await resolveUserRole(
    supabase,
    user.id,
    request,
    existingRoleCookie,
    intendedRoleCookie
  );

  // Update cookies based on resolution result
  if (userRole) {
    setUserRoleCookie(supabaseResponse, user.id, userRole);
  }

  // Always clear intended_role after processing
  if (intendedRoleCookie) {
    supabaseResponse.cookies.delete(INTENDED_ROLE_COOKIE_NAME);
  }

  // ============================================================================
  // HANDLE NO VALID ROLE - SIGN OUT USER
  // ============================================================================

  if (!userRole) {
    console.error(
      `[Auth] Signing out user ${user.id} - ${
        roleError || "no valid role found"
      }`
    );

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("[Auth] Error during sign out:", error);
    }

    const response = redirectToHomeWithError(
      request,
      roleError || "No role found. Please contact support."
    );
    clearRoleCookies(response);
    return response;
  }

  // ============================================================================
  // ROUTE AUTHORIZATION & REDIRECTS
  // ============================================================================

  const roleBasePath = getRoleBasePath(userRole);

  // 1. Root path → Redirect to user's dashboard
  if (pathname === "/") {
    return redirectToDashboard(request, userRole);
  }

  // 2. Login pages → Redirect authenticated users to their dashboard
  if (pathname.startsWith("/login")) {
    return redirectToDashboard(request, userRole);
  }

  // 3. Dashboard route protection → Must match user's role
  if (pathname.startsWith("/dashboard")) {
    const hasAccess = pathname.startsWith(roleBasePath);

    if (!hasAccess) {
      console.warn(
        `[Auth] Access denied: User with role "${userRole}" tried to access "${pathname}"`
      );
      return redirectToDashboard(request, userRole);
    }
  }

  // 4. All other routes (static assets, public pages, etc.) → Allow
  return supabaseResponse;
}
