import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, ExternalLink, Users, Check, Plus, X, Phone, Mail } from 'lucide-react';
import Button from './Button';
import TourAttendanceModal from './TourAttendanceModal';
import CancelTourModal from './CancelTourModal';
import { Tour, Trip, Group, UserRole } from '../types';
import { groupsApi } from '../lib/database';

interface TourDetailPageProps {
  tour: Tour;
  trip?: Trip;
  userRole: UserRole;
  userGroup?: Group;
  groups?: Group[]; // Lista de grupos para mostrar os que confirmaram presença
  onBack: () => void;
  onConfirmAttendance?: (
    tourId: string,
    members: string[],
    customDate?: string | null,
    selectedPriceKey?: string,
    cancelReason?: string
  ) => void;
}

const TourDetailPage: React.FC<TourDetailPageProps> = ({
  tour,
  trip,
  userRole,
  userGroup,
  groups: groupsProp = [],
  onBack,
  onConfirmAttendance
}) => {
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>(groupsProp);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Carregar grupos da mesma viagem quando o componente montar
  useEffect(() => {
    const loadGroupsForTour = async () => {
      if (!trip?.id) {
        // Se não tem trip, usar os grupos passados via props
        if (groupsProp.length > 0) {
          setGroups(groupsProp);
        }
        return;
      }
      
      setLoadingGroups(true);
      try {
        console.log('🔄 TourDetailPage - Carregando grupos para viagem:', trip.id, 'passeio:', tour.id);
        const tripGroups = await groupsApi.getByTripId(trip.id);
        console.log('✅ TourDetailPage - Grupos carregados:', tripGroups.length);
        console.log('📊 TourDetailPage - Grupos com presença no passeio:', tripGroups.filter(g => {
          const attendance = g.tourAttendance?.[tour.id];
          if (!attendance) return false;
          const members = Array.isArray(attendance) ? attendance : (attendance.members || []);
          return members.length > 0;
        }).map(g => {
          const attendance = g.tourAttendance?.[tour.id];
          const count = Array.isArray(attendance) 
            ? attendance.length 
            : (attendance && typeof attendance === 'object' && 'members' in attendance ? attendance.members?.length || 0 : 0);
          return {
            name: g.name,
            count
          };
        }));
        setGroups(tripGroups);
      } catch (error) {
        console.error('❌ Erro ao carregar grupos:', error);
        // Manter os grupos passados via props em caso de erro
        if (groupsProp.length > 0) {
          setGroups(groupsProp);
        }
      } finally {
        setLoadingGroups(false);
      }
    };
    
    // Sempre recarregar grupos para garantir dados atualizados com tourAttendance
    loadGroupsForTour();
  }, [trip?.id, tour.id]);
  
  // Atualizar grupos quando groupsProp mudar (fallback)
  useEffect(() => {
    if (groupsProp.length > 0 && groups.length === 0 && !loadingGroups) {
      console.log('📥 TourDetailPage - Usando grupos das props:', groupsProp.length);
      setGroups(groupsProp);
    }
  }, [groupsProp, groups.length, loadingGroups]);

  // Verificar se o grupo já confirmou presença
  const attendance = userGroup?.tourAttendance?.[tour.id];
  let attendingMembers: string[] = [];
  let customDate: string | null = null;
  let selectedPriceKey: string | undefined = undefined;
  
  console.log('🔍 TourDetailPage - Verificando attendance:', {
    hasUserGroup: !!userGroup,
    tourId: tour.id,
    attendance: attendance,
    attendanceType: Array.isArray(attendance) ? 'array' : typeof attendance,
    attendanceKeys: attendance && typeof attendance === 'object' ? Object.keys(attendance) : []
  });
  
  if (Array.isArray(attendance)) {
    attendingMembers = attendance;
  } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
    attendingMembers = attendance.members || [];
    customDate = attendance.customDate || null;
    selectedPriceKey = attendance.selectedPriceKey || undefined;
    console.log('✅ TourDetailPage - Extraído do attendance:', {
      membersCount: attendingMembers.length,
      customDate,
      selectedPriceKey,
      hasSelectedPriceKey: !!selectedPriceKey
    });
  } else {
    console.warn('⚠️ TourDetailPage - Attendance não está no formato esperado:', attendance);
  }

  const isSelected = attendingMembers.length > 0;
  const attendanceCount = attendingMembers.length;
  const totalMembers = userGroup 
    ? (userGroup.leaderName ? userGroup.members.length + 1 : userGroup.members.length)
    : 0;
  const isPartial = attendanceCount > 0 && attendanceCount < totalMembers;
  
  // Calcular valor total baseado no tipo de ingresso selecionado
  const calculateTotalValue = () => {
    if (attendanceCount === 0) return 0;
    
    console.log('💰 TourDetailPage - Calculando valor total:', {
      attendanceCount,
      selectedPriceKey,
      hasPrices: !!tour.prices,
      pricesKeys: tour.prices ? Object.keys(tour.prices) : [],
      pricesEntries: tour.prices ? Object.entries(tour.prices).map(([k, v]: [string, any]) => ({
        key: k,
        description: v?.description,
        value: v?.value
      })) : [],
      tourPrice: tour.price
    });
    
    // Se houver preços dinâmicos e um tipo selecionado, usar esse preço
    if (tour.prices && selectedPriceKey) {
      // Tentar encontrar o preço pela chave exata
      let selectedPrice = tour.prices[selectedPriceKey as keyof typeof tour.prices];
      let matchedKey = selectedPriceKey;
      
      // Se não encontrar pela chave exata, tentar encontrar por correspondência parcial
      if (!selectedPrice && tour.prices) {
        const priceEntries = Object.entries(tour.prices);
        // Tentar correspondência exata (case-insensitive)
        let matched = priceEntries.find(([key]) => key.toLowerCase() === selectedPriceKey.toLowerCase());
        
        // Se não encontrar, tentar correspondência parcial
        if (!matched) {
          matched = priceEntries.find(([key]) => 
            key.toLowerCase().includes(selectedPriceKey.toLowerCase()) || 
            selectedPriceKey.toLowerCase().includes(key.toLowerCase())
          );
        }
        
        if (matched) {
          selectedPrice = matched[1] as any;
          matchedKey = matched[0];
          console.log('✅ TourDetailPage - Preço encontrado por correspondência:', {
            originalKey: selectedPriceKey,
            matchedKey: matchedKey,
            price: selectedPrice
          });
        }
      }
      
      if (selectedPrice && selectedPrice.value !== undefined) {
        const total = attendanceCount * selectedPrice.value;
        console.log('✅ TourDetailPage - Valor calculado com preço selecionado:', {
          pricePerPerson: selectedPrice.value,
          attendanceCount,
          total,
          key: matchedKey
        });
        return total;
      } else {
        console.warn('⚠️ TourDetailPage - Preço não encontrado para chave:', selectedPriceKey, {
          availableKeys: tour.prices ? Object.keys(tour.prices) : []
        });
      }
    }
    
    // Caso contrário, usar preço padrão
    const defaultTotal = attendanceCount * tour.price;
    console.log('⚠️ TourDetailPage - Usando preço padrão:', {
      tourPrice: tour.price,
      attendanceCount,
      total: defaultTotal
    });
    return defaultTotal;
  };
  
  const totalValue = calculateTotalValue();
  
  // Obter descrição do tipo de ingresso selecionado
  const getSelectedPriceDescription = () => {
    if (tour.prices && selectedPriceKey) {
      // Tentar encontrar o preço pela chave exata
      let selectedPrice = tour.prices[selectedPriceKey as keyof typeof tour.prices];
      let matchedKey = selectedPriceKey;
      
      // Se não encontrar pela chave exata, tentar encontrar por correspondência parcial
      if (!selectedPrice && tour.prices) {
        const priceEntries = Object.entries(tour.prices);
        // Tentar correspondência exata (case-insensitive)
        let matched = priceEntries.find(([key]) => key.toLowerCase() === selectedPriceKey.toLowerCase());
        
        // Se não encontrar, tentar correspondência parcial
        if (!matched) {
          matched = priceEntries.find(([key]) => 
            key.toLowerCase().includes(selectedPriceKey.toLowerCase()) || 
            selectedPriceKey.toLowerCase().includes(key.toLowerCase())
          );
        }
        
        if (matched) {
          selectedPrice = matched[1] as any;
          matchedKey = matched[0];
        }
      }
      
      if (selectedPrice) {
        if (selectedPrice.description) {
          console.log('✅ TourDetailPage - Descrição encontrada:', {
            key: matchedKey,
            description: selectedPrice.description
          });
          return selectedPrice.description;
        }
        // Se não houver descrição, formatar a chave
        return matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1).replace(/_/g, ' ');
      }
    }
    console.warn('⚠️ TourDetailPage - Descrição não encontrada para chave:', selectedPriceKey);
    return null;
  };
  
  const selectedPriceDescription = getSelectedPriceDescription();
  
  // Log para debug
  useEffect(() => {
    if (isSelected && userRole === 'user') {
      console.log('🔍 TourDetailPage - Debug completo de confirmação:', {
        tourId: tour.id,
        tourName: tour.name,
        selectedPriceKey,
        selectedPriceDescription,
        attendanceCount,
        totalValue,
        prices: tour.prices ? Object.entries(tour.prices).map(([key, price]: [string, any]) => ({
          key,
          description: price?.description,
          value: price?.value
        })) : null,
        attendanceData: attendance,
        attendanceType: Array.isArray(attendance) ? 'array' : typeof attendance
      });
    }
  }, [isSelected, selectedPriceKey, attendanceCount, tour.id, tour.prices, attendance]);

  // Filtrar grupos que confirmaram presença neste passeio
  const attendingGroups = useMemo(() => {
    // Se for usuário, garantir que o userGroup esteja incluído na lista de grupos para filtragem
    let groupsToFilter = groups;
    if (userRole === 'user' && userGroup && !groups.find(g => g.id === userGroup.id)) {
      groupsToFilter = [...groups, userGroup];
      console.log('✅ TourDetailPage - Adicionando userGroup à lista para filtragem');
    }
    
    console.log('🔍 TourDetailPage - Filtrando grupos:', {
      totalGroups: groups.length,
      groupsToFilter: groupsToFilter.length,
      tourId: tour.id,
      groupsWithAttendance: groupsToFilter.filter(g => g?.tourAttendance?.[tour.id]).length,
      userGroupId: userGroup?.id,
      userGroupHasAttendance: userGroup?.tourAttendance?.[tour.id] ? 'sim' : 'não'
    });

    const filtered = groupsToFilter
      .filter(g => {
        if (!g || !g.tourAttendance || !g.tourAttendance[tour.id]) {
          return false;
        }
        
        const attendance = g.tourAttendance[tour.id];
        let members: string[] = [];
        
        if (Array.isArray(attendance)) {
          members = attendance;
        } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
          members = attendance.members || [];
        }
        
        return members.length > 0;
      })
      .map(g => {
        const attendance = g.tourAttendance![tour.id];
        let members: string[] = [];
        
        if (Array.isArray(attendance)) {
          members = attendance;
        } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
          members = attendance.members || [];
        }
        
        return {
          ...g,
          attendingCount: members.length,
          attendingNames: members
        };
      });

    console.log('✅ TourDetailPage - Grupos confirmados:', filtered.length);
    if (filtered.length > 0) {
      console.log('📋 TourDetailPage - Detalhes dos grupos confirmados:', filtered.map(g => ({ 
        name: g.name, 
        count: g.attendingCount,
        members: g.attendingNames 
      })));
    } else {
      console.log('⚠️ TourDetailPage - Nenhum grupo confirmado. Verificando grupos disponíveis...');
      console.log('📊 TourDetailPage - Todos os grupos:', groups.map(g => ({
        name: g.name,
        hasTourAttendance: !!g.tourAttendance,
        attendanceKeys: g.tourAttendance ? Object.keys(g.tourAttendance) : [],
        hasThisTourAttendance: !!g.tourAttendance?.[tour.id],
        attendanceData: g.tourAttendance?.[tour.id]
      })));
    }
    return filtered;
  }, [groups, tour.id, userRole, userGroup]);

  const totalAttendingPeople = attendingGroups.reduce((acc, g) => acc + g.attendingCount, 0);

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCustomDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleConfirmAttendance = (
    tourId: string,
    members: string[],
    customDate?: string | null,
    selectedPriceKey?: string
  ) => {
    if (onConfirmAttendance) {
      onConfirmAttendance(tourId, members, customDate, selectedPriceKey);
    }
    setAttendanceModalOpen(false);
  };

  const handleCancelTour = (reason: string) => {
    // Cancelar presença (salvar array vazio)
    if (onConfirmAttendance && tour.id) {
      onConfirmAttendance(tour.id, [], null, undefined, reason);
    }
    setCancelModalOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header com botão voltar */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary">Detalhes do Passeio</h1>
          {trip && (
            <p className="text-sm text-text-secondary mt-1">{trip.name} • {trip.destination}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Coluna Principal - Informações */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Imagem */}
          {tour.imageUrl && (
            <div className="bg-white rounded-xl sm:rounded-[24px] border border-border overflow-hidden">
              <div className="w-full h-48 sm:h-64 md:h-96 overflow-hidden relative">
                <img 
                  src={tour.imageUrl} 
                  alt={tour.name}
                  className="w-full h-full object-cover"
                />
                {isSelected && userRole === 'user' && (
                  <div className={`absolute top-4 left-4 px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 ${
                    isPartial ? 'bg-status-warning text-white' : 'bg-status-success text-white'
                  }`}>
                    <Check size={16} strokeWidth={3} />
                    {isPartial ? 'CONFIRMAÇÃO PARCIAL' : 'CONFIRMADO'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="bg-white rounded-xl sm:rounded-[24px] border border-border p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4 break-words">{tour.name}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Data
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDate(tour.date)}
                  </p>
                  {customDate && userRole === 'user' && (
                    <p className="text-xs text-primary mt-1">
                      📅 Data escolhida: {formatCustomDate(customDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Horário
                  </p>
                  <p className="text-sm font-medium text-text-primary">{tour.time}</p>
                </div>
              </div>

              {/* Valores dos Ingressos */}
              {tour.prices && Object.keys(tour.prices).length > 0 ? (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                      Valores dos Ingressos
                    </p>
                    <div className="space-y-2">
                      {Object.entries(tour.prices).map(([key, priceData]) => {
                        if (!priceData || priceData.value === undefined) return null;
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">
                                {priceData.description || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                              </p>
                            </div>
                            <p className="text-base font-bold text-primary ml-4">
                              R$ {priceData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Preço por pessoa
                    </p>
                    <p className="text-lg font-bold text-primary">
                      R$ {tour.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {tour.address && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Endereço
                    </p>
                    <p className="text-sm font-medium text-text-primary break-words">
                      {tour.address}
                    </p>
                  </div>
                </div>
              )}

              {userRole === 'user' && isSelected && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Participantes
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      {attendanceCount} de {totalMembers} pessoa{totalMembers !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Descrição */}
            {tour.description && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Descrição
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {tour.description}
                </p>
              </div>
            )}

            {/* Observações - Campo em Destaque */}
            {tour.observations && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-xl p-5 sm:p-6 border-2 border-primary/30 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-lg font-bold">!</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary">
                      Observações
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-text-primary leading-relaxed whitespace-pre-line font-medium">
                    {tour.observations}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            {tour.tags && tour.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Categorias
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tour.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links Externos */}
            {tour.links && tour.links.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Links Úteis
                </h3>
                <div className="flex flex-wrap gap-3">
                  {tour.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
                    >
                      {link.title}
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Informações da Viagem */}
            {trip && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Viagem
                    </p>
                    <p className="text-sm font-medium text-text-primary">{trip.name}</p>
                    <p className="text-xs text-text-secondary mt-1">{trip.destination}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Ações */}
        {userRole === 'user' && userGroup && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-[24px] border border-border p-4 sm:p-6 sticky top-4 sm:top-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                {isSelected ? 'Sua Confirmação' : 'Confirmar Presença'}
              </h3>

              {isSelected ? (
                <>
                  {/* Resumo da Confirmação */}
                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-surface rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Pessoas confirmadas</span>
                        <span className="font-bold text-text-primary">{attendanceCount}</span>
                      </div>
                      {/* Sempre mostrar tipo de ingresso se houver múltiplos preços e um selecionado */}
                      {tour.prices && Object.keys(tour.prices).length > 1 && (
                        <div className="mb-2 pt-2 border-t border-border">
                          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                            Tipo de Ingresso Selecionado:
                          </span>
                          {selectedPriceDescription ? (
                            <span className="text-sm font-medium text-text-primary">
                              {selectedPriceDescription}
                            </span>
                          ) : selectedPriceKey ? (
                            <span className="text-sm font-medium text-text-primary">
                              {selectedPriceKey} (chave: {selectedPriceKey})
                            </span>
                          ) : (
                            <span className="text-xs text-text-secondary italic">
                              Nenhum tipo selecionado
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Total</span>
                        <span className="text-lg font-bold text-primary">
                          R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {attendingMembers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                          Participantes:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {attendingMembers.map((member, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {customDate && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                          Data escolhida
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {formatCustomDate(customDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      fullWidth
                      onClick={() => setAttendanceModalOpen(true)}
                      variant="outline"
                      className="min-h-[52px] sm:h-[48px] text-base sm:text-sm font-semibold"
                    >
                      Editar Confirmação
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => setCancelModalOpen(true)}
                      variant="outline"
                      className="text-status-error border-status-error/30 hover:bg-status-error/5 min-h-[52px] sm:h-[48px] text-base sm:text-sm font-semibold"
                    >
                      <X size={18} className="sm:w-4 sm:h-4 mr-2" />
                      Cancelar Passeio
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  fullWidth
                  onClick={() => setAttendanceModalOpen(true)}
                  className="min-h-[52px] sm:h-[48px] text-base sm:text-sm font-semibold"
                >
                  <Plus size={20} className="sm:w-5 sm:h-5 mr-2" />
                  Confirmar Presença
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Seção de Grupos que Confirmaram Presença - Sempre visível */}
      <div className="mt-6 bg-white rounded-xl sm:rounded-[24px] border border-border p-4 sm:p-6" id="grupos-confirmados-section">
        {(() => {
          console.log('🎨 TourDetailPage - Renderizando seção de grupos:', {
            attendingGroupsCount: attendingGroups.length,
            totalGroups: groups.length,
            tourId: tour.id,
            tourName: tour.name
          });
          return null;
        })()}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Grupos que Vão para Este Passeio
            </h2>
            {attendingGroups.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                <p className="text-xs sm:text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">{attendingGroups.length}</span> grupo{attendingGroups.length !== 1 ? 's' : ''}
                </p>
                <span className="text-text-disabled">•</span>
                <p className="text-xs sm:text-sm text-text-secondary">
                  <span className="font-semibold text-primary">{totalAttendingPeople}</span> pessoa{totalAttendingPeople !== 1 ? 's' : ''} confirmada{totalAttendingPeople !== 1 ? 's' : ''}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-xs sm:text-sm text-text-secondary">
                  Nenhum grupo confirmou presença ainda
                </p>
                <p className="text-xs text-text-disabled mt-1">
                  Total de grupos na viagem: {groups.length}
                </p>
              </div>
            )}
          </div>
        </div>

        {attendingGroups.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {attendingGroups.map((group) => (
              <div
                key={group.id}
                className="p-4 sm:p-5 bg-surface rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary mb-1 break-words">{group.name}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className="font-medium">Líder:</span>
                            <span>{group.leaderName}</span>
                          </div>
                          {group.leaderPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <Phone size={12} />
                              {group.leaderPhone}
                            </div>
                          )}
                          {group.leaderEmail && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <Mail size={12} />
                              {group.leaderEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-3">
                    <div className="flex flex-col sm:items-end gap-1">
                      <span className="text-xs font-semibold text-text-secondary uppercase">Quantidade:</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center min-w-[40px] h-10 rounded-lg bg-primary/10 text-primary font-bold text-base sm:text-lg px-3">
                          {group.attendingCount}
                        </span>
                        <span className="text-xs text-text-secondary">pessoa{group.attendingCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {group.attendingNames.length > 0 && (
                      <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-text-secondary uppercase">Participantes:</span>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {group.attendingNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-border text-text-primary"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <Users size={48} className="mx-auto mb-3 text-text-disabled opacity-50" />
            <p className="text-sm font-medium">Nenhum grupo confirmou presença neste passeio ainda.</p>
            <p className="text-xs text-text-disabled mt-1">Os grupos precisam confirmar presença para aparecer aqui.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {userGroup && (
        <>
          <TourAttendanceModal
            isOpen={attendanceModalOpen}
            onClose={() => setAttendanceModalOpen(false)}
            tour={tour}
            group={userGroup}
            onConfirm={handleConfirmAttendance}
          />

          <CancelTourModal
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            onConfirm={handleCancelTour}
            tour={tour}
          />
        </>
      )}
    </div>
  );
};

export default TourDetailPage;
