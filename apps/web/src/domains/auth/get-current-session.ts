import "server-only"
import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})
