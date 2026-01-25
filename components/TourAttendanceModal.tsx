import React, { useState, useEffect } from 'react';
import { X, Check, Users, User, Calendar, DollarSign } from 'lucide-react';
import Button from './Button';
import DatePicker from './DatePicker';
import { Tour, Group, TourAttendanceInfo } from '../types';

interface TourAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tourId: string, selectedMembers: string[], customDate?: string | null, customTime?: string | null, selectedPriceKey?: string, priceQuantities?: Record<string, number>) => void;
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
  const [customTime, setCustomTime] = useState<string>('');
  const [selectedPriceKey, setSelectedPriceKey] = useState<string>(''); // Chave do tipo de ingresso selecionado (DEPRECATED - manter para compatibilidade)
  const [priceQuantities, setPriceQuantities] = useState<Record<string, number>>({}); // Quantidade de cada tipo de ingresso

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
        
        if (attendanceInfo.customTime) {
          setCustomTime(attendanceInfo.customTime);
        } else {
          setCustomTime('');
        }
        
        // Restaurar quantidades de tipos de ingresso se existir (nova versão)
        if (attendanceInfo.priceQuantities) {
          setPriceQuantities(attendanceInfo.priceQuantities);
          console.log('✅ TourAttendanceModal - Restaurando priceQuantities do attendance:', attendanceInfo.priceQuantities);
        } else if (attendanceInfo.selectedPriceKey) {
          // Compatibilidade com versão antiga (apenas um tipo de ingresso)
          setPriceQuantities({ [attendanceInfo.selectedPriceKey]: attendanceInfo.members.length });
          setSelectedPriceKey(attendanceInfo.selectedPriceKey);
          console.log('✅ TourAttendanceModal - Convertendo selectedPriceKey antigo para priceQuantities:', attendanceInfo.selectedPriceKey);
        } else {
          // Se não houver nada, inicializar vazio
          setPriceQuantities({});
        }
      } else {
        // Default: Select all members (including leader) initially for easier UX
        setSelectedMembers([...allGroupMembers]);
        setDateOption('group');
        setCustomDate('');
        // Inicializar quantidades vazias
        setPriceQuantities({});
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
    const finalCustomTime = dateOption === 'custom' && customTime ? customTime : null;
    
    // Filtrar apenas quantidades maiores que zero
    const validPriceQuantities = Object.fromEntries(
      Object.entries(priceQuantities).filter(([_, qty]) => qty > 0)
    );
    
    console.log('💾 TourAttendanceModal - Salvando confirmação:', {
      tourId: tour.id,
      tourName: tour.name,
      selectedMembers: selectedMembers.length,
      finalCustomDate,
      finalCustomTime,
      priceQuantities: validPriceQuantities,
      totalPeople: totalPeopleFromPrices,
      totalPrice: calculateTotalPrice()
    });
    
    // Passar quantidades de tipos de ingresso
    onConfirm(tour.id, selectedMembers, finalCustomDate, finalCustomTime, undefined, validPriceQuantities);
    onClose();
  };

  const allSelected = selectedMembers.length === totalGroupMembers;
  
  // Calcular preço total baseado nas quantidades de cada tipo de ingresso
  const calculateTotalPrice = () => {
    if (!tour.prices || Object.keys(tour.prices).length === 0) {
      // Se não houver preços dinâmicos, usar preço padrão
      return selectedMembers.length * tour.price;
    }
    
    let total = 0;
    Object.entries(priceQuantities).forEach(([key, quantity]) => {
      if (quantity > 0 && tour.prices && tour.prices[key as keyof typeof tour.prices]) {
        const priceData = tour.prices[key as keyof typeof tour.prices];
        if (priceData && priceData.value !== undefined) {
          total += quantity * priceData.value;
        }
      }
    });
    
    return total;
  };
  
  const totalPrice = calculateTotalPrice();
  
  // Calcular total de pessoas selecionadas via quantidades de ingresso
  const totalPeopleFromPrices = Object.values(priceQuantities).reduce((sum, qty) => sum + qty, 0);

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
                    <div className="space-y-3 mt-2">
                      <DatePicker
                        label="Data"
                        value={customDate}
                        onChange={(date) => setCustomDate(date)}
                        required={dateOption === 'custom'}
                      />
                      <div className="relative">
                        <label className="text-xs font-medium text-text-secondary mb-1 block">Horário</label>
                        <div className="relative">
                          <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required={dateOption === 'custom'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Seção: Tipos de Ingresso (se houver múltiplos preços) */}
          {tour.prices && Object.keys(tour.prices).length > 0 && (
            <div className="bg-surface/50 rounded-xl p-4 border border-border">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <DollarSign size={16} />
                Tipos de Ingresso
              </h4>
              <p className="text-xs text-text-secondary mb-4">
                Informe quantas pessoas de cada tipo irão participar
              </p>
              
              <div className="space-y-3">
                {Object.entries(tour.prices).map(([key, priceData]) => {
                  if (!priceData || priceData.value === undefined) return null;
                  const quantity = priceQuantities[key] || 0;
                  const hasDiscount = priceData.hasDiscount && priceData.originalValue && priceData.discountPercent;
                  
                  return (
                    <div 
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-text-primary">
                          {priceData.description || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <span className="text-xs text-text-secondary line-through">
                                R$ {priceData.originalValue!.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-sm font-bold text-status-success">
                                R$ {priceData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded">
                                {priceData.discountPercent}% OFF
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              R$ {priceData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = Math.max(0, quantity - 1);
                            setPriceQuantities(prev => ({ ...prev, [key]: newQty }));
                          }}
                          className="w-8 h-8 rounded-lg border border-border bg-white hover:bg-surface text-text-primary font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                          disabled={quantity === 0}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={totalGroupMembers}
                          value={quantity}
                          onChange={(e) => {
                            const newQty = Math.max(0, Math.min(totalGroupMembers, parseInt(e.target.value) || 0));
                            setPriceQuantities(prev => ({ ...prev, [key]: newQty }));
                          }}
                          className="w-14 h-8 text-center border border-border rounded-lg text-sm font-semibold text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = Math.min(totalGroupMembers, quantity + 1);
                            setPriceQuantities(prev => ({ ...prev, [key]: newQty }));
                          }}
                          className="w-8 h-8 rounded-lg border border-border bg-white hover:bg-surface text-text-primary font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                          disabled={totalPeopleFromPrices >= totalGroupMembers}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {totalPeopleFromPrices > 0 && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Total de pessoas:</span>
                    <span className="font-bold text-primary">{totalPeopleFromPrices}</span>
                  </div>
                </div>
              )}
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
               R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
               {totalPeopleFromPrices > 0 && (
                 <span className="text-xs font-normal text-text-secondary ml-1">
                   ({totalPeopleFromPrices}x)
                 </span>
               )}
             </span>
          </div>
          <Button 
            fullWidth
            onClick={handleSave}
            disabled={tour.prices && Object.keys(tour.prices).length > 0 ? totalPeopleFromPrices === 0 : selectedMembers.length === 0}
          >
            {tour.prices && Object.keys(tour.prices).length > 0 
              ? `Confirmar ${totalPeopleFromPrices} Pessoa${totalPeopleFromPrices !== 1 ? 's' : ''}`
              : `Confirmar ${selectedMembers.length} Pessoa${selectedMembers.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TourAttendanceModal;