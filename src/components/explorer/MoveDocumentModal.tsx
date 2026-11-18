"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, ArrowRight, X, Loader2, Check } from "lucide-react";
import { Folder as FolderType } from "@/types";

interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  currentFolderId: string | null;
  folders: FolderType[];
  onConfirmMove: (targetFolderId: string | null) => Promise<void>;
}

export const MoveDocumentModal: React.FC<MoveDocumentModalProps> = ({
  isOpen,
  onClose,
  documentName,
  currentFolderId,
  folders,
  onConfirmMove,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    currentFolderId
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onConfirmMove(selectedFolderId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al mover el documento";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Mover Documento
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[260px]" title={documentName}>
                "{documentName}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Selecciona la carpeta de destino:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
            {/* Opción Raíz */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedFolderId === null
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>Repositorio Principal (Raíz)</span>
              </div>
              {selectedFolderId === null && <Check className="w-4 h-4" />}
            </button>

            {/* Lista de Carpetas */}
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              const isCurrent = currentFolderId === folder.id;

              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder
                      className="w-4 h-4 shrink-0"
                      style={{ color: isSelected ? "#ffffff" : folder.color_icono || "#3b82f6" }}
                    />
                    <span className="truncate">{folder.nombre}</span>
                    {isCurrent && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isSelected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        Actual
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || selectedFolderId === currentFolderId}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Moviendo...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Confirmar movimiento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
