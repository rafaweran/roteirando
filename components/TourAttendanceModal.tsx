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

  // Criar lista completa incluindo o líder
  // O líder sempre deve estar incluído na lista de membros disponíveis
  // IMPORTANTE: useMemo sempre é chamado, mesmo se group for undefined
  const allMembersIncludingLeader = React.useMemo(() => {
    if (!group) return [];
    const members = [...(group.members || [])];
    // Adicionar líder se não estiver na lista e se o líder existir
    if (group.leaderName && !members.includes(group.leaderName)) {
      members.unshift(group.leaderName); // Adicionar no início
    }
    return members;
  }, [group?.members, group?.leaderName]);

  // Initialize selection based on existing data or select all by default if empty (optional logic)
  // IMPORTANTE: useEffect sempre é chamado, mas o conteúdo interno é condicional
  useEffect(() => {
    // Só atualizar quando o modal abrir
    if (!isOpen) {
      return; // Early return dentro do useEffect é seguro
    }
    
    try {
      const existingAttendance = group.tourAttendance?.[tour.id];
      if (existingAttendance && existingAttendance.length > 0) {
        // Garantir que o líder está incluído se já havia presença confirmada
        const attendanceWithLeader = [...existingAttendance];
        if (group.leaderName && !attendanceWithLeader.includes(group.leaderName)) {
          attendanceWithLeader.unshift(group.leaderName);
        }
        setSelectedMembers(attendanceWithLeader);
      } else {
        // Default: Select all members including leader initially
        setSelectedMembers([...allMembersIncludingLeader]);
      }
    } catch (error) {
      console.error('Erro ao inicializar seleção:', error);
      // Fallback: selecionar apenas o líder ou lista vazia
        setSelectedMembers(group?.leaderName ? [group.leaderName] : []);
    }
  }, [isOpen, group?.id, group?.tourAttendance, tour?.id, allMembersIncludingLeader]);

  // Calcular com líder sempre incluído
  // IMPORTANTE: useMemo sempre é chamado, mesmo se group for undefined
  const membersWithLeader = React.useMemo(() => {
    const members = [...selectedMembers];
    if (group?.leaderName && !members.includes(group.leaderName)) {
      members.unshift(group.leaderName);
    }
    return members;
  }, [selectedMembers, group?.leaderName]);
  
  const allSelected = selectedMembers.length === allMembersIncludingLeader.length;
  const totalPrice = membersWithLeader.length * tour.price;

  // IMPORTANTE: return null DEPOIS de todos os hooks para evitar erro "Rendered fewer hooks"
  if (!isOpen) return null;

  const handleToggleMember = (member: string) => {
    // O líder não pode ser desmarcado - sempre deve estar presente
    if (group?.leaderName && member === group.leaderName) {
      return; // Não permitir desmarcar o líder
    }
    
    if (selectedMembers.includes(member)) {
      setSelectedMembers(prev => prev.filter(m => m !== member));
    } else {
      setSelectedMembers(prev => [...prev, member]);
    }
  };

  const handleToggleAll = () => {
    // Quando desmarcar todos, manter apenas o líder
    // Quando marcar todos, incluir todos incluindo o líder
    const hasAllSelected = selectedMembers.length === allMembersIncludingLeader.length;
    
    if (hasAllSelected) {
      // Desmarcar todos, mas manter o líder se existir
        setSelectedMembers(group?.leaderName ? [group.leaderName] : []);
    } else {
      // Selecionar todos incluindo o líder
      setSelectedMembers([...allMembersIncludingLeader]);
    }
  };

  const handleSave = () => {
    try {
      // Garantir que o líder sempre está incluído na lista de presença
      const membersToSave = [...selectedMembers];
      if (group?.leaderName && !membersToSave.includes(group.leaderName)) {
        membersToSave.unshift(group.leaderName); // Adicionar líder no início se não estiver
      }
      
      // Validar que temos pelo menos o líder ou algum membro
      if (membersToSave.length === 0) {
        console.warn('⚠️ Tentando salvar lista vazia de membros');
        return; // Não salvar se não houver ninguém
      }
      
      console.log('💾 Salvando presença:', {
        tourId: tour.id,
        members: membersToSave,
        leaderIncluded: group?.leaderName ? membersToSave.includes(group.leaderName) : false,
        totalCount: membersToSave.length,
      });
      
      // Fechar o modal primeiro para evitar problemas de estado
      onClose();
      
      // Chamar onConfirm após fechar o modal para evitar problemas de renderização
      setTimeout(() => {
        try {
          onConfirm(tour.id, membersToSave);
        } catch (error) {
          console.error('❌ Erro ao chamar onConfirm:', error);
        }
      }, 0);
    } catch (error) {
      console.error('❌ Erro ao salvar presença:', error);
      // Não fechar o modal se houver erro
    }
  };

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
            {allMembersIncludingLeader.map((member, idx) => {
              const isLeader = group?.leaderName ? member === group.leaderName : false;
              // Líder sempre está selecionado (não pode ser desmarcado)
              const isSelected = isLeader ? true : selectedMembers.includes(member);
              
              return (
                <div 
                  key={idx}
                  onClick={() => !isLeader && handleToggleMember(member)}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group
                    ${isLeader 
                      ? 'cursor-not-allowed border-primary/40 bg-primary/10 ring-1 ring-primary/30' 
                      : 'cursor-pointer border-border hover:border-primary/30 hover:bg-surface'
                    }
                    ${isSelected && !isLeader
                      ? 'border-primary bg-primary/5' 
                      : ''
                    }
                  `}
                  title={isLeader ? 'O líder sempre participa e não pode ser desmarcado' : ''}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-text-disabled group-hover:border-primary'}
                      ${isLeader ? 'ring-1 ring-primary/50' : ''}
                    `}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isSelected ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                        {member}
                      </span>
                      {isLeader && (
                        <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium border border-primary/30">
                          Líder
                        </span>
                      )}
                    </div>
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
               R$ {totalPrice.toFixed(2)} <span className="text-xs font-normal text-text-secondary">({membersWithLeader.length}x)</span>
             </span>
          </div>
          <Button 
            fullWidth
            onClick={handleSave}
            disabled={membersWithLeader.length === 0}
          >
            Confirmar {membersWithLeader.length} Pessoa{membersWithLeader.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TourAttendanceModal;