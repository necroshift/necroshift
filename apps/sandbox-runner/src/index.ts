import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { startSandboxContainer } from "./docker-run"
import { isRunRequest } from "./types"

const PORT = Number(process.env.PORT ?? 4000)

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/runs") return void handleStartRun(req, res)
  if (req.method === "GET" && req.url === "/health") return void res.writeHead(200).end("ok")
  res.writeHead(404).end()
})

async function handleStartRun(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJsonBody(req).catch(() => null)
  if (!isRunRequest(body)) {
    res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "invalid_run_request" }))
    return
  }
  // Fire-and-forget: the sandbox reports its own progress to Postgres.
  // sandbox-runner doesn't track run state itself.
  startSandboxContainer(body).catch((error) => console.error(`sandbox run ${body.runId} failed to start`, error))
  res.writeHead(202, { "content-type": "application/json" }).end(JSON.stringify({ ok: true }))
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
      } catch (error) {
        reject(error instanceof Error ? error : new Error("invalid JSON body"))
      }
    })
    req.on("error", reject)
  })
}

server.listen(PORT, () => console.log(`sandbox-runner listening on :${PORT}`))
