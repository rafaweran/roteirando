import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, ExternalLink, Users, Check, Plus, X } from 'lucide-react';
import Button from './Button';
import TourAttendanceModal from './TourAttendanceModal';
import CancelTourModal from './CancelTourModal';
import { Tour, Trip, Group, UserRole } from '../types';

interface TourDetailPageProps {
  tour: Tour;
  trip?: Trip;
  userRole: UserRole;
  userGroup?: Group;
  onBack: () => void;
  onConfirmAttendance?: (tourId: string, members: string[], customDate?: string | null) => void;
}

const TourDetailPage: React.FC<TourDetailPageProps> = ({
  tour,
  trip,
  userRole,
  userGroup,
  onBack,
  onConfirmAttendance
}) => {
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Verificar se o grupo já confirmou presença
  const attendance = userGroup?.tourAttendance?.[tour.id];
  let attendingMembers: string[] = [];
  let customDate: string | null = null;
  
  if (Array.isArray(attendance)) {
    attendingMembers = attendance;
  } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
    attendingMembers = attendance.members || [];
    customDate = attendance.customDate || null;
  }

  const isSelected = attendingMembers.length > 0;
  const attendanceCount = attendingMembers.length;
  const totalMembers = userGroup 
    ? (userGroup.leaderName ? userGroup.members.length + 1 : userGroup.members.length)
    : 0;
  const isPartial = attendanceCount > 0 && attendanceCount < totalMembers;
  const totalValue = tour.price * attendanceCount;

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

  const handleConfirmAttendance = (tourId: string, members: string[], customDate?: string | null) => {
    if (onConfirmAttendance) {
      onConfirmAttendance(tourId, members, customDate);
    }
    setAttendanceModalOpen(false);
  };

  const handleCancelTour = (reason: string) => {
    // Cancelar presença (salvar array vazio)
    if (onConfirmAttendance && tour.id) {
      onConfirmAttendance(tour.id, [], null);
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
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Detalhes do Passeio</h1>
          {trip && (
            <p className="text-sm text-text-secondary mt-1">{trip.name} • {trip.destination}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Informações */}
        <div className="lg:col-span-2 space-y-6">
          {/* Imagem */}
          {tour.imageUrl && (
            <div className="bg-white rounded-[24px] border border-border overflow-hidden">
              <div className="w-full h-64 md:h-96 overflow-hidden relative">
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
          <div className="bg-white rounded-[24px] border border-border p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">{tour.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <div className="bg-white rounded-[24px] border border-border p-6 sticky top-6">
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
                    >
                      Editar Confirmação
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => setCancelModalOpen(true)}
                      variant="outline"
                      className="text-status-error border-status-error/30 hover:bg-status-error/5"
                    >
                      <X size={16} className="mr-2" />
                      Cancelar Passeio
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => setAttendanceModalOpen(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Confirmar Presença
                </Button>
              )}
            </div>
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
