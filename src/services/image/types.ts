export type Image = {
  url: string;
}

export interface ImageClient {
  generateImage(query: string): Promise<Image | null>;
}