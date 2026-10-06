import { z } from "zod"

export const logPayloadSchema = z.looseObject({
  level: z.string().optional(),
  message: z.string().optional(),
})

export const crashPayloadSchema = z.looseObject({
  message: z.string().optional(),
})

export type LogPayload = z.infer<typeof logPayloadSchema>
export type CrashPayload = z.infer<typeof crashPayloadSchema>
