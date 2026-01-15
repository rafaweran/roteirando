import React, { useState, useEffect } from 'react';
import { X, Check, Users, User, Calendar, DollarSign } from 'lucide-react';
import Button from './Button';
import DatePicker from './DatePicker';
import { Tour, Group, TourAttendanceInfo } from '../types';

interface TourAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tourId: string, selectedMembers: string[], customDate?: string | null, selectedPriceKey?: string) => void;
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
  const [dateOption, setDateOption] = useState<'group' | 'custom'>('group'); // 'group' = data original, 'custom' = data personalizada
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedPriceKey, setSelectedPriceKey] = useState<string>(''); // Chave do tipo de ingresso selecionado

  // Criar lista completa incluindo líder + membros
  const allGroupMembers = React.useMemo(() => {
    return group.leaderName 
      ? [group.leaderName, ...group.members]
      : group.members;
  }, [group.leaderName, group.members]);
  
  const totalGroupMembers = allGroupMembers.length;

  // Formatar data original do tour para exibição
  const formatTourDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Initialize selection based on existing data or select all by default if empty (optional logic)
  useEffect(() => {
    if (isOpen) {
      const existingAttendance = group.tourAttendance?.[tour.id];
      
      // Compatibilidade: pode ser TourAttendanceInfo ou string[] (versão antiga)
      let attendanceInfo: TourAttendanceInfo | string[] | undefined;
      if (Array.isArray(existingAttendance)) {
        // Versão antiga (apenas array de membros)
        attendanceInfo = { members: existingAttendance, customDate: null };
      } else if (existingAttendance && typeof existingAttendance === 'object' && 'members' in existingAttendance) {
        // Nova versão (TourAttendanceInfo)
        attendanceInfo = existingAttendance as TourAttendanceInfo;
      }
      
      if (attendanceInfo && !Array.isArray(attendanceInfo) && attendanceInfo.members && attendanceInfo.members.length > 0) {
        setSelectedMembers(attendanceInfo.members);
        if (attendanceInfo.customDate) {
          setDateOption('custom');
          setCustomDate(attendanceInfo.customDate);
        } else {
          setDateOption('group');
          setCustomDate('');
        }
        // Restaurar tipo de ingresso selecionado se existir
        if (attendanceInfo.selectedPriceKey) {
          setSelectedPriceKey(attendanceInfo.selectedPriceKey);
          console.log('✅ TourAttendanceModal - Restaurando selectedPriceKey do attendance:', attendanceInfo.selectedPriceKey);
        } else {
          // Se não houver tipo selecionado, usar o primeiro disponível ou vazio
          const firstKey = tour.prices ? Object.keys(tour.prices)[0] || '' : '';
          setSelectedPriceKey(firstKey);
          console.log('⚠️ TourAttendanceModal - Usando primeiro preço disponível como padrão:', firstKey);
        }
      } else {
        // Default: Select all members (including leader) initially for easier UX
        setSelectedMembers([...allGroupMembers]);
        setDateOption('group');
        setCustomDate('');
        // Selecionar o primeiro tipo de ingresso disponível por padrão
        const firstKey = tour.prices ? Object.keys(tour.prices)[0] || '' : '';
        setSelectedPriceKey(firstKey);
        console.log('✅ TourAttendanceModal - Inicializando com primeiro preço disponível:', firstKey);
      }
      
      console.log('🔄 TourAttendanceModal - Estado inicializado:', {
        selectedMembersCount: (attendanceInfo && !Array.isArray(attendanceInfo) && attendanceInfo.members) ? attendanceInfo.members.length : allGroupMembers.length,
        selectedPriceKey: (attendanceInfo && !Array.isArray(attendanceInfo) && attendanceInfo.selectedPriceKey) ? attendanceInfo.selectedPriceKey : (tour.prices ? Object.keys(tour.prices)[0] : ''),
        availablePriceKeys: tour.prices ? Object.keys(tour.prices) : []
      });
    }
  }, [isOpen, group, tour, allGroupMembers]);

  if (!isOpen) return null;

  const handleToggleMember = (member: string) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(prev => prev.filter(m => m !== member));
    } else {
      setSelectedMembers(prev => [...prev, member]);
    }
  };

  const handleToggleAll = () => {
    if (selectedMembers.length === totalGroupMembers) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers([...allGroupMembers]);
    }
  };

  const handleSave = () => {
    // Se escolheu data personalizada, usar customDate, senão null (data original)
    const finalCustomDate = dateOption === 'custom' && customDate ? customDate : null;
    // Passar o tipo de ingresso selecionado
    // IMPORTANTE: Só passar se houver preços dinâmicos E se selectedPriceKey não estiver vazio
    let finalSelectedPriceKey: string | undefined = undefined;
    if (tour.prices && Object.keys(tour.prices).length > 0) {
      if (selectedPriceKey && selectedPriceKey.trim() !== '') {
        finalSelectedPriceKey = selectedPriceKey.trim();
      } else {
        // Se selectedPriceKey está vazio mas há preços, usar o primeiro disponível como fallback
        const firstKey = Object.keys(tour.prices)[0];
        if (firstKey) {
          finalSelectedPriceKey = firstKey;
          console.warn('⚠️ TourAttendanceModal - selectedPriceKey estava vazio, usando primeiro disponível:', firstKey);
        } else {
          console.warn('⚠️ TourAttendanceModal - selectedPriceKey está vazio e não há chaves disponíveis');
        }
      }
    }
    
    console.log('💾 TourAttendanceModal - Salvando confirmação:', {
      tourId: tour.id,
      tourName: tour.name,
      selectedMembers: selectedMembers.length,
      finalCustomDate,
      selectedPriceKey,
      selectedPriceKeyType: typeof selectedPriceKey,
      selectedPriceKeyLength: selectedPriceKey?.length,
      finalSelectedPriceKey,
      finalSelectedPriceKeyType: typeof finalSelectedPriceKey,
      hasTourPrices: !!tour.prices,
      availablePriceKeys: tour.prices ? Object.keys(tour.prices) : [],
      availablePriceKeysCount: tour.prices ? Object.keys(tour.prices).length : 0,
      selectedPrice: finalSelectedPriceKey && tour.prices ? tour.prices[finalSelectedPriceKey as keyof typeof tour.prices] : null,
      willPassSelectedPriceKey: !!finalSelectedPriceKey,
      totalPrice: calculateTotalPrice()
    });
    
    onConfirm(tour.id, selectedMembers, finalCustomDate, finalSelectedPriceKey);
    onClose();
  };

  const allSelected = selectedMembers.length === totalGroupMembers;
  
  // Calcular preço total baseado no tipo de ingresso selecionado
  const calculateTotalPrice = () => {
    if (!selectedMembers.length) return 0;
    
    // Se houver preços dinâmicos e um tipo selecionado, usar esse preço
    if (tour.prices && selectedPriceKey && tour.prices[selectedPriceKey as keyof typeof tour.prices]) {
      const selectedPrice = tour.prices[selectedPriceKey as keyof typeof tour.prices];
      if (selectedPrice && selectedPrice.value !== undefined) {
        return selectedMembers.length * selectedPrice.value;
      }
    }
    
    // Caso contrário, usar preço padrão
    return selectedMembers.length * tour.price;
  };
  
  const totalPrice = calculateTotalPrice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-xl sm:rounded-[24px] shadow-2xl w-full max-w-md mx-4 sm:mx-auto relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-surface/50">
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* Seção: Data do Passeio */}
          <div className="bg-surface/50 rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Quando vai participar?
            </h4>
            
            <div className="space-y-3">
              {/* Opção 1: Ir junto com o grupo (data original) */}
              <label 
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${dateOption === 'group' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/30 hover:bg-white'
                  }
                `}
              >
                <input
                  type="radio"
                  name="dateOption"
                  value="group"
                  checked={dateOption === 'group'}
                  onChange={() => {
                    setDateOption('group');
                    setCustomDate('');
                  }}
                  className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-text-primary">
                    Ir junto com o grupo
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {formatTourDate(tour.date)}
                  </div>
                </div>
              </label>

              {/* Opção 2: Ir em outra data */}
              <label 
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${dateOption === 'custom' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/30 hover:bg-white'
                  }
                `}
              >
                <input
                  type="radio"
                  name="dateOption"
                  value="custom"
                  checked={dateOption === 'custom'}
                  onChange={() => setDateOption('custom')}
                  className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-text-primary mb-2">
                    Ir em outra data
                  </div>
                  {dateOption === 'custom' && (
                    <DatePicker
                      label=""
                      value={customDate}
                      onChange={(date) => setCustomDate(date)}
                      required={dateOption === 'custom'}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Seção: Tipo de Ingresso (apenas se houver múltiplos preços) */}
          {tour.prices && Object.keys(tour.prices).length > 1 && (
            <div className="bg-surface/50 rounded-xl p-4 border border-border">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <DollarSign size={16} />
                Tipo de Ingresso
              </h4>
              
              <div className="space-y-2">
                {Object.entries(tour.prices).map(([key, priceData]) => {
                  if (!priceData || priceData.value === undefined) return null;
                  const isSelected = selectedPriceKey === key;
                  return (
                    <label 
                      key={key}
                      className={`
                        flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30 hover:bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="radio"
                          name="priceOption"
                          value={key}
                          checked={isSelected}
                          onChange={() => {
                            console.log('🔄 TourAttendanceModal - Preço selecionado:', key);
                            setSelectedPriceKey(key);
                          }}
                          className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-text-primary">
                            {priceData.description || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-base font-bold text-primary">
                        R$ {priceData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seção: Quem vai participar */}
          <div>
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
              {allGroupMembers.map((member, idx) => {
                const isSelected = selectedMembers.includes(member);
                const isLeader = idx === 0 && group.leaderName && member === group.leaderName;
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
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isSelected ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                          {member}
                        </span>
                        {isLeader && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
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