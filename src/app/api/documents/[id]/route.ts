import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/documents/[id] - Obtiene los detalles de un documento específico
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { success: false, error: "Documento no encontrado o sin permisos." },
        { status: 404 }
      );
    }

    if (doc.usuario_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: este documento no pertenece a tu cuenta." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doc,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/[id] - Actualiza metadatos del documento (renombrar, cambiar carpeta, notas, categoría)
 * Preserva estrictamente la extensión original del archivo al renombrar.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 1. Verificar existencia y titularidad del documento
    const { data: existingDoc, error: fetchError } = await supabase
      .from("documents")
      .select("id, usuario_id, extension, nombre_archivo")
      .eq("id", id)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json(
        { success: false, error: "Documento no encontrado o sin permisos." },
        { status: 404 }
      );
    }

    if (existingDoc.usuario_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: este documento no pertenece a tu cuenta." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.carpeta_id !== undefined) {
      updateFields.carpeta_id = body.carpeta_id || null;
    }

    // Renombrar con preservación estricta de la extensión original (CA-07.1)
    if (typeof body.nombre_archivo === "string") {
      let rawName = body.nombre_archivo.trim();
      if (!rawName) {
        return NextResponse.json(
          { success: false, error: "El nombre del archivo no puede estar vacío." },
          { status: 400 }
        );
      }

      const originalExt = existingDoc.extension
        ? existingDoc.extension.toLowerCase().replace(/^\./, "")
        : "";

      if (originalExt) {
        // Si el usuario no escribió la extensión al final o la escribió diferente, aseguramos la extensión original
        const extSuffix = `.${originalExt}`;
        if (!rawName.toLowerCase().endsWith(extSuffix)) {
          // Remover extensiones erróneas si intentó cambiarlas
          const lastDotIndex = rawName.lastIndexOf(".");
          if (lastDotIndex > 0) {
            rawName = rawName.substring(0, lastDotIndex);
          }
          rawName = `${rawName}${extSuffix}`;
        }
      }

      updateFields.nombre_archivo = rawName;
    }

    if (typeof body.categoria_id === "string") {
      updateFields.categoria_id = body.categoria_id;
    }

    if (typeof body.notas === "string") {
      updateFields.notas = body.notas.trim();
    }

    // Sincronización de etiquetas asociadas (HU-08)
    if (Array.isArray(body.etiquetas)) {
      const tagNames = Array.from(
        new Set(
          body.etiquetas
            .map((n: unknown) =>
              typeof n === "string" ? n.trim().replace(/^#/, "").toLowerCase() : ""
            )
            .filter(Boolean)
        )
      );

      const tagIds: string[] = [];
      for (const name of tagNames) {
        const { data: exTag } = await supabase
          .from("tags")
          .select("id")
          .eq("usuario_id", user.id)
          .eq("nombre", name)
          .maybeSingle();

        if (exTag?.id) {
          tagIds.push(exTag.id);
        } else {
          const { data: nTag } = await supabase
            .from("tags")
            .insert({ usuario_id: user.id, nombre: name })
            .select("id")
            .single();
          if (nTag?.id) tagIds.push(nTag.id);
        }
      }

      // Borrar asociaciones actuales del documento
      await supabase
        .from("document_tags")
        .delete()
        .eq("documento_id", id);

      // Insertar nuevas asociaciones
      if (tagIds.length > 0) {
        const rows = tagIds.map((tid) => ({
          documento_id: id,
          etiqueta_id: tid,
        }));
        await supabase.from("document_tags").insert(rows);
      }
    }

    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[PATCH /api/documents/[id] Error]:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Documento actualizado correctamente.",
      data: updatedDoc,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id] - Eliminación completa dual (Base de datos + Storage) (CA-07.3)
 * Garantiza aislamiento por RLS y elimina el binario en Supabase Storage además del registro en PostgreSQL.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 1. Obtener documento y validar titularidad (RLS)
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, usuario_id, storage_path, nombre_archivo")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json(
        { success: false, error: "Documento no encontrado o sin permisos." },
        { status: 404 }
      );
    }

    if (doc.usuario_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: este documento no pertenece a tu cuenta." },
        { status: 403 }
      );
    }

    // 2. Eliminar el archivo físico de Supabase Storage en el bucket privado 'documents'
    if (doc.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.storage_path]);

      if (storageError) {
        console.warn("[DELETE /api/documents/[id] Storage Warning]:", storageError);
      }
    }

    // 3. Eliminar el registro en la base de datos PostgreSQL
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/documents/[id] Database Error]:", deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `El documento "${doc.nombre_archivo}" ha sido eliminado definitivamente del sistema y del almacenamiento.`,
      deletedId: id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
