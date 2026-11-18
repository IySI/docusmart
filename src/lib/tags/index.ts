/**
 * Servicio de Gestión de Etiquetas y Relación con Documentos (HU-08)
 * Conectado con Supabase PostgreSQL y políticas RLS
 */

import { createClient } from "@/lib/supabase/client";
import { Tag } from "@/types";

/**
 * Consulta todas las etiquetas creadas por el usuario autenticado
 */
export async function fetchUserTags(): Promise<{
  success: boolean;
  data: Tag[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.warn("[fetchUserTags Error]:", error.message);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as Tag[]) || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener etiquetas";
    return { success: false, data: [], error: msg };
  }
}

/**
 * Crea una nueva etiqueta para el usuario autenticado (o la devuelve si ya existe)
 */
export async function createOrGetTag(
  name: string,
  color: string = "#6366f1"
): Promise<{ success: boolean; data?: Tag; error?: string }> {
  try {
    const cleanName = name.trim().replace(/^#/, "").toLowerCase();
    if (!cleanName) {
      return { success: false, error: "El nombre de la etiqueta no puede estar vacío." };
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Debes iniciar sesión para gestionar etiquetas." };
    }

    // 1. Buscar si ya existe
    const { data: existing } = await supabase
      .from("tags")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("nombre", cleanName)
      .maybeSingle();

    if (existing) {
      return { success: true, data: existing as Tag };
    }

    // 2. Si no existe, crearla
    const { data: newTag, error: insertError } = await supabase
      .from("tags")
      .insert({
        usuario_id: user.id,
        nombre: cleanName,
        color,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[createOrGetTag Error]:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, data: newTag as Tag };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al crear la etiqueta.";
    return { success: false, error: msg };
  }
}

/**
 * Elimina una etiqueta del usuario (las asociaciones en document_tags se borran por cascade)
 */
export async function deleteTag(
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autorizado." };
    }

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId)
      .eq("usuario_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar etiqueta.";
    return { success: false, error: msg };
  }
}

/**
 * Obtiene un mapa de todas las etiquetas asociadas a cada documento del usuario:
 * Record<documentId, string[] (nombres de etiquetas)>
 */
export async function fetchAllDocumentTagsMap(): Promise<{
  success: boolean;
  data: Record<string, string[]>;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("document_tags")
      .select("documento_id, tags!inner(nombre)");

    if (error) {
      console.warn("[fetchAllDocumentTagsMap Error]:", error.message);
      return { success: true, data: {} };
    }

    const map: Record<string, string[]> = {};
    if (data) {
      (data as unknown as Array<{ documento_id: string; tags: unknown }>).forEach((row) => {
        if (!row.documento_id) return;
        if (!map[row.documento_id]) {
          map[row.documento_id] = [];
        }
        if (Array.isArray(row.tags)) {
          row.tags.forEach((t: { nombre?: string }) => {
            if (t?.nombre) map[row.documento_id].push(t.nombre);
          });
        } else if (row.tags && typeof row.tags === "object" && "nombre" in row.tags) {
          const tagObj = row.tags as { nombre: string };
          if (tagObj.nombre) map[row.documento_id].push(tagObj.nombre);
        }
      });
    }

    return { success: true, data: map };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener mapa de etiquetas.";
    return { success: true, data: {}, error: msg };
  }
}

/**
 * Asigna un conjunto de nombres de etiquetas a un documento
 * Crea las etiquetas que no existan y sincroniza la tabla document_tags
 */
export async function setDocumentTags(
  documentId: string,
  tagNames: string[]
): Promise<{ success: boolean; tags?: string[]; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autorizado." };
    }

    // Normalizar nombres
    const cleanNames = Array.from(
      new Set(
        tagNames
          .map((n) => n.trim().replace(/^#/, "").toLowerCase())
          .filter(Boolean)
      )
    );

    // 1. Obtener o crear cada tag para obtener sus IDs
    const tagIds: string[] = [];
    for (const name of cleanNames) {
      const res = await createOrGetTag(name);
      if (res.success && res.data) {
        tagIds.push(res.data.id);
      }
    }

    // 2. Eliminar etiquetas actuales del documento
    await supabase.from("document_tags").delete().eq("documento_id", documentId);

    // 3. Insertar las nuevas asociaciones
    if (tagIds.length > 0) {
      const rowsToInsert = tagIds.map((tagId) => ({
        documento_id: documentId,
        etiqueta_id: tagId,
      }));

      const { error: insertErr } = await supabase
        .from("document_tags")
        .insert(rowsToInsert);

      if (insertErr) {
        console.error("[setDocumentTags insert error]:", insertErr);
        return { success: false, error: insertErr.message };
      }
    }

    return { success: true, tags: cleanNames };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al vincular etiquetas.";
    return { success: false, error: msg };
  }
}
