import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { TRAINER_ROLES } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/login", "/", "/invite"];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/invite");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    const role = profile?.role ?? "client";
    url.pathname = TRAINER_ROLES.includes(role as any) ? "/dashboard" : "/my-dashboard";
    return NextResponse.redirect(url);
  }

  // Protect trainer routes
  const trainerRoutes = ["/dashboard", "/clients", "/workouts", "/programs", "/sessions", "/notes", "/settings"];
  const isTrainerRoute = trainerRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (user && isTrainerRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !TRAINER_ROLES.includes(profile.role as any)) {
      const url = request.nextUrl.clone();
      url.pathname = "/my-dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Protect client route
  if (user && pathname.startsWith("/my-dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && TRAINER_ROLES.includes(profile.role as any)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect old admin routes
  if (pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/admin/dashboard", "/dashboard")
      .replace("/admin/clients", "/clients")
      .replace("/admin/workouts", "/workouts")
      .replace("/admin/schedule", "/sessions")
      .replace("/admin/settings", "/settings")
      .replace("/admin", "/dashboard");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
