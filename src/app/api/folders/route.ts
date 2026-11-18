import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/folders - Retorna la lista de carpetas del usuario autenticado
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Inicia sesión para ver carpetas." },
        { status: 401 }
      );
    }

    const { data: folders, error: dbError } = await supabase
      .from("folders")
      .select("*")
      .order("nombre", { ascending: true });

    if (dbError) {
      console.error("[GET /api/folders Error]:", dbError);
      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: folders || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/folders - Crea una nueva carpeta o subcarpeta
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Inicia sesión para crear carpetas." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    const parentId = body.parent_id || null;
    const colorIcono = body.color_icono || "#3b82f6";

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: "El nombre de la carpeta es obligatorio." },
        { status: 400 }
      );
    }

    const { data: newFolder, error: insertError } = await supabase
      .from("folders")
      .insert({
        usuario_id: user.id,
        nombre,
        parent_id: parentId,
        color_icono: colorIcono,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[POST /api/folders Error]:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: newFolder },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
