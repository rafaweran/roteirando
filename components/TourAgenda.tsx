import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Plus, X, Check, Link } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { Tour, Trip, Group, TourAttendanceInfo, UserCustomTour } from '../types';
import { userCustomToursApi } from '../lib/database';

interface TourAgendaProps {
  tours: Tour[];
  trips: Trip[];
  userGroup: Group;
  companionGroup?: Group | null;
  onViewTourDetail?: (tour: Tour) => void;
  onAddCustomTour?: () => void;
  onCancelAttendance?: (tourId: string, isCustomTour: boolean) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TourAgenda: React.FC<TourAgendaProps> = ({ 
  tours, 
  trips, 
  userGroup, 
  companionGroup,
  onViewTourDetail, 
  onAddCustomTour, 
  onCancelAttendance 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customTours, setCustomTours] = useState<UserCustomTour[]>([]);
  const [companionCustomTours, setCompanionCustomTours] = useState<UserCustomTour[]>([]);
  const [loadingCustomTours, setLoadingCustomTours] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [tourToCancel, setTourToCancel] = useState<{ id: string; name: string; isCustomTour: boolean } | null>(null);

  // Debug companion group
  useEffect(() => {
    console.log('🔍 TourAgenda - Estado do Grupo Parceiro:', {
      hasCompanionId: !!userGroup.companionGroupId,
      companionId: userGroup.companionGroupId,
      companionGroupLoaded: !!companionGroup,
      companionGroupName: companionGroup?.name
    });
  }, [userGroup.companionGroupId, companionGroup]);

  // Carregar passeios personalizados
  useEffect(() => {
    const loadCustomTours = async () => {
      try {
        setLoadingCustomTours(true);
        
        // Carregar meus próprios passeios
        const myData = await userCustomToursApi.getByGroupId(userGroup.id);
        setCustomTours(myData);
        
        // Carregar passeios do parceiro se existir
        if (companionGroup) {
          console.log('🔄 Buscando passeios personalizados do parceiro:', companionGroup.name);
          const companionData = await userCustomToursApi.getByGroupId(companionGroup.id);
          setCompanionCustomTours(companionData);
          console.log('✅ Passeios personalizados do parceiro carregados:', companionData.length);
        } else {
          setCompanionCustomTours([]);
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar passeios personalizados:', error);
        setCustomTours([]);
        setCompanionCustomTours([]);
      } finally {
        setLoadingCustomTours(false);
      }
    };
    
    loadCustomTours();
  }, [userGroup.id, companionGroup?.id]);

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
        let customTime: string | null = null;
        let isPaid = false;
        
        if (Array.isArray(attendance)) {
          members = attendance;
        } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
          members = attendance.members || [];
          customDate = attendance.customDate || null;
          customTime = attendance.customTime || null;
          isPaid = (attendance as any).isPaid || false;
        }
        
        // Usar data personalizada se existir, senão usar data original do tour
        const displayDate = customDate || tour.date;
        const displayTime = customTime || tour.time;
        
        return {
          ...tour,
          trip,
          attendanceCount: members.length,
          attendingMembers: members,
          customDate: customDate,
          customTime: customTime,
          isPaid: isPaid,
          displayDate: displayDate, // Data que será exibida/agrupada
          displayTime: displayTime,
          isCustomTour: false
        };
      });
  }, [tours, trips, userGroup]);

  // Converter passeios personalizados para o formato de Tour
  const customToursAsTours = useMemo(() => {
    return customTours.map(customTour => {
      const tour: any = {
        id: customTour.id,
        tripId: userGroup.tripId || '', // Usar tripId do grupo
        name: customTour.name,
        date: customTour.date,
        time: customTour.time,
        price: customTour.price || 0,
        description: customTour.description || '',
        address: customTour.address,
        imageUrl: customTour.imageUrl,
        trip: trips.find(t => t.id === userGroup.tripId),
        attendanceCount: 1, // Passeios personalizados são sempre confirmados
        attendingMembers: [userGroup.leaderName],
        customDate: null,
        customTime: null,
        displayDate: customTour.date,
        displayTime: customTour.time,
        isCustomTour: true // Marcar como passeio personalizado
      };
      return tour;
    });
  }, [customTours, userGroup, trips]);

  // Mesclar passeios confirmados oficiais com passeios personalizados
  const allTours = useMemo(() => {
    // Meus passeios oficiais e personalizados
    const baseTours = [...confirmedTours, ...customToursAsTours];
    
    // Adicionar passeios do grupo parceiro que este grupo ainda não confirmou
    if (companionGroup) {
      // 1. Passeios Oficiais do Parceiro
      if (companionGroup.tourAttendance) {
        const companionOfficialTours = tours.filter(tour => {
          // Verificar se o grupo parceiro confirmou presença
          const companionAttendance = companionGroup.tourAttendance?.[tour.id];
          let companionAttending = false;
          
          if (Array.isArray(companionAttendance)) {
            companionAttending = companionAttendance.length > 0;
          } else if (companionAttendance && typeof companionAttendance === 'object' && 'members' in companionAttendance) {
            companionAttending = companionAttendance.members && companionAttendance.members.length > 0;
          }

          if (!companionAttending) return false;

          // Verificar se o grupo ATUAL ainda NÃO confirmou presença
          const myAttendance = userGroup.tourAttendance?.[tour.id];
          let iAmAttending = false;
          if (Array.isArray(myAttendance)) {
            iAmAttending = myAttendance.length > 0;
          } else if (myAttendance && typeof myAttendance === 'object' && 'members' in myAttendance) {
            iAmAttending = myAttendance.members && myAttendance.members.length > 0;
          }

          return !iAmAttending;
        }).map(tour => {
          const trip = trips.find(t => t.id === tour.tripId);
          return {
            ...tour,
            trip,
            displayDate: tour.date,
            displayTime: tour.time,
            attendanceCount: 0,
            attendingMembers: [],
            isCompanionTour: true,
            companionGroupName: companionGroup.name
          };
        });

        baseTours.push(...(companionOfficialTours as any[]));
      }

      // 2. Passeios Personalizados do Parceiro
      if (companionCustomTours.length > 0) {
        const companionCustomAsTours = companionCustomTours.map(ct => ({
          id: ct.id,
          tripId: userGroup.tripId || '',
          name: ct.name,
          date: ct.date,
          time: ct.time,
          price: ct.price || 0,
          description: ct.description || '',
          address: ct.address,
          imageUrl: ct.imageUrl,
          trip: trips.find(t => t.id === userGroup.tripId),
          attendanceCount: 0,
          attendingMembers: [],
          displayDate: ct.date,
          displayTime: ct.time,
          isCustomTour: true,
          isCompanionTour: true,
          companionGroupName: companionGroup.name
        }));
        
        baseTours.push(...(companionCustomAsTours as any[]));
      }
    }

    return baseTours.sort((a, b) => {
      // Ordenar por data
      return new Date(a.displayDate).getTime() - new Date(b.displayDate).getTime();
    });
  }, [confirmedTours, customToursAsTours, companionGroup, companionCustomTours, tours, trips, userGroup]);

  // Obter ano e mês do mês atual (ou do primeiro passeio se houver)
  const getCalendarMonthYear = () => {
    if (allTours.length > 0) {
      const firstTourDate = new Date(allTours[0].displayDate + 'T12:00:00');
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

  // Criar dias do calendário baseados nos passeios existentes
  const calendarDays = useMemo(() => {
    if (allTours.length === 0) return [];

    // Encontrar a menor e maior data entre todos os passeios
    const dates = allTours.map(t => new Date(t.displayDate + 'T12:00:00').getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Garantir que mostramos pelo menos alguns dias antes e depois, ou um intervalo mínimo
    const startDay = new Date(minDate);
    startDay.setDate(startDay.getDate() - 1);
    
    const endDay = new Date(maxDate);
    endDay.setDate(endDay.getDate() + 1);

    const days = [];
    const current = new Date(startDay);
    
    // Limitar o calendário a no máximo 15 dias para não quebrar o layout
    let count = 0;
    while (current <= endDay && count < 20) {
      const d = current.getDate();
      const m = current.getMonth();
      const y = current.getFullYear();
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const toursForDay = allTours.filter(tour => tour.displayDate === dateStr);

      days.push({
        day: d,
        month: m,
        year: y,
        date: new Date(current),
        dateStr,
        tours: toursForDay,
        dayOfWeek: DAYS_OF_WEEK[current.getDay()]
      });
      
      current.setDate(current.getDate() + 1);
      count++;
    }
    return days;
  }, [allTours]);

  // Função para rolar até o dia selecionado
  const scrollToDay = (dateStr: string) => {
    const element = document.getElementById(`day-section-${dateStr}`);
    if (element) {
      const offset = 100; // Espaço para o header fixo se houver
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Calcular total de passeios e valor
  const totalTours = allTours.length;
  const totalValue = allTours.reduce((sum, tour) => {
    // Não incluir passeios gratuitos no valor total
    if (tour.paymentMethod === 'free') return sum;
    return sum + (tour.price * tour.attendanceCount);
  }, 0);

  const handleCancelClick = (tour: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTourToCancel({
      id: tour.id,
      name: tour.name,
      isCustomTour: tour.isCustomTour || false
    });
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (tourToCancel && onCancelAttendance) {
      onCancelAttendance(tourToCancel.id, tourToCancel.isCustomTour);
      setCancelModalOpen(false);
      setTourToCancel(null);
    }
  };

  if (allTours.length === 0 && !loadingCustomTours) {
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
      {/* Banner de Grupo Parceiro */}
      {companionGroup && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Link size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-0.5">Agenda Compartilhada</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Sua agenda está conectada com o grupo <strong>{companionGroup.name}</strong>. Os passeios confirmados por eles aparecerão aqui como sugestão para vocês!
            </p>
          </div>
          <div className="hidden sm:block px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 uppercase">
            Ativado
          </div>
        </div>
      )}

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
              {MONTHS[calendarDays[0]?.month || month]} {calendarDays[0]?.year || year}
            </h2>
          </div>

          {/* Cabeçalho dos Dias */}
          <div className="overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <div className="flex gap-3 sm:gap-4 min-w-max">
              {calendarDays.map((calendarDay) => {
                const hasTours = calendarDay.tours.length > 0;
                const isToday = new Date().toDateString() === calendarDay.date.toDateString();

                return (
                  <div
                    key={calendarDay.dateStr}
                    onClick={() => hasTours && scrollToDay(calendarDay.dateStr)}
                    className={`
                      w-[120px] sm:w-[140px] min-h-[130px] sm:min-h-[140px] rounded-2xl border-2 p-3 transition-all duration-300 cursor-pointer
                      flex flex-col
                      ${hasTours 
                        ? 'border-primary bg-primary/5 shadow-md hover:shadow-lg hover:-translate-y-1' 
                        : 'border-border bg-surface/30 opacity-60'
                      }
                      ${isToday && !hasTours ? 'border-primary/30 bg-primary/5 opacity-100' : ''}
                    `}
                  >
                    {/* Dia da Semana */}
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                      {calendarDay.dayOfWeek}
                    </div>

                    {/* Número do Dia */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`
                        text-xl font-black
                        ${hasTours ? 'text-primary' : isToday ? 'text-primary' : 'text-text-secondary'}
                      `}>
                        {calendarDay.day}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full uppercase">
                          Hoje
                        </span>
                      )}
                    </div>

                    {/* Passeios do Dia (Miniaturas) */}
                    <div className="flex-1 flex flex-col justify-end gap-1.5">
                      {calendarDay.tours.slice(0, 2).map((tour) => (
                        <div
                          key={tour.id}
                          className={`
                            px-1.5 py-1.5 rounded-md text-[9px] font-bold leading-none
                            flex flex-col gap-1
                            ${tour.isPaid 
                              ? 'bg-status-success text-white' 
                              : tour.isCompanionTour 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-primary text-white'}
                          `}
                        >
                          <div className="truncate">{tour.name}</div>
                          <div className="flex items-center gap-1 opacity-90 text-[8px]">
                            <Clock size={8} strokeWidth={3} />
                            <span>{tour.displayTime}</span>
                          </div>
                        </div>
                      ))}
                      {calendarDay.tours.length > 2 && (
                        <div className="text-[9px] font-bold text-primary bg-primary/10 py-1 text-center rounded-md">
                          + {calendarDay.tours.length - 2} outros
                        </div>
                      )}
                      {!hasTours && (
                        <div className="text-[9px] text-text-disabled text-center py-2 italic">
                          Livre
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes dos Passeios por Dia */}
      {calendarDays.some(day => day.tours.length > 0) && (
        <div className="space-y-6">
          {calendarDays.map((calendarDay) => {
            if (calendarDay.tours.length === 0) return null;

            return (
              <div 
                key={calendarDay.dateStr} 
                id={`day-section-${calendarDay.dateStr}`}
                className="bg-white rounded-xl sm:rounded-[24px] border border-border overflow-hidden shadow-sm scroll-mt-24"
              >
                {/* Data Header */}
                <div className="bg-primary/5 border-b border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-text-primary capitalize truncate">
                        {calendarDay.dayOfWeek}, {calendarDay.day} de {MONTHS[calendarDay.month]}
                      </h2>
                      <p className="text-xs sm:text-sm text-text-secondary">{calendarDay.year}</p>
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
                                <h3 className="text-base sm:text-xl font-bold text-text-primary break-words">{tour.name}</h3>
                                {tour.isPaid && (
                                  <span className="px-2.5 py-1 bg-status-success text-white text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                    <Check size={12} strokeWidth={4} />
                                    Pago
                                  </span>
                                )}
                                {tour.isCompanionTour && (
                                  <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                    Passeio do Parceiro ({tour.companionGroupName})
                                  </span>
                                )}
                                {onCancelAttendance && !tour.isCompanionTour && (
                                  <button
                                    onClick={(e) => handleCancelClick(tour, e)}
                                    className="ml-auto p-2 rounded-lg text-status-error hover:bg-status-error/10 transition-colors flex-shrink-0"
                                    title="Cancelar presença"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>
                              {tour.trip && (
                                <p className="text-xs sm:text-sm text-text-secondary mb-2 break-words">
                                  {tour.trip.name} • {tour.trip.destination}
                                </p>
                              )}
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <div className={`text-base sm:text-lg font-bold ${tour.paymentMethod === 'free' ? 'text-status-success' : 'text-primary'}`}>
                                {tour.paymentMethod === 'free' ? 'GRATUITO' : `R$ ${tour.price.toFixed(2)}`}
                              </div>
                              {tour.paymentMethod !== 'free' && (
                                <div className="text-[10px] sm:text-xs text-text-secondary">
                                  por pessoa
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Informações */}
                          <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-3 text-xs sm:text-sm items-center">
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold">
                              <Clock size={16} className="flex-shrink-0" />
                              <span className="whitespace-nowrap text-sm">{tour.displayTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary min-w-0">
                              <MapPin size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                              <span className="truncate">{tour.description || 'Local a definir'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary">
                              <Users size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                              <span className="whitespace-nowrap">{tour.attendanceCount} pessoa{tour.attendanceCount !== 1 ? 's' : ''} confirmada{tour.attendanceCount !== 1 ? 's' : ''}</span>
                            </div>
                            {(tour.customDate || tour.customTime) && (
                              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                <Calendar size={14} />
                                {tour.customDate && tour.customTime ? 'Data e horário personalizados' : tour.customDate ? 'Data personalizada' : 'Horário personalizado'}
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
      <div className="mt-6 bg-white rounded-xl sm:rounded-[24px] border border-border p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-sm text-text-secondary uppercase tracking-wider font-bold mb-1">Total de passeios</p>
            <p className="text-xl sm:text-2xl font-bold text-text-primary">{totalTours}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] sm:text-sm text-text-secondary uppercase tracking-wider font-bold mb-1">Valor total estimado</p>
            <p className="text-xl sm:text-2xl font-bold text-status-success">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setTourToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title={tourToCancel?.isCustomTour ? "Excluir Passeio" : "Cancelar Presença"}
        description={
          tourToCancel?.isCustomTour 
            ? `Tem certeza que deseja excluir o passeio "${tourToCancel?.name}"? Esta ação não pode ser desfeita.`
            : `Tem certeza que deseja cancelar sua presença no passeio "${tourToCancel?.name}"?`
        }
        variant="danger"
        confirmLabel={tourToCancel?.isCustomTour ? "Excluir" : "Cancelar Presença"}
        cancelLabel="Voltar"
      />
    </div>
  );
};

export default TourAgenda;
