import React from 'react';
import { MapPin, Clock, Baby, Heart, AlertTriangle, ArrowRight, Info } from 'lucide-react';

interface CityInfo {
  name: string;
  distance: string;
  time: string;
  whyWorthIt: string[];
  idealFor: string;
  recommendation: 'high' | 'medium' | 'low'; // 🟢 🟡 🔴
  category: 'children' | 'elderly' | 'caution';
}

const citiesData: Record<string, CityInfo[]> = {
  children: [
    {
      name: 'Canela',
      distance: '~7 km',
      time: '10–15 min',
      whyWorthIt: [
        'Parques temáticos (Bondinhos Aéreos, Alpen Park, Mundo a Vapor)',
        'Deslocamento curtíssimo',
        'Restaurantes familiares e boa infraestrutura'
      ],
      idealFor: 'Ideal para meio período ou dia inteiro',
      recommendation: 'high',
      category: 'children'
    },
    {
      name: 'Nova Petrópolis',
      distance: '~35 km',
      time: '45–50 min',
      whyWorthIt: [
        'Praça com playground grande e seguro',
        'Parque Aldeia do Imigrante (espaço aberto, educativo)',
        'Clima tranquilo, sem correria'
      ],
      idealFor: 'Ótimo para crianças pequenas',
      recommendation: 'high',
      category: 'children'
    },
    {
      name: 'São Francisco de Paula',
      distance: '~45 km',
      time: '~1h',
      whyWorthIt: [
        'Lago São Bernardo (caminhada leve, pedalinho)',
        'Contato com natureza'
      ],
      idealFor: 'Bom para crianças um pouco maiores',
      recommendation: 'medium',
      category: 'children'
    }
  ],
  elderly: [
    {
      name: 'Canela',
      distance: '~7 km',
      time: '10–15 min',
      whyWorthIt: [
        'Fácil locomoção',
        'Cafés, igrejas, passeios contemplativos',
        'Pode ser feito sem pressa'
      ],
      idealFor: 'Excelente para qualquer idade',
      recommendation: 'high',
      category: 'elderly'
    },
    {
      name: 'Nova Petrópolis',
      distance: '~35 km',
      time: '45–50 min',
      whyWorthIt: [
        'Cidade plana e organizada',
        'Bancos, cafés, restaurantes acessíveis',
        'Ritmo calmo'
      ],
      idealFor: 'Uma das melhores opções para idosos',
      recommendation: 'high',
      category: 'elderly'
    },
    {
      name: 'Bento Gonçalves',
      distance: '~120 km',
      time: '2h–2h30',
      whyWorthIt: [
        'Vinícolas com boa estrutura',
        'Passeio de Maria-Fumaça (confortável)'
      ],
      idealFor: 'Indicado se o idoso gostar de vinho e não se cansar com estrada',
      recommendation: 'medium',
      category: 'elderly'
    }
  ],
  caution: [
    {
      name: 'Cambará do Sul',
      distance: '~',
      time: '~',
      whyWorthIt: [
        'Estradas longas',
        'Trilhas e caminhadas longas',
        'Clima imprevisível'
      ],
      idealFor: 'Melhor para adultos ativos',
      recommendation: 'low',
      category: 'caution'
    }
  ]
};

const CityGuide: React.FC = () => {
  const getRecommendationColor = (rec: 'high' | 'medium' | 'low') => {
    switch (rec) {
      case 'high':
        return 'bg-status-success text-white';
      case 'medium':
        return 'bg-status-warning text-white';
      case 'low':
        return 'bg-status-error text-white';
    }
  };

  const getRecommendationIcon = (rec: 'high' | 'medium' | 'low') => {
    switch (rec) {
      case 'high':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔴';
    }
  };

    const CityCard: React.FC<{ city: CityInfo }> = ({ city }) => {
    return (
      <div className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getRecommendationColor(city.recommendation)} flex items-center justify-center text-lg font-bold`}>
              {getRecommendationIcon(city.recommendation)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">{city.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {city.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {city.time}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-text-primary mb-2">Por que vale a pena:</h4>
          <ul className="space-y-2">
            {city.whyWorthIt.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-primary mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {city.recommendation === 'medium' && (
          <div className="mb-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-warning font-medium">
                {city.category === 'elderly' ? 'Viagem mais longa, não ideal para todos' : 'Menos atrações infantis estruturadas'}
              </p>
            </div>
          </div>
        )}

        {city.recommendation === 'low' && (
          <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-error font-medium">
                Exige mais cuidado e preparo físico
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <ArrowRight size={16} className="text-primary" />
            <span className="font-medium">{city.idealFor}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          Guia de Cidades Próximas
        </h1>
        <p className="text-text-secondary">
          Dicas e recomendações para explorar as cidades ao redor de Gramado
        </p>
      </div>

      {/* Seção: Melhores opções para crianças */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Baby size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Melhores opções para ir com crianças
            </h2>
            <p className="text-sm text-text-secondary">
              Cidades com atrações e infraestrutura adequadas para famílias
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {citiesData.children.map((city, idx) => (
            <CityCard key={idx} city={city} />
          ))}
        </div>
      </div>

      {/* Seção: Melhores opções para idosos */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Melhores opções para ir com idosos
            </h2>
            <p className="text-sm text-text-secondary">
              Destinos com acessibilidade e ritmo adequado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {citiesData.elderly.map((city, idx) => (
            <CityCard key={idx} city={city} />
          ))}
        </div>
      </div>

      {/* Seção: Cidades que exigem cuidado */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-status-error/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-status-error" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Cidades que exigem mais cuidado
            </h2>
            <p className="text-sm text-text-secondary">
              Destinos que requerem mais preparo físico ou atenção especial
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {citiesData.caution.map((city, idx) => (
            <CityCard key={idx} city={city} />
          ))}
        </div>
      </div>

      {/* Informação adicional */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Dicas importantes</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Considere o tempo de deslocamento ao planejar o dia</li>
              <li>• Verifique as condições climáticas antes de sair</li>
              <li>• Algumas atrações podem ter horários específicos - confirme antes</li>
              <li>• Para idosos e crianças, priorize destinos mais próximos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityGuide;
