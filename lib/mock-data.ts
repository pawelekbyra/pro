import type { Grid } from './types';

// A new, more cohesive and connected slide labyrinth
export const mockGrid: Grid = {
  // --- Main Hub & Vertical Video Feed (Column x=0) ---
  '0,0': {
    id: 'welcome_video',
    type: 'video',
    x: 0, y: 0,
    userId: 'system', username: 'TheLabyrinth', avatar: 'https://i.pravatar.cc/150?u=system',
    access: 'public', createdAt: Date.now(), initialLikes: 2024, isLiked: false, initialComments: 42,
    data: {
      description: 'Welcome to the Labyrinth. Swipe in any direction to explore. #welcome #interactive',
      mp4Url: 'https://vod-progressive.pexels.com/video/857195/free-video-857195.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/857195/free-video-857195.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,-1': {
    id: 'cat_video_1',
    type: 'video',
    x: 0, y: -1,
    userId: 'cat_lover', username: 'Kociara', avatar: 'https://i.pravatar.cc/150?u=cat_lover',
    access: 'public', createdAt: Date.now(), initialLikes: 999, isLiked: false, initialComments: 100,
    data: {
      description: 'Funny cat chasing a laser. You have to see this! (0,-1) #cats #funny',
      mp4Url: 'https://vod-progressive.pexels.com/video/2022395/free-video-2022395.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,1': {
    id: 'city_video_1',
    type: 'video',
    x: 0, y: 1,
    userId: 'city_explorer', username: 'CityScapes', avatar: 'https://i.pravatar.cc/150?u=city',
    access: 'public', createdAt: Date.now(), initialLikes: 2100, isLiked: true, initialComments: 56,
    data: {
      description: 'Stunning city view from above. (0,1) #city #drone #architecture',
      mp4Url: 'https://vod-progressive.pexels.com/video/854386/free-video-854386.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/854386/free-video-854386.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },

  // --- Game Zone (Branch x < 0) ---
  '-1,0': {
    id: 'game_flappy_div',
    type: 'game', // This type will render the FlappyDivGame component
    x: -1, y: 0,
    userId: 'game_dev', username: 'DivWizard', avatar: 'https://i.pravatar.cc/150?u=gamedev',
    access: 'public', createdAt: Date.now(), initialLikes: 9999, isLiked: true, initialComments: 512,
    data: {
      description: 'Play Flappy Div! How far can you get? (-1,0) #game #flappy',
    },
  },
  '-2,0': {
    id: 'game_pope_1',
    type: 'html',
    x: -2, y: 0,
    userId: 'pope_dev', username: 'DivineGames', avatar: 'https://i.pravatar.cc/150?u=pope',
    access: 'public', createdAt: Date.now(), initialLikes: 2137, isLiked: true, initialComments: 420,
    data: {
      type: 'GAME_POPE',
      description: 'The Pope Game: Bless or Scold? Your choice. (-2,0)',
    },
  },

  // --- Interactive & Creative Zone (Branch x > 0) ---
  '1,0': {
    id: 'quiz_entry',
    type: 'html',
    x: 1, y: 0,
    userId: 'quiz_master', username: 'TheInquisitor', avatar: 'https://i.pravatar.cc/150?u=quiz',
    access: 'public', createdAt: Date.now(), initialLikes: 101, isLiked: true, initialComments: 42,
    data: {
      type: 'QUIZ',
      description: 'Your choice determines your path. (1,0)',
      quizData: {
        question: 'What do you seek?',
        answers: [
          { text: 'A Story', nextSlide: { x: 1, y: -1 } },    // Leads to Story
          { text: 'A Challenge', nextSlide: { x: 1, y: 1 } }, // Leads to Logic Quiz
          { text: 'Beauty', nextSlide: { x: 2, y: 0 } },      // Leads to Color Palette
        ],
      },
    },
  },
  '1,-1': {
    id: 'story_ai',
    type: 'html',
    x: 1, y: -1,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=jules_creative',
    access: 'public', createdAt: Date.now(), initialLikes: 88, isLiked: true, initialComments: 22,
    data: {
      type: 'STORY',
      description: 'An AI\'s Tale. (1,-1)',
      storyData: {
        text: 'You find a dusty old server rack. A single terminal glows with a question: "Reboot the old web, or build the new one?"',
        choices: [
          { text: 'Reboot (Legacy)', nextSlide: { x: 0, y: -1 } }, // Back to cat video
          { text: 'Build (Future)', nextSlide: { x: 2, y: -1 } }, // To a parallax view
        ],
      },
    },
  },
  '1,1': {
    id: 'quiz_logic',
    type: 'html',
    x: 1, y: 1,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=jules_creative',
    access: 'public', createdAt: Date.now(), initialLikes: 123, isLiked: false, initialComments: 32,
    data: {
      type: 'QUIZ',
      description: 'A little logic puzzle. (1,1)',
      quizData: {
        question: 'A farmer has 17 sheep. All but 9 die. How many are left?',
        answers: [
          { text: '8', nextSlide: { x: 1, y: 0 } }, // Wrong, back to quiz entry
          { text: '17', nextSlide: { x: 1, y: 0 } },// Wrong, back to quiz entry
          { text: '9', nextSlide: { x: 2, y: 1 } },  // Correct! To a typing challenge
        ],
      },
    },
  },
  '2,0': {
    id: 'creative_colors',
    type: 'html',
    x: 2, y: 0,
    userId: 'artist', username: 'Colorista', avatar: 'https://i.pravatar.cc/150?u=artist',
    access: 'public', createdAt: Date.now(), initialLikes: 555, isLiked: true, initialComments: 11,
    data: {
      // Assuming a new 'COLOR_PALETTE' type could be rendered.
      // For now, we can use a generic HTML content slide.
      type: 'HTML_CONTENT',
      description: 'Just some beautiful, animated colors. (2,0) #art #creative',
      htmlContent: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab); background-size: 400% 400%; animation: gradient 15s ease infinite;">
          <h1 style="color: white; font-size: 3rem; text-shadow: 2px 2px 4px #000000a0;">Colors in Motion</h1>
        </div>
        <style>
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        </style>
      `,
    },
  },
  '2,-1': {
    id: 'parallax_1',
    type: 'html',
    x: 2, y: -1,
    userId: 'artist', username: 'VisualDreamer', avatar: 'https://i.pravatar.cc/150?u=dreamer',
    access: 'public', createdAt: Date.now(), initialLikes: 404, isLiked: false, initialComments: 12,
    data: {
      type: 'PARALLAX',
      description: 'A journey through layers. (2,-1)',
      posterUrl: 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
  },
  '2,1': {
    id: 'typing_challenge_1',
    type: 'html',
    x: 2, y: 1,
    userId: 'user_typing', username: 'SpeedyKeys', avatar: 'https://i.pravatar.cc/150?u=speedy',
    access: 'public', createdAt: Date.now(), initialLikes: 1337, isLiked: false, initialComments: 88,
    data: {
      type: 'TYPING_CHALLENGE',
      description: 'You solved the riddle! Now prove your speed. (2,1)',
      challengeData: {
        phrases: [
          'The labyrinth is full of secrets.',
          'Navigate wisely through the digital corridors.',
          'Every choice leads to a new discovery.',
        ],
      },
    },
  },
};
