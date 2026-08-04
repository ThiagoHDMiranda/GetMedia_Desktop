import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Info, History as HistoryIcon } from "lucide-react";
import { HeroSection } from "@/components/hero-section/HeroSection";
import { DownloadQuickly } from "@/components/download-quickly-section/DownloadQuickly";
import { SettingsModal } from "@/components/settings-modal/SettingsModal";
import { AboutModal } from "@/components/about-modal/AboutModal";
import { HistoryModal } from "@/components/history-modal/HistoryModal";
import { FileInformation } from "@/components/file-information/FileInformation";
import { ToastNotification } from "@/components/toast-notification/ToastNotification";
import type { FileDownloadType, DefaultConfig } from "@/types/file-download-type";
import type { VideoInfo } from "@/types/video-info";
import type { HistoryEntryInput } from "@/types/history";
import {
  fetchVideoInfo as bridgeFetchInfo,
  downloadMedia as bridgeDownload,
  getDownloadFolder as bridgeGetDownloadFolder,
  historyAdd as bridgeHistoryAdd,
  historyUpdate as bridgeHistoryUpdate,
} from "@/lib/desktop-bridge";
import { useUpdater } from "@/hooks/useUpdater";
// Import images so Vite bundles them with correct relative paths (works in production Electron)
import iconUrl from "@/assets/getmedia_icon_512x512.png";
import logoUrl from "@/assets/getmedia.png";

export default function App() {
  const { t } = useTranslation();
  const [linkDownload, setLinkDownload] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ type: "errorType" | "warnType" | "successType"; message: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const updater = useUpdater();
  const [defaultConfig, setDefaultConfig] = useState<DefaultConfig>({
    type: "video",
    extension: "MP4",
    quality: "",
  });
  const [fileDownload, setFileDownload] = useState<FileDownloadType>({
    type: defaultConfig.type,
    extension: defaultConfig.extension,
    optionExtensionUnselected: defaultConfig.type === "audio" ? "MP4" : "MP3",
    quality: defaultConfig.quality,
    optionQualityUnselected: "",
  });

  const showToast = (type: "errorType" | "warnType" | "successType", message: string) => {
    setToast({ type, message });
  };

  const fetchVideoInfo = async (url: string) => {
    if (!url) return;
    setIsLoadingInfo(true);
    setVideoInfo(null);
    try {
      const result = await bridgeFetchInfo(url);
      if ("error" in result) {
        throw new Error(t(result.error || "errors.unexpectedFetch"));
      }
      const data = result as VideoInfo;
      setVideoInfo(data);

      // Pre-select highest qualities
      let bestVideoQuality = "";
      if (data.videoQualities && data.videoQualities.length > 0) {
        const sortedVideo = [...data.videoQualities]
          .map((q) => {
            if (!q.resolution) return 0;
            if (q.resolution.includes("x")) {
              return parseInt(q.resolution.split("x")[1]);
            }
            return parseInt(q.resolution);
          })
          .filter((h) => !isNaN(h))
          .sort((a, b) => b - a);
        if (sortedVideo.length > 0) {
          bestVideoQuality = `${sortedVideo[0]}p`;
        }
      }

      let bestAudioQuality = "";
      if (data.audioQualities && data.audioQualities.length > 0) {
        const sortedAudio = [...data.audioQualities]
          .map((q) => q.abr)
          .filter((a): a is number => a !== undefined && !isNaN(a))
          .sort((a, b) => b - a);
        if (sortedAudio.length > 0) {
          bestAudioQuality = `${Math.round(sortedAudio[0])}k`;
        }
      }

      setFileDownload((prev) => ({
        ...prev,
        quality: prev.type === "video" ? bestVideoQuality : bestAudioQuality,
        optionQualityUnselected: prev.type === "video" ? bestAudioQuality : bestVideoQuality,
      }));
    } catch (err: unknown) {
      showToast("errorType", err instanceof Error ? t(err.message) : t("errors.unexpectedFetch"));
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const downloadQuickly = async () => {
    if (!linkDownload) {
      showToast("warnType", t("download.invalidLink"));
      return;
    }
    setIsDownloading(true);

    // Capture context for the history entry before any awaits so a fast
    // failure (e.g. bad URL) still produces a useful record.
    const startedAt = Date.now();
    let historyId: string | undefined;
    let destinationFolder = "";
    try {
      destinationFolder = await bridgeGetDownloadFolder();
    } catch {
      destinationFolder = "";
    }

    const entryInput: HistoryEntryInput = {
      url: linkDownload,
      title: videoInfo?.title ?? null,
      thumbnail: videoInfo?.thumbnail ?? null,
      type: fileDownload.type,
      format: (fileDownload.extension ?? "").toLowerCase(),
      quality: fileDownload.quality ?? "",
      channel: videoInfo?.channel ?? null,
      duration: videoInfo?.duration ?? null,
      filePath: null,
      filename: null,
      fileSize: null,
      destinationFolder,
      completedAt: null,
      status: "in_progress",
      errorKey: null,
    };

    try {
      const created = await bridgeHistoryAdd(entryInput);
      historyId = created.id;
    } catch (err) {
      console.warn("[history] Failed to add in_progress entry:", err);
    }

    try {
      const result = await bridgeDownload({
        url: linkDownload,
        type: fileDownload.type,
        extension: fileDownload.extension,
        quality: fileDownload.quality,
      });

      if ("error" in result) {
        throw new Error(t(result.error || "errors.unexpectedDownload"));
      }

      // The file is already saved to disk by the Electron main process.
      const filename = result.filename || "download";
      showToast("successType", t("download.success", { filename: filename }));

      if (historyId) {
        try {
          await bridgeHistoryUpdate(historyId, {
            status: "downloaded",
            filePath: result.filePath ?? null,
            filename: result.filename ?? null,
            fileSize: result.fileSize ?? null,
            completedAt: Date.now(),
            errorKey: null,
          });
        } catch (err) {
          console.warn("[history] Failed to update entry as downloaded:", err);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("errors.unexpectedDownload");
      showToast("errorType", t(message));

      if (historyId) {
        try {
          await bridgeHistoryUpdate(historyId, {
            status: "failed",
            completedAt: Date.now(),
            errorKey: message,
          });
        } catch (updateErr) {
          console.warn("[history] Failed to update entry as failed:", updateErr);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 bg-surface" aria-hidden="true">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-brand-400/8 blur-3xl animate-pulse-slow animate-delay-200" />
      </div>
      <div className="w-full absolute top-6 place-self-center flex items-center justify-center gap-2">
          <img src={iconUrl} className="w-auto h-10" />
          <img src={logoUrl} className="w-auto h-10" />
        </div>
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-12 relative">
        {/* Top-bar buttons — fixed right cluster (History + About + Settings) */}
        <div className="fixed top-6 right-6 z-40 flex items-center gap-2">
          {/* History button */}
          <button
            id="history-btn"
            onClick={() => setHistoryOpen(true)}
            className="group flex items-center h-10 rounded-xl glass text-[var(--text-secondary)] hover:text-brand-400 hover:border-brand-400/40 transition-colors duration-300 overflow-hidden"
          >
            <span className="flex items-center justify-center w-10 h-10 flex-none">
              <HistoryIcon className="w-5 h-5" />
            </span>
            <span className="flex items-center text-sm font-medium whitespace-nowrap overflow-hidden opacity-0 max-w-0 group-hover:pr-4 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-500">
              {t("history.title")}
            </span>
          </button>

          {/* About button */}
          <button
            id="about-btn"
            onClick={() => setAboutOpen(true)}
            className="group flex items-center h-10 rounded-xl glass text-[var(--text-secondary)] hover:text-brand-400 hover:border-brand-400/40 transition-colors duration-300 overflow-hidden"
          >
            <span className="flex items-center justify-center w-10 h-10 flex-none">
              <Info className="w-5 h-5" />
            </span>
            <span className="flex items-center text-sm font-medium whitespace-nowrap overflow-hidden opacity-0 max-w-0 group-hover:pr-4 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-500">
              {t("about.title")}
            </span>
          </button>

          {/* Settings button */}
          <button
            id="settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="group flex items-center h-10 rounded-xl glass text-[var(--text-secondary)] hover:text-brand-400 hover:border-brand-400/40 transition-colors duration-300 overflow-hidden"
          >
            <span className="flex items-center justify-center w-10 h-10 flex-none">
              <Settings className="w-5 h-5" />
            </span>
            <span className="flex items-center text-sm font-medium whitespace-nowrap overflow-hidden opacity-0 max-w-0 group-hover:pr-4 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-500">
              {t("settings.title")}
            </span>
          </button>
        </div>
        
        <HeroSection />
        <DownloadQuickly
          linkDownload={linkDownload}
          setLinkDownload={setLinkDownload}
          fileDownload={fileDownload}
          setFileDownload={setFileDownload}
          downloadQuickly={downloadQuickly}
          fetchVideoInfo={fetchVideoInfo}
          isDownloading={isDownloading}
          setToast={setToast}
          defaultConfig={defaultConfig}
          onDefaultConfigChange={(cfg) => {
            setDefaultConfig(cfg);
          }}
        />
        <FileInformation
          videoInfo={videoInfo}
          isLoading={isLoadingInfo}
          fileDownload={fileDownload}
          setFileDownload={setFileDownload}
          onDownload={downloadQuickly}
          isDownloading={isDownloading}
        />
      </div>

      {/* Settings modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} updater={updater} />

      {/* About modal */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* History modal */}
      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Toast */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          clearUseState={() => setToast(null)}
        />
      )}
    </main>
  );
}
