import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ToastNotification } from "@/components/toast-notification/ToastNotification";
import { ButtonComponent } from "@/components/button-component/ButtonComponent";

interface LabelInputProps {
  label: { htmlFor_id: string; textContent: string };
  input: { type: string; value: string; placeholder?: string };
  setInputValue: (val: string) => void;
  onEnter?: () => void;
  setToast: Dispatch<SetStateAction<{
      type: "errorType" | "warnType" | "successType";
      message: string;
  } | null>>
}

export const LabelInputField: React.FC<LabelInputProps> = ({
  label,
  input,
  setInputValue,
  onEnter,
  setToast
}) => {
  const { t } = useTranslation();
  const [pasteError, setPasteError] = useState("");
  const [clipboardEmpty, setClipboardEmpty] = useState("");

  const pasteValue = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not supported");
      }
      const clipboardValue = await navigator.clipboard.readText();
      if (!clipboardValue) {
        setClipboardEmpty(t("errors.clipboardEmpty"));
      } else {
        setInputValue(clipboardValue);
      }
    } catch (err) {
      if (!pasteError) {
        setPasteError(t("errors.clipboardError"));
        console.error("Clipboard error:", err);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) onEnter();
  };

  useEffect(() => {
    if (!pasteError) return;
    setToast({ type: "errorType", message: pasteError }); 
    const t = setTimeout(() => setPasteError(""), 8000);
    return () => clearTimeout(t);
  }, [pasteError]);
  
  useEffect(() => {
    if (!clipboardEmpty) return;
    setToast({ type: "warnType", message: clipboardEmpty }); 
    const t = setTimeout(() => setClipboardEmpty(""), 8000);
    return () => clearTimeout(t);
  }, [clipboardEmpty]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        htmlFor={label.htmlFor_id}
        className="text-sm font-medium text-[var(--text-secondary)] tracking-wide"
      >
        {label.textContent}
      </label>

      <div className="flex gap-2">
        <input
          id={label.htmlFor_id}
          type={input.type}
          placeholder={input.placeholder}
          value={input.value}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="
            flex-1 bg-surface-muted border border-white/10 rounded-xl
            px-4 py-3 text-[var(--text-input)] text-sm
            placeholder:text-[var(--text-secondary)]
            focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20
            transition-all duration-200
          "
        />
        <ButtonComponent
          fontSize="medium"
          variant="ghost"
          onClick={pasteValue}
          id="paste-link-btn"
        >
          {t("common.paste")}
        </ButtonComponent>
      </div>
    </div>
  );
};
