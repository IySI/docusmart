"use client";

import React from "react";
import { Sparkles, Check, X, Tag as TagIcon, AlertCircle, Info, RefreshCw } from "lucide-react";
import { AiClassificationResult } from "@/types";

interface AiSuggestionCardProps {
  isLoading: boolean;
  suggestion: AiClassificationResult | null;
  fallbackMessage?: string | null;
  aiAvailable?: boolean;
  onAccept: (suggestion: AiClassificationResult) => void;
  onDismiss: () => void;
  onRetry?: () => void;
  isAccepted?: boolean;
}

export const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  isLoading,
  suggestion,
  fallbackMessage,
  aiAvailable = true,
  onAccept,
  onDismiss,
  onRetry,
  isAccepted = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-purple-50/70 to-blue-50/70 border border-indigo-200/80 rounded-2xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-spin">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
                Analizando con Google Gemini Flash...
              </span>
            </div>
            <p className="text-[11px] text-indigo-700">
              Extrayendo contenido relevante para sugerir categoría y etiquetas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si no está disponible la IA o hubo degradación elegante
  if (!aiAvailable || fallbackMessage) {
    return (
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold block">Clasificación asistida por IA en pausa</span>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {fallbackMessage ||
              "Puedes seleccionar la categoría y añadir notas a tu documento de forma manual a continuación."}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline shrink-0 cursor-pointer"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (!suggestion) return null;

  const confidencePct = Math.round((suggestion.confianza || 0.85) * 100);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        isAccepted
          ? "bg-emerald-50/80 border-emerald-300 shadow-xs"
          : "bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white border-indigo-200/90 shadow-sm"
      }`}
    >
      {/* Header de la tarjeta */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Sugerencia Inteligente de IA
          </span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
            Gemini Flash
          </span>
        </div>

        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
          {confidencePct}% confianza
        </span>
      </div>

      {/* Contenido sugerido */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-medium">Categoría sugerida:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            🏷️ {suggestion.categoria_sugerida}
          </span>
        </div>

        {/* Resumen / Justificación */}
        {suggestion.resumen && (
          <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded-xl border border-slate-200/60">
            "{suggestion.resumen}"
          </p>
        )}

        {/* Etiquetas sugeridas */}
        {suggestion.etiquetas && suggestion.etiquetas.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <TagIcon className="w-3 h-3" /> Tags:
            </span>
            {suggestion.etiquetas.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Acciones de la sugerencia */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-400">
          {isAccepted
            ? "✅ Sugerencia aplicada. Puedes editar los campos abajo si lo deseas."
            : "¿Deseas aplicar esta clasificación a tu documento?"}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {!isAccepted ? (
            <>
              <button
                type="button"
                onClick={onDismiss}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Modificar
              </button>
              <button
                type="button"
                onClick={() => onAccept(suggestion)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Aceptar sugerencia
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
              <Check className="w-4 h-4 text-emerald-600" />
              Aplicada
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
