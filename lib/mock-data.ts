import type { Grid, Slide } from './types';

// The Labyrinth - A more complex and interconnected grid of slides
export const mockGrid: Grid = {
  // Main Vertical Video Feed (x=0)
  '0,0': {
    id: 'video_feed_1',
    type: 'video',
    x: 0, y: 0,
    userId: 'video_creator_1', username: 'NatureVibes', avatar: 'https://i.pravatar.cc/150?u=nature',
    access: 'public', createdAt: Date.now(), initialLikes: 1520, isLiked: false, initialComments: 34,
    data: {
      description: 'A beautiful waterfall. #nature #waterfall #travel',
      mp4Url: 'https://vod-progressive.pexels.com/video/857195/free-video-857195.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/857195/free-video-857195.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,1': {
    id: 'video_feed_2',
    type: 'video',
    x: 0, y: 1,
    userId: 'video_creator_2', username: 'CityScapes', avatar: 'https://i.pravatar.cc/150?u=city',
    access: 'public', createdAt: Date.now(), initialLikes: 2100, isLiked: true, initialComments: 56,
    data: {
      description: 'Stunning city view from above. #city #drone #architecture',
      mp4Url: 'https://vod-progressive.pexels.com/video/854386/free-video-854386.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/854386/free-video-854386.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,2': {
    id: 'video_reward_1', // This one was already here
    type: 'video',
    x: 0, y: 2,
    userId: 'user_mock_1', username: 'TestUser', avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public', createdAt: Date.now(), initialLikes: 500, isLiked: false, initialComments: 20,
    data: {
      description: 'You have successfully navigated a part of the maze!',
      mp4Url: 'https://vod-progressive.pexels.com/video/857195/free-video-857195.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/857195/free-video-857195.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,-1': {
    id: 'video_feed_3',
    type: 'video',
    x: 0, y: -1,
    userId: 'cat_lover', username: 'Kociara', avatar: 'https://i.pravatar.cc/150?u=cat_lover',
    access: 'public', createdAt: Date.now(), initialLikes: 999, isLiked: false, initialComments: 100,
    data: {
      description: 'Funny cat chasing a laser. You have to see this! #cats #funny',
      mp4Url: 'https://vod-progressive.pexels.com/video/2022395/free-video-2022395.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,-2': {
    id: 'video_cat_1', // This one was already here
    type: 'video',
    x: 0, y: -2,
    userId: 'cat_lover', username: 'Kociara', avatar: 'https://i.pravatar.cc/150?u=cat_lover',
    access: 'public', createdAt: Date.now(), initialLikes: 999, isLiked: false, initialComments: 100,
    data: {
      description: 'Funny cat chasing a laser. You have to see this!',
      mp4Url: 'https://vod-progressive.pexels.com/video/2022395/free-video-2022395.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,-3': {
    id: 'video_feed_4',
    type: 'video',
    x: 0, y: -3,
    userId: 'video_creator_3', username: 'Techie', avatar: 'https://i.pravatar.cc/150?u=tech',
    access: 'public', createdAt: Date.now(), initialLikes: 3000, isLiked: false, initialComments: 150,
    data: {
      description: 'Code compiling on a screen. #programming #code #tech',
      mp4Url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
      hlsUrl: null,
      poster: 'https://i.imgflip.com/2fm6x.jpg',
    },
  },

  // Other slides, moved or new
  '1,0': {
    id: 'quiz_1',
    type: 'html',
    x: 1, y: 0,
    userId: 'quiz_master', username: 'TheInquisitor', avatar: 'https://i.pravatar.cc/150?u=quiz',
    access: 'public', createdAt: Date.now(), initialLikes: 101, isLiked: true, initialComments: 42,
    data: {
      type: 'QUIZ',
      description: 'Your choice determines your path.',
      quizData: {
        question: 'What do you seek?',
        answers: [
          { text: 'Knowledge', nextSlide: { x: 1, y: -1 } }, // Leads to Data Viz
          { text: 'Wonder', nextSlide: { x: 2, y: 0 } },    // Leads to Parallax
        ],
      },
    },
  },
  '-2,0': {
    id: 'game_pope_1',
    type: 'game',
    x: -2, y: 0,
    userId: 'pope_dev', username: 'DivineGames', avatar: 'https://i.pravatar.cc/150?u=pope',
    access: 'public', createdAt: Date.now(), initialLikes: 2137, isLiked: true, initialComments: 420,
    data: {
      description: 'Be nice. Or not. Your choice.',
    },
  },
  '1,-1': {
    id: 'data_viz_1',
    type: 'html',
    x: 1, y: -1,
    userId: 'data_scientist', username: 'Dr. Charts', avatar: 'https://i.pravatar.cc/150?u=charts',
    access: 'public', createdAt: Date.now(), initialLikes: 789, isLiked: false, initialComments: 5,
    data: {
      type: 'DATA_VIZ',
      description: 'The data behind the curtain.',
      videoUrl: 'https://vod-progressive.pexels.com/video/854386/free-video-854386.mp4',
      posterUrl: 'https://images.pexels.com/videos/854386/free-video-854386.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '2,0': {
    id: 'parallax_1',
    type: 'html',
    x: 2, y: 0,
    userId: 'artist', username: 'VisualDreamer', avatar: 'https://i.pravatar.cc/150?u=dreamer',
    access: 'public', createdAt: Date.now(), initialLikes: 404, isLiked: false, initialComments: 12,
    data: {
      type: 'PARALLAX',
      description: 'A journey through layers of reality.',
      videoUrl: '',
      posterUrl: 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
  },
  '-1,0': {
    id: 'video_mock_meme',
    type: 'video',
    userId: 'user_mock_ai',
    username: 'JulesTheAI',
    avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 2048,
    isLiked: false,
    initialComments: 256,
    x: -1,
    y: 0,
    data: {
      description: 'Jak powstają memy? Krótki film instruktażowy. (-1,0)',
      mp4Url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
      hlsUrl: null,
      poster: 'https://i.imgflip.com/2fm6x.jpg',
    },
  },
  '-1,1': {
    id: 'game_mock_flappy',
    type: 'game',
    userId: 'user_mock_ai',
    username: 'JulesTheAI',
    avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 9999,
    isLiked: true,
    initialComments: 512,
    x: -1,
    y: 1,
    data: {
      description: 'Zagraj w Flappy Div! (-1,1)',
    },
  },
  '1,1': {
    id: 'pope_game_1',
    type: 'html',
    x: 1, y: 1,
    userId: 'pope_dev', username: 'DivineGames', avatar: 'https://i.pravatar.cc/150?u=pope',
    access: 'public', createdAt: Date.now(), initialLikes: 2137, isLiked: true, initialComments: 420,
    data: {
      type: 'GAME_POPE',
      description: 'Be nice. Or not. Your choice.',
      gameData: {
        scenarios: [
          { text: "A child spills ice cream on your new shoes. What do you do?", choices: { dopyskuj: "Sigh loudly", powiedz_milo: "Smile warmly" } },
          { text: "A pigeon lands on your head during a sermon.", choices: { dopyskuj: "Shoo it away angrily", powiedz_milo: "Offer it a blessing" } },
        ],
        bossFight: { text: "A tourist asks if you know the 'Macarena'.", choices: { dopyskuj: "Stare in silence", powiedz_milo: "Begin dancing" } },
      },
    },
  },
  '2,1': {
    id: 'poll_1',
    type: 'html',
    x: 2, y: 1,
    userId: 'pollster', username: 'DataCollector', avatar: 'https://i.pravatar.cc/150?u=poll',
    access: 'public', createdAt: Date.now(), initialLikes: 50, isLiked: false, initialComments: 30,
    data: {
      type: 'POLL',
      description: 'Your opinion matters to us (maybe).',
      pollData: {
        question: 'What is the best type of web content?',
        options: ['Funny Videos', 'Absurd Games', 'Interactive Stories'],
      },
    },
  },
  // --- My Creative Slides ---
  '2,-1': {
    id: 'creative_quiz_1',
    type: 'html',
    x: 2, y: -1,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=jules_creative',
    access: 'public', createdAt: Date.now(), initialLikes: 42, isLiked: false, initialComments: 13,
    data: {
      type: 'QUIZ',
      description: 'A quiz from your friendly AI assistant!',
      quizData: {
        question: 'Which programming paradigm is superior?',
        answers: [
          { text: 'Object-Oriented', nextSlide: { x: 2, y: -2 } },
          { text: 'Functional', nextSlide: { x: 3, y: -1 } },
          { text: 'Procedural', nextSlide: { x: 2, y: -2 } },
        ],
      },
    },
  },
  '-1,-1': {
    id: 'creative_story_1',
    type: 'html',
    x: -1, y: -1,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=jules_creative',
    access: 'public', createdAt: Date.now(), initialLikes: 88, isLiked: true, initialComments: 22,
    data: {
      type: 'STORY',
      description: 'A choice for the brave.',
      storyData: {
        text: 'You find a dusty old server rack in a forgotten corner of the internet. It whirs softly. A single terminal glows with a question: "Reboot the old web, or build the new one?"',
        choices: [
          { text: 'Reboot (Legacy Mode)', nextSlide: { x: -2, y: -1 } },
          { text: 'Build (Future Mode)', nextSlide: { x: -1, y: -2 } },
        ],
      },
    },
  },
  // --- Moved original slides ---
  '1,-2': {
    id: 'company_pitch_1',
    type: 'html',
    x: 1, y: -2,
    userId: 'corp_user', username: 'TheCorporation', avatar: 'https://i.pravatar.cc/150?u=corp',
    access: 'public', createdAt: Date.now(), initialLikes: 2024, isLiked: false, initialComments: 10,
    data: {
      type: 'COMPANY_PITCH',
      description: "Welcome to Our Labyrinth! Choose a door.",
    },
  },
  '2,-2': {
    id: 'typing_challenge_1',
    type: 'html',
    x: 2, y: -2,
    userId: 'user_typing', username: 'SpeedyKeys', avatar: 'https://i.pravatar.cc/150?u=speedy',
    access: 'public', createdAt: Date.now(), initialLikes: 1337, isLiked: false, initialComments: 88,
    data: {
      type: 'TYPING_CHALLENGE',
      description: 'Prove your worth, typist!',
      challengeData: {
        phrases: [
          'The labyrinth is full of secrets.',
          'Navigate wisely through the digital corridors.',
          'Every choice leads to a new discovery.',
        ],
        titles: {
          slow: 'Cautious Explorer',
          average: 'Adept Navigator',
          fast: 'Labyrinth Runner',
          insane: 'Master of the Maze',
        },
      },
    },
  },
};
