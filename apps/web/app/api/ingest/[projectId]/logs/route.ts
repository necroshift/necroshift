import { handleIngestionRequest } from "@/src/domains/ingestion/handle-request"

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return handleIngestionRequest(request, projectId, "log")
}
