export interface MediaItem {
  id: string;
  title: string;
  image: string;
  year?: string;
  rating?: string;
  quality?: 'HD' | '4K' | 'CAM';
  isDubbed?: boolean;
  dubLanguage?: string; // Language of the dub (e.g., "Arabic", "Turkish", "English")
  type: 'movie' | 'tv' | 'animation';
  slug: string;
  description?: string;
  subjectType?: number | string; // 1 = movie, 2 = TV show
  subjectId?: string;
}
