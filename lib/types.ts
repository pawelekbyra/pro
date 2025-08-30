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

// Specific data for the Pope Game
interface PopeGameScenario {
  text: string;
  choices: {
    dopyskuj: string;
    powiedz_milo: string;
  };
}

export interface PopeGameData {
  scenarios: PopeGameScenario[];
  bossFight: PopeGameScenario;
}

// Specific data for the Typing Challenge
export interface TypingChallengeData {
  phrases: string[];
  titles: {
    slow: string;
    average: string;
    fast: string;
    insane: string;
  };
}

// Specific data for Quiz
export interface QuizData {
  question: string;
  answers: {
    text: string;
    nextSlide: { x: number; y: number };
  }[];
}

// Specific data for DataViz and Parallax
export interface MediaData {
    videoUrl: string;
    posterUrl: string;
}

// Specific data for an HTML slide, which can be regular HTML or a game
export type HtmlSlideData = {
  description?: string; // Optional description for HTML slides
} & (
  | {
      htmlContent: string;
      type?: undefined; // Regular HTML slides don't have a 'type' in data
    }
  | {
      htmlContent?: never;
      type: 'GAME_POPE';
      gameData: PopeGameData;
    }
  | {
      htmlContent?: never;
      type: 'TYPING_CHALLENGE';
      challengeData: TypingChallengeData;
    }
  | {
      htmlContent?: never;
      type: 'QUIZ';
      quizData: QuizData;
    }
  | {
      htmlContent?: never;
      type: 'COMPANY_PITCH';
    }
  | {
      htmlContent?: never;
      type: 'DATA_VIZ';
      videoUrl: string;
      posterUrl: string;
    }
  | {
      htmlContent?: never;
      type: 'PARALLAX';
      videoUrl: string;
      posterUrl: string;
    }
);

// HTML slide type
export interface HtmlSlide extends BaseSlide {
  type: 'html';
  data: HtmlSlideData;
}

// Specific data for a game slide
export interface GameSlideData {
  description?: string;
}

// Game slide type
export interface GameSlide extends BaseSlide {
  type: 'game';
  data: GameSlideData;
}

// A union type for any possible slide
export type Slide = VideoSlide | HtmlSlide | GameSlide;

// The grid will be a dictionary of slides
export type Grid = {
  [key: string]: Slide;
};
