import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Edit2,
  FolderInput,
  Tag as TagIcon,
} from "lucide-react";
import { MockDocument } from "@/data/mock-data";

interface DocumentActionsMenuProps {
  document: MockDocument;
  onSelectDocument: (doc: MockDocument) => void;
  onDownloadDocument: (doc: MockDocument) => void;
  onRenameDocument: (doc: MockDocument) => void;
  onMoveDocument?: (doc: MockDocument) => void;
  onDeleteDocument: (doc: MockDocument) => void;
  onEditMetadata?: (doc: MockDocument) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const DocumentActionsMenu: React.FC<DocumentActionsMenuProps> = ({
  document,
  onSelectDocument,
  onDownloadDocument,
  onRenameDocument,
  onMoveDocument,
  onDeleteDocument,
  onEditMetadata,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<{
    vertical: "top" | "bottom";
    horizontal: "right" | "left";
  }>({ vertical: "top", horizontal: "right" });

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculatePlacement = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Si hay menos de 220px por debajo, abrimos hacia arriba
      const spaceBelow = viewportHeight - rect.bottom;
      const vertical = spaceBelow < 220 ? "top" : "bottom";

      // Si está muy cerca del borde izquierdo, alineamos a la izquierda; por defecto a la derecha
      const spaceRight = viewportWidth - rect.right;
      const horizontal = spaceRight < 200 ? "right" : "right";

      setPlacement({ vertical, horizontal });
    }
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", calculatePlacement, true);
      window.addEventListener("resize", calculatePlacement);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculatePlacement, true);
      window.removeEventListener("resize", calculatePlacement);
    };
  }, [isOpen, closeMenu, calculatePlacement]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isOpen;
    if (nextState) {
      calculatePlacement();
    }
    setIsOpen(nextState);
    onOpenChange?.(nextState);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    closeMenu();
    action();
  };

  const verticalClass =
    placement.vertical === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const horizontalClass =
    placement.horizontal === "right" ? "right-0" : "left-0";

  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          isOpen
            ? "bg-indigo-50 text-indigo-600 shadow-xs"
            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        }`}
        title="Más opciones del documento"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${horizontalClass} ${verticalClass} w-48 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none`}
        >
          <button
            onClick={(e) => handleAction(e, () => onSelectDocument(document))}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Previsualizar</span>
          </button>

          <button
            onClick={(e) => handleAction(e, () => onDownloadDocument(document))}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Descargar archivo</span>
          </button>

          <button
            onClick={(e) => handleAction(e, () => onRenameDocument(document))}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Renombrar</span>
          </button>

          {onEditMetadata && (
            <button
              onClick={(e) => handleAction(e, () => onEditMetadata(document))}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
            >
              <TagIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Categoría & Etiquetas...</span>
            </button>
          )}

          {onMoveDocument && (
            <button
              onClick={(e) => handleAction(e, () => onMoveDocument(document))}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
            >
              <FolderInput className="w-3.5 h-3.5 text-slate-400" />
              <span>Mover a carpeta...</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={(e) => handleAction(e, () => onDeleteDocument(document))}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Eliminar documento</span>
          </button>
        </div>
      )}
    </div>
  );
};
