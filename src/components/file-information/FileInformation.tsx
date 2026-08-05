import { Dispatch, SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, ChevronDown, Tv2, Eye, ThumbsUp, Link, MessageCircle } from "lucide-react";
import { TypeContainer } from "./TypeContainer";
import { ButtonComponent } from "@/components/button-component/ButtonComponent";
import type { FileDownloadType } from "@/types/file-download-type";
import type { VideoInfo } from "@/types/video-info";

const AUDIO_OPTIONS = ["MP3", "M4A", "AAC", "WAV", "FLAC"];
const VIDEO_OPTIONS = ["MP4", "MKV", "WEBM", "AVI", "MOV", "FLV"];

function formatNumber(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface FileInformationProps {
  videoInfo: VideoInfo | null;
  isLoading: boolean;
  fileDownload: FileDownloadType;
  setFileDownload: Dispatch<SetStateAction<FileDownloadType>>;
  onDownload: () => void;
  isDownloading: boolean;
}

export function FileInformation({
  videoInfo,
  isLoading,
  fileDownload,
  setFileDownload,
  onDownload,
  isDownloading,
}: FileInformationProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const videoQualitiesList = videoInfo?.videoQualities
    ? Array.from(
        new Set(
          videoInfo.videoQualities
            .map((q) => {
              if (!q.resolution) return "";
              if (q.resolution.includes("x")) {
                return `${q.resolution.split("x")[1]}p`;
              }
              return q.resolution.includes("p") ? q.resolution : `${q.resolution}p`;
            })
            .filter(Boolean)
        )
      ).sort((a, b) => parseInt(b) - parseInt(a))
    : [];

  const audioQualitiesList = videoInfo?.audioQualities
    ? Array.from(
        new Set(
          videoInfo.audioQualities
            .map((q) => (q.abr ? `${Math.round(q.abr)}k` : ""))
            .filter(Boolean)
        )
      ).sort((a, b) => parseInt(b) - parseInt(a))
    : [];

  if (!videoInfo && !isLoading) return null;

  return (
    <section
      className="glass rounded-2xl overflow-hidden animate-slide-up animate-delay-200"
      aria-label={t("fileInfo.sectionAria")}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex gap-4">
            <div className="w-32 h-20 rounded-xl bg-surface-muted shimmer-box" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-surface-muted rounded-lg w-3/4 shimmer-box" />
              <div className="h-3 bg-surface-muted rounded-lg w-1/2 shimmer-box" />
              <div className="h-3 bg-surface-muted rounded-lg w-1/3 shimmer-box" />
            </div>
          </div>
        </div>
      )}

      {/* Loaded content */}
      {videoInfo && (
        <>
          {/* Thumbnail + meta */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
            {videoInfo.thumbnail && (
              <div className="relative w-full sm:w-48 aspect-video flex-shrink-0 rounded-xl overflow-hidden border border-surface-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title ?? t("fileInfo.thumbnail")}
                  className="w-full h-full object-cover"
                />
                {videoInfo.duration && (
                  <div className="absolute bottom-1.5 right-1.5 bg-black/75 text-white/80 text-xs px-1.5 py-0.5 rounded font-mono">
                    {videoInfo.duration}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 space-y-3 min-w-0">
              {videoInfo.title && (
                <h3 className="font-bold text-[var(--text-primary)] text-lg leading-snug line-clamp-2">
                  {videoInfo.title}
                </h3>
              )}
              {videoInfo.channel && (
                <p className="text-sm text-[var(--text-secondary)]">
                  <Tv2 className="w-4 h-4 inline mr-1.5"/> {videoInfo.channel}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-sm">
                {videoInfo.view_count != null && (
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span><Eye className="w-4 h-4 inline mr-1.5" /></span>
                    <span>{formatNumber(videoInfo.view_count)} visualizações</span>
                  </div>
                )}
                {videoInfo.like_count != null && (
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span><ThumbsUp className="w-4 h-4 inline mr-1.5"/></span>
                    <span>{formatNumber(videoInfo.like_count)}</span>
                  </div>
                )}
                {videoInfo.comment_count != null && (
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span><MessageCircle className="w-4 h-4 inline mr-1.5"/></span>
                    <span>{formatNumber(videoInfo.comment_count)}</span>
                  </div>
                )}
              </div>

              {videoInfo.webpage_url && (
                <a
                  href={videoInfo.webpage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <Link className="w-4 h-4 inline mr-1.5"/> {t("fileInfo.openOriginal")}
                </a>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-surface-border" />

          {/* Format config toggle */}
          <div className="p-6 sm:p-8 space-y-4">
            <button
              id="toggle-format-config"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-semibold text-[var(--text-primary)] group"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t("fileInfo.formatConfig")}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Expandable format chooser */}
            <div className={`overflow-hidden transition-all duration-400 ${expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <TypeContainer
                  typeFile="audio"
                  extensionType={AUDIO_OPTIONS}
                  qualityFile={audioQualitiesList}
                  currentType={fileDownload}
                  onClick={setFileDownload}
                />
                <TypeContainer
                  typeFile="video"
                  extensionType={VIDEO_OPTIONS}
                  qualityFile={videoQualitiesList}
                  currentType={fileDownload}
                  onClick={setFileDownload}
                />
              </div>

              {/* Current selection summary */}
              <div className="mt-4 p-4 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <span>{t("fileInfo.type")}: <strong className="text-[var(--text-primary)]">{fileDownload.type === "audio" ? t("fileInfo.typeAudio") : t("fileInfo.typeVideo")}</strong></span>
                  <span className="w-px h-4 bg-surface-border" />
                  <span>{t("fileInfo.format")}: <strong className="text-[var(--text-primary)]">{fileDownload.extension || "—"}</strong></span>
                  {fileDownload.quality && (
                    <>
                      <span className="w-px h-4 bg-surface-border" />
                      <span>{t("fileInfo.quality")}: <strong className="text-[var(--text-primary)]">{fileDownload.quality}</strong></span>
                    </>
                  )}
                </div>

                <ButtonComponent
                  id="download-with-config-btn"
                  fontSize="medium"
                  variant="primary"
                  onClick={onDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? t("common.downloading") : t("fileInfo.downloadBtn")}
                </ButtonComponent>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
