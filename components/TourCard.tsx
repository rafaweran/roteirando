import React from 'react';
import { Clock, CalendarDays, Check, Plus, Edit2, ListChecks, X, Eye } from 'lucide-react';
import { Tour, Group } from '../types';
import Button from './Button';

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
  
  // Obter detalhes da confirmação se houver
  const attendance = userGroup?.tourAttendance?.[tour.id];
  let selectedPriceKey: string | undefined = undefined;
  let customDate: string | null = null;
  let customTime: string | null = null;
  let isPaid = false;

  if (attendance && typeof attendance === 'object' && !Array.isArray(attendance)) {
    selectedPriceKey = attendance.selectedPriceKey || undefined;
    customDate = attendance.customDate || null;
    customTime = attendance.customTime || null;
    isPaid = (attendance as any).isPaid || false;
  }

  // Calcular valor total baseado no tipo de ingresso selecionado
  const calculateTotalValue = () => {
    if (attendanceCount === 0) return 0;
    
    // Se houver preços dinâmicos e um tipo selecionado, usar esse preço
    if (tour.prices && selectedPriceKey) {
      let selectedPrice = tour.prices[selectedPriceKey as keyof typeof tour.prices];
      
      // Se não encontrar pela chave exata, tentar correspondência case-insensitive
      if (!selectedPrice && tour.prices) {
        const priceEntries = Object.entries(tour.prices);
        const matched = priceEntries.find(([key]) => key.toLowerCase() === selectedPriceKey?.toLowerCase());
        if (matched) {
          selectedPrice = matched[1] as any;
        }
      }
      
      if (selectedPrice && selectedPrice.value !== undefined) {
        return attendanceCount * selectedPrice.value;
      }
    }
    
    // Caso contrário, usar preço padrão
    return attendanceCount * tour.price;
  };

  const totalValue = calculateTotalValue();

  // Obter descrição do tipo de ingresso selecionado
  const getSelectedPriceDescription = () => {
    if (tour.prices && selectedPriceKey) {
      let selectedPrice = tour.prices[selectedPriceKey as keyof typeof tour.prices];
      
      if (!selectedPrice && tour.prices) {
        const priceEntries = Object.entries(tour.prices);
        const matched = priceEntries.find(([key]) => key.toLowerCase() === selectedPriceKey?.toLowerCase());
        if (matched) {
          selectedPrice = matched[1] as any;
        }
      }
      
      if (selectedPrice) {
        return selectedPrice.description || selectedPriceKey.charAt(0).toUpperCase() + selectedPriceKey.slice(1).replace(/_/g, ' ');
      }
    }
    return null;
  };

  const selectedPriceDescription = getSelectedPriceDescription();

  // Calcular valor para exibição (menor e maior preço disponível)
  const getDisplayPrice = () => {
    // Se for gratuito, mostrar "Gratuito"
    if (tour.paymentMethod === 'free') {
      return 'Gratuito';
    }
    
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
          <div className={`absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${
            tour.paymentMethod === 'free' 
              ? 'text-status-success border-status-success/30' 
              : 'text-primary border-border/50'
          }`}>
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
           <div className={`absolute top-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${
            tour.paymentMethod === 'free' 
              ? 'text-status-success border-status-success/30' 
              : 'text-primary border-border'
          }`}>
            {getDisplayPrice()}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Nome do Passeio */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="font-bold text-text-primary text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors flex-1" title={tour.name}>
            {tour.name}
          </h4>
          {isSelected && (
            isPaid ? (
              <span className="px-2 py-0.5 bg-status-success/10 text-status-success text-[10px] font-bold rounded-full uppercase tracking-wider flex-shrink-0 mt-1">
                Pago
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-status-error/10 text-status-error text-[10px] font-bold rounded-full uppercase tracking-wider flex-shrink-0 mt-1">
                Pendente
              </span>
            )
          )}
        </div>
        
        {/* Data e Horário */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          <div className={`inline-flex items-center text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border ${customDate && isUserView ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-text-secondary border-border/50'}`}>
            <CalendarDays size={12} className={`sm:w-[14px] sm:h-[14px] mr-1 sm:mr-1.5 flex-shrink-0 ${customDate && isUserView ? 'text-primary' : 'text-primary'}`} />
            <span className="whitespace-nowrap">{(customDate && isUserView) ? new Date(customDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : new Date(tour.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
          <div className={`inline-flex items-center text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border ${customTime && isUserView ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-text-secondary border-border/50'}`}>
            <Clock size={12} className={`sm:w-[14px] sm:h-[14px] mr-1 sm:mr-1.5 flex-shrink-0 ${customTime && isUserView ? 'text-primary' : 'text-primary'}`} />
            <span className="whitespace-nowrap">{(customTime && isUserView) ? customTime : tour.time}</span>
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
          <div className="mt-auto mb-3 p-2.5 sm:p-3 bg-primary/5 rounded-lg border border-primary/20">
             <div className="flex items-center justify-between mb-1.5">
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">Confirmado</span>
                 <span className="text-xs font-medium text-text-primary">{attendanceCount} pessoa{attendanceCount !== 1 ? 's' : ''}</span>
               </div>
               <span className={`font-bold text-base sm:text-lg ${
                 tour.paymentMethod === 'free' ? 'text-status-success' : 'text-primary'
               }`}>
                 {tour.paymentMethod === 'free' ? 'Gratuito' : `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
               </span>
             </div>
             {selectedPriceDescription && (
               <div className="pt-1.5 border-t border-primary/10">
                 <span className="text-[9px] uppercase tracking-wider font-bold text-text-secondary block mb-0.5">Ingresso Selecionado:</span>
                 <span className="text-[11px] font-medium text-text-primary leading-tight line-clamp-1">{selectedPriceDescription}</span>
               </div>
             )}
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