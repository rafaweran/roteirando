import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Upload, Link as LinkIcon, MapPin, DollarSign, Image as ImageIcon, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Trip, Tour, TourLink } from '../types';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';

interface NewTourFormProps {
  trip: Trip;
  initialData?: Tour | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const NewTourForm: React.FC<NewTourFormProps> = ({ trip, initialData, onSave, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
      // If editing and has image, set preview
      if (initialData.imageUrl) {
        setImagePreviews([initialData.imageUrl]);
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 ========== INÍCIO handleSubmit NewTourForm ==========');
    console.log('📋 Form Data:', {
      name: formData.name,
      date: formData.date,
      startTime: formData.startTime,
      price: formData.price,
      description: formData.description?.substring(0, 50) + '...',
      location: formData.location,
      linksCount: links.length,
      selectedImagesCount: selectedImages.length,
      isEditMode: isEditMode,
      initialDataId: initialData?.id,
    });
    
    setIsLoading(true);
    console.log('⏳ Loading state set to true');
    
    try {
      // Process images - convert to base64 for now (in production, upload to storage service)
      let imageUrl = '';
      console.log('🖼️ Processando imagens...');
      try {
        if (selectedImages.length > 0) {
          console.log(`📸 ${selectedImages.length} imagem(ns) selecionada(s)`);
          // Use the first image as the main image
          const firstImage = selectedImages[0];
          console.log('📄 Processando primeira imagem:', {
            name: firstImage.name,
            size: firstImage.size,
            type: firstImage.type,
          });
          
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                const result = reader.result as string;
                console.log('✅ Imagem processada com sucesso, tamanho base64:', result.length);
                resolve(result);
              } else {
                console.error('❌ reader.result é null');
                reject(new Error('Falha ao processar imagem'));
              }
            };
            reader.onerror = (error) => {
              console.error('❌ Erro no FileReader:', error);
              reject(new Error('Erro ao ler arquivo de imagem'));
            };
            console.log('📖 Iniciando leitura do arquivo...');
            reader.readAsDataURL(firstImage);
          });
          console.log('✅ imageUrl definido, tamanho:', imageUrl.length);
        } else if (initialData?.imageUrl) {
          // Keep existing image if editing and no new image selected
          console.log('🔄 Usando imagem existente do initialData');
          imageUrl = initialData.imageUrl;
        } else {
          console.log('ℹ️ Nenhuma imagem selecionada e nenhuma imagem existente');
        }
      } catch (imageError) {
        console.warn('⚠️ Erro ao processar imagem, continuando sem imagem:', imageError);
        // Continue without image if processing fails
        imageUrl = initialData?.imageUrl || '';
      }

      // Prepare data in correct format
      console.log('📦 Preparando dados do tour...');
      const tourData: any = {
        tripId: trip.id,
        name: formData.name.trim(),
        date: formData.date,
        time: formData.startTime || '00:00', // Use startTime, default to 00:00 if empty
        price: formData.price ? parseFloat(formData.price) : 0,
        description: formData.description.trim(),
        imageUrl: imageUrl,
        links: links.filter(l => l.title && l.url), // Filter out empty links
      };

      // If editing, include the id
      if (initialData?.id) {
        tourData.id = initialData.id;
        console.log('✏️ Modo edição, incluindo ID:', initialData.id);
      }

      console.log('📤 Dados do tour preparados:', {
        tripId: tourData.tripId,
        name: tourData.name,
        date: tourData.date,
        time: tourData.time,
        price: tourData.price,
        hasImage: !!tourData.imageUrl,
        imageUrlLength: tourData.imageUrl?.length || 0,
        linksCount: tourData.links.length,
        hasId: !!tourData.id,
      });

      // Call onSave which will handle the API call
      console.log('📞 Chamando onSave...');
      await onSave(tourData);
      console.log('✅ onSave concluído com sucesso');
    } catch (error: any) {
      // Log error but let parent handle it
      console.error('❌ ========== ERRO em handleSubmit NewTourForm ==========');
      console.error('Erro completo:', error);
      console.error('Mensagem:', error?.message);
      console.error('Stack:', error?.stack);
      console.error('Tipo:', typeof error);
      console.error('========================================================');
      // Re-throw to let parent component handle the error and show toast
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🏁 ========== FIM handleSubmit NewTourForm ==========');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxImages = 10;

    files.forEach((file) => {
      // Validar tipo
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Arquivo ${file.name} não é um formato válido. Formatos aceitos: JPG, PNG, WebP, GIF`);
        return;
      }

      // Validar tamanho
      if (file.size > maxSize) {
        console.warn(`Arquivo ${file.name} excede o tamanho máximo de 5MB`);
        return;
      }

      // Validar quantidade máxima
      if (selectedImages.length + validFiles.length >= maxImages) {
        console.warn(`Máximo de ${maxImages} imagens permitidas`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      const newImages = [...selectedImages, ...validFiles].slice(0, maxImages);
      setSelectedImages(newImages);

      // Criar previews de forma assíncrona
      const previewPromises = validFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previewPromises)
        .then((newPreviews) => {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        })
        .catch((error) => {
          console.error('Erro ao criar previews:', error);
        });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const generateDescription = async () => {
    if (!formData.name) {
      return;
    }

    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setIsGeneratingDescription(true);

    // Simulate AI generation with typing effect
    const generateText = () => {
      const name = formData.name;
      const location = formData.location || trip.destination;
      const date = formData.date ? new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : '';
      const time = formData.startTime ? `às ${formData.startTime}` : '';
      const price = formData.price ? `R$ ${parseFloat(formData.price).toFixed(2)}` : '';

      // Generate description based on available information
      let description = `Descubra ${name}${location ? ` em ${location}` : ''}${date ? ` no dia ${date}` : ''}${time ? ` ${time}` : ''}. `;
      
      // Add contextual information based on tour name
      const nameLower = name.toLowerCase();
      if (nameLower.includes('vinícol') || nameLower.includes('vinho') || nameLower.includes('degustação')) {
        description += `Uma experiência única de degustação de vinhos, onde você poderá conhecer os melhores rótulos da região, aprender sobre o processo de produção e apreciar harmonizações especiais. `;
      } else if (nameLower.includes('gastronôm') || nameLower.includes('culinária') || nameLower.includes('restaurante')) {
        description += `Delicie-se com os sabores autênticos da região em uma experiência gastronômica inesquecível, com pratos típicos preparados com ingredientes frescos e receitas tradicionais. `;
      } else if (nameLower.includes('caminhada') || nameLower.includes('trilha') || nameLower.includes('natureza')) {
        description += `Conecte-se com a natureza em uma caminhada guiada por trilhas deslumbrantes, com paisagens incríveis e momentos de contemplação. `;
      } else if (nameLower.includes('histórico') || nameLower.includes('cultura') || nameLower.includes('museu')) {
        description += `Explore a rica história e cultura local em um passeio guiado por pontos históricos e culturais, conhecendo as tradições e patrimônios da região. `;
      } else if (nameLower.includes('aventura') || nameLower.includes('esport') || nameLower.includes('radical')) {
        description += `Viva momentos de pura adrenalina e diversão em uma experiência de aventura única, com atividades emocionantes e paisagens de tirar o fôlego. `;
      } else {
        description += `Uma experiência única e memorável que combina entretenimento, cultura e lazer, perfeita para toda a família. `;
      }

      if (price) {
        description += `Investimento: ${price} por pessoa. `;
      }

      description += `Não perca esta oportunidade de criar memórias inesquecíveis!`;

      return description;
    };

    // Simulate typing effect
    const generatedText = generateText();
    let currentText = '';
    let index = 0;

    typingIntervalRef.current = setInterval(() => {
      if (index < generatedText.length) {
        currentText += generatedText[index];
        handleChange('description', currentText);
        index++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsGeneratingDescription(false);
      }
    }, 30); // Typing speed: 30ms per character
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
          <p className="text-text-secondary text-sm">
            Viagem: {trip.name}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
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
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-medium text-text-primary">
                Descrição (opcional)
              </label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={!formData.name || isGeneratingDescription}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
                title="Gerar descrição automaticamente com IA"
              >
                {isGeneratingDescription ? (
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div 
              className={`
                border-2 border-dashed rounded-custom p-8 text-center transition-all duration-200 cursor-pointer
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleImageAreaClick}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary">
                  <Upload size={20} />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-primary">Selecionar imagens</span>
                </div>
                <p className="text-xs text-text-disabled">
                  {selectedImages.length}/10 imagens • Formatos: JPG, PNG, WebP, GIF • Máx: 5MB por imagem
                </p>
              </div>
            </div>
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-border bg-surface">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-status-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-status-error/80"
                      title="Remover imagem"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      {selectedImages[index]?.name || `Imagem ${index + 1}`}
                    </div>
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