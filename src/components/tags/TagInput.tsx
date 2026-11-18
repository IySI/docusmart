import React, { useState, KeyboardEvent } from "react";
import { Tag as TagIcon, X, Plus } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  availableSuggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  readOnly?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags = [],
  onChange,
  availableSuggestions = [],
  placeholder = "Escribe una etiqueta y pulsa Enter...",
  maxTags = 10,
  readOnly = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const addTag = (text: string) => {
    const clean = text.trim().replace(/^#/, "").toLowerCase();
    if (!clean) return;
    if (tags.map((t) => t.toLowerCase()).includes(clean)) {
      setInputValue("");
      return;
    }
    if (tags.length >= maxTags) return;

    onChange([...tags, clean]);
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    if (readOnly) return;
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // Filtrar sugerencias que no hayan sido agregadas aún
  const filteredSuggestions = availableSuggestions
    .map((s) => s.replace(/^#/, "").toLowerCase())
    .filter(
      (s) =>
        s.includes(inputValue.toLowerCase()) &&
        !tags.map((t) => t.toLowerCase()).includes(s)
    )
    .slice(0, 5);

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap items-center gap-1.5 p-2 rounded-xl border bg-white transition-all ${
          isFocused
            ? "border-indigo-500 ring-2 ring-indigo-100 shadow-xs"
            : "border-slate-200 hover:border-slate-300"
        } ${readOnly ? "bg-slate-50 opacity-90 cursor-default" : ""}`}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold rounded-lg group animate-in fade-in zoom-in-95 duration-100"
          >
            <TagIcon className="w-3 h-3 text-indigo-500" />
            <span>#{tag}</span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="hover:bg-indigo-200/70 p-0.5 rounded-full text-indigo-500 hover:text-indigo-800 transition-colors cursor-pointer"
                title="Quitar etiqueta"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}

        {!readOnly && tags.length < maxTags && (
          <div className="flex-1 min-w-[120px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                if (inputValue.trim()) {
                  addTag(inputValue);
                }
              }}
              placeholder={tags.length === 0 ? placeholder : "Añadir otra..."}
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden py-1 px-1 bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Sugerencias en caliente si el usuario está escribiendo */}
      {!readOnly && isFocused && inputValue && filteredSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
          <span className="text-[10px] text-slate-400 font-medium">Sugeridas:</span>
          {filteredSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(sug);
              }}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>#{sug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
