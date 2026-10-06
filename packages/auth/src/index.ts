import { fileURLToPath } from "node:url"
import path from "node:path"
import { config as loadEnv } from "dotenv"

loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") })

import { and, eq } from "drizzle-orm"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins/organization"
import { db } from "@workspace/db/client"
import * as schema from "@workspace/db/schema"

function requiredEnv(name: string, minLength = 1): string {
  const value = process.env[name]
  if (!value || value.length < minLength) {
    throw new Error(`Missing or invalid required env var: ${name}`)
  }
  return value
}

const secret = requiredEnv("BETTER_AUTH_SECRET", 32)
const githubClientId = requiredEnv("GITHUB_CLIENT_ID")
const githubClientSecret = requiredEnv("GITHUB_CLIENT_SECRET")

// Necroshift is invite-only: the first account on a fresh deployment becomes
// the owner; every account after that must match a pending invitation. This
// blocks pre-registration account takeover (squatting a teammate's email
// before they accept their invite), across every signup method.
export async function isRegistrationAllowed(email: string): Promise<boolean> {
  const [existingUser] = await db.select({ id: schema.user.id }).from(schema.user).limit(1)
  if (!existingUser) return true
  const [pendingInvite] = await db
    .select({ id: schema.invitation.id })
    .from(schema.invitation)
    .where(and(eq(schema.invitation.email, email), eq(schema.invitation.status, "pending")))
    .limit(1)
  return Boolean(pendingInvite)
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  encryptOAuthTokens: true,
  user: {
    validateUserInfo: async ({ user, source }) => {
      if (source.action !== "create-user") return
      const allowed = await isRegistrationAllowed(user.email as string)
      if (allowed) return
      return { error: "registration_closed", errorDescription: "This Necroshift instance is invite-only." }
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    },
  },
  plugins: [organization(), nextCookies()],
})
