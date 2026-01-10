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
  tags?: string[]; // Tags/categorias do passeio (ex: Restaurante, Passeios, Shows, etc.)
}

export interface TourAttendanceInfo {
  members: string[]; // Array of Member Names who are attending
  customDate?: string | null; // Data personalizada (null = data original do tour)
}

export interface Group {
  id: string;
  tripId: string;
  name: string;
  membersCount: number;
  members: string[]; // List of member names
  leaderName: string;
  leaderEmail?: string;
  leaderPhone?: string;
  // Key: TourID, Value: AttendanceInfo (members + customDate)
  tourAttendance?: Record<string, TourAttendanceInfo | string[]>; // Compatível com versão antiga (apenas string[])
}

export type UserRole = 'admin' | 'user';