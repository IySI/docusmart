import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/documents/search
 * Endpoint de búsqueda avanzada y filtrado de documentos en Supabase.
 * Respeta estrictamente Row-Level Security (RLS) y aislamiento multi-tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión autenticada
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Inicia sesión para realizar búsquedas." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const formato = searchParams.get("formato")?.toLowerCase() || "todos";
    const categoriaId = searchParams.get("categoria_id");
    const carpetaId = searchParams.get("carpeta_id");
    const fecha = searchParams.get("fecha")?.toLowerCase() || "all";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // 2. Construir consulta base aislada por usuario_id (reforzando RLS)
    let query = supabase
      .from("documents")
      .select("*")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // 3. Filtro de búsqueda textual por nombre y metadatos (notas, nombre original)
    if (q) {
      // Búsqueda insensible a mayúsculas/minúsculas en nombre_archivo, nombre_original o notas
      query = query.or(
        `nombre_archivo.ilike.%${q}%,nombre_original.ilike.%${q}%,notas.ilike.%${q}%`
      );
    }

    // 4. Filtro por formato de archivo
    if (formato === "pdf") {
      query = query.eq("extension", "pdf");
    } else if (formato === "docx") {
      query = query.in("extension", ["docx", "doc"]);
    } else if (formato === "img") {
      query = query.in("extension", ["jpg", "jpeg", "png", "webp", "gif"]);
    }

    // 5. Filtro por categoría
    if (categoriaId && categoriaId !== "all") {
      query = query.eq("categoria_id", categoriaId);
    }

    // 6. Filtro por carpeta
    if (carpetaId) {
      if (carpetaId === "root") {
        query = query.is("carpeta_id", null);
      } else {
        query = query.eq("carpeta_id", carpetaId);
      }
    }

    // 7. Filtro por rango de fecha
    if (fecha === "7d") {
      const dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", dateLimit);
    } else if (fecha === "30d") {
      const dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", dateLimit);
    } else if (fecha === "year") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
      query = query.gte("created_at", startOfYear);
    }

    // 8. Ejecutar consulta
    const { data, error } = await query;

    if (error) {
      console.error("[Documents Search Error]:", error);
      return NextResponse.json(
        { success: false, error: `Error en la consulta: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado en búsqueda.";
    console.error("[Search Route Error]:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
