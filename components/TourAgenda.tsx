import React, { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Button from './Button';
import { Tour, Trip, Group, TourAttendanceInfo } from '../types';

interface TourAgendaProps {
  tours: Tour[];
  trips: Trip[];
  userGroup: Group;
  onViewTourDetail?: (tour: Tour) => void;
  onAddCustomTour?: () => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TourAgenda: React.FC<TourAgendaProps> = ({ tours, trips, userGroup, onViewTourDetail, onAddCustomTour }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filtrar apenas passeios confirmados pelo grupo
  const confirmedTours = useMemo(() => {
    return tours
      .filter(tour => {
        const attendance = userGroup.tourAttendance?.[tour.id];
        // Compatibilidade: pode ser TourAttendanceInfo ou string[] (versão antiga)
        if (Array.isArray(attendance)) {
          return attendance.length > 0;
        } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
          return attendance.members && attendance.members.length > 0;
        }
        return false;
      })
      .map(tour => {
        const trip = trips.find(t => t.id === tour.tripId);
        const attendance = userGroup.tourAttendance?.[tour.id];
        
        // Compatibilidade: pode ser TourAttendanceInfo ou string[] (versão antiga)
        let members: string[] = [];
        let customDate: string | null = null;
        
        if (Array.isArray(attendance)) {
          members = attendance;
        } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
          members = attendance.members || [];
          customDate = attendance.customDate || null;
        }
        
        // Usar data personalizada se existir, senão usar data original do tour
        const displayDate = customDate || tour.date;
        
        return {
          ...tour,
          trip,
          attendanceCount: members.length,
          attendingMembers: members,
          customDate: customDate,
          displayDate: displayDate // Data que será exibida/agrupada
        };
      });
  }, [tours, trips, userGroup]);

  // Obter ano e mês do mês atual (ou do primeiro passeio se houver)
  const getCalendarMonthYear = () => {
    if (confirmedTours.length > 0) {
      const firstTourDate = new Date(confirmedTours[0].displayDate + 'T12:00:00');
      return {
        year: firstTourDate.getFullYear(),
        month: firstTourDate.getMonth()
      };
    }
    return {
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth()
    };
  };

  const { year, month } = getCalendarMonthYear();

  // Criar dias do calendário (20 a 25)
  const calendarDays = useMemo(() => {
    const days = [];
    for (let day = 20; day <= 25; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Buscar passeios para este dia
      const toursForDay = confirmedTours.filter(tour => {
        const tourDate = new Date(tour.displayDate + 'T12:00:00');
        return tourDate.getDate() === day && 
               tourDate.getMonth() === month && 
               tourDate.getFullYear() === year;
      });

      days.push({
        day,
        date,
        dateStr,
        tours: toursForDay,
        dayOfWeek: DAYS_OF_WEEK[date.getDay()]
      });
    }
    return days;
  }, [year, month, confirmedTours]);

  // Calcular total de passeios e valor
  const totalTours = confirmedTours.length;
  const totalValue = confirmedTours.reduce((sum, tour) => sum + (tour.price * tour.attendanceCount), 0);

  if (confirmedTours.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[24px] border border-border p-12 text-center">
          <Calendar size={64} className="mx-auto mb-4 text-text-disabled" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Nenhum passeio confirmado</h2>
          <p className="text-text-secondary">
            Você ainda não confirmou presença em nenhum passeio. Confirme sua presença nos passeios para vê-los aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Minha Agenda</h1>
          <p className="text-sm sm:text-base text-text-secondary">
            {totalTours} passeio{totalTours !== 1 ? 's' : ''} confirmado{totalTours !== 1 ? 's' : ''}
          </p>
        </div>
        {onAddCustomTour && (
          <Button
            onClick={onAddCustomTour}
            className="min-h-[44px] sm:h-[48px] px-4 sm:px-6 text-sm sm:text-base font-semibold whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" />
            Novo Passeio
          </Button>
        )}
      </div>

      {/* Calendário Visual */}
      <div className="bg-white rounded-xl sm:rounded-[24px] border border-border p-3 sm:p-6 mb-4 sm:mb-6 shadow-sm">
        {/* Cabeçalho do Calendário */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              {MONTHS[month]} {year}
            </h2>
          </div>

          {/* Cabeçalho dos Dias */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-2 sm:mb-3">
            {calendarDays.map((calendarDay) => (
              <div 
                key={calendarDay.day} 
                className="text-center text-[10px] sm:text-xs font-semibold text-text-secondary py-1.5 sm:py-2"
              >
                {calendarDay.dayOfWeek}
              </div>
            ))}
          </div>

          {/* Dias 20 a 25 */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {calendarDays.map((calendarDay) => {
              const hasTours = calendarDay.tours.length > 0;
              const isToday = new Date().toDateString() === calendarDay.date.toDateString();

              return (
                <div
                  key={calendarDay.day}
                  className={`
                    min-h-[100px] sm:min-h-[120px] rounded-lg sm:rounded-xl border-2 p-2 sm:p-3 transition-all duration-200
                    ${hasTours 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border bg-surface/30'
                    }
                    ${isToday && !hasTours ? 'border-primary/30 bg-primary/5' : ''}
                  `}
                >
                  {/* Número do Dia */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      text-lg font-bold
                      ${hasTours ? 'text-primary' : isToday ? 'text-primary' : 'text-text-secondary'}
                    `}>
                      {calendarDay.day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-medium text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Passeios do Dia */}
                  <div className="space-y-2 max-h-[80px] overflow-y-auto">
                    {calendarDay.tours.map((tour) => (
                      <div
                        key={tour.id}
                        onClick={() => onViewTourDetail && onViewTourDetail(tour)}
                        className={`
                          p-2 rounded-lg text-xs cursor-pointer transition-all duration-200
                          bg-white border border-primary/30 hover:bg-primary/10 hover:border-primary
                          ${onViewTourDetail ? 'hover:shadow-md' : ''}
                        `}
                      >
                        <div className="font-semibold text-text-primary line-clamp-1 mb-1">
                          {tour.name}
                        </div>
                        <div className="flex items-center gap-1 text-text-secondary">
                          <Clock size={10} className="text-primary" />
                          <span>{tour.time}</span>
                        </div>
                        {tour.customDate && (
                          <div className="text-[10px] text-primary mt-1 font-medium">
                            📅 Data personalizada
                          </div>
                        )}
                      </div>
                    ))}
                    {!hasTours && (
                      <div className="text-[10px] text-text-disabled text-center py-2">
                        Sem passeios
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhes dos Passeios por Dia */}
      {calendarDays.some(day => day.tours.length > 0) && (
        <div className="space-y-6">
          {calendarDays.map((calendarDay) => {
            if (calendarDay.tours.length === 0) return null;

            return (
              <div key={calendarDay.day} className="bg-white rounded-xl sm:rounded-[24px] border border-border overflow-hidden shadow-sm">
                {/* Data Header */}
                <div className="bg-primary/5 border-b border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-text-primary capitalize truncate">
                        {calendarDay.dayOfWeek}, {calendarDay.day} de {MONTHS[month]}
                      </h2>
                      <p className="text-xs sm:text-sm text-text-secondary">{year}</p>
                    </div>
                  </div>
                </div>

                {/* Passeios do Dia */}
                <div className="divide-y divide-border">
                  {calendarDay.tours.map((tour) => (
                    <div 
                      key={tour.id} 
                      className={`p-4 sm:p-6 hover:bg-surface/30 transition-colors ${onViewTourDetail ? 'cursor-pointer' : ''}`}
                      onClick={() => onViewTourDetail && onViewTourDetail(tour)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        {/* Imagem */}
                        {tour.imageUrl && (
                          <div className="w-full sm:w-32 h-32 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                            <img 
                              src={tour.imageUrl} 
                              alt={tour.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                                <CheckCircle2 size={18} className="sm:w-5 sm:h-5 text-status-success flex-shrink-0" />
                                <h3 className="text-base sm:text-xl font-bold text-text-primary break-words">{tour.name}</h3>
                              </div>
                              {tour.trip && (
                                <p className="text-xs sm:text-sm text-text-secondary mb-2 break-words">
                                  {tour.trip.name} • {tour.trip.destination}
                                </p>
                              )}
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <div className="text-base sm:text-lg font-bold text-primary">
                                R$ {tour.price.toFixed(2)}
                              </div>
                              <div className="text-[10px] sm:text-xs text-text-secondary">
                                por pessoa
                              </div>
                            </div>
                          </div>

                          {/* Informações */}
                          <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary">
                              <Clock size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                              <span className="whitespace-nowrap">{tour.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary min-w-0">
                              <MapPin size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                              <span className="truncate">{tour.description || 'Local a definir'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary">
                              <Users size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                              <span className="whitespace-nowrap">{tour.attendanceCount} pessoa{tour.attendanceCount !== 1 ? 's' : ''} confirmada{tour.attendanceCount !== 1 ? 's' : ''}</span>
                            </div>
                            {tour.customDate && (
                              <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                                <Calendar size={14} className="text-primary" />
                                Data personalizada
                              </div>
                            )}
                          </div>

                          {/* Membros Confirmados */}
                          {tour.attendingMembers && tour.attendingMembers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                                Participantes:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {tour.attendingMembers.map((member, memberIdx) => (
                                  <span 
                                    key={memberIdx}
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                                  >
                                    {member}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Links Externos */}
                          {tour.links && tour.links.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tour.links.map((link, linkIdx) => (
                                <a
                                  key={linkIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                                >
                                  {link.title}
                                  <ArrowRight size={14} />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resumo */}
      <div className="mt-6 bg-white rounded-[24px] border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">Total de passeios confirmados</p>
            <p className="text-2xl font-bold text-text-primary">{totalTours}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary mb-1">Valor total estimado</p>
            <p className="text-2xl font-bold text-status-success">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourAgenda;
