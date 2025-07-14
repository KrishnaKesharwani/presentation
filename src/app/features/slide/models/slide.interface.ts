export interface Hotspot {
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

export interface Slide {
  id: string;
  title?: string;
  imageUrl?: string;
  hotspots?: Hotspot[];
}

export interface GoogleSlidesResponse {
  slides: Slide[];
}