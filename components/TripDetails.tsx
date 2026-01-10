import React, { useState, useEffect } from 'react';
import { Trip, Tour, Group, UserRole } from '../types';
import { Calendar, MapPin, Map as MapIcon, Users, ArrowLeft, Plus, Camera, ExternalLink, Info } from 'lucide-react';
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
  initialTab?: 'tours' | 'groups';
  userRole?: UserRole;
  userGroup?: Group;
  onSaveAttendance?: (tourId: string, members: string[], cancelReason?: string) => void;
  onViewTourAttendance?: (tour: Tour) => void;
  onViewTourDetail?: (tour: Tour) => void;
}

type Tab = 'tours' | 'groups';

const TripDetails: React.FC<TripDetailsProps> = ({ 
  trip, 
  tours, 
  groups, 
  onBack, 
  onAddTour, 
  onAddGroup,
  initialTab = 'tours',
  userRole = 'admin',
  userGroup,
  onSaveAttendance,
  onViewTourAttendance,
  onViewTourDetail
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedTourForAttendance, setSelectedTourForAttendance] = useState<Tour | null>(null);
  const [selectedTourForCancel, setSelectedTourForCancel] = useState<Tour | null>(null);

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
                Famílias / Grupos ({groups.length})
            </button>
            </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center py-2 gap-4">
          <div>
              <h2 className="text-xl font-bold text-text-primary">
                {isUser ? 'Passeios Disponíveis' : (activeTab === 'tours' ? 'Passeios Disponíveis' : 'Grupos Participantes')}
              </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map(tour => {
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
                  />
                );
              })}
              {tours.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary bg-white rounded-custom border border-border border-dashed">
                  <MapIcon size={48} className="mx-auto mb-3 text-text-disabled" />
                  <p>Nenhum passeio cadastrado nesta viagem.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
              {groups.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary bg-white rounded-custom border border-border border-dashed">
                  <Users size={48} className="mx-auto mb-3 text-text-disabled" />
                  <p>Nenhum grupo cadastrado nesta viagem.</p>
                </div>
              )}
            </div>
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