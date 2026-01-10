import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, MoreVertical, Filter, Download, Edit, Trash2, Users, X, DollarSign, CheckCircle2, Circle, Plus } from 'lucide-react';
import { toursApi, tripsApi } from '../lib/database';
import Button from './Button';
import Modal from './Modal';
import { Tour, Trip } from '../types';

interface ToursListProps {
  onEdit: (tour: Tour) => void;
  onViewGroup: (tripId: string) => void;
  onDelete: (tourId: string) => void;
  onAddTour?: () => void;
}

const ToursList: React.FC<ToursListProps> = ({ onEdit, onViewGroup, onDelete, onAddTour }) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    selectedTags: [] as string[]
  });
  
  // Available tags from all tours
  const availableTags = Array.from(
    new Set(
      tours.flatMap(tour => tour.tags || [])
    )
  ).sort();

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [toursData, tripsData] = await Promise.all([
          toursApi.getAll(),
          tripsApi.getAll()
        ]);
        setTours(toursData);
        setTrips(tripsData);
        console.log('✅ ToursList: Dados carregados', { tours: toursData.length, trips: tripsData.length });
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setTours([]);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.action-menu-container') === null) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleAction = (action: string, tour: Tour) => {
    setActiveMenuId(null);
    if (action === 'view-group') {
      onViewGroup(tour.tripId);
    } else if (action === 'edit') {
      onEdit(tour);
    } else if (action === 'delete') {
      setTourToDelete(tour);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (tourToDelete) {
      onDelete(tourToDelete.id);
      setDeleteModalOpen(false);
      setTourToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      date: '',
      status: 'all',
      minPrice: '',
      maxPrice: '',
      selectedTags: []
    });
    setSearchTerm('');
  };

  const handleToggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  // Join Tours with Trip data to access Trip Status and Name
  const enrichedTours = tours.map(tour => {
    const trip = trips.find(t => t.id === tour.tripId);
    return {
      ...tour,
      tripName: trip ? trip.name : 'Viagem desconhecida',
      tripDestination: trip ? trip.destination : '',
      tripStatus: trip ? trip.status : ''
    };
  });

  // Advanced Filtering Logic
  const filteredTours = enrichedTours.filter(tour => {
    // Text Search
    const matchesSearch = 
      tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Date Filter
    const matchesDate = !filters.date || tour.date === filters.date;

    // Status Filter (based on Trip Status)
    const matchesStatus = filters.status === 'all' || tour.tripStatus === filters.status;

    // Price Filter
    const matchesMinPrice = !filters.minPrice || tour.price >= Number(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || tour.price <= Number(filters.maxPrice);

    // Tags Filter - tour must have at least one of the selected tags
    const matchesTags = filters.selectedTags.length === 0 || 
      (tour.tags && tour.tags.some(tag => filters.selectedTags.includes(tag)));

    return matchesSearch && matchesDate && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesTags;
  });

  const activeFiltersCount = [
    filters.date, 
    filters.status !== 'all', 
    filters.minPrice, 
    filters.maxPrice,
    filters.selectedTags.length > 0
  ].filter(Boolean).length;

  const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos', colorClass: 'bg-text-primary text-white' },
    { value: 'active', label: 'Em andamento', colorClass: 'bg-status-success text-white' },
    { value: 'upcoming', label: 'Próxima', colorClass: 'bg-primary text-white' },
    { value: 'completed', label: 'Finalizada', colorClass: 'bg-text-disabled text-white' },
  ];

  // Reusable Action Menu Component
  const ActionMenu = ({ tour }: { tour: any }) => (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-1 flex flex-col gap-0.5">
        <button 
          onClick={() => handleAction('view-group', tour)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors text-left"
        >
          <Users size={16} />
          Visualizar Grupo
        </button>
        <button 
          onClick={() => handleAction('edit', tour)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors text-left"
        >
          <Edit size={16} />
          Editar Passeio
        </button>
        <div className="h-px bg-border my-1 mx-2"></div>
        <button 
          onClick={() => handleAction('delete', tour)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-status-error hover:bg-status-error/5 rounded-lg transition-colors text-left font-medium"
        >
          <Trash2 size={16} />
          Deletar
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Todos os Passeios</h1>
            <p className="text-text-secondary mt-1">Gerencie os passeios de todas as viagens cadastradas</p>
          </div>
          <div className="flex gap-2">
            {onAddTour && (
              <Button 
                className="h-10 px-4 text-sm"
                onClick={onAddTour}
              >
                <Plus size={18} className="mr-2" />
                Novo Passeio
              </Button>
            )}
            <Button variant="outline" className="h-10 px-4 text-sm">
              <Download size={18} className="mr-2" />
              Exportar
            </Button>
            <Button 
              variant={showFilters ? 'primary' : 'outline'} 
              className="h-10 px-4 text-sm relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} className="mr-2" />
              Filtrar
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-status-error text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filter & Search Container */}
        <div className="bg-white p-5 rounded-custom border border-border mb-6 shadow-sm space-y-5 transition-all duration-300">
          
          {/* Advanced Filters Section */}
          {showFilters && (
            <div className="space-y-5 animate-in slide-in-from-top-2 fade-in duration-200 border-b border-border pb-5">
              
              {/* Row 1: Status Segmented Control */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary ml-1">Status da Viagem</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => {
                    const isActive = filters.status === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFilters({ ...filters, status: option.value })}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border
                          ${isActive
                            ? `${option.colorClass} border-transparent shadow-md`
                            : 'bg-surface text-text-secondary border-transparent hover:border-border hover:text-text-primary'
                          }
                        `}
                      >
                        {isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Tags/Categories Filter */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary ml-1">Categorias / Tipos</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = filters.selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border
                            ${isSelected
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-surface text-text-secondary border-border hover:border-primary/50 hover:text-primary'
                            }
                          `}
                        >
                          {isSelected ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-text-disabled ml-1">
                    Selecione uma ou mais categorias para filtrar os passeios
                  </p>
                </div>
              )}

              {/* Row 3: Date and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1">Data do Passeio</label>
                  <div className="relative group">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-hover:text-primary transition-colors" />
                    <input 
                      type="date"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-border text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                      value={filters.date}
                      onChange={(e) => setFilters({...filters, date: e.target.value})}
                    />
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-1.5">
                   <label className="text-xs font-medium text-text-secondary ml-1">Faixa de Preço</label>
                   <div className="flex items-center gap-2">
                      <div className="relative flex-1 group">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-hover:text-primary transition-colors" />
                        <input 
                          type="number" 
                          placeholder="Mín"
                          min="0"
                          className="w-full h-10 pl-8 pr-3 rounded-lg border border-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                        />
                      </div>
                      <span className="text-text-disabled">-</span>
                      <div className="relative flex-1 group">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-hover:text-primary transition-colors" />
                        <input 
                          type="number" 
                          placeholder="Máx"
                          min="0"
                          className="w-full h-10 pl-8 pr-3 rounded-lg border border-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar & Clear Action */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors z-10" />
              <input
                type="text"
                placeholder="Buscar por nome do passeio, cidade ou viagem..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {(activeFiltersCount > 0 || searchTerm) && (
              <button 
                onClick={handleClearFilters}
                className="flex items-center justify-center px-4 h-10 text-sm font-medium text-text-secondary bg-surface hover:bg-status-error/10 hover:text-status-error rounded-lg transition-colors border border-transparent hover:border-status-error/20"
              >
                <X size={16} className="mr-2" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {filteredTours.length > 0 ? (
          <>
            {/* MOBILE VIEW: Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {filteredTours.map((tour) => (
                <div key={tour.id} className="bg-white rounded-[20px] border border-border p-5 shadow-sm relative overflow-visible">
                  {/* Card Header */}
                  <div className="flex gap-4 mb-4">
                     {tour.imageUrl ? (
                        <img src={tour.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-border shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
                          <MapPin size={24} className="text-text-disabled" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary line-clamp-1">{tour.name}</h3>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-1">{tour.description}</p>
                      </div>
                      
                      {/* Action Menu Mobile */}
                      <div className="relative action-menu-container">
                        <button 
                          onClick={(e) => handleToggleMenu(e, tour.id)}
                          className={`p-2 rounded-full transition-colors ${activeMenuId === tour.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                        >
                          <MoreVertical size={20} />
                        </button>
                        {activeMenuId === tour.id && <ActionMenu tour={tour} />}
                      </div>
                  </div>

                  {/* Card Body Info */}
                  <div className="space-y-3 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-primary">
                          <MapPin size={12} />
                        </div>
                        Viagem
                      </span>
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md max-w-[150px] truncate">
                        {tour.tripName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-primary">
                          <Calendar size={12} />
                        </div>
                        Data & Hora
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {new Date(tour.date).toLocaleDateString()} às {tour.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-primary">
                          <Clock size={12} />
                        </div>
                        Preço
                      </span>
                      <span className="text-lg font-bold text-text-primary">
                        {tour.prices ? (
                          (() => {
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
                            return `R$ ${tour.price.toFixed(2)}`;
                          })()
                        ) : (
                          `R$ ${tour.price.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    {/* Tags */}
                    {tour.tags && tour.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                        {tour.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-custom border border-border shadow-sm overflow-visible"> 
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Passeio</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Viagem Associada</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Data & Hora</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Valor</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTours.map((tour) => (
                      <tr key={tour.id} className="hover:bg-surface/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {tour.imageUrl ? (
                              <img src={tour.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-border shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                                <MapPin size={18} className="text-text-disabled" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-text-primary">{tour.name}</p>
                              <p className="text-xs text-text-secondary truncate max-w-[200px] mt-0.5">{tour.description}</p>
                              {/* Tags */}
                              {tour.tags && tour.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {tour.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                             <span className={`w-1.5 h-1.5 rounded-full ${
                                tour.tripStatus === 'active' ? 'bg-status-success' :
                                tour.tripStatus === 'upcoming' ? 'bg-primary' : 'bg-text-disabled'
                             }`}></span>
                             <span className="text-sm font-medium text-text-secondary hover:text-primary transition-colors cursor-default">
                              {tour.tripName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col text-sm text-text-secondary">
                            <div className="flex items-center gap-1.5 font-medium text-text-primary">
                              <Calendar size={14} className="text-primary/70" />
                              {new Date(tour.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-xs">
                              <Clock size={14} className="text-text-disabled" />
                              {tour.time}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-text-primary bg-surface px-2 py-1 rounded-md border border-border/50">
                            {tour.prices ? (
                              (() => {
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
                                return `R$ ${tour.price.toFixed(2)}`;
                              })()
                            ) : (
                              `R$ ${tour.price.toFixed(2)}`
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right relative action-menu-container">
                          <button 
                            onClick={(e) => handleToggleMenu(e, tour.id)}
                            className={`p-2 rounded-full transition-colors ${activeMenuId === tour.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeMenuId === tour.id && <ActionMenu tour={tour} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination (Common) */}
            <div className="mt-4 md:mt-0 md:border-t md:border-border px-0 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-sm text-text-secondary">
                Mostrando <span className="font-semibold text-text-primary">{filteredTours.length}</span> resultados
              </span>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-2 text-sm border border-border rounded-lg text-text-disabled cursor-not-allowed bg-surface/50">Anterior</button>
                <button className="flex-1 md:flex-none px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface hover:text-primary transition-colors shadow-sm">Próximo</button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-custom border border-border p-12 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-text-disabled">
              <Filter size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">Nenhum passeio encontrado</h3>
            <p className="text-text-secondary mb-4">Não encontramos resultados para os filtros selecionados.</p>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Passeio"
        description={`Tem certeza que deseja excluir o passeio "${tourToDelete?.name}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Sim, excluir"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default ToursList;