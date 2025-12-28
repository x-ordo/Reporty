export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { getObjectStream } from "@/server/storage";
import { eq } from "drizzle-orm";
import { Buffer } from "node:buffer";

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function GET(req: Request, { params }: { params: { packId: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const pack = await db.query.defensePacks.findFirst({
    where: eq(schema.defensePacks.id, params.packId)
  });
  if (!pack) return Response.json({ error: "not_found" }, { status: 404 });
  if (pack.status !== "generated" || !pack.pdfPath) {
    return Response.json({ error: "not_ready", status: pack.status }, { status: 409 });
  }

  const obj = await getObjectStream(pack.pdfPath);
  if (!obj.Body) return Response.json({ error: "storage_missing" }, { status: 404 });

  const buf = await streamToBuffer(obj.Body as any);

  return new Response(buf, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="DefensePack_${pack.id}.pdf"`,
      "cache-control": "no-store"
    }
  });
}