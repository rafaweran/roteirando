import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, User, Phone, Mail, Baby, Plus, X, Check, Map } from 'lucide-react';
import { Trip } from '../types';
import { tripsApi } from '../lib/database';
import Input from './Input';
import Button from './Button';

interface NewGroupFormProps {
  trip?: Trip; // Made optional
  onSave: (data: any) => void;
  onCancel: () => void;
}

const NewGroupForm: React.FC<NewGroupFormProps> = ({ trip, onSave, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  
  // Trip Selection State (if no trip prop provided)
  const [selectedTripId, setSelectedTripId] = useState<string>(trip?.id || '');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    totalPeople: '',
    leaderName: '',
    leaderPhone: '',
    leaderEmail: '',
    hasChildren: false,
    childrenCount: '',
  });

  // Members List State
  const [currentMember, setCurrentMember] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  // Load trips if no trip prop provided
  useEffect(() => {
    if (!trip) {
      const loadTrips = async () => {
        try {
          setLoadingTrips(true);
          const data = await tripsApi.getAll();
          setAvailableTrips(data);
        } catch (err: any) {
          console.error('Erro ao carregar viagens:', err);
          setAvailableTrips([]);
        } finally {
          setLoadingTrips(false);
        }
      };
      loadTrips();
    }
  }, [trip]);

  // Derived state for the active trip context
  const activeTrip = trip || availableTrips.find(t => t.id === selectedTripId);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMember = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (currentMember.trim()) {
      setMembers([...members, currentMember.trim()]);
      setCurrentMember('');
    }
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for Global Mode
    if (!activeTrip) {
      alert("Por favor, selecione uma viagem para este grupo.");
      return;
    }

    setIsLoading(true);
    
    const finalData = {
      ...formData,
      members,
      tripId: activeTrip.id
    };

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSave(finalData);
    }, 1000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary-light transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Novo Grupo</h1>
          {activeTrip ? (
            <p className="text-text-secondary text-sm">
              Viagem: {activeTrip.name}
            </p>
          ) : (
             <p className="text-text-secondary text-sm">
              Selecione a viagem abaixo
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">

          {/* Trip Selector (Only visible if no trip prop passed) */}
          {!trip && (
            <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
               <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                <Map size={20} className="text-primary" />
                Vincular à Viagem
              </h2>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tripSelect" className="text-sm font-medium text-text-primary">
                  Selecione a Viagem *
                </label>
                <div className="relative">
                  <select
                    id="tripSelect"
                    className="w-full h-[48px] appearance-none rounded-custom border border-border bg-white px-4 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {loadingTrips ? 'Carregando viagens...' : 'Selecione uma viagem...'}
                    </option>
                    {availableTrips.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.destination})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Dados do Grupo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                id="name"
                label="Nome do Grupo *"
                placeholder="Ex: Família Rodrigues"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <Input 
                id="totalPeople"
                type="number"
                label="Quantidade de Pessoas *"
                placeholder="0"
                min="1"
                value={formData.totalPeople}
                onChange={(e) => handleChange('totalPeople', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Responsible Person */}
          <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Responsável pelo Grupo
            </h2>

            <div className="space-y-6">
              <Input 
                id="leaderName"
                label="Nome do Responsável *"
                placeholder="Nome completo"
                value={formData.leaderName}
                onChange={(e) => handleChange('leaderName', e.target.value)}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  id="leaderPhone"
                  type="tel"
                  label="WhatsApp *"
                  placeholder="(00) 00000-0000"
                  icon={Phone}
                  value={formData.leaderPhone}
                  onChange={(e) => handleChange('leaderPhone', e.target.value)}
                  required
                />
                <Input 
                  id="leaderEmail"
                  type="email"
                  label="E-mail *"
                  placeholder="email@exemplo.com"
                  icon={Mail}
                  value={formData.leaderEmail}
                  onChange={(e) => handleChange('leaderEmail', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Children */}
          <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Baby size={20} className="text-primary" />
              Crianças
            </h2>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Há crianças no grupo?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleChange('hasChildren', true)}
                    className={`flex-1 py-3 px-4 rounded-custom border transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                      formData.hasChildren 
                        ? 'bg-primary/5 border-primary text-primary' 
                        : 'bg-white border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {formData.hasChildren && <Check size={16} />}
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('hasChildren', false);
                      handleChange('childrenCount', '');
                    }}
                    className={`flex-1 py-3 px-4 rounded-custom border transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                      !formData.hasChildren 
                        ? 'bg-primary/5 border-primary text-primary' 
                        : 'bg-white border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {!formData.hasChildren && <Check size={16} />}
                    Não
                  </button>
                </div>
              </div>

              {formData.hasChildren && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input 
                    id="childrenCount"
                    type="number"
                    label="Quantidade de Crianças"
                    placeholder="0"
                    min="0"
                    value={formData.childrenCount}
                    onChange={(e) => handleChange('childrenCount', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Members List */}
          <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Lista de Integrantes
            </h2>

            <div className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input 
                    id="addMember"
                    label="Adicionar Integrante"
                    placeholder="Nome da pessoa"
                    value={currentMember}
                    onChange={(e) => setCurrentMember(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={() => handleAddMember()}
                  disabled={!currentMember.trim()}
                  className="mb-[1px]" // Align with input
                >
                  <Plus size={20} />
                </Button>
              </div>

              {members.length > 0 ? (
                <div className="bg-surface rounded-custom p-4 border border-border space-y-2 max-h-60 overflow-y-auto">
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border/50 shadow-sm animate-in fade-in slide-in-from-left-2">
                      <span className="font-medium text-text-primary">{member}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="text-text-disabled hover:text-status-error transition-colors p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text-disabled text-sm italic border border-dashed border-border rounded-custom">
                  Nenhum integrante adicionado à lista ainda.
                </div>
              )}
              
              <p className="text-xs text-text-secondary">
                * Adicione o nome de todos os participantes do grupo para controle da viagem.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="w-full sm:w-auto px-8"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              isLoading={isLoading}
              className="w-full sm:w-auto px-8"
            >
              Salvar Grupo
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewGroupForm;