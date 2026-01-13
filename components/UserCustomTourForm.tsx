import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, MapPin, DollarSign, X, Upload, Image as ImageIcon } from 'lucide-react';
import { UserCustomTour, Group } from '../types';
import { userCustomToursApi } from '../lib/database';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';
import { useToast } from '../hooks/useToast';

interface UserCustomTourFormProps {
  group: Group;
  initialData?: UserCustomTour | null;
  onSave: () => void;
  onCancel: () => void;
}

const UserCustomTourForm: React.FC<UserCustomTourFormProps> = ({
  group,
  initialData,
  onSave,
  onCancel
}) => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    price: '',
    description: '',
    address: '',
    location: '',
  });

  // Estado para endereço estruturado
  const [addressParts, setAddressParts] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const isEditMode = !!initialData;

  // Carregar dados iniciais se estiver editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        date: initialData.date || '',
        time: initialData.time || '',
        price: initialData.price?.toString() || '',
        description: initialData.description || '',
        address: initialData.address || '',
        location: initialData.location || '',
      });

      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }

      // Parsear endereço se existir
      if (initialData.address) {
        const parts = parseAddress(initialData.address);
        setAddressParts(parts);
      }
    }
  }, [initialData]);

  // Função para parsear endereço
  const parseAddress = (address: string) => {
    if (!address) return { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' };
    
    const parts = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' };
    const segments = address.split(',').map(s => s.trim()).filter(s => s);
    
    if (segments.length === 0) return parts;
    
    if (segments[0]) {
      const streetNumMatch = segments[0].match(/^(.+?)(?:\s+)(\d+)$/);
      if (streetNumMatch) {
        parts.street = streetNumMatch[1].trim();
        parts.number = streetNumMatch[2].trim();
      } else {
        parts.street = segments[0];
      }
    }
    
    // Buscar cidade-estado
    for (let i = 1; i < segments.length; i++) {
      const cityStateMatch = segments[i].match(/^(.+?)\s*-\s*(.+)$/);
      if (cityStateMatch) {
        parts.city = cityStateMatch[1].trim();
        parts.state = cityStateMatch[2].trim();
        break;
      }
      if (!parts.neighborhood && i === 1) {
        parts.neighborhood = segments[i];
      }
    }
    
    // CEP no último segmento
    const lastSegment = segments[segments.length - 1];
    const zipMatch = lastSegment?.match(/(\d{5}-?\d{3})/);
    if (zipMatch) {
      parts.zipCode = zipMatch[1].replace(/-/g, '');
    }
    
    return parts;
  };

  // Função para formatar endereço completo
  const formatFullAddress = (parts: typeof addressParts): string => {
    const partsArray: string[] = [];
    
    if (parts.street) {
      const streetPart = parts.number 
        ? `${parts.street}, ${parts.number}`
        : parts.street;
      partsArray.push(streetPart);
    }
    
    if (parts.neighborhood) {
      partsArray.push(parts.neighborhood);
    }
    
    if (parts.city && parts.state) {
      partsArray.push(`${parts.city}, ${parts.state}`);
    } else if (parts.city) {
      partsArray.push(parts.city);
    }
    
    if (parts.zipCode) {
      const formattedZip = parts.zipCode.length === 8 
        ? `${parts.zipCode.slice(0, 5)}-${parts.zipCode.slice(5)}`
        : parts.zipCode;
      partsArray.push(formattedZip);
    }
    
    if (parts.complement && partsArray.length > 0) {
      const result = [partsArray[0], parts.complement, ...partsArray.slice(1)];
      return result.join(', ');
    }
    
    return partsArray.join(', ');
  };

  // Sincronizar endereço estruturado com campo address
  useEffect(() => {
    const fullAddress = formatFullAddress(addressParts);
    if (fullAddress) {
      setFormData(prev => ({ ...prev, address: fullAddress }));
    } else {
      setFormData(prev => ({ ...prev, address: '' }));
    }
  }, [addressParts]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tourData: Omit<UserCustomTour, 'id' | 'createdAt' | 'updatedAt'> = {
        groupId: group.id,
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time || '00:00',
        price: formData.price ? parseFloat(formData.price.replace(',', '.')) : undefined,
        description: formData.description.trim() || undefined,
        address: formData.address.trim() || undefined,
        location: formData.location.trim() || undefined,
        imageUrl: imagePreview || undefined,
      };

      if (isEditMode && initialData) {
        await userCustomToursApi.update(initialData.id, tourData);
        showSuccess('Passeio atualizado com sucesso!');
      } else {
        await userCustomToursApi.create(tourData);
        showSuccess('Passeio cadastrado com sucesso!');
      }

      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar passeio:', error);
      showError(`Erro ao salvar passeio: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary-light transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditMode ? 'Editar Passeio' : 'Novo Passeio Personalizado'}
          </h1>
          <p className="text-sm text-text-secondary">Cadastre um passeio na sua agenda</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl sm:rounded-[24px] border border-border p-4 sm:p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <Input
            id="name"
            label="Nome do Passeio *"
            placeholder="Ex: Cinema, Restaurante, Show..."
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <DatePicker
              id="date"
              label="Data *"
              value={formData.date}
              onChange={(date) => handleChange('date', date)}
              required
            />
            <Input
              id="time"
              label="Horário *"
              type="time"
              icon={Clock}
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              required
            />
          </div>

          {/* Preço */}
          <Input
            id="price"
            label="Preço (opcional)"
            type="number"
            step="0.01"
            placeholder="Ex: 50.00"
            icon={DollarSign}
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
          />

          {/* Local/Ponto de Encontro */}
          <Input
            id="location"
            label="Local/Ponto de Encontro (opcional)"
            placeholder="Ex: Saída do hotel"
            icon={MapPin}
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />

          {/* Endereço - Formulário Estruturado */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <MapPin size={16} />
              Endereço (opcional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id="address-street"
                label="Rua/Avenida"
                placeholder="Ex: Rua das Flores"
                value={addressParts.street}
                onChange={(e) => setAddressParts(prev => ({ ...prev, street: e.target.value }))}
              />
              <Input
                id="address-number"
                label="Número"
                placeholder="Ex: 123"
                value={addressParts.number}
                onChange={(e) => setAddressParts(prev => ({ ...prev, number: e.target.value }))}
              />
              <Input
                id="address-neighborhood"
                label="Bairro"
                placeholder="Ex: Centro"
                value={addressParts.neighborhood}
                onChange={(e) => setAddressParts(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="address-city"
                  label="Cidade"
                  placeholder="Ex: Gramado"
                  value={addressParts.city}
                  onChange={(e) => setAddressParts(prev => ({ ...prev, city: e.target.value }))}
                />
                <Input
                  id="address-state"
                  label="Estado"
                  placeholder="Ex: RS"
                  maxLength={2}
                  value={addressParts.state}
                  onChange={(e) => setAddressParts(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-text-primary">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
              placeholder="Descreva o passeio, observações, etc."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Imagem */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <ImageIcon size={16} />
              Imagem (opcional)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileInputChange({ target: { files: e.dataTransfer.files } } as any);
                  }
                }}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary-light'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <ImageIcon size={32} className="mx-auto mb-2 text-text-disabled" />
                <p className="text-sm text-text-secondary mb-2">
                  Arraste uma imagem aqui ou clique para selecionar
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Imagem
                </Button>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 min-h-[52px] sm:h-[48px] text-base sm:text-sm font-semibold"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 min-h-[52px] sm:h-[48px] text-base sm:text-sm font-semibold"
              isLoading={isLoading}
            >
              {isEditMode ? 'Atualizar' : 'Cadastrar'} Passeio
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCustomTourForm;
