import { ImageType } from "./image-type";

export type ButtonType = {
  onClick: () => void;
  image?: ImageType;
};
