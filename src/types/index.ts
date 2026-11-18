export * from "./database";

/**
 * Tipos auxiliares para respuestas de API y estado de interfaz
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AiClassificationResult {
  categoria_id: string;
  categoria_sugerida: string;
  etiquetas: string[];
  confianza: number;
  resumen?: string;
}

export interface DocumentFilterOptions {
  searchQuery?: string;
  carpetaId?: string | null;
  categoriaId?: string | null;
  etiquetaId?: string | null;
  formato?: "pdf" | "docx" | "img" | "todos";
}
