// src/middleware.ts
// Proteksi route - Edge-safe menggunakan getToken dari next-auth/jwt
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/api/public");

  // Biarkan API auth dan route publik langsung lewat tanpa auth check
  if (isApiAuth) return NextResponse.next();

  // Ambil session token langsung dari cookies (cek secure cookie untuk production, fallback non-secure)
  let token = await getToken({ req, secret, secureCookie: true });
  if (!token) {
    token = await getToken({ req, secret, secureCookie: false });
  }

  const isLoggedIn = !!token;

  // Redirect ke /dashboard jika sudah login tapi coba buka /login
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Biarkan route publik diakses siapa saja
  if (isPublicRoute) return NextResponse.next();

  // Route terproteksi yang wajib login: /dashboard, /kategori, /dokumen, /akun
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/kategori") ||
    pathname.startsWith("/dokumen") ||
    pathname.startsWith("/akun");

  if (!isLoggedIn && (isProtectedRoute || !isLoginPage)) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Route Protections Berdasarkan Role ─────────────────────────────
  if (isLoggedIn && token) {
    const userRole = token.role as string | undefined;

    // Kelola Akun: Khusus SUPER_ADMIN
    if (pathname.startsWith("/akun") && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)"],
};
