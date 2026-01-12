import React from 'react';
import { MapPin, Clock, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';

interface CityInfo {
  name: string;
  distance: string;
  time: string;
  whyWorthIt: string[];
  idealFor: string;
  recommendation: 'high' | 'medium' | 'low';
  warning?: string;
}

const DestinosGuide: React.FC = () => {
  const childrenCities: CityInfo[] = [
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
      recommendation: 'high'
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
      recommendation: 'high'
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
      warning: 'Menos atrações infantis estruturadas'
    }
  ];

  const elderlyCities: CityInfo[] = [
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
      recommendation: 'high'
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
      recommendation: 'high'
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
      warning: 'Viagem mais longa, não ideal para todos'
    }
  ];

  const cautionCities: CityInfo[] = [
    {
      name: 'Cambará do Sul',
      distance: '~90 km',
      time: '~1h30',
      whyWorthIt: [
        'Estradas longas',
        'Trilhas e caminhadas longas',
        'Clima imprevisível'
      ],
      idealFor: 'Melhor para adultos ativos',
      recommendation: 'low'
    }
  ];

  const getRecommendationBadge = (rec: 'high' | 'medium' | 'low') => {
    switch (rec) {
      case 'high':
        return {
          icon: '🟢',
          label: 'Altamente Recomendado',
          bgColor: 'bg-status-success/10',
          textColor: 'text-status-success',
          borderColor: 'border-status-success/30'
        };
      case 'medium':
        return {
          icon: '🟡',
          label: 'Recomendado com Cuidado',
          bgColor: 'bg-status-warning/10',
          textColor: 'text-status-warning',
          borderColor: 'border-status-warning/30'
        };
      case 'low':
        return {
          icon: '🔴',
          label: 'Requer Atenção',
          bgColor: 'bg-status-error/10',
          textColor: 'text-status-error',
          borderColor: 'border-status-error/30'
        };
    }
  };

  const CityCard: React.FC<{ city: CityInfo }> = ({ city }) => {
    const badge = getRecommendationBadge(city.recommendation);

    return (
      <div className="bg-white rounded-custom border border-border p-4 sm:p-6 hover:shadow-lg hover:border-primary-light transition-all duration-300">
        {/* Badge de Recomendação */}
        <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg ${badge.bgColor} ${badge.borderColor} border mb-3 sm:mb-4`}>
          <span className="text-sm sm:text-base">{badge.icon}</span>
          <span className={`text-[10px] sm:text-xs font-semibold ${badge.textColor} leading-tight`}>{badge.label}</span>
        </div>

        {/* Nome da Cidade */}
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">{city.name}</h3>
        
        {/* Distância e Tempo */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="bg-surface p-2.5 sm:p-3 rounded-custom border border-border">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <MapPin size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase">Distância</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-text-primary">{city.distance}</p>
          </div>
          <div className="bg-surface p-2.5 sm:p-3 rounded-custom border border-border">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Clock size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase">Tempo</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-text-primary">{city.time}</p>
          </div>
        </div>

        {/* Por que vale a pena */}
        <div className="mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-2 sm:mb-3">Por que vale a pena:</h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {city.whyWorthIt.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircle size={14} className="sm:w-4 sm:h-4 text-status-success flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Aviso se houver */}
        {city.warning && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-status-warning/10 border border-status-warning/30 rounded-custom">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-status-warning flex-shrink-0 mt-0.5" />
              <p className="text-[10px] sm:text-xs text-status-warning font-medium leading-relaxed">{city.warning}</p>
            </div>
          </div>
        )}

        {/* Ideal para */}
        <div className="pt-3 sm:pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-primary bg-surface p-2.5 sm:p-3 rounded-custom">
            <ArrowRight size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="font-medium leading-relaxed">{city.idealFor}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Guia de Destinos</h1>
          </div>
          <p className="text-text-secondary text-sm sm:text-base max-w-2xl">
            Descubra as melhores cidades próximas a Gramado, com recomendações personalizadas para sua família
          </p>
        </div>

        {/* Children Section */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-br from-primary/5 via-surface/30 to-primary/5 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-5 sm:mb-6 pb-4 border-b border-primary/10">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Melhores opções para ir com crianças</h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">Destinos com atrações e infraestrutura adequadas para famílias</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {childrenCities.map((city, idx) => (
              <CityCard key={idx} city={city} />
            ))}
          </div>
        </div>

        {/* Elderly Section */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-br from-primary/5 via-surface/30 to-primary/5 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-5 sm:mb-6 pb-4 border-b border-primary/10">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Melhores opções para ir com idosos</h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">Destinos com acessibilidade e ritmo adequado</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {elderlyCities.map((city, idx) => (
              <CityCard key={idx} city={city} />
            ))}
          </div>
        </div>

        {/* Caution Section */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-br from-status-warning/5 via-surface/30 to-status-warning/5 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-status-warning/20 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-5 sm:mb-6 pb-4 border-b border-status-warning/10">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Cidades que exigem mais cuidado</h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">Destinos que requerem mais preparo físico ou atenção especial</p>
          </div>
          
          {/* Info Box */}
          <div className="bg-status-warning/10 border border-status-warning/30 rounded-custom p-4 sm:p-5 mb-5 sm:mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-status-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="sm:w-5 sm:h-5 text-status-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-text-primary mb-2 text-sm sm:text-base">Atenção especial necessária</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Estes destinos podem ser desafiadores para alguns grupos. Avalie bem antes de incluir no roteiro.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cautionCities.map((city, idx) => (
              <CityCard key={idx} city={city} />
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gradient-to-br from-surface via-white to-surface rounded-xl sm:rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm">
          <div>
            <h3 className="font-semibold text-text-primary mb-4 text-base sm:text-lg pb-3 border-b border-border/50">Dicas importantes</h3>
              <ul className="space-y-3 text-sm sm:text-base text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">•</span>
                  </div>
                  <span className="leading-relaxed">Considere a distância e tempo de viagem ao planejar o dia</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">•</span>
                  </div>
                  <span className="leading-relaxed">Verifique as condições climáticas antes de sair</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">•</span>
                  </div>
                  <span className="leading-relaxed">Algumas atrações podem ter horários específicos - confirme antes</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">•</span>
                  </div>
                  <span className="leading-relaxed">Para idosos e crianças, priorize destinos mais próximos</span>
                </li>
              </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinosGuide;
