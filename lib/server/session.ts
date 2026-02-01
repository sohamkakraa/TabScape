import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "tabscape_session";

export function getSessionUserId(req?: NextRequest) {
  if (req) {
    return req.cookies.get(SESSION_COOKIE)?.value ?? null;
  }
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
