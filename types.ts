export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  imageUrl: string;
  links?: TourLink[];
}

export interface TourLink {
  title: string;
  url: string;
}

export interface Tour {
  id: string;
  tripId: string;
  name: string;
  date: string;
  time: string;
  price: number;
  description: string;
  imageUrl?: string;
  links?: TourLink[];
}

export interface Group {
  id: string;
  tripId: string;
  name: string;
  membersCount: number;
  members: string[]; // List of member names
  leaderName: string;
  leaderEmail?: string;
  leaderPassword?: string; // Senha hasheada (não expor em produção)
  passwordChanged?: boolean; // Indica se o usuário já alterou a senha inicial
  // Key: TourID, Value: Array of Member Names who are attending
  tourAttendance?: Record<string, string[]>; 
}

export type UserRole = 'admin' | 'user';