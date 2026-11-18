"use client";

import React from "react";
import {
  Search,
  LayoutGrid,
  List,
  UploadCloud,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Calendar,
  Tag,
} from "lucide-react";
import { MockCategory } from "@/data/mock-data";
import { Category } from "@/types/database";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFormatFilter: "todos" | "pdf" | "docx" | "img";
  onFormatFilterChange: (format: "todos" | "pdf" | "docx" | "img") => void;
  categories?: (MockCategory | Category)[];
  activeCategoryId?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
  activeDateFilter?: "all" | "7d" | "30d" | "year";
  onDateFilterChange?: (dateFilter: "all" | "7d" | "30d" | "year") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onOpenUpload: () => void;
  onOpenMobileSidebar: () => void;
  currentUser?: { email: string; name: string } | null;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFormatFilter,
  onFormatFilterChange,
  categories = [],
  activeCategoryId = null,
  onCategoryChange,
  activeDateFilter = "all",
  onDateFilterChange,
  viewMode,
  onViewModeChange,
  onOpenUpload,
  onOpenMobileSidebar,
  currentUser,
  onLogout,
}) => {
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 space-y-2.5">
      {/* Top Row: Search, Upload & User Info */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Search bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
            title="Abrir menú lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar with debounce feedback and clear button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, notas o etiquetas (#tag)..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Upload Action & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Subir Documento</span>
            <span className="sm:hidden">Subir</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {userInitials}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <span className="font-bold text-slate-800 block truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-slate-400 text-[11px] truncate block max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left text-xs leading-tight">
                <span className="font-bold text-slate-700 block">Invitado</span>
                <span className="text-slate-400 text-[11px]">Modo Demo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Multicriteria Filters (Format, Category, Date) & View Toggle (HU-06) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-100">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* 1. Format Filter Chips */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFormatFilterChange("todos")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                activeFormatFilter === "todos"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onFormatFilterChange("pdf")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeFormatFilter === "pdf"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              PDF
            </button>
            <button
              onClick={() => onFormatFilterChange("docx")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeFormatFilter === "docx"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Word
            </button>
            <button
              onClick={() => onFormatFilterChange("img")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeFormatFilter === "img"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Imágenes
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5" />

          {/* 2. Category Filter Selector (HU-06) */}
          {onCategoryChange && categories.length > 0 && (
            <div className="relative inline-flex items-center">
              <Tag className="w-3.5 h-3.5 absolute left-2 text-slate-400 pointer-events-none" />
              <select
                value={activeCategoryId || "all"}
                onChange={(e) =>
                  onCategoryChange(e.target.value === "all" ? null : e.target.value)
                }
                className={`pl-7 pr-7 py-1 rounded-lg text-xs font-semibold appearance-none transition-colors border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  activeCategoryId
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                    : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
                }`}
                title="Filtrar por categoría"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {("name" in cat && cat.name) ? cat.name : ("nombre" in cat ? (cat as Category).nombre : cat.id)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Date Filter Selector (HU-06) */}
          {onDateFilterChange && (
            <div className="relative inline-flex items-center">
              <Calendar className="w-3.5 h-3.5 absolute left-2 text-slate-400 pointer-events-none" />
              <select
                value={activeDateFilter}
                onChange={(e) =>
                  onDateFilterChange(
                    e.target.value as "all" | "7d" | "30d" | "year"
                  )
                }
                className={`pl-7 pr-7 py-1 rounded-lg text-xs font-semibold appearance-none transition-colors border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  activeDateFilter !== "all"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                    : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
                }`}
                title="Filtrar por fecha de subida"
              >
                <option value="all">Cualquier fecha</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="year">Este año</option>
              </select>
            </div>
          )}
        </div>

        {/* View Switcher: Grid vs List */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 shrink-0 ml-auto">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-indigo-600 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Vista en cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Vista en lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
