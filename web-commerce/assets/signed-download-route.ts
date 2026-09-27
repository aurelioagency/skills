import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// Copiar a app/api/download/[productId]/route.ts.
// npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
// Compatible con Cloudflare R2 y Backblaze B2 (ambos hablan la API de S3),
// cambiando solo el "endpoint" según el proveedor elegido.

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "no autenticado" }, { status: 401 });
  }

  // TODO: verificar en la base de datos que session.user.email compró
  // params.productId (el registro que creó el webhook). Si no compró, 403.
  // const purchased = await db.purchases.findOne({ email: session.user.email, productId: params.productId });
  // if (!purchased) return NextResponse.json({ error: "no comprado" }, { status: 403 });

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `${params.productId}.zip`, // el archivo pesado subido de antemano al bucket
  });

  // Expira en 1 hora — no es un link permanente, evita que se comparta libremente.
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return NextResponse.json({ url });
}
