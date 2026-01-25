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

export interface TourPrice {
  value: number;
  description?: string; // Descrição sobre idade, condições, etc.
  originalValue?: number; // Valor original antes do desconto
  discountPercent?: number; // Porcentagem de desconto (0-100)
  hasDiscount?: boolean; // Se tem desconto aplicado
}

export interface TourPrices {
  inteira?: TourPrice; // Ingresso Inteira
  meia?: TourPrice; // Meia Entrada
  senior?: TourPrice; // Ingresso Sênior
}

export interface Tour {
  id: string;
  tripId: string;
  name: string;
  date: string;
  time: string;
  price: number; // Preço padrão (mantido para compatibilidade)
  prices?: TourPrices; // Preços por tipo de ingresso
  description: string;
  observations?: string; // Observações em destaque
  imageUrl?: string;
  links?: TourLink[];
  tags?: string[]; // Tags/categorias do passeio (ex: Restaurante, Passeios, Shows, etc.)
  address?: string; // Endereço completo do passeio
  paymentMethod?: 'guide' | 'website' | 'free'; // Forma de pagamento: direto à guia, no site ou gratuito
  paymentWebsiteUrl?: string; // URL do site de pagamento (quando paymentMethod = 'website')
}

export interface TourAttendanceInfo {
  members: string[]; // Array of Member Names who are attending
  customDate?: string | null; // Data personalizada (null = data original do tour)
  customTime?: string | null; // Horário personalizado (null = horário original do tour)
  selectedPriceKey?: string; // Chave do tipo de ingresso selecionado (ex: "inteira", "meia", "price_0", etc.) - DEPRECATED
  priceQuantities?: Record<string, number>; // Quantidade de cada tipo de ingresso (ex: { "adulto": 2, "crianca": 3 })
  isPaid?: boolean;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  documentUrls?: string[]; // Array de URLs dos comprovantes
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
  leaderPassword?: string; // Senha hasheada do responsável
  passwordChanged?: boolean; // Se já alterou a senha do primeiro acesso
  // Key: TourID, Value: AttendanceInfo (members + customDate)
  tourAttendance?: Record<string, TourAttendanceInfo | string[]>; // Compatível com versão antiga (apenas string[])
}

export type UserRole = 'admin' | 'user';

export interface UserTravelInfo {
  id?: string;
  groupId: string;
  
  // Dados do Hotel
  hotelName?: string;
  hotelAddress?: string;
  hotelCheckin?: string;
  hotelCheckout?: string;
  hotelPhone?: string;
  hotelConfirmationCode?: string;
  hotelNotes?: string;
  
  // Dados do Voo
  flightCompany?: string;
  flightNumber?: string;
  flightDepartureDate?: string;
  flightDepartureTime?: string;
  flightDepartureAirport?: string;
  flightArrivalDate?: string;
  flightArrivalTime?: string;
  flightArrivalAirport?: string;
  flightConfirmationCode?: string;
  flightNotes?: string;
  
  // Dados do Aluguel de Carro
  carRentalCompany?: string;
  carRentalPickupDate?: string;
  carRentalPickupTime?: string;
  carRentalPickupLocation?: string;
  carRentalReturnDate?: string;
  carRentalReturnTime?: string;
  carRentalReturnLocation?: string;
  carRentalConfirmationCode?: string;
  carRentalNotes?: string;
  
  // Dados Pessoais
  personalName?: string;
  personalEmail?: string;
  personalPhone?: string;
  personalDocument?: string;
  personalEmergencyContact?: string;
  personalEmergencyPhone?: string;
  personalNotes?: string;
}

export interface UserCustomTour {
  id: string;
  groupId: string;
  name: string;
  date: string;
  time: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  address?: string;
  location?: string; // Local/ponto de encontro
  createdAt?: string;
  updatedAt?: string;
}