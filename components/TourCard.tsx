import React from 'react';
import { Clock, CalendarDays, Check, Plus, Edit2, ListChecks, X, Eye } from 'lucide-react';
import { Tour, Group } from '../types';
import Button from './Button';
import { getAttendanceTotal } from '../lib/pricing';

interface TourCardProps {
  tour: Tour;
  onViewGroup?: (tripId: string) => void;
  // New props for user selection
  isUserView?: boolean;
  attendanceCount?: number; // Number of people going
  totalMembers?: number; // Total people in group
  userGroup?: Group;
  onOpenAttendance?: (tour: Tour) => void;
  onCancelTour?: (tour: Tour) => void;
  onViewAttendanceList?: (tour: Tour) => void;
  onViewTourDetail?: (tour: Tour) => void;
  onEditTour?: (tour: Tour) => void; // Admin: Edit tour
}

const TourCard: React.FC<TourCardProps> = ({ 
  tour, 
  onViewGroup, 
  isUserView, 
  attendanceCount = 0,
  totalMembers = 0,
  userGroup,
  onOpenAttendance,
  onCancelTour,
  onViewAttendanceList,
  onViewTourDetail,
  onEditTour
}) => {
  const isSelected = attendanceCount > 0;
  const isPartial = attendanceCount > 0 && attendanceCount < totalMembers;
  
  // Calcular valor total baseado nos preços múltiplos ou preço padrão
  const getDisplayPrice = () => {
    if (tour.prices) {
      // Se houver preços múltiplos, mostrar o menor e maior
      const prices = [
        tour.prices.inteira?.value,
        tour.prices.meia?.value,
        tour.prices.senior?.value
      ].filter(p => p !== undefined && p !== null) as number[];
      
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `R$ ${min.toFixed(2)}` : `R$ ${min.toFixed(2)} - R$ ${max.toFixed(2)}`;
      }
    }
    return `R$ ${tour.price.toFixed(2)}`;
  };

  const totalValue = getAttendanceTotal(tour, userGroup?.tourAttendance?.[tour.id] as any);

  const handleCardClick = () => {
    if (onViewTourDetail) {
      onViewTourDetail(tour);
    }
  };

  return (
    <div 
      className={`bg-white rounded-custom border overflow-hidden transition-all duration-300 flex flex-col h-full group cursor-pointer
        ${isSelected 
          ? 'border-primary ring-1 ring-primary shadow-md' 
          : 'border-border hover:shadow-lg hover:border-primary-light'
        }
      `}
      onClick={onViewTourDetail ? handleCardClick : undefined}
    >
      {/* Image Area */}
      {tour.imageUrl ? (
        <div className="w-full h-48 overflow-hidden relative">
          <img 
            src={tour.imageUrl} 
            alt={tour.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold text-primary shadow-sm border border-border/50">
            {getDisplayPrice()}
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
            {getDisplayPrice()}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Nome do Passeio */}
        <h4 className="font-bold text-text-primary text-base sm:text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors" title={tour.name}>
          {tour.name}
        </h4>
        
        {/* Data e Horário */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          <div className="inline-flex items-center text-[10px] sm:text-xs font-medium text-text-secondary bg-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-border/50">
            <CalendarDays size={12} className="sm:w-[14px] sm:h-[14px] mr-1 sm:mr-1.5 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">{new Date(tour.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
          <div className="inline-flex items-center text-[10px] sm:text-xs font-medium text-text-secondary bg-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-border/50">
            <Clock size={12} className="sm:w-[14px] sm:h-[14px] mr-1 sm:mr-1.5 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">{tour.time}</span>
          </div>
        </div>

        {/* Tags */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {tour.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {tag}
              </span>
            ))}
            {tour.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-surface text-text-secondary text-text-secondary border border-border/50">
                +{tour.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Descrição */}
        {tour.description && (
          <p className="text-xs sm:text-sm text-text-secondary mb-4 line-clamp-3 flex-1">
            {tour.description}
          </p>
        )}
        
        {/* Total Confirmado (apenas para usuários que confirmaram) */}
        {isSelected && isUserView && (
          <div className="mt-auto mb-3 p-2.5 sm:p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">Confirmado</span>
               <span className="text-xs font-medium text-text-primary">{attendanceCount} pessoa{attendanceCount !== 1 ? 's' : ''}</span>
             </div>
             <span className="font-bold text-primary text-base sm:text-lg">
               R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
          </div>
        )}
        
        {/* Ações */}
        <div 
          className={`flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-surface ${!isSelected ? 'mt-auto' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isUserView ? (
             <>
               {isSelected ? (
                 <>
                   <Button
                     variant="outline"
                     className="h-10 sm:h-11 text-xs sm:text-sm flex-1"
                     onClick={(e) => {
                       e.stopPropagation();
                       onViewTourDetail?.(tour);
                     }}
                   >
                     <Eye size={14} className="sm:w-4 sm:h-4 mr-1.5" />
                     <span className="hidden sm:inline">Ver Detalhes</span>
                     <span className="sm:hidden">Detalhes</span>
                   </Button>
                   <button
                     onClick={() => onCancelTour && onCancelTour(tour)}
                     className="flex-1 h-10 sm:h-11 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-white text-status-error border border-status-error/30 hover:bg-status-error/5 hover:border-status-error active:transform active:scale-[0.98]"
                   >
                     <X size={14} className="sm:w-4 sm:h-4" />
                     <span className="hidden sm:inline">Cancelar</span>
                     <span className="sm:hidden">Cancelar</span>
                   </button>
                 </>
               ) : (
                 <>
                   <Button
                     variant="outline"
                     className="h-10 sm:h-11 text-xs sm:text-sm flex-1"
                     onClick={(e) => {
                       e.stopPropagation();
                       onViewTourDetail?.(tour);
                     }}
                   >
                     <Eye size={14} className="sm:w-4 sm:h-4 mr-1.5" />
                     <span className="hidden sm:inline">Ver Detalhes</span>
                     <span className="sm:hidden">Detalhes</span>
                   </Button>
                   <button
                     onClick={() => onOpenAttendance && onOpenAttendance(tour)}
                     className="flex-1 h-10 sm:h-11 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-primary text-white hover:bg-primary-hover shadow-sm active:transform active:scale-[0.98]"
                   >
                     <Plus size={16} className="sm:w-5 sm:h-5" />
                     <span className="hidden sm:inline">Confirmar</span>
                     <span className="sm:hidden">Confirmar</span>
                   </button>
                 </>
               )}
             </>
          ) : (
             // Admin Actions
             <>
               <Button 
                 variant="outline" 
                 className="h-9 sm:h-10 text-xs flex-1"
                 onClick={(e) => {
                   e.stopPropagation();
                   onViewTourDetail?.(tour);
                 }}
               >
                 <Eye size={14} className="mr-1.5" />
                 Detalhes
               </Button>
               <Button 
                 variant="outline" 
                 className="h-9 sm:h-10 text-xs flex-1"
                 onClick={(e) => {
                   e.stopPropagation();
                   onEditTour?.(tour);
                 }}
               >
                 <Edit2 size={14} className="mr-1.5" />
                 Editar
               </Button>
               <Button 
                 className="h-9 sm:h-10 text-xs flex-1"
                 onClick={(e) => {
                   e.stopPropagation();
                   onViewAttendanceList?.(tour);
                 }}
               >
                 <ListChecks size={14} className="mr-1.5" />
                 Ver Lista
               </Button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCard;