import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';

export interface TestimonialVideo {
  id: string;
  /** Bundled require() module or remote/local URI source for expo-video */
  video: VideoSource;
  /** Bundled module id when available (for thumbnail generation) */
  videoModule?: number | null;
  thumbnail: ImageSourcePropType;
  customerName: string;
  location: string;
  rating: number;
  quote: string;
}

export interface TestimonialReview {
  id: string;
  customerName: string;
  businessType: string;
  rating: number;
  review: string;
  photo?: ImageSourcePropType;
}

/** @deprecated Static arrays removed — Home loads testimonials from GET /cms/home */
export const TESTIMONIAL_VIDEOS: TestimonialVideo[] = [];

/** @deprecated Static arrays removed — Home loads testimonials from GET /cms/home */
export const TESTIMONIAL_REVIEWS: TestimonialReview[] = [];
