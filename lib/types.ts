import { JWTPayload } from 'jose';

export interface UserPayload extends JWTPayload {
  user: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
}
