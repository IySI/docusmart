import { createClient } from "@/lib/supabase/client";
import { Folder } from "@/types";

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
  depth: number;
}

export interface CreateFolderPayload {
  nombre: string;
  parent_id?: string | null;
  color_icono?: string;
}

export interface UpdateFolderPayload {
  nombre?: string;
  parent_id?: string | null;
  color_icono?: string;
}

/**
 * Consulta todas las carpetas del usuario autenticado respetando RLS
 */
export async function fetchUserFolders(): Promise<{
  success: boolean;
  data?: Folder[];
  error?: string;
}> {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Debes iniciar sesión para consultar tus carpetas." };
  }

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("[fetchUserFolders Error]:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as Folder[]) || [] };
}

/**
 * Crea una nueva carpeta o subcarpeta asociada al usuario autenticado
 */
export async function createFolder(
  payload: CreateFolderPayload
): Promise<{
  success: boolean;
  data?: Folder;
  error?: string;
}> {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Debes iniciar sesión para crear carpetas." };
  }

  const cleanName = payload.nombre.trim();
  if (!cleanName) {
    return { success: false, error: "El nombre de la carpeta no puede estar vacío." };
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      usuario_id: user.id,
      nombre: cleanName,
      parent_id: payload.parent_id || null,
      color_icono: payload.color_icono || "#3b82f6",
    })
    .select()
    .single();

  if (error) {
    console.error("[createFolder Error]:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Folder };
}

/**
 * Actualiza el nombre, color o carpeta padre de una carpeta existente
 */
export async function updateFolder(
  folderId: string,
  payload: UpdateFolderPayload
): Promise<{
  success: boolean;
  data?: Folder;
  error?: string;
}> {
  const supabase = createClient();

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.nombre !== undefined) {
    const cleanName = payload.nombre.trim();
    if (!cleanName) {
      return { success: false, error: "El nombre no puede estar vacío." };
    }
    updateFields.nombre = cleanName;
  }

  if (payload.color_icono !== undefined) {
    updateFields.color_icono = payload.color_icono;
  }

  if (payload.parent_id !== undefined) {
    if (payload.parent_id === folderId) {
      return { success: false, error: "Una carpeta no puede ser padre de sí misma." };
    }
    updateFields.parent_id = payload.parent_id || null;
  }

  const { data, error } = await supabase
    .from("folders")
    .update(updateFields)
    .eq("id", folderId)
    .select()
    .single();

  if (error) {
    console.error("[updateFolder Error]:", error);
    // Errores de trigger anti-ciclos en PostgreSQL
    if (error.message.includes("Jerarquía circular") || error.message.includes("check_folder_hierarchy_cycles")) {
      return {
        success: false,
        error: "No se puede mover la carpeta dentro de una de sus propias subcarpetas (referencia circular).",
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Folder };
}

/**
 * Elimina una carpeta. Los documentos asociados se desvinculan a la raíz automáticamente por ON DELETE SET NULL.
 */
export async function deleteFolder(
  folderId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) {
    console.error("[deleteFolder Error]:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mueve un documento a una carpeta específica (o a la raíz si folderId es null)
 */
export async function moveDocumentToFolder(
  documentId: string,
  folderId: string | null
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();

  const { error } = await supabase
    .from("documents")
    .update({
      carpeta_id: folderId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    console.error("[moveDocumentToFolder Error]:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Construye una estructura en árbol jerárquico a partir de una lista plana de carpetas
 */
export function buildFolderTree(folders: Folder[], parentId: string | null = null, depth = 0): FolderTreeNode[] {
  return folders
    .filter((f) => (parentId === null ? !f.parent_id : f.parent_id === parentId))
    .map((folder) => ({
      ...folder,
      depth,
      children: buildFolderTree(folders, folder.id, depth + 1),
    }));
}

/**
 * Obtiene la ruta de migas de pan (Breadcrumbs) desde la raíz hasta la carpeta actual
 */
export function getBreadcrumbTrail(
  folders: Folder[],
  currentFolderId: string | null
): Array<{ id: string | null; name: string }> {
  const crumbs: Array<{ id: string | null; name: string }> = [
    { id: null, name: "Inicio" },
  ];

  if (!currentFolderId) return crumbs;

  const folderMap = new Map(folders.map((f) => [f.id, f]));
  const trail: Array<{ id: string; name: string }> = [];

  let curr: Folder | undefined = folderMap.get(currentFolderId);
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    trail.unshift({ id: curr.id, name: curr.nombre });
    curr = curr.parent_id ? folderMap.get(curr.parent_id) : undefined;
  }

  return [...crumbs, ...trail];
}

/**
 * Determina todos los IDs de carpetas descendientes para evitar selección circular en la UI
 */
export function getDescendantFolderIds(folders: Folder[], folderId: string): Set<string> {
  const descendants = new Set<string>([folderId]);
  let added = true;

  while (added) {
    added = false;
    for (const f of folders) {
      if (f.parent_id && descendants.has(f.parent_id) && !descendants.has(f.id)) {
        descendants.add(f.id);
        added = true;
      }
    }
  }

  return descendants;
}
