export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { verifyEvidenceChain } from "@/server/evidence-verify";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const result = await verifyEvidenceChain(params.id);
  const status = result.ok ? 200 : 409;
  return Response.json(result, { status });
}
