export type VideoQuality = {
  format_id: string;
  resolution: string;
  ext: string;
  filesize?: number;
};

export type AudioQuality = {
  format_id: string;
  abr?: number;
  ext: string;
  filesize?: number;
};

export type VideoInfo = {
  title: string | null;
  thumbnail: string | null;
  channel: string | null;
  like_count: number | null;
  comment_count: number | null;
  duration: string | null;
  view_count: number | null;
  upload_date: string | null;
  webpage_url: string;
  videoQualities: VideoQuality[];
  audioQualities: AudioQuality[];
};
