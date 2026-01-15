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
    observations: '',
    date: '',
    startTime: '',
    endTime: '',
    price: '',
    currency: 'BRL',
    location: '',
    address: '',
  });

  // Estado para endereço estruturado do passeio
  const [tourAddressParts, setTourAddressParts] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Array dinâmico de preços: [{id, description, value}]
  const [prices, setPrices] = useState<Array<{id: string; description: string; value: string}>>([]);

  const [links, setLinks] = useState<TourLink[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Estados de erro para validação visual
  const [errors, setErrors] = useState<{
    name?: boolean;
    trip?: boolean;
  }>({});

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

  const handlePriceChange = (id: string, value: string) => {
    const parsed = parseCurrency(value);
    setPrices(prev => prev.map(p => p.id === id ? { ...p, value: parsed } : p));
  };

  const handlePriceDescriptionChange = (id: string, description: string) => {
    setPrices(prev => prev.map(p => p.id === id ? { ...p, description } : p));
  };

  const handleAddPrice = () => {
    const newId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPrices(prev => [...prev, { id: newId, description: '', value: '' }]);
  };

  const handleRemovePrice = (id: string) => {
    setPrices(prev => prev.filter(p => p.id !== id));
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

  // Função para parsear endereço existente em partes
  const parseAddress = (address: string) => {
    if (!address) return { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' };
    
    // Tentar parsear endereços no formato: "Rua, Número, Bairro, Cidade, Estado, CEP"
    const parts: typeof tourAddressParts = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' };
    
    // Separar por vírgulas
    const segments = address.split(',').map(s => s.trim()).filter(s => s);
    
    if (segments.length === 0) return parts;
    
    // Primeiro segmento geralmente tem rua e número/km
    if (segments[0]) {
      // Tentar detectar padrões: "RS-235", "km 52", "Rua X, 123", "Rua X 123"
      const kmMatch = segments[0].match(/^(.+?)\s*(?:km|KM)\s*(\d+)$/i);
      if (kmMatch) {
        parts.street = kmMatch[1].trim();
        parts.number = `km ${kmMatch[2]}`;
      } else {
        const streetNumMatch = segments[0].match(/^(.+?)(?:\s+)(\d+)$/);
        if (streetNumMatch) {
          parts.street = streetNumMatch[1].trim();
          parts.number = streetNumMatch[2].trim();
        } else {
          parts.street = segments[0];
        }
      }
    }
    
    // Tentar identificar cidade-estado no padrão "Cidade - Estado" ou "Cidade, Estado"
    let cityStateIndex = -1;
    for (let i = 1; i < segments.length; i++) {
      const cityStateMatch = segments[i].match(/^(.+?)\s*-\s*(.+)$/);
      if (cityStateMatch) {
        parts.city = cityStateMatch[1].trim();
        parts.state = cityStateMatch[2].trim();
        cityStateIndex = i;
        break;
      }
      // Se não encontrou com hífen, pode ser que cidade e estado estejam separados
      if (segments[i].length <= 3 && i < segments.length - 1) {
        // Pode ser estado (2 letras) seguido de CEP
        parts.state = segments[i].toUpperCase();
        cityStateIndex = i;
      }
    }
    
    // Segmentos entre rua e cidade-estado são bairro/complemento
    if (cityStateIndex > 1) {
      for (let i = 1; i < cityStateIndex; i++) {
        if (!parts.neighborhood) {
          parts.neighborhood = segments[i];
        } else if (!parts.complement) {
          parts.complement = segments[i];
        }
      }
    } else if (segments.length > 1 && !parts.city) {
      // Se não encontrou cidade-estado, segundo segmento pode ser bairro
      parts.neighborhood = segments[1];
      // Terceiro pode ser cidade
      if (segments.length > 2) {
        const nextCityStateMatch = segments[2].match(/^(.+?)\s*-\s*(.+)$/);
        if (nextCityStateMatch) {
          parts.city = nextCityStateMatch[1].trim();
          parts.state = nextCityStateMatch[2].trim();
        } else {
          parts.city = segments[2];
        }
      }
    }
    
    // Se ainda não encontrou cidade e estado, tentar nos últimos segmentos
    if (!parts.city && segments.length >= 3) {
      const secondLast = segments[segments.length - 2];
      const last = segments[segments.length - 1];
      
      // Verificar se penúltimo é cidade e último é estado
      if (last.length <= 3 && !parts.state) {
        parts.state = last.toUpperCase();
        parts.city = secondLast;
      }
    }
    
    // Último segmento pode ser CEP
    const lastSegment = segments[segments.length - 1];
    const zipMatch = lastSegment.match(/(\d{5}-?\d{3})/);
    if (zipMatch) {
      parts.zipCode = zipMatch[1].replace(/-/g, '');
      // Remover CEP do último segmento se estava junto com outro dado
      if (lastSegment !== zipMatch[0] && parts.city === lastSegment) {
        parts.city = lastSegment.replace(zipMatch[0], '').trim();
      }
    }
    
    return parts;
  };

  // Função para formatar endereço completo (otimizado para geocodificação)
  const formatFullAddress = (parts: typeof tourAddressParts): string => {
    const partsArray: string[] = [];
    
    // Construir endereço na ordem ideal para geocodificação:
    // Rua e número primeiro
    if (parts.street) {
      const streetPart = parts.number 
        ? `${parts.street}, ${parts.number}`
        : parts.street;
      partsArray.push(streetPart);
    }
    
    // Bairro
    if (parts.neighborhood) {
      partsArray.push(parts.neighborhood);
    }
    
    // Cidade e Estado (importante para precisão)
    if (parts.city && parts.state) {
      partsArray.push(`${parts.city}, ${parts.state}`);
    } else if (parts.city) {
      partsArray.push(parts.city);
    } else if (parts.state) {
      partsArray.push(parts.state);
    }
    
    // CEP (opcional, adiciona precisão)
    if (parts.zipCode) {
      const formattedZip = parts.zipCode.length === 8 
        ? `${parts.zipCode.slice(0, 5)}-${parts.zipCode.slice(5)}`
        : parts.zipCode;
      partsArray.push(formattedZip);
    }
    
    // Complemento (adicionar no final para não confundir geocodificação)
    if (parts.complement && partsArray.length > 0) {
      // Adicionar complemento entre rua e bairro se houver
      const result = [partsArray[0], parts.complement, ...partsArray.slice(1)];
      return result.join(', ');
    }
    
    return partsArray.join(', ');
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        observations: (initialData as any).observations || '',
        date: initialData.date,
        startTime: initialData.time,
        endTime: '', // Not in mock data
        price: initialData.price.toString(),
        currency: 'BRL',
        location: '', // Not in mock data
        address: initialData.address || '',
      });
      
      // Parsear endereço existente se houver
      if (initialData.address) {
        setTourAddressParts(parseAddress(initialData.address));
      }
      if (initialData.links) {
        setLinks(initialData.links);
      }
      if (initialData.tags) {
        setSelectedTags(initialData.tags);
      }
      // Carregar preços múltiplos se existirem
      if (initialData.prices) {
        const pricesArray: Array<{id: string; description: string; value: string}> = [];
        // Converter objeto de preços para array dinâmico
        Object.entries(initialData.prices).forEach(([key, priceData]) => {
          if (priceData && priceData.value !== undefined) {
            pricesArray.push({
              id: `price_${key}_${Date.now()}`,
              description: priceData.description || '',
              value: priceData.value.toString()
            });
          }
        });
        setPrices(pricesArray);
      }
    }
  }, [initialData]);

  // Sincronizar endereço estruturado com campo address
  useEffect(() => {
    const fullAddress = formatFullAddress(tourAddressParts);
    console.log('📝 NewTourForm: Endereço formatado:', {
      parts: tourAddressParts,
      fullAddress: fullAddress
    });
    if (fullAddress) {
      setFormData(prev => ({ ...prev, address: fullAddress }));
    } else {
      // Se todos os campos estiverem vazios, limpar o endereço
      setFormData(prev => ({ ...prev, address: '' }));
    }
  }, [tourAddressParts]);

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
    
    // Limpar erros anteriores
    setErrors({});
    
    // Validação de campos obrigatórios com feedback visual
    const newErrors: typeof errors = {};
    let hasErrors = false;

    // Validation for Global Mode
    if (!activeTrip) {
      newErrors.trip = true;
      hasErrors = true;
    }

    // Validação de campos obrigatórios
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = true;
      hasErrors = true;
    }

    // Preço é opcional - não validar se não houver valor fixo
    // O sistema permite passeios sem preço definido

    // Validação de horário se ambos estiverem preenchidos
    if (formData.startTime && formData.endTime && timeError) {
      // timeError já está sendo exibido visualmente
      hasErrors = true;
    }

    // Se houver erros, mostrar feedback visual e não continuar
    if (hasErrors) {
      setErrors(newErrors);
      // Scroll para o primeiro erro
      const firstErrorField = document.querySelector('.border-status-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
      const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const defaultDate = formData.date || (activeTrip?.startDate ? activeTrip.startDate.split('T')[0] : getTodayDate());
      
      // Preparar preços múltiplos - converter array dinâmico para objeto JSON
      const tourPrices: any = {};
      prices.forEach((price, index) => {
        if (price.value && price.value.trim() !== '') {
          // Usar um ID único baseado no índice ou gerar uma chave baseada na descrição
          const key = price.description 
            ? price.description.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30) || `price_${index}`
            : `price_${index}`;
          tourPrices[key] = {
            value: parseFloat(price.value),
            description: price.description || ''
          };
        }
      });

      // Preço padrão: usar o primeiro valor disponível, senão o campo price antigo, senão 0
      // Se não houver nenhum preço, usar 0 (passeio sem valor fixo)
      const firstPriceValue = prices.find(p => p.value && p.value.trim() !== '');
      const defaultPrice = firstPriceValue 
        ? parseFloat(firstPriceValue.value) 
        : (formData.price ? parseFloat(formData.price) : 0);
      
      const tourData = {
        tripId: activeTrip.id,
        name: formData.name,
        date: defaultDate,
        time: formData.startTime || '00:00', // Usar startTime como time principal
        price: defaultPrice, // Preço padrão para compatibilidade
        prices: Object.keys(tourPrices).length > 0 ? tourPrices : undefined, // Preços múltiplos
        description: formData.description || '',
        observations: formData.observations || undefined, // Observações em destaque
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined, // Primeira imagem como principal
        links: links.filter(l => l.title && l.url), // Filter out empty links
        tags: selectedTags.length > 0 ? selectedTags : undefined, // Tags selecionadas
        address: formData.address || undefined, // Endereço do passeio
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
                    className={`w-full h-[48px] appearance-none rounded-custom border bg-white px-4 text-text-primary outline-none transition-all duration-200 focus:ring-2 ${
                      errors.trip 
                        ? 'border-status-error focus:border-status-error focus:ring-status-error' 
                        : 'border-border focus:border-primary focus:ring-primary/20'
                    }`}
                    value={selectedTripId}
                    onChange={(e) => {
                      setSelectedTripId(e.target.value);
                      // Limpar erro quando o usuário selecionar uma viagem
                      if (errors.trip) {
                        setErrors(prev => ({ ...prev, trip: false }));
                      }
                    }}
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
                {errors.trip && (
                  <p className="text-xs text-status-error flex items-center gap-1 mt-1">
                    <span>⚠️</span>
                    Por favor, selecione uma viagem para este passeio
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Name */}
          <Input 
            id="name"
            label="Nome do passeio *"
            placeholder="Ex: Tour Vinícolas"
            value={formData.name}
            onChange={(e) => {
              handleChange('name', e.target.value);
              // Limpar erro quando o usuário começar a digitar
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: false }));
              }
            }}
            className={errors.name ? 'border-status-error focus:border-status-error focus:ring-status-error' : ''}
            required
          />
          {errors.name && (
            <p className="text-xs text-status-error flex items-center gap-1 mt-1">
              <span>⚠️</span>
              Por favor, preencha o nome do passeio
            </p>
          )}

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

          {/* Observações - Campo em Destaque */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-primary/30 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-lg font-bold">!</span>
              </div>
              <label htmlFor="observations" className="text-base sm:text-lg font-bold text-text-primary">
                Observações
              </label>
            </div>
            <textarea
              id="observations"
              rows={5}
              className="w-full rounded-lg border-2 border-primary/40 bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 placeholder:text-text-disabled resize-none text-sm sm:text-base font-medium"
              placeholder="Adicione observações importantes sobre este passeio (instruções especiais, recomendações, avisos, etc.)"
              value={formData.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
            />
            <p className="text-xs text-text-secondary mt-2 italic">
              Este campo é destacado para informações importantes que devem ser facilmente visualizadas
            </p>
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

          {/* Prices - Campos Dinâmicos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Valores dos Ingressos
              </label>
              <span className="text-xs text-text-disabled">
                Opcional - adicione diferentes tipos de ingresso
              </span>
            </div>

            {/* Lista dinâmica de preços */}
            {prices.map((price, index) => (
              <div key={price.id} className="bg-surface/50 rounded-lg p-4 border border-border animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-text-primary">
                    Valor {index + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemovePrice(price.id)}
                    className="p-1.5 text-text-secondary hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                    title="Remover valor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-xs text-text-secondary mb-1.5 block">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Ingresso Inteira, Meia Entrada, Idosos, etc."
                      value={price.description}
                      onChange={(e) => handlePriceDescriptionChange(price.id, e.target.value)}
                      className="w-full h-12 px-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-xs text-text-secondary mb-1.5 block">Valor (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none font-medium">R$</span>
                      <input
                        type="text"
                        placeholder="0,00"
                        value={getDisplayValue(price.value)}
                        onChange={(e) => handlePriceChange(price.id, e.target.value)}
                        onBlur={(e) => {
                          const parsed = parseCurrency(e.target.value);
                          if (parsed) {
                            handlePriceChange(price.id, parsed);
                          }
                        }}
                        className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Botão para adicionar novo valor */}
            <button
              type="button"
              onClick={handleAddPrice}
              className="w-full h-12 border border-dashed border-primary/30 rounded-custom flex items-center justify-center gap-2 text-primary font-medium hover:bg-primary/5 hover:border-primary transition-all duration-200 group"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus size={14} />
              </div>
              Adicionar Valor de Ingresso
            </button>
            
            {prices.length === 0 && (
              <p className="text-xs text-text-disabled text-center py-2">
                Clique no botão acima para adicionar valores de ingresso
              </p>
            )}
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

          {/* Address - Formulário Estruturado */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <MapPin size={16} />
              Endereço do Passeio
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id="tour-address-street"
                label="Rua/Avenida"
                placeholder="Ex: RS-235"
                value={tourAddressParts.street}
                onChange={(e) => setTourAddressParts(prev => ({ ...prev, street: e.target.value }))}
              />
              <Input
                id="tour-address-number"
                label="Número/Km"
                placeholder="Ex: 123 ou km 52"
                value={tourAddressParts.number}
                onChange={(e) => setTourAddressParts(prev => ({ ...prev, number: e.target.value }))}
              />
              <Input
                id="tour-address-complement"
                label="Complemento (opcional)"
                placeholder="Ex: Próximo ao restaurante"
                value={tourAddressParts.complement}
                onChange={(e) => setTourAddressParts(prev => ({ ...prev, complement: e.target.value }))}
              />
              <Input
                id="tour-address-neighborhood"
                label="Bairro (opcional)"
                placeholder="Ex: Centro"
                value={tourAddressParts.neighborhood}
                onChange={(e) => setTourAddressParts(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
              <Input
                id="tour-address-city"
                label="Cidade"
                placeholder="Ex: Gramado"
                value={tourAddressParts.city}
                onChange={(e) => setTourAddressParts(prev => ({ ...prev, city: e.target.value }))}
              />
              <Input
                id="tour-address-state"
                label="Estado"
                placeholder="Ex: RS"
                value={tourAddressParts.state}
                onChange={(e) => setTourAddressParts(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                maxLength={2}
              />
              <Input
                id="tour-address-zipcode"
                label="CEP (opcional)"
                placeholder="Ex: 95400-000"
                value={tourAddressParts.zipCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 8) {
                    setTourAddressParts(prev => ({ ...prev, zipCode: value }));
                  }
                }}
                maxLength={9}
              />
            </div>
            {formData.address && (
              <div className="text-xs text-text-secondary italic pt-1">
                Endereço formatado: {formData.address}
              </div>
            )}
          </div>

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