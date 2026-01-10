import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Upload, Link as LinkIcon, MapPin, DollarSign, Image as ImageIcon, Plus, Trash2, Map, Sparkles, Loader2, X } from 'lucide-react';
import { Trip, Tour, TourLink } from '../types';
import { tripsApi } from '../lib/database';
import { generateTourDescription } from '../lib/ai';
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
  const [selectedTripId, setSelectedTripId] = useState<string>(trip?.id || initialData?.tripId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [timeError, setTimeError] = useState<string>('');
  const [images, setImages] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const [prices, setPrices] = useState({
    inteira: { value: '', description: 'Ingresso padrão para adultos' },
    meia: { value: '', description: 'Estudantes, pessoas com deficiência e acompanhantes' },
    senior: { value: '', description: 'Idosos a partir de 60 anos' },
  });

  const [links, setLinks] = useState<TourLink[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Tags pré-definidas disponíveis
  const availableTags = [
    'Restaurante',
    'Passeios',
    'Shows',
    'Compras',
    'Eventos',
    'Cultura',
    'Natureza',
    'Aventura',
    'Relaxamento',
    'Gastronomia',
    'História',
    'Esportes',
    'Noturno',
    'Família'
  ];

  const isEditMode = !!initialData;
  const activeTrip = trip || availableTrips.find(t => t.id === selectedTripId);

  // Funções para formatação de moeda brasileira
  const formatCurrency = (value: string | number): string => {
    if (!value && value !== 0) return '';
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) 
      : value;
    if (isNaN(numValue) || numValue < 0) return '';
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string): string => {
    if (!value) return '';
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = value.replace(/[^\d,.]/g, '');
    if (!cleaned) return '';
    
    // Se tiver vírgula, assume formato brasileiro (vírgula como separador decimal)
    if (cleaned.includes(',')) {
      // Remove todos os pontos (são separadores de milhares)
      const withoutThousands = cleaned.replace(/\./g, '');
      // Substitui vírgula por ponto para formato numérico
      return withoutThousands.replace(',', '.');
    }
    
    // Se só tiver pontos, pode ser formato internacional (decimal) ou brasileiro (milhares)
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Múltiplos pontos = formato brasileiro (milhares), remove todos os pontos
      return parts.join('');
    }
    
    if (parts.length === 2) {
      // Um ponto: verifica se é decimal ou milhar
      // Se a parte após o ponto tem 3 dígitos e há mais de 3 dígitos antes, é milhar
      if (parts[1].length === 3 && parts[0].length > 3) {
        // Formato brasileiro: 1.234 = 1234 (sem decimal)
        return parts.join('');
      }
      // Caso contrário, assume que é decimal (formato internacional)
      return cleaned;
    }
    
    // Apenas números
    return cleaned;
  };

  const handlePriceChange = (type: 'inteira' | 'meia' | 'senior', value: string) => {
    const parsed = parseCurrency(value);
    setPrices(prev => ({
      ...prev,
      [type]: { ...prev[type], value: parsed }
    }));
  };

  const getDisplayValue = (value: string): string => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return formatCurrency(numValue);
  };

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

  // Se estiver editando e não tiver trip, garantir que o tripId está definido
  useEffect(() => {
    if (!trip && initialData && !selectedTripId && initialData.tripId) {
      setSelectedTripId(initialData.tripId);
    }
  }, [trip, initialData]);

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
      if (initialData.tags) {
        setSelectedTags(initialData.tags);
      }
      // Carregar preços múltiplos se existirem
      if (initialData.prices) {
        setPrices({
          inteira: {
            value: initialData.prices.inteira?.value ? initialData.prices.inteira.value.toString() : '',
            description: initialData.prices.inteira?.description || 'Ingresso padrão para adultos'
          },
          meia: {
            value: initialData.prices.meia?.value ? initialData.prices.meia.value.toString() : '',
            description: initialData.prices.meia?.description || 'Estudantes, pessoas com deficiência e acompanhantes'
          },
          senior: {
            value: initialData.prices.senior?.value ? initialData.prices.senior.value.toString() : '',
            description: initialData.prices.senior?.description || 'Idosos a partir de 60 anos'
          }
        });
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Validar horas quando ambas estiverem preenchidas
      if ((field === 'startTime' || field === 'endTime') && updated.startTime && updated.endTime) {
        const start = new Date(`2000-01-01T${updated.startTime}`);
        const end = new Date(`2000-01-01T${updated.endTime}`);
        
        if (end <= start) {
          setTimeError('A hora de término deve ser posterior à hora de início');
        } else {
          setTimeError('');
        }
      } else {
        setTimeError('');
      }
      
      return updated;
    });
  };

  // Calcular duração do passeio
  const calculateDuration = (): string => {
    if (!formData.startTime || !formData.endTime) return '';
    
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    
    if (end <= start) return '';
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes} min`;
    } else if (diffMinutes === 0) {
      return `${diffHours}h`;
    } else {
      return `${diffHours}h ${diffMinutes}min`;
    }
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

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert('Por favor, preencha o nome do passeio primeiro para gerar uma descrição.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const description = await generateTourDescription({
        name: formData.name,
        date: formData.date,
        location: formData.location,
        price: formData.price ? `${formData.currency} ${formData.price}` : undefined,
        tripName: activeTrip?.name,
        tripDestination: activeTrip?.destination,
      });
      
      handleChange('description', description);
    } catch (error: any) {
      console.error('Erro ao gerar descrição:', error);
      alert(`Erro ao gerar descrição: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for Global Mode
    if (!activeTrip) {
      alert("Por favor, selecione uma viagem para este passeio.");
      return;
    }

    // Validação de campos obrigatórios
    if (!formData.name) {
      alert("Por favor, preencha o nome do passeio.");
      return;
    }

    // Verificar se pelo menos um preço foi preenchido
    const hasAnyPrice = prices.inteira.value || prices.meia.value || prices.senior.value || formData.price;
    if (!hasAnyPrice) {
      alert("Por favor, preencha pelo menos um valor de ingresso.");
      return;
    }

    // Validação de horário se ambos estiverem preenchidos
    if (formData.startTime && formData.endTime && timeError) {
      alert("Por favor, corrija o horário antes de salvar.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Converter imagens para base64 (ou você pode fazer upload para um storage)
      // Por enquanto, vamos usar base64 diretamente do preview
      // Em produção, você deve fazer upload para Supabase Storage ou similar
      const imageUrls = images.map(img => img.preview);

      // Preparar dados no formato esperado pela API
      // Se não houver data informada, usar a data de início da viagem como padrão
      const defaultDate = formData.date || (activeTrip?.startDate ? activeTrip.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      
      // Preparar preços múltiplos
      const tourPrices: any = {};
      if (prices.inteira.value) {
        tourPrices.inteira = {
          value: parseFloat(prices.inteira.value),
          description: prices.inteira.description
        };
      }
      if (prices.meia.value) {
        tourPrices.meia = {
          value: parseFloat(prices.meia.value),
          description: prices.meia.description
        };
      }
      if (prices.senior.value) {
        tourPrices.senior = {
          value: parseFloat(prices.senior.value),
          description: prices.senior.description
        };
      }

      // Preço padrão: usar inteira se disponível, senão o campo price antigo, senão 0
      const defaultPrice = prices.inteira.value 
        ? parseFloat(prices.inteira.value) 
        : (formData.price ? parseFloat(formData.price) : 0);
      
      const tourData = {
        tripId: activeTrip.id,
        name: formData.name,
        date: defaultDate,
        time: formData.startTime || '00:00', // Usar startTime como time principal
        price: defaultPrice, // Preço padrão para compatibilidade
        prices: Object.keys(tourPrices).length > 0 ? tourPrices : undefined, // Preços múltiplos
        description: formData.description || '',
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined, // Primeira imagem como principal
        links: links.filter(l => l.title && l.url), // Filter out empty links
        tags: selectedTags.length > 0 ? selectedTags : undefined, // Tags selecionadas
      };

      console.log('📝 NewTourForm: Enviando dados do passeio:', tourData);

      // Chamar onSave que vai salvar no banco (a mensagem de sucesso será exibida no App.tsx)
      await onSave(tourData);
      
      console.log('✅ NewTourForm: Passeio criado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao salvar passeio:', error);
      alert(`Erro ao salvar passeio: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxImages = 10;

    // Filtrar arquivos válidos
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Validar quantidade
      if (images.length + validFiles.length >= maxImages) {
        errors.push(`Você pode adicionar no máximo ${maxImages} imagens.`);
        return;
      }

      // Validar tipo
      if (!allowedTypes.includes(file.type)) {
        errors.push(`"${file.name}" não é um formato válido.`);
        return;
      }

      // Validar tamanho
      if (file.size > maxSize) {
        errors.push(`"${file.name}" é muito grande (máx: 5MB).`);
        return;
      }

      validFiles.push(file);
    });

    // Mostrar erros se houver
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    // Processar arquivos válidos
    if (validFiles.length === 0) return;

    const newImages: Array<{ file: File; preview: string }> = [];
    let processedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push({
            file,
            preview: e.target.result as string
          });
          
          processedCount++;
          
          // Quando todos os arquivos forem processados
          if (processedCount === validFiles.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
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
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          
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

          {/* Tags/Categorias */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Categorias / Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTags(prev => prev.filter(t => t !== tag));
                      } else {
                        setSelectedTags(prev => [...prev, tag]);
                      }
                    }}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isSelected
                        ? 'bg-primary text-white border-2 border-primary shadow-md'
                        : 'bg-surface text-text-secondary border-2 border-border hover:border-primary/50 hover:text-primary'
                      }
                    `}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-disabled mt-1">
              Selecione uma ou mais categorias para facilitar a organização dos passeios
            </p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-medium text-text-primary">
                Descrição (opcional)
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingAI || !formData.name}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
                title="Gerar descrição com IA"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Gerar com IA</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
              placeholder="Descreva o passeio... ou clique em 'Gerar com IA' para criar automaticamente"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Date */}
          <DatePicker 
            id="date"
            label="Data do passeio"
            value={formData.date}
            onChange={(date) => handleChange('date', date)}
          />

          {/* Times */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Horário do passeio
              </label>
              {formData.startTime && formData.endTime && !timeError && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">
                  Duração: {calculateDuration()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="startTime" className="text-xs text-text-secondary flex items-center gap-1.5">
                  <Clock size={14} />
                  Hora de início
                </label>
                <Input 
                  id="startTime"
                  type="time"
                  icon={Clock}
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className={timeError ? 'border-status-error' : ''}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="endTime" className="text-xs text-text-secondary flex items-center gap-1.5">
                  <Clock size={14} />
                  Hora de término
                </label>
                <Input 
                  id="endTime"
                  type="time"
                  icon={Clock}
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className={timeError ? 'border-status-error' : ''}
                />
              </div>
            </div>
            {timeError && (
              <p className="text-xs text-status-error flex items-center gap-1.5 mt-1">
                <span>⚠️</span>
                {timeError}
              </p>
            )}
            {!timeError && formData.startTime && formData.endTime && (
              <p className="text-xs text-text-disabled mt-1">
                O passeio terá duração de {calculateDuration()}
              </p>
            )}
          </div>

          {/* Prices by Ticket Type */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Valores dos Ingressos
              </label>
              <span className="text-xs text-text-disabled">
                Preencha pelo menos um tipo de ingresso
              </span>
            </div>

            {/* Ingresso Inteira */}
            <div className="bg-surface/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-text-primary">
                  Ingresso Inteira
                </label>
                <span className="text-xs text-text-secondary bg-white px-2 py-1 rounded border border-border">
                  Padrão
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none font-medium">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={getDisplayValue(prices.inteira.value)}
                    onChange={(e) => handlePriceChange('inteira', e.target.value)}
                    onBlur={(e) => {
                      const parsed = parseCurrency(e.target.value);
                      if (parsed) {
                        setPrices(prev => ({
                          ...prev,
                          inteira: { ...prev.inteira, value: parsed }
                        }));
                      }
                    }}
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Descrição (ex: Adultos, idade mínima, etc.)"
                    value={prices.inteira.description}
                    onChange={(e) => setPrices(prev => ({
                      ...prev,
                      inteira: { ...prev.inteira, description: e.target.value }
                    }))}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Meia Entrada */}
            <div className="bg-surface/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-text-primary">
                  Meia Entrada
                </label>
                <span className="text-xs text-text-secondary bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                  50% desconto
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none font-medium">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={getDisplayValue(prices.meia.value)}
                    onChange={(e) => handlePriceChange('meia', e.target.value)}
                    onBlur={(e) => {
                      const parsed = parseCurrency(e.target.value);
                      if (parsed) {
                        setPrices(prev => ({
                          ...prev,
                          meia: { ...prev.meia, value: parsed }
                        }));
                      }
                    }}
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Descrição (ex: Estudantes, PCD, etc.)"
                    value={prices.meia.description}
                    onChange={(e) => setPrices(prev => ({
                      ...prev,
                      meia: { ...prev.meia, description: e.target.value }
                    }))}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Ingresso Sênior */}
            <div className="bg-surface/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-text-primary">
                  Ingresso Sênior
                </label>
                <span className="text-xs text-text-secondary bg-status-success/10 text-status-success px-2 py-1 rounded border border-status-success/20">
                  60+ anos
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none font-medium">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={getDisplayValue(prices.senior.value)}
                    onChange={(e) => handlePriceChange('senior', e.target.value)}
                    onBlur={(e) => {
                      const parsed = parseCurrency(e.target.value);
                      if (parsed) {
                        setPrices(prev => ({
                          ...prev,
                          senior: { ...prev.senior, value: parsed }
                        }));
                      }
                    }}
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Descrição (ex: Idosos a partir de 60 anos)"
                    value={prices.senior.description}
                    onChange={(e) => setPrices(prev => ({
                      ...prev,
                      senior: { ...prev.senior, description: e.target.value }
                    }))}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Campo de preço único (legado - opcional) */}
            <div className="bg-surface/30 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-medium text-text-secondary">
                  Valor Único (opcional - para compatibilidade)
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none font-medium text-sm">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={getDisplayValue(formData.price)}
                  onChange={(e) => {
                    const parsed = parseCurrency(e.target.value);
                    handleChange('price', parsed);
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrency(e.target.value);
                    if (parsed) {
                      handleChange('price', parsed);
                    }
                  }}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-text-disabled mt-1">
                Use apenas se não houver tipos específicos de ingresso
              </p>
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
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Upload area */}
            <div 
              className={`
                border-2 border-dashed rounded-custom p-8 text-center transition-all duration-200 cursor-pointer
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleClickUpload}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary">
                  <Upload size={20} />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-primary">Selecionar imagens</span>
                  <span className="text-text-secondary ml-1">ou arraste e solte</span>
                </div>
                <p className="text-xs text-text-disabled">
                  {images.length}/10 imagens • Formatos: JPG, PNG, WebP, GIF • Máx: 5MB por imagem
                </p>
              </div>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-border bg-surface">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-status-error/90 hover:bg-status-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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