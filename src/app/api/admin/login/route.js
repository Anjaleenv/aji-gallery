import { NextResponse } from "next/server";

const COOKIE = "admin_gallery";
const CODE = process.env.ADMIN_ACCESS_CODE || "6565";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (String(body?.code) !== CODE) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
