import React, { useEffect, useState } from "react";
import type { FileDownloadType } from "@/types/file-download-type";
import { useTranslation } from "react-i18next";
import { Music, Video } from "lucide-react";

interface TypeContainerProps {
  typeFile: "audio" | "video";
  extensionType: string[];
  qualityFile: string[] | null;
  currentType: FileDownloadType;
  onClick: (typeFile: FileDownloadType) => void;
}

export const TypeContainer = ({
  typeFile,
  extensionType,
  qualityFile,
  currentType,
  onClick,
}: TypeContainerProps) => {
  const { t } = useTranslation();
  const isActive = currentType.type === typeFile;

  const [selectedExt, setSelectedExt] = useState<string>(
    typeFile === "audio" ? "MP3" : "MP4"
  );
  const [selectedQuality, setSelectedQuality] = useState<string>("");

  useEffect(() => {
    if (currentType.type === typeFile) {
      if (currentType.extension) setSelectedExt(currentType.extension);
      if (currentType.quality !== undefined) setSelectedQuality(currentType.quality);
    } else {
      if (currentType.optionExtensionUnselected) setSelectedExt(currentType.optionExtensionUnselected);
      if (currentType.optionQualityUnselected !== undefined) setSelectedQuality(currentType.optionQualityUnselected);
    }
  }, [currentType, typeFile]);

  const handleExtClick = (ext: string) => {
    setSelectedExt(ext);
    const newType: FileDownloadType = {
      type: typeFile,
      extension: ext,
      optionExtensionUnselected: currentType.optionExtensionUnselected,
      quality: selectedQuality,
      optionQualityUnselected: currentType.optionQualityUnselected,
    };
    onClick(newType);
  };

  const handleQualityClick = (q: string) => {
    setSelectedQuality(q);
    const newType: FileDownloadType = {
      type: typeFile,
      extension: selectedExt,
      optionExtensionUnselected: currentType.optionExtensionUnselected,
      quality: q,
      optionQualityUnselected: currentType.optionQualityUnselected,
    };
    onClick(newType);
  };

  const handleTypeSelect = () => {
    const newType: FileDownloadType = {
      type: typeFile,
      extension: selectedExt,
      optionExtensionUnselected: currentType.extension,
      quality: selectedQuality,
      optionQualityUnselected: currentType.quality,
    };
    onClick(newType);
  };

  return (
    <div
      onClick={handleTypeSelect}
      className={`
        relative rounded-xl border cursor-pointer transition-all duration-300
        ${isActive
          ? "border-brand-500/60 bg-brand-500/10 shadow-lg shadow-brand-900/20"
          : "border-surface-border bg-surface-muted hover:border-surface-border hover:bg-glassHover"
        }
      `}
      role="radio"
      aria-checked={isActive}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className={`font-semibold text-sm ${isActive ? "text-brand-300" : "text-[var(--text-secondary)]"}`}>
          {typeFile === "audio" ? 
          <span className="flex items-center justify-center"><Music className="w-4 h-4 inline mr-1.5" />{t("fileInfo.typeAudio")}</span>: 
          <span className="flex items-center justify-center"><Video className="w-4 h-4 inline mr-1.5" />{t("fileInfo.typeVideo")}</span>
          }
        </div>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
        )}
      </div>

      {/* Expansion content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${isActive ? "max-h-60 pb-4" : "max-h-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Extension buttons */}
        <div className="px-4 space-y-2">
          <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{t("fileInfo.format")}</p>
          <div className="flex flex-wrap gap-2">
            {extensionType.map((ext) => (
              <button
                key={ext}
                id={`ext-${typeFile}-${ext}`}
                onClick={() => handleExtClick(ext)}
                className={`
                  px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150
                  ${selectedExt === ext && isActive
                    ? "bg-brand-500 border-brand-400 text-white/80 shadow-sm shadow-brand-900/30"
                    : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-surface-border hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {ext}
              </button>
            ))}
          </div>
        </div>

        {/* Quality (if available) */}
        {qualityFile && qualityFile.length > 0 && (
          <div className="px-4 mt-3 space-y-2">
            <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{t("fileInfo.quality")}</p>
            <div className="flex flex-wrap gap-2">
              {qualityFile.map((q) => (
                <button
                  key={q}
                  id={`quality-${typeFile}-${q}`}
                  onClick={() => handleQualityClick(q)}
                  className={`
                    px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150
                    ${selectedQuality === q
                      ? "bg-brand-500 border-brand-400 text-white/80"
                      : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-surface-border"
                    }
                  `}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
