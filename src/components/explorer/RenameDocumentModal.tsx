import React, { useState, useEffect } from "react";
import { Edit2, X, Loader2, AlertCircle } from "lucide-react";
import { MockDocument } from "@/data/mock-data";

interface RenameDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MockDocument | null;
  onRename: (doc: MockDocument, newName: string) => Promise<{ success: boolean; error?: string }>;
}

export const RenameDocumentModal: React.FC<RenameDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onRename,
}) => {
  const [nameWithoutExt, setNameWithoutExt] = useState("");
  const [extension, setExtension] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      const full = document.name;
      const lastDot = full.lastIndexOf(".");
      if (lastDot > 0) {
        setNameWithoutExt(full.substring(0, lastDot));
        setExtension(full.substring(lastDot));
      } else {
        setNameWithoutExt(full);
        setExtension(document.extension ? `.${document.extension.toLowerCase()}` : "");
      }
      setErrorMessage(null);
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameWithoutExt.trim();
    if (!trimmed) {
      setErrorMessage("Por favor ingresa un nombre para el archivo.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Si el usuario ya colocó la extensión en el input, no la duplicamos
    let finalName = trimmed;
    if (extension && !finalName.toLowerCase().endsWith(extension.toLowerCase())) {
      finalName = `${finalName}${extension}`;
    }

    const res = await onRename(document, finalName);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || "No se pudo actualizar el nombre del documento.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Renombrar Documento</h3>
              <p className="text-xs text-slate-500">
                Cambia el nombre conservando el formato original
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nombre del archivo
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
              <input
                type="text"
                autoFocus
                value={nameWithoutExt}
                onChange={(e) => setNameWithoutExt(e.target.value)}
                placeholder="Escribe el nuevo nombre..."
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden bg-transparent"
              />
              {extension && (
                <span className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-mono font-semibold border-l border-slate-200 select-none">
                  {extension}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              La extensión original se conservará automáticamente para garantizar compatibilidad.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nameWithoutExt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
