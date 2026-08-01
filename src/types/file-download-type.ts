export type FileDownloadType = {
  type: "audio" | "video";
  extension: string;
  optionExtensionUnselected: string;
  quality: string;
  optionQualityUnselected: string;
};

export type DefaultConfig = {
  type: "audio" | "video";
  extension: string;
  quality: string;
};
