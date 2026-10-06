import { handleIngestionRequest } from "@/src/domains/ingestion/handle-request"

export async function POST(request: Request, { params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params
  return handleIngestionRequest(request, projectSlug, "crash")
}
