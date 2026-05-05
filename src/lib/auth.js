import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production"
);

/**
 * Sign a JWT token with user payload
 */
export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from the request
 * Works with both cookie and Authorization header
 */
export async function getAuthUser(request) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return await verifyToken(token);
  }

  // Try cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (token) {
    return await verifyToken(token);
  }

  return null;
}

/**
 * Auth middleware — returns user or error response
 */
export async function requireAuth(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { error: "Unauthorized — please log in", status: 401 };
  }
  return { user };
}

/**
 * Admin middleware — returns user or error response
 */
export async function requireAdmin(request) {
  const result = await requireAuth(request);
  if (result.error) return result;
  if (result.user.role !== "admin") {
    return { error: "Forbidden — admin access required", status: 403 };
  }
  return result;
}
