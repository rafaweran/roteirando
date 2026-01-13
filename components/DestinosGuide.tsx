import React from 'react';
import { MapPin, Clock } from 'lucide-react';

interface CityInfo {
  name: string;
  distance: string;
  time: string;
}

interface DistanceCategory {
  title: string;
  cities: CityInfo[];
}

const DestinosGuide: React.FC = () => {
  const categories: DistanceCategory[] = [
    {
      title: 'Até 15 km (bem perto)',
      cities: [
        { name: 'Canela', distance: '~7 km', time: '10 a 15 min' },
        { name: 'Várzea Grande (bairro de Gramado)', distance: '~7 km', time: '15 min' }
      ]
    },
    {
      title: 'Até 50 km (bate-volta fácil)',
      cities: [
        { name: 'Três Coroas', distance: '~25 km', time: '35 a 40 min' },
        { name: 'Nova Petrópolis', distance: '~35 km', time: '45 a 50 min' },
        { name: 'Igrejinha', distance: '~40 km', time: '~1h' },
        { name: 'São Francisco de Paula', distance: '~45 km', time: '~1h' }
      ]
    },
    {
      title: 'Até 100 km (Região da Serra)',
      cities: [
        { name: 'Caxias do Sul', distance: '~70 km', time: '1h30' },
        { name: 'Farroupilha', distance: '~95 km', time: '1h45' },
        { name: 'Carlos Barbosa', distance: '~115 km', time: '~2h' },
        { name: 'Garibaldi', distance: '~110 km', time: '~2h' }
      ]
    },
    {
      title: 'Até 150 km (vinícolas e cânions)',
      cities: [
        { name: 'Bento Gonçalves', distance: '~120 km', time: '2h a 2h30' },
        { name: 'Cambará do Sul', distance: '~140 km', time: '2h30 a 3h' }
      ]
    },
    {
      title: 'Grandes centros',
      cities: [
        { name: 'Porto Alegre', distance: '~115 km', time: '2h a 2h30' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
            Áreas e cidades ao redor de Gramado
          </h1>
        </div>

        {/* Categories */}
        <div className="space-y-8 sm:space-y-10">
          {categories.map((category, categoryIdx) => (
            <div key={categoryIdx} className="bg-white rounded-xl sm:rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6 pb-3 border-b border-primary/10">
                {category.title}
              </h2>
              
              <ul className="space-y-3 sm:space-y-4">
                {category.cities.map((city, cityIdx) => (
                  <li key={cityIdx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                      <span className="font-semibold text-text-primary">{city.name}</span>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 text-text-secondary ml-4 sm:ml-0">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary flex-shrink-0" />
                        <span>{city.distance}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary flex-shrink-0" />
                        <span>{city.time}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinosGuide;
