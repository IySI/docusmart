import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/documents/[id]/signed-url
 * Genera una URL firmada temporal (15 minutos / 900 s) para acceso seguro a un documento privado en Supabase Storage.
 * Respeta estrictamente Row-Level Security (RLS) y aislamiento entre usuarios.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de documento requerido." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verificar sesión autenticada
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado. Inicia sesión para acceder a este documento.",
        },
        { status: 401 }
      );
    }

    // 2. Consultar el documento en la base de datos (protegido por RLS)
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        {
          success: false,
          error: "Documento no encontrado o no tienes permisos para acceder a él.",
        },
        { status: 404 }
      );
    }

    // 3. Verificación de titularidad adicional para aislamiento multi-tenant estricto
    if (doc.usuario_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: este documento pertenece a otro usuario.",
        },
        { status: 403 }
      );
    }

    // 4. Generar URL firmada temporal con TTL de 900 segundos (15 minutos)
    // Si se especifica ?download=true, configuramos la cabecera Content-Disposition para descarga obligatoria
    const url = new URL(_request.url);
    const isDownload = url.searchParams.get("download") === "true";
    const expiresIn = 900;

    const storageOptions = isDownload
      ? { download: doc.nombre_archivo }
      : undefined;

    const { data: signedData, error: storageError } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, expiresIn, storageOptions);

    if (storageError || !signedData?.signedUrl) {
      console.error("[Storage Signed URL Error]:", storageError);
      return NextResponse.json(
        {
          success: false,
          error: "Error al generar la URL temporal firmada desde Supabase Storage.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      expiresIn,
      document: doc,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[Signed URL Route Error]:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
