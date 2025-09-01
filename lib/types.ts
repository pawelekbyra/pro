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

// Specific data for an HTML slide
export interface HtmlSlideData {
  htmlContent: string;
}

// HTML slide type
export interface HtmlSlide extends BaseSlide {
  type: 'html';
  data: HtmlSlideData;
}

// A union type for any possible slide
export type Slide = HtmlSlide;

// The grid will be a dictionary of slides
export type Grid = {
  [key: string]: Slide;
};
