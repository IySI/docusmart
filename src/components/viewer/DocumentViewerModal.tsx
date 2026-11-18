"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FileCode,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  HardDrive,
  Folder as FolderIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Loader2,
  FileWarning,
} from "lucide-react";
import mammoth from "mammoth";
import { MockDocument, MockCategory } from "@/data/mock-data";
import { Category } from "@/types/database";
import { Folder as FolderType } from "@/types";
import { fetchDocumentSignedUrl, downloadDocumentFile } from "@/lib/storage";
import { Tag as TagIcon, Edit3 } from "lucide-react";

interface DocumentViewerModalProps {
  document: MockDocument | null;
  documentsList?: MockDocument[];
  categories: (MockCategory | Category)[];
  folders?: FolderType[];
  onClose: () => void;
  onSelectDocument?: (doc: MockDocument) => void;
  onEditMetadata?: (doc: MockDocument) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  documentsList = [],
  categories,
  folders = [],
  onClose,
  onSelectDocument,
  onEditMetadata,
}) => {
  // Signed URL State
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Zoom State (for images & scaling)
  const [zoomLevel, setZoomLevel] = useState(100);

  // Docx Preview State
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  // 1. Obtener URL firmada temporal (15 min) al abrir o cambiar de documento
  useEffect(() => {
    if (!document) {
      setSignedUrl(null);
      setUrlError(null);
      setDocxHtml(null);
      return;
    }

    let isMounted = true;
    setIsLoadingUrl(true);
    setUrlError(null);
    setSignedUrl(null);
    setDocxHtml(null);
    setDocxError(null);
    setZoomLevel(100);

    fetchDocumentSignedUrl(document.id)
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.success || !res.signedUrl) {
          setUrlError(res.error || "No se pudo generar la URL firmada.");
          setIsLoadingUrl(false);
          return;
        }

        setSignedUrl(res.signedUrl);
        setIsLoadingUrl(false);

        // Si es documento Word (.docx), procesar preview HTML con mammoth
        const isDocx =
          document.type === "docx" ||
          document.extension.toLowerCase() === "docx" ||
          document.name.toLowerCase().endsWith(".docx");

        if (isDocx) {
          setIsLoadingDocx(true);
          try {
            const fileRes = await fetch(res.signedUrl);
            if (!fileRes.ok) {
              throw new Error(`Error HTTP ${fileRes.status} al descargar el archivo Word.`);
            }
            const arrayBuffer = await fileRes.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            if (isMounted) {
              if (result.value && result.value.trim().length > 0) {
                setDocxHtml(result.value);
              } else {
                setDocxError(
                  "El documento Word no contiene texto formateado legible para vista previa."
                );
              }
            }
          } catch (err: unknown) {
            if (isMounted) {
              const msg =
                err instanceof Error
                  ? err.message
                  : "No fue posible procesar la vista previa del archivo Word.";
              setDocxError(msg);
            }
          } finally {
            if (isMounted) setIsLoadingDocx(false);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setUrlError(err.message || "Error al obtener URL firmada.");
          setIsLoadingUrl(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [document]);

  // Navegación entre documentos
  const currentIndex = documentsList.findIndex((d) => d.id === document?.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < documentsList.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious && onSelectDocument) {
      onSelectDocument(documentsList[currentIndex - 1]);
    }
  }, [hasPrevious, currentIndex, documentsList, onSelectDocument]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectDocument) {
      onSelectDocument(documentsList[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, documentsList, onSelectDocument]);

  // Atajos de teclado: Escape para cerrar, Flechas para navegar
  useEffect(() => {
    if (!document) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [document, handlePrevious, handleNext, onClose]);

  if (!document) return null;

  const category = categories.find((c) => c.id === document.categoryId);
  const folder = folders.find((f) => f.id === document.folderId);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoomLevel(100);

  const ext = document.extension.toLowerCase();
  const isPdf = document.type === "pdf" || ext === "pdf";
  const isImage = document.type === "img" || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  const isDocx = document.type === "docx" || ext === "docx" || ext === "doc";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de documento: ${document.name}`}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl h-[92vh] overflow-hidden flex flex-col">
        {/* 1. Barra Superior del Visor */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          {/* Título e Indicador de Seguridad */}
          <div className="flex items-center gap-3 truncate pr-4 min-w-0">
            <div className="p-2 bg-slate-800 rounded-xl shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : isDocx ? (
                <FileCode className="w-5 h-5 text-blue-400" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-emerald-400" />
              ) : (
                <FileText className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="truncate">
              <h3 className="font-bold text-sm truncate text-white" title={document.name}>
                {document.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>URL Firmada Segura (15 min)</span>
                </span>
                <span>•</span>
                <span>{document.size}</span>
                {documentsList.length > 1 && currentIndex >= 0 && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">
                      {currentIndex + 1} de {documentsList.length}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Acciones del Visor */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Controles de Navegación entre Documentos (HU-05) */}
            {documentsList.length > 1 && onSelectDocument && (
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 mr-1">
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                  title="Documento anterior (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-medium text-slate-300 select-none hidden sm:inline">
                  {currentIndex + 1} / {documentsList.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                  title="Documento siguiente (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Controles de Zoom (para imágenes y páginas escalables) */}
            {isImage && (
              <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="p-1.5 hover:bg-slate-700 text-slate-300 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                  title="Alejar (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Restablecer escala al 100%"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                  className="p-1.5 hover:bg-slate-700 text-slate-300 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                  title="Acercar (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Abrir en nueva pestaña */}
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                title="Abrir archivo en nueva pestaña"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </a>
            )}

            {/* Descargar archivo protegido */}
            {signedUrl && (
              <button
                onClick={() => downloadDocumentFile(document)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Descargar archivo original"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Descargar</span>
              </button>
            )}

            {/* Cerrar Visor */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Cerrar visor (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Cuerpo del Visor: Lienzo de Vista Previa (70%) + Barra Lateral de Metadatos (30%) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Panel Principal de Renderizado */}
          <div className="flex-1 bg-slate-100/90 overflow-auto flex items-center justify-center p-3 md:p-6 relative">
            {/* Estado: Cargando enlace firmado */}
            {isLoadingUrl && (
              <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-700">
                  Generando enlace seguro con Supabase Storage...
                </p>
                <span className="text-xs text-slate-400">
                  Verificando credenciales RLS y permisos del archivo
                </span>
              </div>
            )}

            {/* Estado: Error al obtener URL firmada */}
            {!isLoadingUrl && urlError && (
              <div className="max-w-md bg-white p-6 rounded-2xl border border-rose-200 shadow-md text-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Error de acceso al documento
                </h4>
                <p className="text-xs text-slate-600">{urlError}</p>
                <button
                  onClick={() => {
                    setUrlError(null);
                    setIsLoadingUrl(true);
                    fetchDocumentSignedUrl(document.id).then((r) => {
                      setIsLoadingUrl(false);
                      if (r.success && r.signedUrl) setSignedUrl(r.signedUrl);
                      else setUrlError(r.error || "Reintento fallido");
                    });
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Reintentar carga
                </button>
              </div>
            )}

            {/* Estado: Documento Listo con URL Firmada */}
            {!isLoadingUrl && !urlError && signedUrl && (
              <>
                {/* A. VISOR DE PDF */}
                {isPdf && (
                  <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <iframe
                      src={`${signedUrl}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-0 rounded-2xl"
                      title={document.name}
                    />
                  </div>
                )}

                {/* B. VISOR DE IMÁGENES CON ZOOM */}
                {isImage && (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <div
                      style={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: "center center",
                      }}
                      className="transition-transform duration-150 flex items-center justify-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signedUrl}
                        alt={document.name}
                        className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* C. VISOR DE WORD (.DOCX) CON MAMMOTH */}
                {isDocx && (
                  <div className="w-full h-full overflow-auto flex flex-col items-center p-4">
                    {isLoadingDocx && (
                      <div className="my-auto flex flex-col items-center justify-center space-y-3 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-sm font-semibold text-slate-700">
                          Convirtiendo documento Word para vista previa...
                        </p>
                      </div>
                    )}

                    {!isLoadingDocx && docxHtml && (
                      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-12 my-auto space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2 text-blue-600">
                            <FileCode className="w-5 h-5" />
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                              Vista Previa de Word (.docx)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Renderizado web nativo
                          </span>
                        </div>
                        <div
                          className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: docxHtml }}
                        />
                      </div>
                    )}

                    {!isLoadingDocx && !docxHtml && (
                      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-blue-200 p-8 text-center space-y-4 my-auto">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
                          <FileCode className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            Documento Microsoft Word
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {docxError ||
                              "La vista previa web no está disponible para la estructura de este documento Word."}
                          </p>
                        </div>
                        <a
                          href={signedUrl}
                          download={document.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar Documento Original</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* D. FORMATO NO COMPATIBLE / DESCONOCIDO */}
                {!isPdf && !isImage && !isDocx && (
                  <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mx-auto">
                      <FileWarning className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Formato no compatible para previsualización directa
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        El archivo con extensión <span className="font-mono font-bold text-slate-700">.{ext}</span> no puede ser renderizado en el navegador, pero puedes descargarlo de forma segura.
                      </p>
                    </div>
                    <a
                      href={signedUrl}
                      download={document.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Archivo Seguro</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 3. Panel Lateral Derecho: Metadatos Completos (30%) */}
          <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-5 md:p-6 overflow-y-auto space-y-5 shrink-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Metadatos del Documento
                </h4>
                {onEditMetadata && (
                  <button
                    onClick={() => onEditMetadata(document)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Editar categoría y etiquetas"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
              <div className="space-y-3 text-xs">
                {/* Formato y extensión */}
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tipo de archivo:</span>
                    <span className="font-medium text-slate-700 uppercase">
                      {document.extension} {document.tipoMime ? `(${document.tipoMime})` : ""}
                    </span>
                  </div>
                </div>

                {/* Tamaño */}
                <div className="flex items-start gap-2.5">
                  <HardDrive className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tamaño exacto:</span>
                    <span className="font-mono font-medium text-slate-700">
                      {document.size} ({document.sizeBytes.toLocaleString()} bytes)
                    </span>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Fecha de registro:</span>
                    <span className="font-medium text-slate-700">{document.updatedAt}</span>
                  </div>
                </div>

                {/* Carpeta */}
                {folder && (
                  <div className="flex items-start gap-2.5">
                    <FolderIcon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Carpeta:</span>
                      <span className="font-medium text-slate-700">{folder.nombre}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Categoría Asignada */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">
                Categoría
              </span>
              {category ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      "badgeBg" in category && category.badgeBg
                        ? `${category.badgeBg} ${category.badgeText}`
                        : ""
                    }`}
                    style={
                      !("badgeBg" in category && category.badgeBg)
                        ? {
                            backgroundColor: `${category.color || "#3b82f6"}18`,
                            color: category.color || "#3b82f6",
                            border: `1px solid ${category.color || "#3b82f6"}30`,
                          }
                        : {}
                    }
                  >
                    {("name" in category && category.name) ? category.name : ("nombre" in category ? (category as Category).nombre : "")}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin categoría asignada</span>
              )}
            </div>

            {/* Etiquetas (#tags) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">
                Etiquetas (#tags)
              </span>
              {document.tags && document.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin etiquetas</span>
              )}
            </div>

            {/* Notas del Documento */}
            {document.notes && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Notas
                </span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs leading-relaxed">
                  {document.notes}
                </p>
              </div>
            )}

            {/* Garantía de Seguridad y Almacenamiento */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Almacenamiento Seguro</span>
              </div>
              <p className="text-[10px] text-emerald-700 leading-normal">
                Bucket privado de Supabase Storage con políticas RLS y cifrado en reposo. El enlace temporal expira a los 15 minutos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
