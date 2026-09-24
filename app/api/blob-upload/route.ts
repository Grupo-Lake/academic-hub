import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import sanitize from "sanitize-filename";
import { createClient } from "@/lib/supabase/server-client";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // matches the Supabase Storage free-tier ceiling

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const supabase = await createClient();
        const { data } = await supabase.auth.getClaims();
        if (!data?.claims) {
          throw new Error("Not authenticated");
        }

        const safeName = sanitize(pathname);
        if (!safeName || safeName !== pathname) {
          throw new Error("Nome de arquivo inválido.");
        }

        return {
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/png",
            "image/jpeg",
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
