import React, { useState, useEffect } from 'react';
import { X, Check, Users, User } from 'lucide-react';
import Button from './Button';
import { Tour, Group } from '../types';

interface TourAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tourId: string, selectedMembers: string[]) => void;
  tour: Tour;
  group: Group;
}

const TourAttendanceModal: React.FC<TourAttendanceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tour,
  group
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Initialize selection based on existing data or select all by default if empty (optional logic)
  useEffect(() => {
    if (isOpen) {
      const existingAttendance = group.tourAttendance?.[tour.id];
      if (existingAttendance) {
        setSelectedMembers(existingAttendance);
      } else {
        // Default: Select all members initially for easier UX
        setSelectedMembers(group.members);
      }
    }
  }, [isOpen, group, tour]);

  if (!isOpen) return null;

  const handleToggleMember = (member: string) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(prev => prev.filter(m => m !== member));
    } else {
      setSelectedMembers(prev => [...prev, member]);
    }
  };

  const handleToggleAll = () => {
    if (selectedMembers.length === group.members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers([...group.members]);
    }
  };

  const handleSave = () => {
    onConfirm(tour.id, selectedMembers);
    onClose();
  };

  const allSelected = selectedMembers.length === group.members.length;
  const totalPrice = selectedMembers.length * tour.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-surface/50">
          <div className="flex items-start justify-between mb-2">
            <div>
               <h3 className="text-xl font-bold text-text-primary">Confirmar Presença</h3>
               <p className="text-sm text-text-secondary mt-1 line-clamp-1">{tour.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-text-disabled hover:text-text-primary transition-colors bg-white rounded-full border border-border hover:border-primary/30"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full w-fit">
            <Users size={14} />
            Grupo: {group.name}
          </div>
        </div>

        {/* Body - Scrollable List */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-text-primary">Quem vai participar?</span>
            <button 
              onClick={handleToggleAll}
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>

          <div className="space-y-2">
            {group.members.map((member, idx) => {
              const isSelected = selectedMembers.includes(member);
              return (
                <div 
                  key={idx}
                  onClick={() => handleToggleMember(member)}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 group
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/30 hover:bg-surface'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-text-disabled group-hover:border-primary'}
                    `}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-sm ${isSelected ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                      {member}
                    </span>
                  </div>
                  <User size={16} className={`${isSelected ? 'text-primary' : 'text-text-disabled'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface/30">
          <div className="flex justify-between items-center mb-4 text-sm">
             <span className="text-text-secondary">Total estimado:</span>
             <span className="font-bold text-lg text-text-primary">
               R$ {totalPrice.toFixed(2)} <span className="text-xs font-normal text-text-secondary">({selectedMembers.length}x)</span>
             </span>
          </div>
          <Button 
            fullWidth
            onClick={handleSave}
            disabled={selectedMembers.length === 0}
          >
            Confirmar {selectedMembers.length} Pessoa{selectedMembers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TourAttendanceModal;