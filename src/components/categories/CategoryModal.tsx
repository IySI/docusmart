import React, { useState, useEffect } from "react";
import { FolderTree, X, Check, Loader2, Trash2, AlertCircle } from "lucide-react";
import { Category } from "@/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  onSubmit: (data: { nombre: string; color: string; icono?: string }) => Promise<void>;
  onDelete?: (category: Category) => Promise<void>;
}

const PRESET_COLORS = [
  { hex: "#3b82f6", name: "Azul" },
  { hex: "#6366f1", name: "Índigo" },
  { hex: "#8b5cf6", name: "Púrpura" },
  { hex: "#10b981", name: "Esmeralda" },
  { hex: "#f59e0b", name: "Ámbar" },
  { hex: "#f43f5e", name: "Rosa" },
  { hex: "#14b8a6", name: "Turquesa" },
  { hex: "#ec4899", name: "Fucsia" },
  { hex: "#64748b", name: "Pizarra" },
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
  onSubmit,
  onDelete,
}) => {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setNombre(editingCategory.nombre);
      setColor(editingCategory.color || "#3b82f6");
    } else {
      setNombre("");
      setColor("#3b82f6");
    }
    setErrorMessage(null);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const isCustom = Boolean(editingCategory?.usuario_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nombre.trim();
    if (!cleanName) {
      setErrorMessage("Por favor ingresa un nombre para la categoría.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        nombre: cleanName,
        color,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error al guardar la categoría."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCategory || !onDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onDelete(editingCategory);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error al eliminar la categoría."
      );
    } finally {
      setIsDeleting(false);
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
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {editingCategory ? "Editar Categoría" : "Nueva Categoría Personalizada"}
              </h3>
              <p className="text-xs text-slate-500">
                {editingCategory
                  ? "Modifica el nombre o color de la categoría"
                  : "Organiza tus documentos con taxonomía propia"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
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
              Nombre de la categoría
            </label>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Contabilidad, Clientes, Médicos..."
              disabled={isSubmitting || isDeleting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Color distintivo</label>
            <div className="grid grid-cols-9 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                    color === c.hex ? "ring-2 ring-offset-2 ring-indigo-500 scale-105" : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {editingCategory && isCustom && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting || !nombre.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{editingCategory ? "Actualizar" : "Crear categoría"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
