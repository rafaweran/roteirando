import React from 'react';
import { Users, User, ChevronRight } from 'lucide-react';
import { Group } from '../types';

interface GroupCardProps {
  group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  return (
    <div className="bg-white rounded-custom border border-border p-4 flex items-center justify-between hover:bg-surface/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Users size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-text-primary">{group.name}</h4>
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