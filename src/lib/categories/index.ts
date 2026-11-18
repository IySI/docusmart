/**
 * Servicio de Gestión de Categorías Personalizadas (HU-08)
 * Conectado con Supabase PostgreSQL y políticas RLS
 */

import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";

export const DEFAULT_SYSTEM_CATEGORIES: Category[] = [
  { id: "cat-1", usuario_id: null, nombre: "Facturas", name: "Facturas", color: "#3b82f6", icono: "Receipt", created_at: new Date().toISOString() },
  { id: "cat-2", usuario_id: null, nombre: "Legal", name: "Legal", color: "#8b5cf6", icono: "Scale", created_at: new Date().toISOString() },
  { id: "cat-3", usuario_id: null, nombre: "Identificaciones", name: "Identificaciones", color: "#10b981", icono: "UserCheck", created_at: new Date().toISOString() },
  { id: "cat-4", usuario_id: null, nombre: "Garantías", name: "Garantías", color: "#f59e0b", icono: "Shield", created_at: new Date().toISOString() },
  { id: "cat-5", usuario_id: null, nombre: "Nóminas", name: "Nóminas", color: "#ec4899", icono: "CreditCard", created_at: new Date().toISOString() },
];

export const SYSTEM_DEFAULT_CATEGORIES = DEFAULT_SYSTEM_CATEGORIES;

/**
 * Consulta todas las categorías accesibles para el usuario autenticado
 * (predeterminadas del sistema + personalizadas del usuario)
 */
export async function fetchCategories(): Promise<{
  success: boolean;
  data: Category[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[fetchCategories] Error consultando tabla categories:", error.message);
      return { success: true, data: DEFAULT_SYSTEM_CATEGORIES };
    }

    if (!data || data.length === 0) {
      return { success: true, data: DEFAULT_SYSTEM_CATEGORIES };
    }

    return {
      success: true,
      data: (data as Array<Record<string, unknown>>).map((c) => ({
        ...c,
        nombre: (c.nombre as string) || (c.name as string),
        name: (c.name as string) || (c.nombre as string),
      })) as unknown as Category[],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener categorías";
    console.error("[fetchCategories exception]:", err);
    return { success: true, data: DEFAULT_SYSTEM_CATEGORIES, error: msg };
  }
}

/**
 * Crea una nueva categoría personalizada para el usuario actual
 */
export async function createCategory(input: {
  nombre: string;
  color: string;
  icono?: string;
}): Promise<{ success: boolean; data?: Category; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Debes iniciar sesión para crear categorías." };
    }

    const trimmedName = input.nombre.trim();
    if (!trimmedName) {
      return { success: false, error: "El nombre de la categoría es obligatorio." };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        usuario_id: user.id,
        nombre: trimmedName,
        color: input.color || "#3b82f6",
        icono: input.icono || "Tag",
      })
      .select()
      .single();

    if (error) {
      console.error("[createCategory Error]:", error);
      return { success: false, error: `Error al guardar la categoría: ${error.message}` };
    }

    return { success: true, data: data as Category };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al crear categoría.";
    return { success: false, error: msg };
  }
}

/**
 * Actualiza una categoría personalizada existente
 */
export async function updateCategory(
  id: string,
  input: {
    nombre?: string;
    color?: string;
    icono?: string;
  }
): Promise<{ success: boolean; data?: Category; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autorizado." };
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.nombre !== undefined) {
      const trimmed = input.nombre.trim();
      if (!trimmed) {
        return { success: false, error: "El nombre de la categoría no puede estar vacío." };
      }
      updates.nombre = trimmed;
    }

    if (input.color !== undefined) updates.color = input.color;
    if (input.icono !== undefined) updates.icono = input.icono;

    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .eq("usuario_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[updateCategory Error]:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Category };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar categoría.";
    return { success: false, error: msg };
  }
}

/**
 * Elimina una categoría personalizada del usuario
 * Reasigna los documentos asociados a la categoría predeterminada ('cat-1')
 */
export async function deleteCategory(
  id: string
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

    // 1. Reasignar documentos que tenían esta categoría a 'cat-1'
    await supabase
      .from("documents")
      .update({ categoria_id: "cat-1", updated_at: new Date().toISOString() })
      .eq("categoria_id", id)
      .eq("usuario_id", user.id);

    // 2. Eliminar la categoría (solo si pertenece al usuario actual)
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("usuario_id", user.id);

    if (error) {
      console.error("[deleteCategory Error]:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar categoría.";
    return { success: false, error: msg };
  }
}
