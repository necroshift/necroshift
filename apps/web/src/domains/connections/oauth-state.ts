import "server-only"
import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "necroshift_oauth_state"

export async function createOAuthState(): Promise<string> {
  const state = randomBytes(24).toString("base64url")
  const jar = await cookies()
  jar.set(COOKIE_NAME, state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" })
  return state
}

export async function verifyAndConsumeOAuthState(receivedState: string | null): Promise<boolean> {
  const jar = await cookies()
  const expected = jar.get(COOKIE_NAME)?.value
  jar.delete(COOKIE_NAME)
  return Boolean(expected) && expected === receivedState
}
