import React from 'react';
import { Clock, CalendarDays, ExternalLink, Check, Plus, Users, Edit2 } from 'lucide-react';
import { Tour } from '../types';
import Button from './Button';

interface TourCardProps {
  tour: Tour;
  onViewGroup?: (tripId: string) => void;
  // New props for user selection
  isUserView?: boolean;
  attendanceCount?: number; // Number of people going
  totalMembers?: number; // Total people in group
  onOpenAttendance?: (tour: Tour) => void;
}

const TourCard: React.FC<TourCardProps> = ({ 
  tour, 
  onViewGroup, 
  isUserView, 
  attendanceCount = 0,
  totalMembers = 0,
  onOpenAttendance 
}) => {
  const isSelected = attendanceCount > 0;
  const isPartial = attendanceCount > 0 && attendanceCount < totalMembers;
  const totalValue = tour.price * attendanceCount;

  return (
    <div className={`bg-white rounded-custom border overflow-hidden transition-all duration-300 flex flex-col h-full group
      ${isSelected 
        ? 'border-primary ring-1 ring-primary shadow-md' 
        : 'border-border hover:shadow-lg hover:border-primary-light'
      }
    `}>
      {/* Image Area */}
      {tour.imageUrl ? (
        <div className="w-full h-48 overflow-hidden relative">
          <img 
            src={tour.imageUrl} 
            alt={tour.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold text-primary shadow-sm border border-border/50">
            R$ {tour.price.toFixed(2)}
          </div>
          {isSelected && (
            <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 ${isPartial ? 'bg-status-warning text-white' : 'bg-status-success text-white'}`}>
              <Check size={12} strokeWidth={3} />
              {isPartial ? 'PARCIAL' : 'CONFIRMADO'}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-48 bg-surface flex items-center justify-center border-b border-border relative">
          <span className="text-text-disabled">Sem imagem</span>
           <div className="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-bold text-primary shadow-sm border border-border">
            R$ {tour.price.toFixed(2)}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-text-primary text-lg line-clamp-1 group-hover:text-primary transition-colors" title={tour.name}>
            {tour.name}
          </h4>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-flex items-center text-xs font-medium text-text-secondary bg-surface px-2.5 py-1 rounded-md border border-border/50">
            <CalendarDays size={14} className="mr-1.5 text-primary" />
            {new Date(tour.date).toLocaleDateString()}
          </div>
          <div className="inline-flex items-center text-xs font-medium text-text-secondary bg-surface px-2.5 py-1 rounded-md border border-border/50">
            <Clock size={14} className="mr-1.5 text-primary" />
            {tour.time}
          </div>
        </div>

        {/* External Links Chips */}
        {tour.links && tour.links.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tour.links.map((link, idx) => (
              <a 
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-full border border-primary/20 transition-colors"
                title={link.url}
              >
                {link.title}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        )}
        
        <p className="text-sm text-text-secondary mb-6 line-clamp-2">
          {tour.description}
        </p>
        
        {isSelected && isUserView && (
          <div className="mt-auto mb-4 p-3 bg-surface rounded-xl border border-border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Total Confirmado</span>
               <span className="text-xs font-medium text-text-primary">{attendanceCount} pessoa{attendanceCount !== 1 ? 's' : ''}</span>
             </div>
             <span className="font-bold text-primary text-lg">
               R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
          </div>
        )}
        
        <div className={`flex gap-3 pt-4 border-t border-surface ${!isSelected ? 'mt-auto' : ''}`}>
          {isUserView ? (
             <button
                onClick={() => onOpenAttendance && onOpenAttendance(tour)}
                className={`
                   w-full h-11 rounded-custom font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200
                   ${isSelected 
                      ? 'bg-white text-text-primary border border-border hover:bg-surface hover:text-primary hover:border-primary/30' 
                      : 'bg-primary text-white hover:bg-primary-hover shadow-sm active:transform active:scale-[0.98]'
                   }
                `}
             >
                {isSelected ? (
                   <>
                     <Edit2 size={16} />
                     Editar Presença
                   </>
                ) : (
                   <>
                     <Plus size={18} />
                     Confirmar Presença
                   </>
                )}
             </button>
          ) : (
             // Admin Actions
             <>
               <Button variant="outline" className="h-9 text-xs flex-1">
                 Editar
               </Button>
               <Button 
                 className="h-9 text-xs flex-1"
                 onClick={() => onViewGroup?.(tour.tripId)}
               >
                 <Users size={14} className="mr-2" />
                 Visualizar Grupo
               </Button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCard;