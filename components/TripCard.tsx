import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onClick: (trip: Trip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'active': return 'bg-status-success text-white';
      case 'upcoming': return 'bg-primary-light text-white';
      case 'completed': return 'bg-text-disabled text-white';
    }
  };

  const getStatusLabel = (status: Trip['status']) => {
    switch (status) {
      case 'active': return 'Em andamento';
      case 'upcoming': return 'Próxima';
      case 'completed': return 'Finalizada';
    }
  };

  return (
    <div 
      className="group bg-white rounded-custom border border-border overflow-hidden hover:shadow-lg hover:border-primary-light transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => onClick(trip)}
    >
      <div className="h-40 w-full overflow-hidden relative">
        <img 
          src={trip.imageUrl} 
          alt={trip.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(trip.status)}`}>
            {getStatusLabel(trip.status)}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-1">{trip.name}</h3>
        
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center text-sm text-text-secondary">
            <MapPin size={16} className="mr-2 text-primary" />
            <span className="line-clamp-1">{trip.destination}</span>
          </div>
          <div className="flex items-center text-sm text-text-secondary">
            <Calendar size={16} className="mr-2 text-primary" />
            <span>{new Date(trip.startDate).toLocaleDateString('pt-BR')} - {new Date(trip.endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-surface mt-auto">
          <span className="text-sm font-medium text-text-secondary">Ver detalhes</span>
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCard;