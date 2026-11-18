import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  classifyDocumentWithGemini,
  getFallbackClassification,
} from "@/lib/ai/gemini-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de Seguridad y Autenticación con Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado. Debes iniciar sesión para analizar documentos con IA.",
        },
        { status: 401 }
      );
    }

    // 2. Extracción y Validación del Archivo
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No se proporcionó ningún archivo para analizar.",
        },
        { status: 400 }
      );
    }

    // Límite de 25 MB del sistema
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "El archivo excede el tamaño máximo permitido de 25 MB.",
        },
        { status: 400 }
      );
    }

    // 3. Comprobación de disponibilidad de clave de API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      const fallback = getFallbackClassification(file.name);
      return NextResponse.json({
        success: true,
        fallback: true,
        aiAvailable: false,
        message:
          "GEMINI_API_KEY no configurada en el servidor. Clasificación manual habilitada.",
        data: fallback,
      });
    }

    // 4. Inferencia con Google Gemini 2.0 Flash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obtener categorías accesibles del usuario para alimentar el prompt de IA (HU-08)
    const { data: dbCategories } = await supabase
      .from("categories")
      .select("id, nombre");

    const dynamicCategories = (dbCategories || []).map((c: { id: string; nombre: string }) => ({
      id: c.id,
      name: c.nombre,
    }));

    try {
      const aiResult = await classifyDocumentWithGemini({
        fileBuffer: buffer,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        availableCategories:
          dynamicCategories.length > 0 ? dynamicCategories : undefined,
      });

      return NextResponse.json({
        success: true,
        fallback: false,
        aiAvailable: true,
        data: aiResult,
      });
    } catch (aiError: unknown) {
      const errorMsg =
        aiError instanceof Error ? aiError.message : "Error al procesar con IA";
      console.warn("[Clasificación IA Fallback]:", errorMsg);

      // Degradación elegante (CA-03.3): retornamos respuesta funcional sin error 500
      const fallback = getFallbackClassification(file.name);
      return NextResponse.json({
        success: true,
        fallback: true,
        aiAvailable: false,
        message: `Servicio de IA temporalmente no disponible (${errorMsg}). Clasificación manual habilitada.`,
        data: fallback,
      });
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error interno en el servidor";
    console.error("[Route /api/ai/classify Exception]:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al procesar la solicitud de clasificación.",
      },
      { status: 500 }
    );
  }
}
