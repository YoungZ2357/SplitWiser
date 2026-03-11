import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protect Dashboard and related UI pages
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/bills/new") ||
      (pathname.startsWith("/bills/") && !pathname.includes("/share")))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect Backend API routes
  if (!user && pathname.startsWith("/api/")) {
    
    // Auth endpoints and share endpoints are public
    if (pathname.startsWith("/api/auth") || pathname.endsWith("/share")) {
      return supabaseResponse;
    }

    // Receipt parsing requires authentication
    if (pathname.startsWith("/api/receipts")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Bills CRUD requires authentication EXCEPT standard GET read requests
    // Example: GET /api/bills/xyz should be public. POST/PUT/DELETE should be blocked.
    // GET /api/bills (list) will handle its own empty state / auth check loosely.
    if (pathname.startsWith("/api/bills") && request.method !== "GET") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
