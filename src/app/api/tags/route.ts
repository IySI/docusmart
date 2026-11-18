import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/tags
 * Retorna las etiquetas creadas por el usuario autenticado
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Crea una nueva etiqueta para el usuario autenticado o devuelve la existente
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const cleanName = (body.nombre || "").trim().replace(/^#/, "").toLowerCase();
    if (!cleanName) {
      return NextResponse.json(
        { success: false, error: "El nombre de la etiqueta es requerido." },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("tags")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("nombre", cleanName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const color = body.color || "#6366f1";
    const { data, error } = await supabase
      .from("tags")
      .insert({
        usuario_id: user.id,
        nombre: cleanName,
        color,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
