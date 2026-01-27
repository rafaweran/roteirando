import React from 'react';
import { Users, User, ChevronRight } from 'lucide-react';
import { Group } from '../types';

interface GroupCardProps {
  group: Group;
  onClick?: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  // Calcular resumo de pagamentos
  const attendance = group.tourAttendance || {};
  const tourIds = Object.keys(attendance);
  const confirmedCount = tourIds.length;
  const paidCount = tourIds.filter(id => {
    const att = attendance[id];
    return Array.isArray(att) ? false : !!att.isPaid;
  }).length;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-custom border border-border p-4 flex items-center justify-between hover:bg-surface/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Users size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-text-primary">{group.name}</h4>
            {confirmedCount > 0 && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                paidCount === confirmedCount 
                  ? 'bg-status-success text-white' 
                  : paidCount > 0 
                    ? 'bg-status-warning text-white' 
                    : 'bg-status-error text-white'
              }`}>
                {paidCount}/{confirmedCount} PAGOS
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-text-secondary gap-3">
            <span className="flex items-center">
              <User size={12} className="mr-1" />
              Líder: {group.leaderName}
            </span>
            <span className="w-1 h-1 rounded-full bg-text-disabled"></span>
            <span>
              {group.membersCount} integrantes
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={20} className="text-text-disabled group-hover:text-primary transition-colors" />
    </div>
  );
};

export default GroupCard;