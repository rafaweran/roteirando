import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Tour, Group, UserRole } from '../types';
import { Calendar, MapPin, Map as MapIcon, Users, ArrowLeft, Plus, Camera, ExternalLink, Info, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import TourCard from './TourCard';
import GroupCard from './GroupCard';
import Button from './Button';
import TourAttendanceModal from './TourAttendanceModal';
import CancelTourModal from './CancelTourModal';

interface TripDetailsProps {
  trip: Trip;
  tours: Tour[];
  groups: Group[];
  onBack: () => void;
  onAddTour: () => void;
  onAddGroup: () => void;
  onEditTour?: (tour: Tour) => void; // Admin: Edit tour
  initialTab?: 'tours' | 'groups';
  userRole?: UserRole;
  userGroup?: Group;
  onSaveAttendance?: (tourId: string, members: string[], cancelReason?: string) => void;
  onViewTourAttendance?: (tour: Tour) => void;
  onViewTourDetail?: (tour: Tour) => void;
  selectedTourId?: string | null; // Tour ID para filtrar grupos quando na aba de grupos
}

type Tab = 'tours' | 'groups';

const TripDetails: React.FC<TripDetailsProps> = ({ 
  trip, 
  tours, 
  groups, 
  onBack, 
  onAddTour, 
  onAddGroup,
  onEditTour,
  initialTab = 'tours',
  userRole = 'admin',
  userGroup,
  onSaveAttendance,
  onViewTourAttendance,
  onViewTourDetail,
  selectedTourId = null
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedTourForAttendance, setSelectedTourForAttendance] = useState<Tour | null>(null);
  const [selectedTourForCancel, setSelectedTourForCancel] = useState<Tour | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [clearTourFilter, setClearTourFilter] = useState(false);

  const isUser = userRole === 'user';

  // Update active tab if initialTab changes (e.g. navigation from ToursList)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleOpenAttendance = (tour: Tour) => {
    setSelectedTourForAttendance(tour);
    setAttendanceModalOpen(true);
  };

  const handleConfirmAttendance = (tourId: string, members: string[], customDate?: string | null) => {
     if (onSaveAttendance) {
       onSaveAttendance(tourId, members, customDate);
     }
  };

  const handleOpenCancel = (tour: Tour) => {
    setSelectedTourForCancel(tour);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (selectedTourForCancel && onSaveAttendance) {
      try {
        // Cancelar = passar array vazio + motivo
        await onSaveAttendance(selectedTourForCancel.id, [], reason);
        alert('✅ Passeio cancelado com sucesso!');
        setCancelModalOpen(false);
        setSelectedTourForCancel(null);
      } catch (error: any) {
        console.error('Erro ao cancelar passeio:', error);
        alert(`Erro ao cancelar passeio: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Agrupar tours por categoria/tag
  const toursByCategory = useMemo(() => {
    const grouped: Record<string, Tour[]> = {};
    const withoutCategory: Tour[] = [];

    tours.forEach(tour => {
      if (tour.tags && tour.tags.length > 0) {
        tour.tags.forEach(tag => {
          if (!grouped[tag]) {
            grouped[tag] = [];
          }
          if (!grouped[tag].includes(tour)) {
            grouped[tag].push(tour);
          }
        });
      } else {
        withoutCategory.push(tour);
      }
    });

    // Ordenar por data dentro de cada categoria
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    withoutCategory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (withoutCategory.length > 0) {
      grouped['Sem categoria'] = withoutCategory;
    }

    return grouped;
  }, [tours]);

  // Filtrar tours por categoria selecionada
  const filteredToursByCategory = useMemo(() => {
    if (!selectedCategoryFilter) return toursByCategory;
    
    return {
      [selectedCategoryFilter]: toursByCategory[selectedCategoryFilter] || []
    };
  }, [toursByCategory, selectedCategoryFilter]);

  // Todas as categorias disponíveis
  const availableCategories = useMemo(() => {
    return Object.keys(toursByCategory).sort();
  }, [toursByCategory]);

  // Toggle collapse de categoria
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Filtrar grupos: se houver um passeio selecionado, mostrar apenas grupos que confirmaram presença
  const filteredGroups = useMemo(() => {
    // Se o usuário clicou em "Ver Todos os Grupos", não filtrar
    const effectiveTourId = clearTourFilter ? null : selectedTourId;
    
    if (!effectiveTourId || activeTab !== 'groups') {
      // Se não há passeio selecionado ou não está na aba de grupos, mostrar todos
      return groups;
    }

    // Filtrar apenas grupos que confirmaram presença neste passeio específico
    return groups.filter(g => {
      if (!g.tourAttendance) return false;
      if (!g.tourAttendance[effectiveTourId]) return false;
      
      // Handle both formats: array of strings or TourAttendanceInfo object
      const attendance = g.tourAttendance[effectiveTourId];
      let members: string[] = [];
      
      if (Array.isArray(attendance)) {
        // Old format: array of strings
        members = attendance;
      } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
        // New format: TourAttendanceInfo object
        members = attendance.members || [];
      }
      
      // Only include groups with at least one member attending
      return members.length > 0;
    });
  }, [groups, selectedTourId, activeTab, clearTourFilter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation Back */}
      <button 
        onClick={onBack}
        className={`flex items-center text-text-secondary hover:text-primary mb-6 transition-colors font-medium text-sm ${isUser ? 'cursor-default hover:text-text-secondary' : ''}`}
        disabled={isUser}
      >
        {!isUser && <ArrowLeft size={18} className="mr-1" />}
        {isUser ? 'Painel do Grupo' : 'Voltar para Viagens'}
      </button>

      {/* Hero / Header */}
      <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="flex-1 order-2 md:order-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                {trip.status === 'active' ? 'Em andamento' : trip.status === 'upcoming' ? 'Confirmada' : 'Finalizada'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{trip.name}</h1>
            
            <div className="flex flex-wrap gap-4 md:gap-6 text-text-secondary mb-6">
              <div className="flex items-center bg-surface px-3 py-1.5 rounded-lg">
                <MapPin size={18} className="mr-2 text-primary" />
                {trip.destination}
              </div>
              <div className="flex items-center bg-surface px-3 py-1.5 rounded-lg">
                <Calendar size={18} className="mr-2 text-primary" />
                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
              </div>
            </div>

            <p className="text-text-secondary leading-relaxed max-w-2xl mb-6">
              {trip.description}
            </p>

            {/* Trip External Links */}
            {trip.links && trip.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {trip.links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-text-primary hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md"
                  >
                    {link.title}
                    <ExternalLink size={14} className="text-text-secondary group-hover:text-primary" />
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full md:w-32 h-48 md:h-32 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 order-1 md:order-2 relative group cursor-pointer">
            <img src={trip.imageUrl} alt={trip.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {!isUser && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                <div className="text-white flex flex-col items-center gap-1">
                  <Camera size={20} />
                  <span className="text-xs font-medium">Alterar</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        
        {/* Tab Navigation - Only show if Admin */}
        {!isUser && (
            <div className="flex items-center gap-2 border-b border-border">
            <button
                onClick={() => setActiveTab('tours')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tours' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
                <MapIcon size={18} />
                Passeios ({tours.length})
            </button>
            <button
                onClick={() => setActiveTab('groups')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'groups' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
                <Users size={18} />
                Famílias / Grupos ({clearTourFilter || !selectedTourId ? groups.length : filteredGroups.length})
            </button>
            </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center py-2 gap-4">
          <div>
              <h2 className="text-xl font-bold text-text-primary">
                {isUser ? 'Passeios Disponíveis' : (activeTab === 'tours' ? 'Passeios Disponíveis' : 'Grupos Participantes')}
              </h2>
              {!isUser && activeTab === 'groups' && selectedTourId && (
                  <p className="text-text-secondary text-sm mt-1">
                      Mostrando apenas grupos que confirmaram presença no passeio selecionado.
                  </p>
              )}
              {isUser && (
                  <p className="text-text-secondary text-sm mt-1">
                      Selecione abaixo os passeios que o grupo <strong>{userGroup?.name}</strong> irá participar.
                  </p>
              )}
          </div>
          
          <div className="flex gap-2">
            {!isUser && activeTab === 'tours' && (
              <Button 
                variant="outline"
                className="h-10 text-sm px-4 hidden sm:flex"
                onClick={() => setActiveTab('groups')}
              >
                <Users size={16} className="mr-2" />
                Ver Grupos
              </Button>
            )}
            {!isUser && activeTab === 'groups' && selectedTourId && !clearTourFilter && (
              <Button 
                variant="outline"
                className="h-10 text-sm px-4"
                onClick={() => {
                  // Limpar o filtro de passeio selecionado
                  setClearTourFilter(true);
                }}
              >
                <X size={16} className="mr-2" />
                Ver Todos os Grupos
              </Button>
            )}
            {!isUser && (
                <Button 
                className="h-10 text-sm px-4" 
                onClick={activeTab === 'tours' ? onAddTour : onAddGroup}
                >
                <Plus size={16} className="mr-2" />
                {activeTab === 'tours' ? 'Novo Passeio' : 'Novo Grupo'}
                </Button>
            )}
          </div>
        </div>
        
        {isUser && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-sm text-primary/80">
                <Info size={20} className="flex-shrink-0" />
                <p>
                    Clique em "Confirmar Presença" para selecionar quem do grupo participará de cada passeio.
                </p>
            </div>
        )}

        {/* Content Lists */}
        <div className="space-y-4">
          {activeTab === 'tours' || isUser ? (
            <>
              {/* Filtro Rápido por Categoria */}
              {availableCategories.length > 0 && (
                <div className="bg-white rounded-custom border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Filter size={16} className="text-primary" />
                      Filtrar por Tipo
                    </label>
                    {selectedCategoryFilter && (
                      <button
                        onClick={() => setSelectedCategoryFilter(null)}
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-status-error transition-colors"
                      >
                        <X size={14} />
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border
                        ${!selectedCategoryFilter
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-surface text-text-secondary border-border hover:border-primary/50 hover:text-primary'
                        }
                      `}
                    >
                      Todos ({tours.length})
                    </button>
                    {availableCategories.map(category => {
                      const isSelected = selectedCategoryFilter === category;
                      const count = toursByCategory[category]?.length || 0;
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategoryFilter(isSelected ? null : category)}
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border
                            ${isSelected
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-surface text-text-secondary border-border hover:border-primary/50 hover:text-primary'
                            }
                          `}
                        >
                          {category} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tours Agrupados por Categoria */}
              {Object.keys(filteredToursByCategory).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(filteredToursByCategory).map(([category, categoryTours]) => {
                    const isCollapsed = collapsedCategories.has(category);
                    return (
                      <div key={category} className="bg-white rounded-custom border border-border shadow-sm overflow-hidden">
                        {/* Cabeçalho da Categoria */}
                        <button
                          onClick={() => toggleCategoryCollapse(category)}
                          className="w-full flex items-center justify-between p-4 hover:bg-surface/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-primary rounded-full"></div>
                            <div className="text-left">
                              <h3 className="text-lg font-bold text-text-primary">{category}</h3>
                              <p className="text-xs text-text-secondary">
                                {categoryTours.length} passeio{categoryTours.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {isCollapsed ? (
                            <ChevronDown size={20} className="text-text-secondary" />
                          ) : (
                            <ChevronUp size={20} className="text-text-secondary" />
                          )}
                        </button>

                        {/* Tours da Categoria */}
                        {!isCollapsed && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 pt-0 border-t border-border">
                            {categoryTours.map(tour => {
                              // Compatibilidade: pode ser TourAttendanceInfo ou string[] (versão antiga)
                              const attendance = userGroup?.tourAttendance?.[tour.id];
                              const attendingMembers = Array.isArray(attendance) 
                                ? attendance 
                                : (attendance && typeof attendance === 'object' && 'members' in attendance) 
                                  ? attendance.members 
                                  : [];
                              // Total de membros incluindo o líder
                              const totalMembers = userGroup 
                                ? (userGroup.leaderName ? userGroup.members.length + 1 : userGroup.members.length)
                                : 0;
                              return (
                                <TourCard 
                                  key={tour.id} 
                                  tour={tour} 
                                  onViewGroup={!isUser ? () => setActiveTab('groups') : undefined}
                                  isUserView={isUser}
                                  attendanceCount={attendingMembers.length}
                                  totalMembers={totalMembers}
                                  onOpenAttendance={handleOpenAttendance}
                                  onCancelTour={handleOpenCancel}
                                  onViewAttendanceList={onViewTourAttendance}
                                  onViewTourDetail={onViewTourDetail}
                                  onEditTour={!isUser ? onEditTour : undefined}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary bg-white rounded-custom border border-border border-dashed">
                  <MapIcon size={48} className="mx-auto mb-3 text-text-disabled" />
                  <p>Nenhum passeio encontrado {selectedCategoryFilter ? `na categoria "${selectedCategoryFilter}"` : ''}.</p>
                  {selectedCategoryFilter && (
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="mt-4 text-sm text-primary hover:underline"
                    >
                      Ver todos os passeios
                    </button>
                  )}
                </div>
              )}

              {tours.length === 0 && (
                <div className="text-center py-12 text-text-secondary bg-white rounded-custom border border-border border-dashed">
                  <MapIcon size={48} className="mx-auto mb-3 text-text-disabled" />
                  <p>Nenhum passeio cadastrado nesta viagem.</p>
                </div>
              )}
            </>
          ) : (
            <>
              {selectedTourId && !clearTourFilter && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-sm text-primary/80">
                  <Info size={20} className="flex-shrink-0" />
                  <p>
                    Mostrando apenas grupos que confirmaram presença no passeio selecionado.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map(group => (
                  <GroupCard key={group.id} group={group} />
                ))}
                {filteredGroups.length === 0 && (
                  <div className="col-span-full text-center py-12 text-text-secondary bg-white rounded-custom border border-border border-dashed">
                    <Users size={48} className="mx-auto mb-3 text-text-disabled" />
                    {selectedTourId && !clearTourFilter ? (
                      <div>
                        <p className="font-medium mb-2">Nenhum grupo confirmou presença neste passeio ainda.</p>
                        <p className="text-sm text-text-disabled">Os grupos precisam confirmar presença para aparecer aqui.</p>
                      </div>
                    ) : (
                      <p>Nenhum grupo cadastrado nesta viagem.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      {selectedTourForAttendance && userGroup && (
        <TourAttendanceModal 
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          tour={selectedTourForAttendance}
          group={userGroup}
          onConfirm={handleConfirmAttendance}
        />
      )}

      {/* Cancel Tour Modal */}
      {isUser && userGroup && selectedTourForCancel && (
        <CancelTourModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedTourForCancel(null);
          }}
          onConfirm={handleConfirmCancel}
          tour={selectedTourForCancel}
        />
      )}
    </div>
  );
};

export default TripDetails;