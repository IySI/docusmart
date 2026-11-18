/**
 * Tipos de datos del modelo conceptual de DocuSmart (PostgreSQL / Supabase)
 * Correspondientes a la arquitectura aprobada en la Fase 4.
 */

export interface User {
  id: string; // UUID
  email: string;
  nombre_completo: string;
  created_at: string;
  updated_at?: string;
}

export interface Folder {
  id: string; // UUID
  usuario_id: string;
  parent_id?: string | null;
  nombre: string;
  color_icono?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string; // ID o UUID
  usuario_id?: string | null; // NULL si es predeterminada del sistema
  nombre: string;
  name?: string; // Nombre visible (compatibilidad con MockCategory y componentes)
  descripcion?: string | null;
  color: string;
  icono?: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentItem {
  id: string; // UUID
  usuario_id: string;
  carpeta_id?: string | null;
  categoria_id?: string | null;
  nombre_archivo: string;
  nombre_original: string;
  tipo_mime: string;
  extension: string;
  tamano_bytes: number;
  storage_path: string;
  notas?: string;
  created_at: string;
  updated_at?: string;
}

export interface Tag {
  id: string; // UUID
  usuario_id: string;
  nombre: string;
  created_at: string;
}

export interface DocumentTag {
  documento_id: string;
  etiqueta_id: string;
}
