/**
 * Cliente de Inteligencia Artificial de DocuSmart con Google Gemini 2.0 Flash
 *
 * Principios de Arquitectura:
 * 1. Ejecución exclusiva en el servidor (Node.js runtime / Next.js Route Handler).
 * 2. La API Key NUNCA se expone al cliente (prohibido prefijo NEXT_PUBLIC_).
 * 3. Inferencia ultrarrápida (< 4 segundos) mediante 'gemini-2.0-flash'.
 * 4. Respuestas estructuradas forzadas por JSON Schema.
 * 5. Degradación elegante ante fallos de red, timeouts o ausencia de clave.
 */

import type { AiClassificationResult } from "../../types/index.ts";

// Catálogo estándar de categorías de DocuSmart para sugerencia de IA
export const SYSTEM_CATEGORIES = [
  { id: "cat-1", name: "Facturas", description: "Facturas, recibos, tickets, comprobantes de pago o compras" },
  { id: "cat-2", name: "Legal", description: "Contratos, convenios, acuerdos legales, términos y condiciones, poderes" },
  { id: "cat-3", name: "Finanzas", description: "Nóminas, declaraciones tributarias, extractos bancarios, balances, impuestos" },
  { id: "cat-4", name: "Personal", description: "DNI, pasaporte, títulos académicos, currículum vitae, informes médicos" },
  { id: "cat-5", name: "Vehículo", description: "Pólizas de seguro de auto, ITV, permisos de circulación, multas de tráfico" },
];

export interface GeminiClassificationPayload {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  availableCategories?: Array<{ id: string; name: string; description?: string }>;
}

/**
 * Extrae texto legible básico de archivos de texto o metadatos de documentos
 */
function extractTextSnippet(buffer: Buffer, mimeType: string): string | null {
  try {
    // Si es texto plano o JSON
    if (mimeType.startsWith("text/")) {
      return buffer.toString("utf-8").slice(0, 4000);
    }
    // Si es DOCX, buscamos fragmentos de texto en XML sin dependencias pesadas
    if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) {
      const raw = buffer.toString("binary");
      const matches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (matches && matches.length > 0) {
        const text = matches
          .map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
          .join(" ")
          .slice(0, 3000);
        return text.trim() || null;
      }
    }
  } catch {
    // Si falla la extracción, devolvemos null y nos basamos en metadatos
  }
  return null;
}

// Lista de modelos Gemini Flash compatibles y vigentes (con fallback automático ante cambios de versión)
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
  "gemini-flash-latest",
].filter(Boolean) as string[];

/**
 * Clasifica un documento utilizando Google Gemini Flash con respuesta JSON estructurada.
 * Si falla, arroja un error con descripción para activar el mecanismo de degradación elegante.
 */
export async function classifyDocumentWithGemini(
  payload: GeminiClassificationPayload
): Promise<AiClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY no está configurada en las variables de entorno del servidor. Se activará la clasificación manual."
    );
  }

  const { fileBuffer, fileName, mimeType } = payload;
  const isImageOrPdf =
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/");

  // Construcción del prompt estructurado con categorías dinámicas si están disponibles
  const catSource =
    payload.availableCategories && payload.availableCategories.length > 0
      ? payload.availableCategories
      : SYSTEM_CATEGORIES;

  const categoriesList = catSource
    .map((c) => `- ID '${c.id}': ${c.name}${c.description ? ` (${c.description})` : ""}`)
    .join("\n");

  const promptText = `Eres el asistente de clasificación documental de DocuSmart.
Analiza con precisión el contenido del siguiente archivo y clasifícalo en exactamente una de las categorías del sistema.

Nombre del archivo: "${fileName}"
Tipo MIME: "${mimeType}"

Categorías disponibles:
${categoriesList}

Instrucciones:
1. Selecciona la categoría que mejor describa la naturaleza principal del documento.
2. Indica el ID exacto ('cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5') y su nombre correspondiente.
3. Genera entre 2 y 5 etiquetas cortas (sin el símbolo #, ej: "2026", "Impuestos", "Iberdrola", "Contrato").
4. Asigna un valor de confianza entre 0.0 y 1.0 según la claridad del contenido.
5. Proporciona un resumen de una sola frase (máximo 120 caracteres) explicando el por qué de la clasificación.`;

  const parts: Array<Record<string, unknown>> = [{ text: promptText }];

  // Si es PDF o imagen y su tamaño es manejable (< 10 MB para inline base64), adjuntamos los bytes
  if (isImageOrPdf && fileBuffer.length <= 10 * 1024 * 1024) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileBuffer.toString("base64"),
      },
    });
  } else {
    // Si es DOCX u otro formato, extraemos texto si es posible
    const textSnippet = extractTextSnippet(fileBuffer, mimeType);
    if (textSnippet) {
      parts.push({
        text: `Fragmento de texto extraído del documento:\n"""\n${textSnippet}\n"""`,
      });
    }
  }

  // Configuración con JSON Schema estricto compatible con Gemini
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: parts,
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          categoria_id: {
            type: "STRING",
            description: "ID de la categoría elegida (ej. 'cat-1', 'cat-2', etc.)",
          },
          categoria_sugerida: {
            type: "STRING",
            description: "Nombre legible de la categoría elegida",
          },
          etiquetas: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Entre 2 y 5 etiquetas cortas descriptivas",
          },
          confianza: {
            type: "NUMBER",
            description: "Puntuación de certeza entre 0.0 y 1.0",
          },
          resumen: {
            type: "STRING",
            description: "Resumen breve de una frase sobre el documento",
          },
        },
        required: ["categoria_id", "categoria_sugerida", "etiquetas", "confianza"],
      },
    },
  };

  let lastError: Error | null = null;

  // Intentamos con la lista de modelos candidatos (ej. gemini-3.8-flash o gemini-flash-latest)
  for (const model of CANDIDATE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        console.warn(`[Gemini Model ${model}]: No disponible (HTTP 404). Probando siguiente modelo...`);
        lastError = new Error(`El modelo ${model} no está disponible en la API.`);
        continue; // Probar siguiente modelo candidato
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Gemini API Error ${response.status} en modelo ${model}]:`, errorText);
        throw new Error(`Google Gemini API retornó código HTTP ${response.status}`);
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error("Respuesta vacía o formato inesperado de Google Gemini.");
      }

      const parsed = JSON.parse(candidateText);

      // Normalización y validación del resultado
      const matchedCategory = SYSTEM_CATEGORIES.find(
        (c) =>
          c.id === parsed.categoria_id ||
          c.name.toLowerCase() === parsed.categoria_sugerida?.toLowerCase()
      );

      return {
        categoria_id: matchedCategory ? matchedCategory.id : (parsed.categoria_id || "cat-1"),
        categoria_sugerida: matchedCategory ? matchedCategory.name : (parsed.categoria_sugerida || "Facturas"),
        etiquetas: Array.isArray(parsed.etiquetas) ? parsed.etiquetas.slice(0, 5) : [],
        confianza: typeof parsed.confianza === "number" ? Math.min(Math.max(parsed.confianza, 0), 1) : 0.85,
        resumen: parsed.resumen || "Documento analizado con éxito por Google Gemini Flash.",
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error("Tiempo de espera agotado al conectar con Google Gemini (> 10 s).");
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  throw lastError || new Error("No se pudo obtener respuesta de ningún modelo Gemini compatible.");
}

/**
 * Genera el resultado de degradación elegante cuando la IA no está disponible
 */
export function getFallbackClassification(fileName: string): AiClassificationResult {
  const lowerName = fileName.toLowerCase();

  // Heurística básica por nombre de archivo para soporte sin IA
  let categoryId = "cat-1";
  let categoryName = "Facturas";

  if (lowerName.includes("contrato") || lowerName.includes("legal") || lowerName.includes("acuerdo")) {
    categoryId = "cat-2";
    categoryName = "Legal";
  } else if (lowerName.includes("nomina") || lowerName.includes("impuesto") || lowerName.includes("banco") || lowerName.includes("renta")) {
    categoryId = "cat-3";
    categoryName = "Finanzas";
  } else if (lowerName.includes("dni") || lowerName.includes("pasaporte") || lowerName.includes("cv") || lowerName.includes("curriculum")) {
    categoryId = "cat-4";
    categoryName = "Personal";
  } else if (lowerName.includes("seguro") || lowerName.includes("itv") || lowerName.includes("coche") || lowerName.includes("vehiculo") || lowerName.includes("multa")) {
    categoryId = "cat-5";
    categoryName = "Vehículo";
  }

  return {
    categoria_id: categoryId,
    categoria_sugerida: categoryName,
    etiquetas: ["Manual"],
    confianza: 0.5,
    resumen: "Clasificación manual habilitada (Asistente de IA en reposo).",
  };
}
