import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Folder, FolderOpen } from "lucide-react";
import { ButtonComponent } from "@/components/button-component/ButtonComponent";
import {
  getDownloadFolder,
  chooseDownloadFolder,
} from "@/lib/desktop-bridge";

/**
 * DownloadFolder
 *
 * Displays the current download destination folder and lets the user
 * choose another folder via the native OS directory picker. The choice
 * is persisted by the main process (config.json in the userData dir).
 */
export function DownloadFolder() {
  const { t } = useTranslation();
  const [folder, setFolder] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDownloadFolder()
      .then(setFolder)
      .catch(() => setFolder("Downloads"));
  }, []);

  const handleChangeFolder = useCallback(async () => {
    setLoading(true);
    try {
      const newFolder = await chooseDownloadFolder();
      if (newFolder) {
        setFolder(newFolder);
      }
    } catch {
      // Ignore picker errors (user dismissed, etc.)
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section
      className="glass rounded-2xl px-5 py-4 animate-slide-up"
      aria-label={t("downloadFolder.sectionAria")}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Folder icon */}
          <div className="flex items-center justify-center w-10 h-10 flex-none rounded-xl bg-brand-500/10 border border-brand-500/20">
            <Folder className="w-5 h-5 text-brand-400" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {t("downloadFolder.label")}
            </p>
            <div
              className="font-mono text-sm text-[var(--text-primary)] truncate max-w-full"
              title={folder}
            >
              {folder || t("common.loading")}
            </div>
          </div>
        </div>

        <ButtonComponent
          id="change-folder-btn"
          fontSize="small"
          variant="outline"
          onClick={handleChangeFolder}
          disabled={loading}
          className="flex-none"
        >
          <FolderOpen className="w-4 h-4" aria-hidden="true" />
          {t("downloadFolder.changeBtn")}
        </ButtonComponent>
      </div>
    </section>
  );
}
