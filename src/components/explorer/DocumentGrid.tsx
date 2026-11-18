import React, { useState } from "react";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Star,
  Download,
  Eye,
  FolderInput,
} from "lucide-react";
import { MockDocument, MockCategory } from "@/data/mock-data";
import { Category } from "@/types/database";
import { DocumentActionsMenu } from "./DocumentActionsMenu";

interface DocumentGridProps {
  documents: MockDocument[];
  categories: (MockCategory | Category)[];
  onSelectDocument: (doc: MockDocument) => void;
  onMoveDocument?: (doc: MockDocument) => void;
  onDownloadDocument?: (doc: MockDocument) => void;
  onRenameDocument?: (doc: MockDocument) => void;
  onDeleteDocument?: (doc: MockDocument) => void;
  onEditMetadata?: (doc: MockDocument) => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  categories,
  onSelectDocument,
  onMoveDocument,
  onDownloadDocument,
  onRenameDocument,
  onDeleteDocument,
  onEditMetadata,
}) => {
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);
  const getFormatBadge = (type: MockDocument["type"]) => {
    switch (type) {
      case "pdf":
        return {
          icon: <FileText className="w-8 h-8 text-rose-500" />,
          bg: "bg-rose-50",
          border: "border-rose-100",
          label: "PDF",
          badge: "bg-rose-100 text-rose-700",
        };
      case "docx":
        return {
          icon: <FileCode className="w-8 h-8 text-blue-500" />,
          bg: "bg-blue-50",
          border: "border-blue-100",
          label: "DOCX",
          badge: "bg-blue-100 text-blue-700",
        };
      case "img":
        return {
          icon: <ImageIcon className="w-8 h-8 text-emerald-500" />,
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          label: "IMG",
          badge: "bg-emerald-100 text-emerald-700",
        };
    }
  };

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const format = getFormatBadge(doc.type);
        const category = getCategory(doc.categoryId);

        return (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc)}
            className={`group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              openMenuDocId === doc.id
                ? "z-30 shadow-md ring-2 ring-indigo-300"
                : "z-0 hover:z-10"
            }`}
          >
            {/* Top Preview Block */}
            <div
              className={`h-36 ${format.bg} border-b ${format.border} rounded-t-2xl flex flex-col items-center justify-center relative p-4 transition-colors group-hover:bg-opacity-80`}
            >
              {/* Type Badge */}
              <span
                className={`absolute top-3 left-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${format.badge}`}
              >
                {format.label}
              </span>

              {/* Star Indicator */}
              {doc.isFavorite && (
                <div className="absolute top-3 right-3 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                </div>
              )}

              {/* Large Document Icon */}
              <div className="transform group-hover:scale-110 transition-transform duration-200">
                {format.icon}
              </div>

              {/* Quick Hover Overlay */}
              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-t-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-xs text-xs font-semibold text-slate-700 rounded-lg shadow-sm">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Previsualizar</span>
                </span>
              </div>
            </div>

            {/* Bottom Details Block */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4
                  className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors"
                  title={doc.name}
                >
                  {doc.name}
                </h4>

                {/* Category & Date */}
                <div className="flex items-center gap-2 mt-2">
                  {category && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
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
                  )}
                  <span className="text-[11px] text-slate-400">{doc.updatedAt}</span>
                </div>
              </div>

              {/* Tags Cloud */}
              <div className="flex flex-wrap gap-1">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Footer Size & Quick Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{doc.size}</span>
                <div
                  className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onDownloadDocument && (
                    <button
                      onClick={() => onDownloadDocument(doc)}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 cursor-pointer"
                      title="Descargar archivo original"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onMoveDocument && (
                    <button
                      onClick={() => onMoveDocument(doc)}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 cursor-pointer"
                      title="Mover a carpeta..."
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onRenameDocument && onDeleteDocument && onDownloadDocument && (
                    <DocumentActionsMenu
                      document={doc}
                      onSelectDocument={onSelectDocument}
                      onDownloadDocument={onDownloadDocument}
                      onRenameDocument={onRenameDocument}
                      onMoveDocument={onMoveDocument}
                      onDeleteDocument={onDeleteDocument}
                      onEditMetadata={onEditMetadata}
                      onOpenChange={(isOpen) =>
                        setOpenMenuDocId(isOpen ? doc.id : null)
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
