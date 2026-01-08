import { Trip, Tour, Group } from './types';

export const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    name: 'Gramado - Inverno 2024',
    destination: 'Gramado, RS',
    startDate: '2024-07-20',
    endDate: '2024-07-25',
    description: 'Uma experiência inesquecível na Serra Gaúcha, com foco em gastronomia e paisagens de inverno.',
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1517502126830-4e5a95393439?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Expedição Jalapão',
    destination: 'Mateiros, TO',
    startDate: '2024-09-10',
    endDate: '2024-09-15',
    description: 'Aventura pelos fervedouros e dunas do parque estadual do Jalapão.',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1627918833979-846200222db2?q=80&w=800&auto=format&fit=crop'
  }
];

export const MOCK_TOURS: Tour[] = [
  {
    id: '101',
    tripId: '1',
    name: 'Tour Gramado e Canela',
    date: '2024-07-21',
    time: '08:00',
    price: 150.00,
    description: 'City tour completo visitando os principais pontos turísticos das duas cidades.',
    imageUrl: 'https://images.unsplash.com/photo-1613589635703-a442145c2560?q=80&w=400&auto=format&fit=crop',
    links: [
      { title: 'Roteiro PDF', url: '#' },
      { title: 'Restaurante Almoço', url: '#' }
    ]
  },
  {
    id: '102',
    tripId: '1',
    name: 'Noite Suíça (Fondue)',
    date: '2024-07-22',
    time: '20:00',
    price: 120.00,
    description: 'Sequência de fondue de queijo, carne e chocolate em restaurante tradicional.',
    imageUrl: 'https://images.unsplash.com/photo-1529566164286-90e9603080f7?q=80&w=400&auto=format&fit=crop',
    links: [
      { title: 'Cardápio Digital', url: '#' }
    ]
  },
  {
    id: '201',
    tripId: '2',
    name: 'Fervedouro Bela Vista',
    date: '2024-09-11',
    time: '09:00',
    price: 80.00,
    description: 'Visita ao maior e mais belo fervedouro do Jalapão.',
    imageUrl: 'https://images.unsplash.com/photo-1544665489-02c38d6df02e?q=80&w=400&auto=format&fit=crop'
  }
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    tripId: '1',
    name: 'Família Silva',
    membersCount: 4,
    members: ['Roberto Silva', 'Maria Silva', 'Pedro Silva', 'Ana Silva'],
    leaderName: 'Roberto Silva',
    leaderEmail: 'roberto@email.com',
    tourAttendance: {
      '101': ['Roberto Silva', 'Maria Silva', 'Pedro Silva', 'Ana Silva'] // Todos vão
    }
  },
  {
    id: 'g2',
    tripId: '1',
    name: 'Grupo Amigos do Sul',
    membersCount: 5,
    members: ['Ana Paula', 'Carlos Souza', 'Fernanda Lima', 'João Vitor', 'Beatriz Costa'],
    leaderName: 'Ana Paula',
    tourAttendance: {}
  },
  {
    id: 'g3',
    tripId: '2',
    name: 'Casal aventureiro',
    membersCount: 2,
    members: ['Carlos Mendes', 'Juliana Mendes'],
    leaderName: 'Carlos Mendes',
    tourAttendance: {}
  }
];