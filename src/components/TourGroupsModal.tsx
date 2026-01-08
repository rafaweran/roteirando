import React from 'react';
import { X, Users, User, DollarSign, MapPin, Calendar, Clock } from 'lucide-react';
import { Tour, Group } from '../types';

interface TourGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  allGroups: Group[];
}

const TourGroupsModal: React.FC<TourGroupsModalProps> = ({
  isOpen,
  onClose,
  tour,
  allGroups
}) => {
  if (!isOpen) return null;

  // Filter groups that have attendance for this tour
  const attendingGroups = allGroups.filter(g => 
    g.tourAttendance && 
    g.tourAttendance[tour.id] && 
    g.tourAttendance[tour.id].length > 0
  ).map(g => ({
    ...g,
    attendingCount: g.tourAttendance![tour.id].length,
    attendingNames: g.tourAttendance![tour.id]
  }));

  const totalPeople = attendingGroups.reduce((acc, curr) => acc + curr.attendingCount, 0);
  const totalRevenue = totalPeople * tour.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-surface/50">
          <div className="flex items-start justify-between mb-4">
            <div>
               <h3 className="text-xl font-bold text-text-primary">Lista de Adesão</h3>
               <p className="text-sm text-text-secondary mt-1 line-clamp-1">{tour.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-text-disabled hover:text-text-primary transition-colors bg-white rounded-full border border-border hover:border-primary/30"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
             <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-border/50">
                <Calendar size={14} className="text-primary" />
                {new Date(tour.date).toLocaleDateString()}
             </div>
             <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-border/50">
                <Clock size={14} className="text-primary" />
                {tour.time}
             </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border bg-white">
            <div className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Confirmado</span>
                <div className="flex items-center gap-2 text-primary">
                    <Users size={20} />
                    <span className="text-2xl font-bold">{totalPeople}</span>
                </div>
            </div>
            <div className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Receita Estimada</span>
                <div className="flex items-center gap-2 text-status-success">
                    <span className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>

        {/* Body - List */}
        <div className="p-0 overflow-y-auto flex-1 bg-surface/30">
            {attendingGroups.length > 0 ? (
                <div className="divide-y divide-border">
                    {attendingGroups.map((group) => (
                        <div key={group.id} className="p-4 hover:bg-white transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {group.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-primary">{group.name}</h4>
                                        <div className="flex items-center text-xs text-text-secondary">
                                            <User size={12} className="mr-1" />
                                            Resp: {group.leaderName}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white">
                                        {group.attendingCount} pessoas
                                    </span>
                                    <p className="text-xs text-text-secondary mt-1">
                                        R$ {(group.attendingCount * tour.price).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Expandable list of names (simple version: just list them small) */}
                            <div className="pl-[52px]">
                                <p className="text-xs text-text-disabled leading-relaxed">
                                    <span className="font-medium text-text-secondary">Integrantes: </span>
                                    {group.attendingNames.join(', ')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-text-disabled">
                    <Users size={48} className="mb-3 opacity-20" />
                    <p>Nenhum grupo confirmou presença neste passeio ainda.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TourGroupsModal;