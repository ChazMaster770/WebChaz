import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Incorrect admin password. Please try again." },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({ authenticated: true });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }
}
