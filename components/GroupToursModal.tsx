import React, { useMemo } from 'react';
import { X, Calendar, Clock, MapPin, Users, Check, ExternalLink } from 'lucide-react';
import { Group, Tour, Trip } from '../types';
import Button from './Button';

interface GroupToursModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  allTours: Tour[];
  trips: Trip[];
}

const GroupToursModal: React.FC<GroupToursModalProps> = ({ isOpen, onClose, group, allTours, trips }) => {
  if (!isOpen) return null;

  // Filtrar passeios que o grupo confirmou presença
  const confirmedTours = useMemo(() => {
    if (!group.tourAttendance) return [];

    return allTours
      .filter(tour => {
        const attendance = group.tourAttendance?.[tour.id];
        if (!attendance) return false;
        
        const members = Array.isArray(attendance) 
          ? attendance 
          : (attendance && typeof attendance === 'object' && 'members' in attendance) 
            ? attendance.members 
            : [];
        
        return members.length > 0;
      })
      .map(tour => {
        const attendance = group.tourAttendance![tour.id];
        const trip = trips.find(t => t.id === tour.tripId);
        
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
        
        return {
          ...tour,
          trip,
          attendingCount: members.length,
          attendingMembers: members,
          customDate,
          customTime,
          isPaid
        };
      })
      .sort((a, b) => {
        const dateA = a.customDate || a.date;
        const dateB = b.customDate || b.date;
        return new Date(dateA + 'T' + (a.customTime || a.time)).getTime() - 
               new Date(dateB + 'T' + (b.customTime || b.time)).getTime();
      });
  }, [group, allTours, trips]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{group.name}</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>{group.membersCount} integrante{group.membersCount !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{confirmedTours.length} passeio{confirmedTours.length !== 1 ? 's' : ''} confirmado{confirmedTours.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-full text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {confirmedTours.length > 0 ? (
            confirmedTours.map((tour) => (
              <div 
                key={tour.id}
                className="bg-surface rounded-2xl border border-border p-4 hover:border-primary/30 transition-all group"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Tour Image */}
                  {tour.imageUrl && (
                    <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={tour.imageUrl} alt={tour.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-text-primary text-lg leading-tight">{tour.name}</h3>
                      {tour.isPaid ? (
                        <span className="flex-shrink-0 px-2 py-1 bg-status-success text-white text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Check size={10} strokeWidth={4} />
                          Pago
                        </span>
                      ) : (
                        <span className="flex-shrink-0 px-2 py-1 bg-status-error/10 text-status-error text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          Pendente
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-3">
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <Calendar size={14} className="text-primary" />
                        <span className={tour.customDate ? "text-primary font-bold" : ""}>
                          {formatDate(tour.customDate || tour.date)}
                          {tour.customDate && " (Alterado)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <Clock size={14} className="text-primary" />
                        <span className={tour.customTime ? "text-primary font-bold" : ""}>
                          {tour.customTime || tour.time}
                          {tour.customTime && " (Alterado)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <Users size={14} className="text-primary" />
                        <span>{tour.attendingCount} pessoa{tour.attendingCount !== 1 ? 's' : ''} confirmada{tour.attendingCount !== 1 ? 's' : ''}</span>
                      </div>
                      {tour.address && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium truncate">
                          <MapPin size={14} className="text-primary flex-shrink-0" />
                          <span className="truncate">{tour.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Members names */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tour.attendingMembers.map((name, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-border rounded text-[10px] text-text-primary">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-text-disabled">
                <Calendar size={32} />
              </div>
              <p className="text-text-secondary font-medium">Este grupo ainda não confirmou nenhum passeio.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface/30 flex justify-end">
          <Button onClick={onClose} variant="outline" className="px-8">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupToursModal;
