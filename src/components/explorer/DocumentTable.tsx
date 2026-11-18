import React from "react";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  MoreVertical,
  Download,
  Eye,
  Star,
  FolderInput
} from "lucide-react";
import { MockDocument, MockCategory } from "@/data/mock-data";
import { Category } from "@/types/database";
import { DocumentActionsMenu } from "./DocumentActionsMenu";

interface DocumentTableProps {
  documents: MockDocument[];
  categories: (MockCategory | Category)[];
  onSelectDocument: (doc: MockDocument) => void;
  onMoveDocument?: (doc: MockDocument) => void;
  onDownloadDocument?: (doc: MockDocument) => void;
  onRenameDocument?: (doc: MockDocument) => void;
  onDeleteDocument?: (doc: MockDocument) => void;
  onEditMetadata?: (doc: MockDocument) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  categories,
  onSelectDocument,
  onMoveDocument,
  onDownloadDocument,
  onRenameDocument,
  onDeleteDocument,
  onEditMetadata,
}) => {
  const getFormatIcon = (type: MockDocument["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500" />;
      case "docx":
        return <FileCode className="w-4 h-4 text-blue-500" />;
      case "img":
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Documento</th>
              <th className="py-3 px-3">Formato</th>
              <th className="py-3 px-3">Categoría</th>
              <th className="py-3 px-3">Tamaño</th>
              <th className="py-3 px-3">Modificado</th>
              <th className="py-3 px-3 hidden lg:table-cell">Etiquetas</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const category = getCategory(doc.categoryId);

              return (
                <tr
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  {/* Name and Icon */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg shrink-0 group-hover:bg-white group-hover:shadow-xs transition-colors">
                        {getFormatIcon(doc.type)}
                      </div>
                      <div className="truncate max-w-xs md:max-w-md">
                        <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors block truncate">
                          {doc.name}
                        </span>
                        {doc.notes && (
                          <span className="text-[11px] text-slate-400 truncate block">
                            {doc.notes}
                          </span>
                        )}
                      </div>
                      {doc.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Format Badge */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {doc.extension}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {category && (
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
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
                  </td>

                  {/* Size */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-500">
                    {doc.size}
                  </td>

                  {/* Modified */}
                  <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-400">
                    {doc.updatedAt}
                  </td>

                  {/* Tags */}
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Previsualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onDownloadDocument && (
                        <button
                          onClick={() => onDownloadDocument(doc)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Descargar archivo original"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {onMoveDocument && (
                        <button
                          onClick={() => onMoveDocument(doc)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Mover a carpeta..."
                        >
                          <FolderInput className="w-4 h-4" />
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
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
