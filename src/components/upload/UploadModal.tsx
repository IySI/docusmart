"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  Check,
  Folder,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { MockCategory } from "@/data/mock-data";
import { Category } from "@/types/database";
import {
  uploadDocument,
  validateDocumentFile,
  formatBytes,
  ALLOWED_EXTENSIONS,
} from "@/lib/storage";
import { DocumentItem, AiClassificationResult, Folder as FolderType } from "@/types";
import { AiSuggestionCard } from "./AiSuggestionCard";
import { TagInput } from "@/components/tags/TagInput";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  categories: (MockCategory | Category)[];
  availableTags?: string[];
  defaultFolderId?: string | null;
  onUploadSuccess?: (doc: DocumentItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folders,
  categories,
  availableTags = [],
  defaultFolderId = null,
  onUploadSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("cat-1");
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId || "");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para HU-03 (Clasificación Asistida con IA)
  const [aiSuggestion, setAiSuggestion] = useState<AiClassificationResult | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiFallbackMessage, setAiFallbackMessage] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [isAiAccepted, setIsAiAccepted] = useState(false);

  if (!isOpen) return null;

  const analyzeFileWithAi = async (file: File) => {
    setIsAnalyzingAi(true);
    setAiSuggestion(null);
    setAiFallbackMessage(null);
    setAiAvailable(true);
    setIsAiAccepted(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/classify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAiFallbackMessage("Inicia sesión para utilizar el asistente de clasificación de IA.");
        } else {
          setAiFallbackMessage("El servicio de IA no respondió favorablemente. Puedes clasificar manualmente.");
        }
        setAiAvailable(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAiSuggestion(result.data);
        setAiAvailable(result.aiAvailable !== false);
        if (result.fallback && result.message) {
          setAiFallbackMessage(result.message);
        }
      } else {
        setAiAvailable(false);
        setAiFallbackMessage(result.error || "No fue posible obtener sugerencias de la IA.");
      }
    } catch (err: unknown) {
      console.warn("[Error al conectar con /api/ai/classify]:", err);
      setAiAvailable(false);
      setAiFallbackMessage("No fue posible conectar con el asistente de IA. Clasificación manual habilitada.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Archivo no válido.");
      setSelectedFile(null);
      setAiSuggestion(null);
      return;
    }

    setSelectedFile(file);
    setCustomName(file.name);

    // Disparar análisis de IA en segundo plano
    analyzeFileWithAi(file);
  };

  const handleAcceptAiSuggestion = (suggestion: AiClassificationResult) => {
    // Buscar categoría correspondiente en categories
    const matchedCategory = categories.find((c) => {
      const cName = ("name" in c && c.name) ? c.name : ("nombre" in c ? (c as Category).nombre : "");
      return (
        c.id === suggestion.categoria_id ||
        cName.toLowerCase() === suggestion.categoria_sugerida.toLowerCase()
      );
    });

    if (matchedCategory) {
      setSelectedCategoryId(matchedCategory.id);
    } else {
      setSelectedCategoryId(suggestion.categoria_id || "cat-1");
    }

    // Agregar etiquetas sugeridas por la IA al estado de etiquetas
    if (suggestion.etiquetas && suggestion.etiquetas.length > 0) {
      setTags((prev) => {
        const merged = new Set([...prev, ...suggestion.etiquetas]);
        return Array.from(merged);
      });
    }

    setIsAiAccepted(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Por favor, selecciona un documento para subir.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const result = await uploadDocument(selectedFile, {
      customName: customName.trim() || selectedFile.name,
      categoryId: selectedCategoryId,
      folderId: selectedFolderId || null,
      notes: notes.trim(),
      tags: tags,
    });

    setIsUploading(false);

    if (!result.success || !result.data) {
      setErrorMessage(result.error || "Ocurrió un error al subir el documento.");
      return;
    }

    setSuccessMessage(`¡Documento "${result.data.nombre_archivo}" subido y almacenado exitosamente!`);

    if (onUploadSuccess) {
      onUploadSuccess(result.data);
    }

    setTimeout(() => {
      setSelectedFile(null);
      setCustomName("");
      setTags([]);
      setNotes("");
      setAiSuggestion(null);
      setIsAnalyzingAi(false);
      setAiFallbackMessage(null);
      setIsAiAccepted(false);
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="w-6 h-6 text-rose-500" />;
    if (ext === "docx" || ext === "doc") return <FileCode className="w-6 h-6 text-blue-500" />;
    return <ImageIcon className="w-6 h-6 text-emerald-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Subir y Almacenar Documento
              </h3>
              <p className="text-xs text-slate-400">
                Formatos permitidos: PDF, Word e imágenes (Máx. 25 MB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
            className="hidden"
          />

          {/* Dropzone Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-2 transition-all cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-100/50 scale-[0.99]"
                : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-blue-600 mx-auto flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Arrastra tu archivo aquí o{" "}
                <span className="text-blue-600 underline">haz clic para examinar</span>
              </p>
              <p className="text-xs text-slate-400">
                PDF, Word (.docx, .doc), PNG o JPG (Hasta 25 MB)
              </p>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                  {getFileIcon(selectedFile.name)}
                </div>
                <div className="truncate text-xs">
                  <span className="font-bold text-slate-800 block truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {formatBytes(selectedFile.size)} • Formato {selectedFile.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setAiSuggestion(null);
                  setIsAnalyzingAi(false);
                  setAiFallbackMessage(null);
                  setIsAiAccepted(false);
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tarjeta de Sugerencia Inteligente IA (HU-03) */}
          {selectedFile && (
            <AiSuggestionCard
              isLoading={isAnalyzingAi}
              suggestion={aiSuggestion}
              fallbackMessage={aiFallbackMessage}
              aiAvailable={aiAvailable}
              isAccepted={isAiAccepted}
              onAccept={handleAcceptAiSuggestion}
              onDismiss={() => {
                setAiSuggestion(null);
                setIsAiAccepted(false);
              }}
              onRetry={() => {
                if (selectedFile) analyzeFileWithAi(selectedFile);
              }}
            />
          )}

          {/* File Name & Metadata Fields */}
          {selectedFile && (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5 text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-600 block">
                  Nombre visible del documento:
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre del documento"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-slate-600 block">
                    Categoría:
                  </label>
                  {isAiAccepted && (
                    <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Sugerida por Gemini
                    </span>
                  )}
                </div>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setIsAiAccepted(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      🏷️ {("name" in cat && cat.name) ? cat.name : ("nombre" in cat ? (cat as Category).nombre : cat.id)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Folder Selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-600 block">
                  Carpeta de destino:
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">📁 Repositorio Principal (Raíz)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-600 block">
                  Etiquetas (#tags):
                </label>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  availableSuggestions={availableTags}
                  placeholder="Ej: legal, contrato, q1 (Enter para agregar)"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-600 block">
                  Notas o descripción (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade notas breves sobre este documento..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Almacenamiento privado seguro con aislamiento estricto RLS por usuario.</span>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo archivo...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Guardar en mi repositorio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
