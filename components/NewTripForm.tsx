import React, { useState, useRef } from 'react';
import { ArrowLeft, Calendar, Upload, Image as ImageIcon, Link as LinkIcon, Plus, Trash2, X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';
import { TourLink } from '../types';

interface NewTripFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

const NewTripForm: React.FC<NewTripFormProps> = ({ onSave, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const [links, setLinks] = useState<TourLink[]>([]);

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
    
    // Validação básica
    if (!formData.name || !formData.destination || !formData.startDate || !formData.endDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const finalData = {
        ...formData,
        imageUrl: imagePreview || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop', // Default fallback
        links: links.filter(l => l.title && l.url)
      };

      console.log('📝 NewTripForm: Enviando dados:', finalData);
      
      // Chamar onSave diretamente (sem setTimeout)
      await onSave(finalData);
      
      console.log('✅ NewTripForm: Dados enviados com sucesso');
    } catch (err: any) {
      console.error('❌ NewTripForm: Erro ao enviar dados:', err);
      alert(`Erro ao salvar viagem: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and Drop Logic
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type/size here if needed
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <h1 className="text-2xl font-bold text-text-primary">Nova Viagem</h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Name */}
          <Input 
            id="name"
            label="Nome da viagem *"
            placeholder="Ex: Gramado 20/03 a 25/03"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          {/* Destination */}
          <Input 
            id="destination"
            label="Destino / Cidade *"
            placeholder="Ex: Gramado, RS"
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            required
          />

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker 
              id="startDate"
              label="Data início *"
              value={formData.startDate}
              onChange={(date) => handleChange('startDate', date)}
              required
            />
            <DatePicker 
              id="endDate"
              label="Data fim *"
              value={formData.endDate}
              onChange={(date) => handleChange('endDate', date)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-text-primary">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
              placeholder="Descreva a viagem..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* External Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <LinkIcon size={16} />
                Links Importantes (Hotel, Documentos, etc)
              </label>
            </div>
            
            {links.map((link, index) => (
              <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input 
                    id={`link-title-${index}`}
                    placeholder="Título (Ex: Hotel, Voucher)"
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
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <ImageIcon size={16} />
              Imagem de Capa (opcional)
            </label>
            
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-custom overflow-hidden group border border-border animate-in fade-in zoom-in-95 duration-300">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-status-error rounded-full font-medium shadow-lg hover:bg-surface transition-transform active:scale-95"
                  >
                    <Trash2 size={18} />
                    Remover Imagem
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`
                  relative border-2 border-dashed rounded-custom p-8 text-center transition-all duration-200 cursor-pointer
                  ${dragActive 
                    ? 'border-primary bg-primary/5 scale-[0.99]' 
                    : 'border-border hover:border-primary/50 hover:bg-surface'
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileInputChange}
                />
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200
                    ${dragActive ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}
                  `}>
                    <Upload size={24} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-primary">Clique para upload</span> ou arraste e solte
                  </div>
                  <p className="text-xs text-text-disabled">
                    PNG, JPG ou WebP (Máx. 5MB)
                  </p>
                </div>
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
              Salvar Viagem
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTripForm;