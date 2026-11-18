/**
 * Módulo de Almacenamiento Seguro y Gestión de Documentos (HU-02)
 * Integrado con Supabase Storage (bucket privado 'documents') y tabla 'documents' con RLS.
 */

import { createClient } from "@/lib/supabase/client";
import { DocumentItem } from "@/types";

// Límite máximo de tamaño: 25 MB en bytes
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

// Tipos MIME y extensiones permitidas
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "png", "jpg", "jpeg"];

/**
 * Valida el tipo MIME y el tamaño de un archivo antes de la subida
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // 1. Validar tamaño máximo (25 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de 25 MB (pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  // 2. Validar extensión de archivo
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Formato de archivo no permitido (.${extension}). Solo se admiten archivos PDF, Word (.docx, .doc) e imágenes (.png, .jpg, .jpeg).`,
    };
  }

  // 3. Validar tipo MIME
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de contenido no admitido (${file.type}). Por favor selecciona un documento válido.`,
    };
  }

  return { valid: true };
}

/**
 * Formatea el tamaño en bytes a representación legible (KB / MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Determina el tipo simplificado de archivo ('pdf' | 'docx' | 'img')
 */
export function getSimplifiedType(extension: string): "pdf" | "docx" | "img" {
  const ext = extension.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  return "img";
}

import { setDocumentTags } from "@/lib/tags";

export interface UploadDocumentOptions {
  customName?: string;
  categoryId?: string | null;
  folderId?: string | null;
  notes?: string;
  tags?: string[];
}

/**
 * Sube un archivo al bucket privado de Supabase Storage y registra sus metadatos en la tabla 'documents'
 */
export async function uploadDocument(
  file: File,
  options: UploadDocumentOptions = {}
): Promise<{ success: boolean; data?: DocumentItem; error?: string }> {
  // 1. Validar archivo
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const supabase = createClient();

  // 2. Obtener usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Debes iniciar sesión para subir documentos a tu cuenta.",
    };
  }

  try {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    // Limpiar caracteres especiales para el path en storage
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const storagePath = `${user.id}/${Date.now()}_${uniqueId.slice(0, 8)}_${sanitizedOriginalName}`;

    // 3. Subir archivo al bucket privado 'documents'
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]:", uploadError);
      return {
        success: false,
        error: `Error al almacenar el archivo en Supabase Storage: ${uploadError.message}`,
      };
    }

    // 4. Guardar metadatos en la tabla 'documents'
    const displayName = options.customName?.trim() || file.name;
    const { data: documentRow, error: dbError } = await supabase
      .from("documents")
      .insert({
        usuario_id: user.id,
        nombre_archivo: displayName,
        nombre_original: file.name,
        tipo_mime: file.type || "application/octet-stream",
        extension: extension,
        tamano_bytes: file.size,
        storage_path: storagePath,
        categoria_id: options.categoryId || "cat-1",
        carpeta_id: options.folderId || null,
        notas: options.notes?.trim() || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Database Insert Error]:", dbError);
      // Rollback: intentar eliminar el archivo subido si falla el registro en BD
      await supabase.storage.from("documents").remove([storagePath]);
      return {
        success: false,
        error: `Error al registrar los metadatos en la base de datos: ${dbError.message}`,
      };
    }

    // Vincular etiquetas si se especificaron (HU-08)
    if (options.tags && options.tags.length > 0) {
      await setDocumentTags(documentRow.id, options.tags);
    }

    return {
      success: true,
      data: documentRow as DocumentItem,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado durante la subida.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Consulta los documentos reales del usuario autenticado (protegido automáticamente por RLS)
 */
export async function fetchUserDocuments(): Promise<{
  success: boolean;
  data: DocumentItem[];
  error?: string;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Fetch Documents Error]:", error);
    return { success: false, data: [], error: error.message };
  }

  return { success: true, data: (data as DocumentItem[]) || [] };
}

/**
 * Obtiene una URL firmada temporal (15 minutos) para un documento específico (HU-05 y HU-07)
 * Permite especificar el parámetro opcional `download` para forzar la descarga binaria.
 */
export async function fetchDocumentSignedUrl(
  documentId: string,
  download: boolean = false
): Promise<{
  success: boolean;
  signedUrl?: string;
  expiresIn?: number;
  document?: DocumentItem;
  error?: string;
}> {
  try {
    const url = `/api/documents/${documentId}/signed-url${download ? "?download=true" : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Error ${res.status}: No se pudo obtener el enlace de lectura.`,
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
      expiresIn: data.expiresIn,
      document: data.document,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error de conexión al obtener URL firmada.";
    return { success: false, error: msg };
  }
}

/**
 * Descarga directa en el navegador de un documento conservando su formato y nombre original (HU-07)
 */
export async function downloadDocumentFile(doc: {
  id: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchDocumentSignedUrl(doc.id, true);
    if (!res.success || !res.signedUrl) {
      return {
        success: false,
        error: res.error || "No fue posible generar el enlace de descarga directa.",
      };
    }

    // Crear elemento <a> temporal para disparar la descarga en el navegador del cliente
    const link = document.createElement("a");
    link.href = res.signedUrl;
    link.download = doc.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error durante la descarga del archivo.";
    return { success: false, error: msg };
  }
}

/**
 * Renombra un documento en Supabase preservando la extensión original (HU-07)
 */
export async function renameDocument(
  documentId: string,
  newName: string
): Promise<{ success: boolean; data?: DocumentItem; error?: string }> {
  try {
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_archivo: newName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Error ${res.status}: No se pudo renombrar el documento.`,
      };
    }

    return {
      success: true,
      data: data.data as DocumentItem,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error de conexión al renombrar el documento.";
    return { success: false, error: msg };
  }
}

/**
 * Elimina un documento tanto de Supabase Storage como de PostgreSQL (HU-07)
 */
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Error ${res.status}: No se pudo eliminar el documento.`,
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error de conexión al eliminar el documento.";
    return { success: false, error: msg };
  }
}
