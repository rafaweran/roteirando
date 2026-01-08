import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Upload, Link as LinkIcon, MapPin, DollarSign, Image as ImageIcon, Plus, Trash2, Map } from 'lucide-react';
import { Trip, Tour, TourLink } from '../types';
import { tripsApi } from '../lib/database';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';

interface NewTourFormProps {
  trip?: Trip;
  initialData?: Tour | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const NewTourForm: React.FC<NewTourFormProps> = ({ trip, initialData, onSave, onCancel }) => {
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>(trip?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    price: '',
    currency: 'BRL',
    location: '',
  });

  const [links, setLinks] = useState<TourLink[]>([]);

  const isEditMode = !!initialData;
  const activeTrip = trip || availableTrips.find(t => t.id === selectedTripId);

  // Load trips if no trip prop provided
  useEffect(() => {
    if (!trip) {
      console.log('🔄 NewTourForm: Carregando viagens...');
      const loadTrips = async () => {
        try {
          setLoadingTrips(true);
          const data = await tripsApi.getAll();
          setAvailableTrips(data);
          console.log('✅ NewTourForm: Viagens carregadas:', data.length);
        } catch (err: any) {
          console.error('❌ NewTourForm: Erro ao carregar viagens:', err);
          setAvailableTrips([]);
        } finally {
          setLoadingTrips(false);
        }
      };
      loadTrips();
    }
  }, [trip]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        date: initialData.date,
        startTime: initialData.time,
        endTime: '', // Not in mock data
        price: initialData.price.toString(),
        currency: 'BRL',
        location: '', // Not in mock data
      });
      if (initialData.links) {
        setLinks(initialData.links);
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: keyof TourLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for Global Mode
    if (!activeTrip) {
      alert("Por favor, selecione uma viagem para este passeio.");
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSave({ 
        ...formData, 
        tripId: activeTrip.id,
        links: links.filter(l => l.title && l.url), // Filter out empty links
        id: initialData?.id 
      }); 
    }, 1000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditMode ? 'Editar Passeio' : 'Novo Passeio'}
          </h1>
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

      {/* Form Card */}
      <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Trip Selector (Only visible if no trip prop passed) */}
          {!trip && (
            <div className="bg-surface rounded-custom border border-border p-6 mb-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
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
          
          {/* Name */}
          <Input 
            id="name"
            label="Nome do passeio *"
            placeholder="Ex: Tour Vinícolas"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-text-primary">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
              placeholder="Descreva o passeio..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Date */}
          <DatePicker 
            id="date"
            label="Data do passeio *"
            value={formData.date}
            onChange={(date) => handleChange('date', date)}
            required
          />

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              id="startTime"
              type="time"
              label="Hora início"
              icon={Clock}
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
            />
            <Input 
              id="endTime"
              type="time"
              label="Hora fim"
              icon={Clock}
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              id="price"
              type="number"
              label="Valor *"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currency" className="text-sm font-medium text-text-primary">
                Moeda *
              </label>
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <select
                  id="currency"
                  className="w-full h-[48px] appearance-none rounded-custom border border-border bg-white pl-10 pr-4 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 border-l border-border pl-2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <Input 
            id="location"
            label="Local / Ponto de encontro"
            placeholder="Ex: Saída do hotel"
            icon={MapPin}
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />

          {/* External Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <LinkIcon size={16} />
                Links Externos e Informações
              </label>
            </div>
            
            {links.map((link, index) => (
              <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input 
                    id={`link-title-${index}`}
                    placeholder="Título (Ex: Hotel, Cardápio)"
                    value={link.title}
                    onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                  />
                  <Input 
                    id={`link-url-${index}`}
                    type="url"
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="mt-[5px] p-2.5 text-text-secondary hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors border border-transparent hover:border-status-error/20"
                  title="Remover link"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLink}
              className="w-full h-12 border border-dashed border-primary/30 rounded-custom flex items-center justify-center gap-2 text-primary font-medium hover:bg-primary/5 hover:border-primary transition-all duration-200 group mt-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus size={14} />
              </div>
              Adicionar Link
            </button>
            <p className="text-xs text-text-disabled">
              Adicione links úteis como localização, site do hotel ou cardápio digital.
            </p>
          </div>

          {/* Photos Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <ImageIcon size={16} />
              Fotos (opcional)
            </label>
            <div 
              className={`
                border-2 border-dashed rounded-custom p-8 text-center transition-all duration-200 cursor-pointer
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrag}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary">
                  <Upload size={20} />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-primary">Selecionar imagens</span>
                </div>
                <p className="text-xs text-text-disabled">
                  0/10 imagens • Formatos: JPG, PNG, WebP, GIF • Máx: 5MB por imagem
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-surface mt-8">
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
              {isEditMode ? 'Salvar Alterações' : 'Criar Passeio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTourForm;