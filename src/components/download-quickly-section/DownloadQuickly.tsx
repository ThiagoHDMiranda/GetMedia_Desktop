import React, { Dispatch, SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import { Music, Video, LoaderCircle, Download, Info, Settings, ChevronDown } from "lucide-react";
import { LabelInputField } from "@/components/label-input-field/LabelInputField";
import { ButtonComponent } from "@/components/button-component/ButtonComponent";
import type { FileDownloadType, DefaultConfig } from "@/types/file-download-type";

const AUDIO_OPTIONS = ["MP3", "M4A", "AAC", "WAV", "FLAC"];
const VIDEO_OPTIONS = ["MP4", "MKV", "WEBM", "AVI", "MOV", "FLV"];

// Predefined quality options
const VIDEO_QUALITY_OPTIONS = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"];
const AUDIO_QUALITY_OPTIONS = ["128k", "192k", "256k", "320k"];

interface DownloadQuicklyProps {
  linkDownload: string;
  setLinkDownload: Dispatch<SetStateAction<string>>;
  fileDownload: FileDownloadType;
  setFileDownload: Dispatch<SetStateAction<FileDownloadType>>;
  downloadQuickly: () => void;
  fetchVideoInfo: (url: string) => void;
  isDownloading: boolean;
  setToast: Dispatch<SetStateAction<{
    type: "errorType" | "warnType" | "successType";
    message: string;
  } | null>>;
  defaultConfig: DefaultConfig;
  onDefaultConfigChange: (cfg: DefaultConfig) => void;
}

export function DownloadQuickly({
  linkDownload,
  setLinkDownload,
  fileDownload,
  setFileDownload,
  downloadQuickly,
  fetchVideoInfo,
  isDownloading,
  setToast,
  defaultConfig,
  onDefaultConfigChange,
}: DownloadQuicklyProps) {
  const { t } = useTranslation();
  const isAudio = fileDownload.type === "audio";
  const [showDefaultConfig, setShowDefaultConfig] = useState(false);

  const LABEL_INPUT_CONFIG = {
    label: { htmlFor_id: "youtube-url-input", textContent: t("download.urlLabel") },
    input: { type: "url", placeholder: t("download.urlPlaceholder"), },
  };

  const changeType = (newType: "audio" | "video") => {
    if (newType === fileDownload.type) return;
    const newExt = newType === "audio" ? "MP3" : "MP4";
    // Update fileDownload
    setFileDownload((prev) => ({
      type: newType,
      extension: newExt,
      optionExtensionUnselected: prev.extension,
      quality: "",
      optionQualityUnselected: prev.quality,
    }));
    // Keep defaultConfig in sync with global type change
    onDefaultConfigChange({
      type: newType,
      extension: newExt,
      quality: "",
    });
  };

  // ── Default config handlers ──
  // Type is now shared with the main toggle — no separate handler needed
  const changeDefaultExt = (ext: string) => {
    onDefaultConfigChange({
      ...defaultConfig,
      extension: ext,
    });
    // Sync to fileDownload immediately
    setFileDownload((prev) => ({
      ...prev,
      extension: ext,
    }));
  };

  const changeDefaultQuality = (quality: string) => {
    const newQuality = quality === defaultConfig.quality ? "" : quality;
    onDefaultConfigChange({
      ...defaultConfig,
      quality: newQuality,
    });
    // Sync to fileDownload immediately
    setFileDownload((prev) => ({
      ...prev,
      quality: newQuality,
    }));
  };

  const handleDownload = () => {
    downloadQuickly();
  };

  const handleFetchInfo = () => {
    if (linkDownload) fetchVideoInfo(linkDownload);
  };

  const qualityOptions = defaultConfig.type === "audio" ? AUDIO_QUALITY_OPTIONS : VIDEO_QUALITY_OPTIONS;

  return (
    <section
      className="glass rounded-2xl p-6 sm:p-8 space-y-6 animate-slide-up"
      aria-label={t("download.sectionAria")}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t("download.sectionTitle")}</h2>
      </div>

      {/* URL Input */}
      <LabelInputField
        label={LABEL_INPUT_CONFIG.label}
        input={{
          type: LABEL_INPUT_CONFIG.input.type,
          placeholder: LABEL_INPUT_CONFIG.input.placeholder,
          value: linkDownload,
        }}
        setInputValue={setLinkDownload}
        onEnter={handleFetchInfo}
        setToast={setToast}
      />

      {/* Type toggle + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Type toggle */}
        <div
          className="relative flex rounded-xl overflow-hidden border border-surface-border bg-surface-muted p-1"
          role="group"
          aria-label={t("download.typeAria")}
        >
          {/* Sliding pill */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-300 ease-out shadow-lg shadow-brand-900/40"
            style={{
              left:  isAudio ? "4px" : "50%",
              right: isAudio ? "50%" : "4px",
            }}
            aria-hidden="true"
          />

          <button
            id="type-audio-btn"
            onClick={() => changeType("audio")}
            className={`flex items-center relative z-10 px-5 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
              isAudio ? "text-white/80" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Music className="w-4 h-4 inline mr-1.5" />
            {t("download.audio")}
          </button>

          <button
            id="type-video-btn"
            onClick={() => changeType("video")}
            className={`flex items-center relative z-10 px-5 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
              !isAudio ? "text-white/80" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Video className="w-4 h-4 inline mr-1.5" />
            {t("download.video")}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 sm:ml-auto items-center">
          <ButtonComponent
            id="fetch-info-btn"
            fontSize="medium"
            variant="ghost"
            onClick={handleFetchInfo}
            disabled={!linkDownload || isDownloading}
          >
            {t("download.infoBtn")}
          </ButtonComponent>

          <div className="relative flex items-center gap-2.5">
            <ButtonComponent
              id="download-quickly-btn"
              fontSize="medium"
              variant="primary"
              onClick={handleDownload}
              disabled={!linkDownload || isDownloading}
            >
              {isDownloading ? (
                <>
                  <LoaderCircle className="animate-spin -ml-1 w-4 h-4" />
                  {t("common.downloading")}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t("download.downloadBtn")}
                </>
              )}
            </ButtonComponent>

            {/* Info badge with hover tooltip — matches oldDesign behavior */}
            <div className="absolute -right-6 group flex items-center">
              <Info
                className="w-4 h-4 flex-none text-[var(--text-secondary)] cursor-help transition-colors duration-200 hover:text-brand-400"
                aria-label={t("download.infoTooltip")}
              />
              <span
                className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 w-56 px-3 py-2 rounded-lg bg-surface-card border border-surface-border text-[var(--text-primary)] text-xs font-medium leading-relaxed shadow-lg backdrop-blur-md opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10 text-center"
              >
                {t("download.infoTooltip")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Default Configuration Panel (collapsible) ── */}
      <div className="rounded-xl border border-surface-border bg-surface-muted overflow-hidden">
        <button
          id="toggle-default-config"
          onClick={() => setShowDefaultConfig((v) => !v)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-glassHover transition-colors"
          aria-expanded={showDefaultConfig}
          aria-controls="default-config-panel"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-400" />
            {t("download.configTitle")}
            <span className="flex items-center text-xs text-[var(--text-secondary)] font-normal ml-1 flex items-center gap-1">
              {fileDownload.type === "audio" ? (
                <><Music className="w-3 h-3 inline" /> {t("download.audio")}</>
              ) : (
                <><Video className="w-3 h-3 inline" /> {t("download.video")}</>
              )}
              {` · ${defaultConfig.extension}`}
              {defaultConfig.quality ? ` · ${defaultConfig.quality}` : ` · ${t("download.configAuto")}`}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 ${showDefaultConfig ? "rotate-180" : ""}`}
          />
        </button>

        <div
          id="default-config-panel"
          className={`overflow-hidden transition-all duration-400 ${showDefaultConfig ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-surface-border">
            {/* No separate Tipo paddle here — type is controlled by the main toggle above */}

            {/* Default format buttons */}
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{t("download.configFormat")}</p>
              <div className="flex flex-wrap gap-2">
                {(fileDownload.type === "audio" ? AUDIO_OPTIONS : VIDEO_OPTIONS).map((ext) => (
                  <button
                    key={ext}
                    id={`default-ext-${ext}`}
                    onClick={() => changeDefaultExt(ext)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                      defaultConfig.extension === ext
                        ? "bg-brand-500 border-brand-400 text-white/80 shadow-sm shadow-brand-900/30"
                        : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-surface-border hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {ext}
                  </button>
                ))}
              </div>
            </div>

            {/* Default quality */}
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{t("download.configQuality")}</p>
              <div className="flex flex-wrap gap-2">
                {/* Auto (best) */}
                <button
                  id="default-quality-auto-btn"
                  onClick={() => changeDefaultQuality("")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                    !defaultConfig.quality
                      ? "bg-brand-500 border-brand-400 text-white/80 shadow-sm shadow-brand-900/30"
                      : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-surface-border hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t("download.configAuto")}
                </button>
                {qualityOptions.map((q) => (
                  <button
                    key={q}
                    id={`default-quality-${q}`}
                    onClick={() => changeDefaultQuality(q)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                      defaultConfig.quality === q
                        ? "bg-brand-500 border-brand-400 text-white/80 shadow-sm shadow-brand-900/30"
                        : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-surface-border hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-secondary)] opacity-70">
                {t("download.configAutoDescription")}
              </p>
            </div>

            <div className="pt-1 text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
              {t("download.configNote")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
