import type { Grid, Slide } from './types';

// The Labyrinth - A more complex and interconnected grid of slides
export const mockGrid: Grid = {
  // 1. Start: The Company Pitch (Center of the first room)
  '0,0': {
    id: 'company_pitch_1',
    type: 'html',
    x: 0, y: 0,
    userId: 'corp_user', username: 'TheCorporation', avatar: 'https://i.pravatar.cc/150?u=corp',
    access: 'public', createdAt: Date.now(), initialLikes: 2024, isLiked: false, initialComments: 10,
    data: {
      type: 'COMPANY_PITCH',
      description: "Welcome to Our Labyrinth! Choose a door.",
    },
  },

  // 2. Down from Start: The Typing Challenge
  '0,1': {
    id: 'typing_challenge_1',
    type: 'html',
    x: 0, y: 1,
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

  // 3. Right from Start: The Quiz
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

  // 4. Up from Quiz: Data Visualization
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

  // 5. Right from Quiz: Parallax Experience
  '2,0': {
    id: 'parallax_1',
    type: 'html',
    x: 2, y: 0,
    userId: 'artist', username: 'VisualDreamer', avatar: 'https://i.pravatar.cc/150?u=dreamer',
    access: 'public', createdAt: Date.now(), initialLikes: 404, isLiked: false, initialComments: 12,
    data: {
      type: 'PARALLAX',
      description: 'A journey through layers of reality.',
      videoUrl: '', // Not needed for this implementation, using poster
      posterUrl: 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
  },

  // 6. Below Typing Challenge: A normal video as a reward
  '0,2': {
    id: 'video_reward_1',
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
      poster: 'https://i.imgflip.com/2fm6x.jpg', // Drake Hotline Bling meme poster
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

  // 7. Up from Start: The Story Branch
  '0,-1': {
    id: 'story_1',
    type: 'html',
    x: 0, y: -1,
    userId: 'story_teller', username: 'TheNarrator', avatar: 'https://i.pravatar.cc/150?u=narrator',
    access: 'public', createdAt: Date.now(), initialLikes: 300, isLiked: false, initialComments: 15,
    data: {
      type: 'STORY',
      description: 'A new path unfolds...',
      storyData: {
        text: 'You stand at a crossroads in the digital maze. To the left, a path hums with ancient data streams. To the right, a faint, rhythmic pulse suggests a hidden game.',
        choices: [
          { text: 'Follow the data streams', nextSlide: { x: -1, y: 0 } }, // Leads to Meme Video
          { text: 'Investigate the pulse', nextSlide: { x: 1, y: 1 } },    // Leads to Pope Game
        ],
      },
    },
  },

  // 8. Below Quiz: The Pope Game
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

  // 9. Right of Pope Game: The Poll
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
};
