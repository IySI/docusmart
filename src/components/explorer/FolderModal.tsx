"use client";

import React, { useState, useEffect } from "react";
import { Folder, X, Loader2, Palette, Check } from "lucide-react";
import { Folder as FolderType } from "@/types";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; parent_id?: string | null; color_icono: string }) => Promise<void>;
  existingFolders: FolderType[];
  editingFolder?: FolderType | null;
  defaultParentId?: string | null;
}

const COLOR_PRESETS = [
  { label: "Azul", hex: "#3b82f6" },
  { label: "Índigo", hex: "#6366f1" },
  { label: "Púrpura", hex: "#8b5cf6" },
  { label: "Esmeralda", hex: "#10b981" },
  { label: "Ámbar", hex: "#f59e0b" },
  { label: "Rosa", hex: "#ec4899" },
  { label: "Cian", hex: "#06b6d4" },
];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingFolders,
  editingFolder = null,
  defaultParentId = null,
}) => {
  const [nombre, setNombre] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingFolder) {
      setNombre(editingFolder.nombre);
      setParentId(editingFolder.parent_id || null);
      setSelectedColor(editingFolder.color_icono || "#3b82f6");
    } else {
      setNombre("");
      setParentId(defaultParentId || null);
      setSelectedColor("#3b82f6");
    }
    setErrorMessage(null);
  }, [editingFolder, defaultParentId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nombre.trim();
    if (!cleanName) {
      setErrorMessage("Por favor, introduce un nombre para la carpeta.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        nombre: cleanName,
        parent_id: parentId,
        color_icono: selectedColor,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar la carpeta";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar carpetas candidatas para evitar auto-referencia directa al editar
  const eligibleParentFolders = existingFolders.filter(
    (f) => !editingFolder || f.id !== editingFolder.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingFolder ? "Renombrar / Editar Carpeta" : "Crear Nueva Carpeta"}
              </h3>
              <p className="text-xs text-slate-400">
                Organiza tus documentos en jerarquías personalizadas
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold uppercase tracking-wider text-slate-600 block">
              Nombre de la carpeta:
            </label>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Contabilidad 2026, Contratos..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Carpeta Padre (Jerarquía) */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold uppercase tracking-wider text-slate-600 block">
              Ubicación / Carpeta superior:
            </label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="">📁 Raíz del repositorio (Sin carpeta superior)</option>
              {eligibleParentFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Color del Icono */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Color distintivo:
            </label>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {COLOR_PRESETS.map((color) => {
                const isSelected = selectedColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                      isSelected ? "scale-110 ring-2 ring-offset-2 ring-slate-400" : "hover:scale-105"
                    }`}
                    title={color.label}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
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
              disabled={isSubmitting || !nombre.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{editingFolder ? "Actualizar carpeta" : "Crear carpeta"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
