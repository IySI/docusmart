import React, { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2, AlertCircle } from "lucide-react";
import { MockDocument } from "@/data/mock-data";

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MockDocument | null;
  onDelete: (doc: MockDocument) => Promise<{ success: boolean; error?: string }>;
}

export const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const res = await onDelete(document);
    setIsDeleting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || "No se pudo eliminar el documento.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Banner */}
        <div className="p-5 flex items-start gap-3.5 border-b border-slate-100">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-base leading-snug">
              ¿Eliminar documento definitivamente?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Esta acción es permanente y no se puede deshacer.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="text-xs text-slate-500 font-medium">Archivo a eliminar:</div>
            <div className="font-bold text-slate-800 text-sm truncate" title={document.name}>
              {document.name}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>{document.size}</span>
              <span>•</span>
              <span className="uppercase">{document.extension}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Se borrará tanto el registro de metadatos en la base de datos como el archivo físico almacenado en la nube privada.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              autoFocus
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar definitivamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
