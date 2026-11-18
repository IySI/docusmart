import React, { useState, useEffect } from "react";
import { Tag as TagIcon, X, Loader2, AlertCircle, Check, FolderTree } from "lucide-react";
import { MockDocument } from "@/data/mock-data";
import { Category } from "@/types";
import { TagInput } from "@/components/tags/TagInput";

interface EditDocumentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MockDocument | null;
  categories: Category[];
  availableTags?: string[];
  onSave: (
    doc: MockDocument,
    newCategoryId: string,
    newTags: string[]
  ) => Promise<{ success: boolean; error?: string }>;
}

export const EditDocumentMetadataModal: React.FC<EditDocumentMetadataModalProps> = ({
  isOpen,
  onClose,
  document,
  categories,
  availableTags = [],
  onSave,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState("cat-1");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setSelectedCategoryId(document.categoryId || "cat-1");
      setTags(document.tags || []);
      setErrorMessage(null);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await onSave(document, selectedCategoryId, tags);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || "No se pudieron actualizar los metadatos.");
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
              <TagIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Categoría y Etiquetas
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]" title={document.name}>
                {document.name}
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

          {/* Selector de Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
              <span>Categoría</span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.usuario_id ? "(Personalizada)" : "(Predeterminada)"}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Etiquetas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Etiquetas (#tags)</span>
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              availableSuggestions={availableTags}
              placeholder="Escribe y presiona Enter..."
              maxTags={8}
            />
            <p className="text-[11px] text-slate-400">
              Escribe el nombre de la etiqueta y presiona Enter para agregarla.
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
