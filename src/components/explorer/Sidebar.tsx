import React, { useMemo } from "react";
import {
  FileText,
  Folder,
  Plus,
  Star,
  Clock,
  HardDrive,
  FolderOpen,
  Sparkles,
  Eye,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  ChevronRight
} from "lucide-react";
import { MockCategory } from "@/data/mock-data";
import { formatBytes } from "@/lib/storage";
import { Folder as FolderType, Category } from "@/types";
import { buildFolderTree, FolderTreeNode } from "@/lib/folders";
import { Tag as TagIcon } from "lucide-react";

interface SidebarProps {
  folders: FolderType[];
  categories: (MockCategory | Category)[];
  activeFolderId: string | null;
  activeCategoryId: string | null;
  activeTag?: string | null;
  userTags?: string[];
  activeQuickFilter: "all" | "recent" | "favorites";
  demoState: "normal" | "empty" | "loading";
  isOpenMobile: boolean;
  totalBytes?: number;
  documentCount?: number;
  documentCountByFolder?: Record<string, number>;
  onSelectQuickFilter: (filter: "all" | "recent" | "favorites") => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectTag?: (tag: string | null) => void;
  onChangeDemoState: (state: "normal" | "empty" | "loading") => void;
  onCloseMobile: () => void;
  onOpenCreateFolder: (parentId?: string | null) => void;
  onOpenEditFolder: (folder: FolderType) => void;
  onOpenDeleteFolder: (folder: FolderType) => void;
  onOpenCreateCategory?: () => void;
  onOpenEditCategory?: (category: Category) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  categories,
  activeFolderId,
  activeCategoryId,
  activeTag,
  userTags = [],
  activeQuickFilter,
  demoState,
  isOpenMobile,
  totalBytes = 0,
  documentCount = 0,
  documentCountByFolder = {},
  onSelectQuickFilter,
  onSelectFolder,
  onSelectCategory,
  onSelectTag,
  onChangeDemoState,
  onCloseMobile,
  onOpenCreateFolder,
  onOpenEditFolder,
  onOpenDeleteFolder,
  onOpenCreateCategory,
  onOpenEditCategory,
}) => {
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  const renderFolderNode = (node: FolderTreeNode) => {
    const isSelected = activeFolderId === node.id;
    const count = documentCountByFolder[node.id] || 0;

    return (
      <div key={node.id} className="space-y-0.5">
        <div
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
            isSelected
              ? "bg-blue-50 text-blue-700 font-bold"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{ paddingLeft: `${Math.max(node.depth * 14 + 10, 10)}px` }}
        >
          <button
            type="button"
            onClick={() => {
              onSelectFolder(node.id);
              onSelectCategory(null);
            }}
            className="flex items-center gap-2 flex-1 truncate text-left cursor-pointer"
          >
            <Folder
              className="w-4 h-4 shrink-0"
              style={{ color: node.color_icono || "#3b82f6" }}
            />
            <span className="truncate">{node.nombre}</span>
          </button>

          {/* Acciones contextuales al hacer hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              title="Nueva subcarpeta"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateFolder(node.id);
              }}
              className="p-1 hover:bg-slate-200/70 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              title="Renombrar / Editar"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditFolder(node);
              }}
              className="p-1 hover:bg-slate-200/70 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              title="Eliminar carpeta"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDeleteFolder(node);
              }}
              className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {count > 0 && (
            <span className="text-[10px] text-slate-400 font-mono ml-1.5 group-hover:hidden">
              {count}
            </span>
          )}
        </div>

        {/* Renderizado recursivo de subcarpetas */}
        {node.children && node.children.length > 0 && (
          <div className="space-y-0.5">
            {node.children.map(renderFolderNode)}
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">DocuSmart</span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-600">
                Gestión Inteligente
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Quick Links */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Accesos Rápidos
            </div>
            <button
              onClick={() => {
                onSelectQuickFilter("all");
                onSelectFolder(null);
                onSelectCategory(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeQuickFilter === "all" && !activeFolderId && !activeCategoryId
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>Todos los documentos</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {documentCount}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectQuickFilter("recent");
                onSelectFolder(null);
                onSelectCategory(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeQuickFilter === "recent"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Recientes</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectQuickFilter("favorites");
                onSelectFolder(null);
                onSelectCategory(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeQuickFilter === "favorites"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Favoritos</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                3
              </span>
            </button>
          </div>

          {/* Folders Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Carpetas
              </span>
              <button
                title="Crear nueva carpeta raíz"
                onClick={() => onOpenCreateFolder(null)}
                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {folderTree.length === 0 ? (
              <div className="px-2 py-3 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Folder className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-[11px] text-slate-400">Sin carpetas aún</p>
                <button
                  type="button"
                  onClick={() => onOpenCreateFolder(null)}
                  className="mt-1.5 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  + Crear carpeta
                </button>
              </div>
            ) : (
              folderTree.map(renderFolderNode)
            )}
          </div>

          {/* Categories Section (HU-08) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Categorías
              </span>
              {onOpenCreateCategory && (
                <button
                  type="button"
                  onClick={onOpenCreateCategory}
                  title="Crear categoría personalizada"
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {categories.map((cat) => {
              const isSelected = activeCategoryId === cat.id;
              const catName = "nombre" in cat ? cat.nombre : cat.name;
              const isCustom = "usuario_id" in cat && Boolean(cat.usuario_id);

              return (
                <div
                  key={cat.id}
                  className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-sm transition-colors ${
                    isSelected
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(isSelected ? null : cat.id);
                      onSelectFolder(null);
                    }}
                    className="flex items-center gap-2.5 flex-1 truncate text-left cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{catName}</span>
                    {isCustom && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 font-bold rounded-md">
                        Propia
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {isCustom && onOpenEditCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditCategory(cat as Category);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 rounded-md transition-opacity cursor-pointer"
                        title="Editar categoría"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tags Section (HU-08) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <TagIcon className="w-3 h-3 text-indigo-500" />
                <span>Etiquetas (#Tags)</span>
              </span>
              {activeTag && onSelectTag && (
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-bold"
                >
                  Limpiar
                </button>
              )}
            </div>

            {userTags && userTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 px-1.5 pt-0.5 max-h-36 overflow-y-auto">
                {userTags.map((tag) => {
                  const isSelected = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSelectTag?.(isSelected ? null : tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>#{tag}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 py-1 text-[11px] text-slate-400 italic">
                Sin etiquetas creadas aún
              </p>
            )}
          </div>

          {/* Interactive State Tester (For UI inspection) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Probar Estados Visuales</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px] font-medium">
              <button
                onClick={() => onChangeDemoState("normal")}
                className={`py-1 rounded-md text-center transition-colors ${
                  demoState === "normal"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => onChangeDemoState("empty")}
                className={`py-1 rounded-md text-center transition-colors ${
                  demoState === "empty"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Vacío
              </button>
              <button
                onClick={() => onChangeDemoState("loading")}
                className={`py-1 rounded-md text-center transition-colors ${
                  demoState === "loading"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Carga
              </button>
            </div>
          </div>
        </div>

        {/* Storage Bar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Almacenamiento</span>
            </div>
            <span className="font-bold text-slate-700">
              {formatBytes(totalBytes)} / 1 GB
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  Math.max((totalBytes / (1024 * 1024 * 1024)) * 100, totalBytes > 0 ? 1 : 0),
                  100
                )}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Bucket Privado Supabase</span>
            <span className="text-emerald-600 font-semibold">
              {(
                100 -
                (totalBytes / (1024 * 1024 * 1024)) * 100
              ).toFixed(1)}% libre
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
