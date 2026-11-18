"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MOCK_CATEGORIES,
  MockDocument,
} from "@/data/mock-data";
import {
  fetchUserDocuments,
  formatBytes,
  renameDocument,
  deleteDocument,
  downloadDocumentFile,
} from "@/lib/storage";
import { DocumentItem, Folder as FolderType, Category } from "@/types";
import {
  fetchUserFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveDocumentToFolder,
  getBreadcrumbTrail,
} from "@/lib/folders";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  SYSTEM_DEFAULT_CATEGORIES,
} from "@/lib/categories";
import {
  fetchUserTags,
  fetchAllDocumentTagsMap,
} from "@/lib/tags";
import { useDebounce } from "@/hooks/useDebounce";
import { Sidebar } from "@/components/explorer/Sidebar";
import { TopBar } from "@/components/explorer/TopBar";
import { DocumentGrid } from "@/components/explorer/DocumentGrid";
import { DocumentTable } from "@/components/explorer/DocumentTable";
import { EmptyState } from "@/components/explorer/EmptyState";
import { SkeletonLoader } from "@/components/explorer/SkeletonLoader";
import { UploadModal } from "@/components/upload/UploadModal";
import { DocumentViewerModal } from "@/components/viewer/DocumentViewerModal";
import { FolderModal } from "@/components/explorer/FolderModal";
import { MoveDocumentModal } from "@/components/explorer/MoveDocumentModal";
import { DeleteFolderDialog } from "@/components/explorer/DeleteFolderDialog";
import { RenameDocumentModal } from "@/components/explorer/RenameDocumentModal";
import { DeleteDocumentModal } from "@/components/explorer/DeleteDocumentModal";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { EditDocumentMetadataModal } from "@/components/explorer/EditDocumentMetadataModal";
import {
  Folder as FolderIcon,
  FolderPlus,
  ChevronRight,
  Home,
  X,
  Filter,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
  } | null>(null);

  // Real User Documents State (HU-02)
  const [userDocuments, setUserDocuments] = useState<MockDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Real User Folders State (HU-04)
  const [userFolders, setUserFolders] = useState<FolderType[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  // Real Categories & Tags State (HU-08)
  const [categories, setCategories] = useState<Category[]>(SYSTEM_DEFAULT_CATEGORIES);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [documentTagsMap, setDocumentTagsMap] = useState<Record<string, string[]>>({});
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Category & Metadata Modals State (HU-08)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [documentToEditMetadata, setDocumentToEditMetadata] = useState<MockDocument | null>(null);

  // Folder & Document Action Modals State (HU-04 & HU-07)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderType | null>(null);
  const [parentFolderIdForNew, setParentFolderIdForNew] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const [documentToMove, setDocumentToMove] = useState<MockDocument | null>(null);
  const [documentToRename, setDocumentToRename] = useState<MockDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<MockDocument | null>(null);

  // Map database document to visual UI representation
  const mapDatabaseDocToUI = (doc: DocumentItem): MockDocument => {
    const ext = (doc.extension || doc.nombre_archivo.split(".").pop() || "pdf").toLowerCase();
    const type: "pdf" | "docx" | "img" =
      ext === "pdf" ? "pdf" : ext === "docx" || ext === "doc" ? "docx" : "img";

    const date = new Date(doc.created_at);
    const formattedDate = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return {
      id: doc.id,
      name: doc.nombre_archivo,
      type,
      extension: ext.toUpperCase(),
      size: formatBytes(doc.tamano_bytes),
      sizeBytes: doc.tamano_bytes,
      updatedAt: formattedDate,
      createdAt: doc.created_at,
      folderId: doc.carpeta_id || "",
      categoryId: doc.categoria_id || "cat-1",
      tags: [ext.toUpperCase()],
      isFavorite: false,
      notes: doc.notas || undefined,
      storagePath: doc.storage_path,
      tipoMime: doc.tipo_mime,
    };
  };

  const loadCategories = async () => {
    const res = await fetchCategories();
    if (res.success && res.data) {
      setCategories(res.data);
    }
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    const [docRes, mapRes, tagsRes] = await Promise.all([
      fetchUserDocuments(),
      fetchAllDocumentTagsMap(),
      fetchUserTags(),
    ]);

    const tagsMap = mapRes.success && mapRes.data ? mapRes.data : {};
    setDocumentTagsMap(tagsMap);

    if (tagsRes.success && tagsRes.data) {
      setUserTags(tagsRes.data.map((t) => t.nombre));
    }

    if (docRes.success && docRes.data) {
      setUserDocuments(
        docRes.data.map((doc) => {
          const uiDoc = mapDatabaseDocToUI(doc);
          const relTags = tagsMap[doc.id] || [];
          uiDoc.tags = Array.from(new Set([...uiDoc.tags, ...relTags]));
          return uiDoc;
        })
      );
    }
    setIsLoadingDocs(false);
  };

  const loadFolders = async () => {
    setIsLoadingFolders(true);
    const res = await fetchUserFolders();
    if (res.success && res.data) {
      setUserFolders(res.data);
    }
    setIsLoadingFolders(false);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser({
          email: user.email || "",
          name:
            user.user_metadata?.nombre_completo ||
            user.email?.split("@")[0] ||
            "Usuario",
        });
        loadDocuments();
        loadFolders();
        loadCategories();
      } else {
        setIsLoadingDocs(false);
        setIsLoadingFolders(false);
      }
    });

    // Escuchar cambios de estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email || "",
          name:
            session.user.user_metadata?.nombre_completo ||
            session.user.email?.split("@")[0] ||
            "Usuario",
        });
        loadDocuments();
        loadFolders();
        loadCategories();
      } else {
        setCurrentUser(null);
        setUserDocuments([]);
        setUserFolders([]);
        setCategories(SYSTEM_DEFAULT_CATEGORIES);
        setUserTags([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Navigation & Filtering States (HU-06)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [activeFormatFilter, setActiveFormatFilter] = useState<
    "todos" | "pdf" | "docx" | "img"
  >("todos");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<
    "all" | "7d" | "30d" | "year"
  >("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState<
    "all" | "recent" | "favorites"
  >("all");

  // Display & UI States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [demoState, setDemoState] = useState<"normal" | "empty" | "loading">(
    "normal"
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<MockDocument | null>(
    null
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Document count by folder
  const documentCountByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    userDocuments.forEach((doc) => {
      if (doc.folderId) {
        counts[doc.folderId] = (counts[doc.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [userDocuments]);

  // Dynamic Filtering Logic (HU-06: Nombre, Metadatos, Formato, Categoría, Fecha y Carpeta)
  const filteredDocuments = useMemo(() => {
    if (demoState === "empty") return [];

    return userDocuments.filter((doc) => {
      // 1. Text Search query (debounced 300 ms) - Búsqueda por Nombre, Notas o Etiquetas
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase().trim();
        const matchesName = doc.name.toLowerCase().includes(query);
        const matchesNotes = doc.notes ? doc.notes.toLowerCase().includes(query) : false;
        const matchesTags = doc.tags.some(
          (t) => t.toLowerCase().includes(query) || `#${t.toLowerCase()}`.includes(query)
        );
        if (!matchesName && !matchesNotes && !matchesTags) return false;
      }

      // 2. Format filter
      if (activeFormatFilter !== "todos" && doc.type !== activeFormatFilter) {
        return false;
      }

      // 3. Category filter
      if (activeCategoryId && doc.categoryId !== activeCategoryId) {
        return false;
      }

      // 4. Tag filter (HU-08)
      if (activeTag) {
        const cleanTag = activeTag.toLowerCase();
        const hasTag = doc.tags.some((t) => t.toLowerCase() === cleanTag);
        if (!hasTag) return false;
      }

      // 5. Folder filter
      if (activeFolderId && doc.folderId !== activeFolderId) {
        return false;
      }

      // 6. Date filter (HU-06)
      if (activeDateFilter !== "all" && doc.createdAt) {
        const docTime = new Date(doc.createdAt).getTime();
        const now = Date.now();
        if (activeDateFilter === "7d") {
          const limit = now - 7 * 24 * 60 * 60 * 1000;
          if (docTime < limit) return false;
        } else if (activeDateFilter === "30d") {
          const limit = now - 30 * 24 * 60 * 60 * 1000;
          if (docTime < limit) return false;
        } else if (activeDateFilter === "year") {
          const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
          if (docTime < startOfYear) return false;
        }
      }

      // 7. Quick filter (recent, favorites)
      if (activeQuickFilter === "favorites" && !doc.isFavorite) {
        return false;
      }
      if (activeQuickFilter === "recent") {
        if (doc.createdAt) {
          const docTime = new Date(doc.createdAt).getTime();
          if (Date.now() - docTime > 7 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }, [
    userDocuments,
    debouncedSearchQuery,
    activeFormatFilter,
    activeFolderId,
    activeCategoryId,
    activeTag,
    activeDateFilter,
    activeQuickFilter,
    demoState,
  ]);

  // Current View Title
  const currentViewTitle = useMemo(() => {
    if (activeFolderId) {
      const folder = userFolders.find((f) => f.id === activeFolderId);
      return folder ? `Carpeta: ${folder.nombre}` : "Carpeta seleccionada";
    }
    if (activeCategoryId) {
      const category = categories.find((c) => c.id === activeCategoryId);
      return category ? `Categoría: ${category.name || category.nombre}` : "Categoría";
    }
    if (activeTag) {
      return `Etiqueta: #${activeTag}`;
    }
    if (activeQuickFilter === "recent") return "Documentos Recientes";
    if (activeQuickFilter === "favorites") return "Documentos Favoritos";
    return "Todos los Documentos";
  }, [activeFolderId, activeCategoryId, activeTag, activeQuickFilter, userFolders, categories]);

  // Breadcrumb Trail (HU-04)
  const breadcrumbTrail = useMemo(() => {
    return getBreadcrumbTrail(userFolders, activeFolderId);
  }, [userFolders, activeFolderId]);

  // Subfolders in current view (HU-04)
  const currentSubfolders = useMemo(() => {
    if (activeCategoryId || activeTag || activeDateFilter !== "all" || activeQuickFilter !== "all") return [];
    return userFolders.filter((f) =>
      activeFolderId ? f.parent_id === activeFolderId : !f.parent_id
    );
  }, [userFolders, activeFolderId, activeCategoryId, activeTag, activeDateFilter, activeQuickFilter]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    activeFormatFilter !== "todos" ||
    activeFolderId !== null ||
    activeCategoryId !== null ||
    activeTag !== null ||
    activeDateFilter !== "all" ||
    activeQuickFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveFormatFilter("todos");
    setActiveFolderId(null);
    setActiveCategoryId(null);
    setActiveTag(null);
    setActiveDateFilter("all");
    setActiveQuickFilter("all");
    setDemoState("normal");
  };

  // Handlers for Folder Operations (HU-04)
  const handleSaveFolder = async (data: {
    nombre: string;
    parent_id?: string | null;
    color_icono: string;
  }) => {
    if (folderToEdit) {
      const res = await updateFolder(folderToEdit.id, data);
      if (!res.success) {
        throw new Error(res.error || "No se pudo actualizar la carpeta");
      }
    } else {
      const res = await createFolder(data);
      if (!res.success) {
        throw new Error(res.error || "No se pudo crear la carpeta");
      }
    }
    await loadFolders();
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    const res = await deleteFolder(folderToDelete.id);
    if (!res.success) {
      throw new Error(res.error || "No se pudo eliminar la carpeta");
    }
    if (activeFolderId === folderToDelete.id) {
      setActiveFolderId(null);
    }
    await Promise.all([loadFolders(), loadDocuments()]);
  };

  const handleConfirmMoveDocument = async (targetFolderId: string | null) => {
    if (!documentToMove) return;
    const res = await moveDocumentToFolder(documentToMove.id, targetFolderId);
    if (!res.success) {
      throw new Error(res.error || "No se pudo mover el documento");
    }
    await loadDocuments();
  };

  // Handlers for Document Operations (HU-07)
  const handleDownloadDocument = async (doc: MockDocument) => {
    const res = await downloadDocumentFile({ id: doc.id, name: doc.name });
    if (!res.success) {
      alert(res.error || "No fue posible iniciar la descarga del documento.");
    }
  };

  const handleConfirmRenameDocument = async (
    doc: MockDocument,
    newName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await renameDocument(doc.id, newName);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Actualización reactiva instantánea del explorador (HU-07)
    setUserDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, name: res.data?.nombre_archivo || newName } : d
      )
    );

    // Sincronizar en segundo plano
    loadDocuments();
    return { success: true };
  };

  const handleConfirmDeleteDocument = async (
    doc: MockDocument
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await deleteDocument(doc.id);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Actualización reactiva instantánea del explorador (HU-07)
    setUserDocuments((prev) => prev.filter((d) => d.id !== doc.id));

    if (previewDocument?.id === doc.id) {
      setPreviewDocument(null);
    }

    // Sincronizar carpetas y lista en segundo plano
    await Promise.all([loadDocuments(), loadFolders()]);
    return { success: true };
  };

  // Handlers for Category Management (HU-08)
  const handleSaveCategory = async (data: {
    nombre: string;
    color: string;
    icono?: string;
  }) => {
    if (categoryToEdit) {
      const res = await updateCategory(categoryToEdit.id, data);
      if (!res.success) {
        throw new Error(res.error || "No se pudo actualizar la categoría");
      }
    } else {
      const res = await createCategory(data);
      if (!res.success) {
        throw new Error(res.error || "No se pudo crear la categoría");
      }
    }
    await loadCategories();
  };

  const handleDeleteCategory = async (cat: Category) => {
    const res = await deleteCategory(cat.id);
    if (!res.success) {
      throw new Error(res.error || "No se pudo eliminar la categoría");
    }
    if (activeCategoryId === cat.id) {
      setActiveCategoryId(null);
    }
    await Promise.all([loadCategories(), loadDocuments()]);
  };

  // Handler for Document Metadata Update (HU-08)
  const handleSaveDocumentMetadata = async (
    doc: MockDocument,
    newCategoryId: string,
    newTags: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria_id: newCategoryId,
          etiquetas: newTags,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || "Error al actualizar metadatos" };
      }

      // Actualización reactiva instantánea en interfaz
      setUserDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                categoryId: newCategoryId,
                tags: Array.from(new Set([d.type.toUpperCase(), ...newTags])),
              }
            : d
        )
      );

      if (previewDocument && previewDocument.id === doc.id) {
        setPreviewDocument((prev) =>
          prev
            ? {
                ...prev,
                categoryId: newCategoryId,
                tags: Array.from(new Set([prev.type.toUpperCase(), ...newTags])),
              }
            : null
        );
      }

      // Sincronizar en segundo plano
      loadDocuments();
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error inesperado al guardar",
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row antialiased">
      {/* 1. Sidebar */}
      <Sidebar
        folders={userFolders}
        categories={categories}
        activeFolderId={activeFolderId}
        activeCategoryId={activeCategoryId}
        activeTag={activeTag}
        userTags={userTags}
        activeQuickFilter={activeQuickFilter}
        demoState={demoState}
        isOpenMobile={isMobileSidebarOpen}
        totalBytes={userDocuments.reduce((acc, doc) => acc + (doc.sizeBytes || 0), 0)}
        documentCount={userDocuments.length}
        documentCountByFolder={documentCountByFolder}
        onSelectQuickFilter={(filter) => {
          setActiveQuickFilter(filter);
          setActiveFolderId(null);
          setActiveCategoryId(null);
          setActiveTag(null);
        }}
        onSelectFolder={(folderId) => {
          setActiveFolderId(folderId);
          setActiveCategoryId(null);
          setActiveTag(null);
          setActiveQuickFilter("all");
        }}
        onSelectCategory={(categoryId) => {
          setActiveCategoryId(categoryId);
          setActiveFolderId(null);
          setActiveTag(null);
          setActiveQuickFilter("all");
        }}
        onSelectTag={(tag) => {
          setActiveTag(tag);
          setActiveFolderId(null);
          setActiveCategoryId(null);
          setActiveQuickFilter("all");
        }}
        onChangeDemoState={setDemoState}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCreateFolder={(parentId) => {
          setFolderToEdit(null);
          setParentFolderIdForNew(parentId || null);
          setIsFolderModalOpen(true);
        }}
        onOpenEditFolder={(folder) => {
          setFolderToEdit(folder);
          setParentFolderIdForNew(folder.parent_id || null);
          setIsFolderModalOpen(true);
        }}
        onOpenDeleteFolder={(folder) => {
          setFolderToDelete(folder);
        }}
        onOpenCreateCategory={() => {
          setCategoryToEdit(null);
          setIsCategoryModalOpen(true);
        }}
        onOpenEditCategory={(cat) => {
          setCategoryToEdit(cat);
          setIsCategoryModalOpen(true);
        }}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar with Search & Multicriteria Filters (HU-06) */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFormatFilter={activeFormatFilter}
          onFormatFilterChange={setActiveFormatFilter}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategoryChange={setActiveCategoryId}
          activeDateFilter={activeDateFilter}
          onDateFilterChange={setActiveDateFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 space-y-5 max-w-7xl w-full mx-auto">
          {/* Breadcrumb Trail Navigation (HU-04) */}
          {activeFolderId && (
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1">
              {breadcrumbTrail.map((crumb, idx) => {
                const isLast = idx === breadcrumbTrail.length - 1;
                return (
                  <React.Fragment key={crumb.id || "root"}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <button
                      onClick={() => {
                        setActiveFolderId(crumb.id);
                        setActiveCategoryId(null);
                        setActiveTag(null);
                        setActiveQuickFilter("all");
                      }}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        isLast
                          ? "font-bold text-slate-900 bg-slate-200/60"
                          : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                      }`}
                    >
                      {idx === 0 ? (
                        <Home className="w-3.5 h-3.5" />
                      ) : (
                        <FolderIcon className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>{crumb.name}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Dashboard Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {currentViewTitle}
                </h2>
                {demoState === "normal" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {filteredDocuments.length} {filteredDocuments.length === 1 ? "resultado" : "resultados"}
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Búsqueda en tiempo real, filtros multicriterio y organización jerárquica segura.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFolderToEdit(null);
                  setParentFolderIdForNew(activeFolderId);
                  setIsFolderModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Crear nueva carpeta en la ubicación actual"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />
                <span>{activeFolderId ? "Nueva Subcarpeta" : "Nueva Carpeta"}</span>
              </button>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  title="Restablecer todos los filtros aplicados"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Restablecer Filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges Bar (HU-06 & HU-08) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="text-xs font-semibold text-slate-400">Filtros activos:</span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium rounded-lg">
                  <span>Búsqueda: <strong>&quot;{searchQuery}&quot;</strong></span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-indigo-900 cursor-pointer"
                    title="Eliminar filtro de búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeFormatFilter !== "todos" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg">
                  <span>Formato: <strong>{activeFormatFilter.toUpperCase()}</strong></span>
                  <button
                    onClick={() => setActiveFormatFilter("todos")}
                    className="hover:text-rose-900 cursor-pointer"
                    title="Eliminar filtro de formato"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeCategoryId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-lg">
                  <span>Categoría: <strong>{categories.find((c) => c.id === activeCategoryId)?.name || categories.find((c) => c.id === activeCategoryId)?.nombre || activeCategoryId}</strong></span>
                  <button
                    onClick={() => setActiveCategoryId(null)}
                    className="hover:text-blue-900 cursor-pointer"
                    title="Eliminar filtro de categoría"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeTag && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium rounded-lg">
                  <span>Etiqueta: <strong>#{activeTag}</strong></span>
                  <button
                    onClick={() => setActiveTag(null)}
                    className="hover:text-purple-900 cursor-pointer"
                    title="Eliminar filtro de etiqueta"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeDateFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium rounded-lg">
                  <span>Fecha: <strong>{activeDateFilter === "7d" ? "Últimos 7 días" : activeDateFilter === "30d" ? "Últimos 30 días" : "Este año"}</strong></span>
                  <button
                    onClick={() => setActiveDateFilter("all")}
                    className="hover:text-amber-900 cursor-pointer"
                    title="Eliminar filtro de fecha"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeFolderId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-lg">
                  <span>Carpeta: <strong>{userFolders.find((f) => f.id === activeFolderId)?.nombre || activeFolderId}</strong></span>
                  <button
                    onClick={() => setActiveFolderId(null)}
                    className="hover:text-emerald-900 cursor-pointer"
                    title="Salir de la carpeta"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold ml-1 cursor-pointer"
              >
                Limpiar todos
              </button>
            </div>
          )}

          {/* Subcarpetas en la vista actual (HU-04) */}
          {currentSubfolders.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {activeFolderId ? "Subcarpetas" : "Carpetas Principales"} ({currentSubfolders.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentSubfolders.map((folder) => {
                  const docCount = documentCountByFolder[folder.id] || 0;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setActiveFolderId(folder.id)}
                      className="group flex flex-col p-3 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${folder.color_icono || "#3b82f6"}18`,
                            color: folder.color_icono || "#3b82f6",
                          }}
                        >
                          <FolderIcon className="w-4 h-4 fill-current/15" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600">
                          {docCount} {docCount === 1 ? "doc" : "docs"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                        {folder.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document Explorer State Rendering */}
          {demoState === "loading" || isLoadingDocs || isLoadingFolders ? (
            <SkeletonLoader viewMode={viewMode} />
          ) : demoState === "empty" ? (
            <EmptyState onOpenUpload={() => setIsUploadOpen(true)} />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              isSearchEmpty={hasActiveFilters}
              searchQuery={searchQuery}
              onClearFilters={handleResetFilters}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          ) : viewMode === "grid" ? (
            <DocumentGrid
              documents={filteredDocuments}
              categories={categories}
              onSelectDocument={setPreviewDocument}
              onMoveDocument={(doc) => setDocumentToMove(doc)}
              onDownloadDocument={handleDownloadDocument}
              onRenameDocument={(doc) => setDocumentToRename(doc)}
              onDeleteDocument={(doc) => setDocumentToDelete(doc)}
              onEditMetadata={(doc) => setDocumentToEditMetadata(doc)}
            />
          ) : (
            <DocumentTable
              documents={filteredDocuments}
              categories={categories}
              onSelectDocument={setPreviewDocument}
              onMoveDocument={(doc) => setDocumentToMove(doc)}
              onDownloadDocument={handleDownloadDocument}
              onRenameDocument={(doc) => setDocumentToRename(doc)}
              onDeleteDocument={(doc) => setDocumentToDelete(doc)}
              onEditMetadata={(doc) => setDocumentToEditMetadata(doc)}
            />
          )}
        </main>
      </div>

      {/* 3. Modal de Subida con Asistencia IA y Selección de Carpeta (HU-02 + HU-03 + HU-04 + HU-08) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folders={userFolders}
        categories={categories}
        availableTags={userTags}
        defaultFolderId={activeFolderId}
        onUploadSuccess={loadDocuments}
      />

      {/* 4. Modal de Visualización Segura (HU-05 & HU-08) */}
      <DocumentViewerModal
        document={previewDocument}
        documentsList={filteredDocuments}
        categories={categories}
        folders={userFolders}
        onClose={() => setPreviewDocument(null)}
        onSelectDocument={setPreviewDocument}
        onEditMetadata={(doc) => setDocumentToEditMetadata(doc)}
      />

      {/* 5. Modal de Creación / Renombrado de Carpeta (HU-04) */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
          setParentFolderIdForNew(null);
        }}
        onSubmit={handleSaveFolder}
        existingFolders={userFolders}
        editingFolder={folderToEdit}
        defaultParentId={parentFolderIdForNew}
      />

      {/* 6. Modal para Mover Documento entre Carpetas (HU-04) */}
      {documentToMove && (
        <MoveDocumentModal
          isOpen={Boolean(documentToMove)}
          onClose={() => setDocumentToMove(null)}
          documentName={documentToMove.name}
          currentFolderId={documentToMove.folderId || null}
          folders={userFolders}
          onConfirmMove={handleConfirmMoveDocument}
        />
      )}

      {/* 7. Diálogo de Confirmación para Eliminar Carpeta (HU-04) */}
      {folderToDelete && (
        <DeleteFolderDialog
          isOpen={Boolean(folderToDelete)}
          onClose={() => setFolderToDelete(null)}
          folderName={folderToDelete.nombre}
          onConfirmDelete={handleConfirmDeleteFolder}
        />
      )}

      {/* 8. Modal para Renombrar Documento (HU-07) */}
      {documentToRename && (
        <RenameDocumentModal
          isOpen={Boolean(documentToRename)}
          onClose={() => setDocumentToRename(null)}
          document={documentToRename}
          onRename={handleConfirmRenameDocument}
        />
      )}

      {/* 9. Diálogo de Confirmación para Eliminar Documento (HU-07) */}
      {documentToDelete && (
        <DeleteDocumentModal
          isOpen={Boolean(documentToDelete)}
          onClose={() => setDocumentToDelete(null)}
          document={documentToDelete}
          onDelete={handleConfirmDeleteDocument}
        />
      )}

      {/* 10. Modal para Crear / Editar / Eliminar Categoría Personalizada (HU-08) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        editingCategory={categoryToEdit}
        onSubmit={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      {/* 11. Modal para Asignar / Modificar Categoría y Etiquetas de Documento (HU-08) */}
      <EditDocumentMetadataModal
        isOpen={Boolean(documentToEditMetadata)}
        onClose={() => setDocumentToEditMetadata(null)}
        document={documentToEditMetadata}
        categories={categories}
        availableTags={userTags}
        onSave={handleSaveDocumentMetadata}
      />
    </div>
  );
}
