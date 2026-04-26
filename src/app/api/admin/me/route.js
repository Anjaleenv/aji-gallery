import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "admin_gallery";

export async function GET() {
  const all = await cookies();
  if (all.get(COOKIE)?.value === "1") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
