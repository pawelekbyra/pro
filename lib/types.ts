// Contains all the types for the refactored slide data model.

// Base interface for a slide, containing common properties
export interface BaseSlide {
  id: string;
  x: number;
  y: number;
  // Common fields that might apply to all slides
  userId: string;
  username: string;
  avatar: string;
  access: 'public' | 'secret';
  createdAt: number;
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;
}

// Specific data for a video slide
export interface VideoSlideData {
  description: string;
  mp4Url: string;
  hlsUrl: string | null;
  poster: string;
  autoPlay?: boolean;
  loopVideo?: boolean;
}

// Video slide type
export interface VideoSlide extends BaseSlide {
  type: 'video';
  data: VideoSlideData;
}

// Specific data for an HTML slide
export interface HtmlSlideData {
  htmlContent: string;
  description?: string; // Optional description for HTML slides
}

// HTML slide type
export interface HtmlSlide extends BaseSlide {
  type: 'html';
  data: HtmlSlideData;
}

// A union type for any possible slide
export type Slide = VideoSlide | HtmlSlide;

// The grid will be a dictionary of slides
export type Grid = {
  [key: string]: Slide;
};
