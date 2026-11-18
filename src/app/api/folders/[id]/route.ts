import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * PATCH /api/folders/[id] - Actualiza nombre, color o carpeta padre (con prevención anti-ciclos)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.nombre === "string") {
      const cleanName = body.nombre.trim();
      if (!cleanName) {
        return NextResponse.json(
          { success: false, error: "El nombre no puede estar vacío." },
          { status: 400 }
        );
      }
      updateFields.nombre = cleanName;
    }

    if (typeof body.color_icono === "string") {
      updateFields.color_icono = body.color_icono;
    }

    if (body.parent_id !== undefined) {
      if (body.parent_id === id) {
        return NextResponse.json(
          { success: false, error: "Una carpeta no puede ser padre de sí misma." },
          { status: 400 }
        );
      }
      updateFields.parent_id = body.parent_id || null;
    }

    const { data: updatedFolder, error: updateError } = await supabase
      .from("folders")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[PATCH /api/folders/[id] Error]:", updateError);
      if (
        updateError.message.includes("Jerarquía circular") ||
        updateError.message.includes("check_folder_hierarchy_cycles")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Jerarquía circular no permitida: no puedes mover una carpeta dentro de una de sus subcarpetas.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: updatedFolder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/[id] - Elimina una carpeta (desvinculando documentos a la raíz)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/folders/[id] Error]:", deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Carpeta eliminada exitosamente. Los documentos contenidos fueron reubicados en la raíz.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
