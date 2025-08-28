export type Comment = {
  id: number;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
};

export const mockCommentsData: Comment[] = [
  {
    id: 1,
    user: 'Paweł Polutek',
    avatar: 'https://i.pravatar.cc/100?u=pawel',
    text: 'Świetny filmik! Naprawdę mi się podoba.',
    likes: 15,
    isLiked: false,
    replies: [
      {
        id: 3,
        user: 'Web Dev',
        avatar: 'https://i.pravatar.cc/100?u=webdev',
        text: 'Zgadzam się!',
        likes: 2,
        isLiked: true,
        replies: [],
      },
    ],
  },
  {
    id: 2,
    user: 'Tajemniczy Tester',
    avatar: 'https://i.pravatar.cc/100?u=tester',
    text: 'Niezłe, ale widziałem lepsze. #krytyk',
    likes: 3,
    isLiked: true,
    replies: [],
  },
];

export type Notification = {
  id: number;
  type: 'message' | 'profile' | 'offer';
  preview: string;
  time: string;
  full: string;
  unread: boolean;
  expanded: boolean;
};

export const mockNotificationsData: Notification[] = [
  { id: 1, type: 'message' as const, preview: 'New message from Admin', time: '2 mins ago', full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!', unread: true, expanded: false },
  { id: 2, type: 'profile' as const, preview: 'Your profile has been updated', time: '10 mins ago', full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.', unread: true, expanded: false },
  { id: 3, type: 'offer' as const, preview: 'A special offer is waiting for you!', time: '1 hour ago', full: 'Don\'t miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.', unread: false, expanded: false },
];
