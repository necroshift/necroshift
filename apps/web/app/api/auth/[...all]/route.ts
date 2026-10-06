import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@workspace/auth"

export const { GET, POST } = toNextJsHandler(auth.handler)
