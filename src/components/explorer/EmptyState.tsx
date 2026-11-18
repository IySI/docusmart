import React from "react";
import { FolderOpen, SearchX, UploadCloud, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  isSearchEmpty?: boolean;
  searchQuery?: string;
  onClearFilters?: () => void;
  onOpenUpload?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearchEmpty = false,
  searchQuery = "",
  onClearFilters,
  onOpenUpload,
}) => {
  if (isSearchEmpty) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
          <SearchX className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-800">
            Sin resultados de búsqueda
          </h3>
          <p className="text-sm text-slate-500">
            No encontramos documentos que coincidan con{" "}
            {searchQuery ? (
              <span className="font-semibold text-slate-700">"{searchQuery}"</span>
            ) : (
              "los filtros aplicados"
            )}
            . Intenta con otros términos o limpia los filtros.
          </p>
        </div>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto my-12 space-y-5">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
        <FolderOpen className="w-10 h-10" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-slate-900">
          Tu espacio documental está listo
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Comienza a organizar tu repositorio subiendo tu primer archivo PDF, Word o imagen.
        </p>
      </div>
      {onOpenUpload && (
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Subir mi primer documento</span>
        </button>
      )}
    </div>
  );
};
