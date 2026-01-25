import React, { useState, useRef } from 'react';
import { X, Check, DollarSign, Calendar, CreditCard, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import Button from './Button';
import { Tour, Group, TourAttendanceInfo } from '../types';
import { storageApi } from '../lib/database';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    tourId: string, 
    isPaid: boolean, 
    paymentDate?: string | null, 
    paymentMethod?: string | null, 
    documentUrls?: string[]
  ) => void;
  tour: Tour;
  group: Group;
  attendanceInfo?: TourAttendanceInfo;
}

const PAYMENT_METHODS = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Transferência Bancária',
  'Boleto'
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tour,
  group,
  attendanceInfo
}) => {
  const [isPaid, setIsPaid] = useState(attendanceInfo?.isPaid || false);
  const [paymentDate, setPaymentDate] = useState(attendanceInfo?.paymentDate || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(attendanceInfo?.paymentMethod || 'Pix');
  const [documentUrls, setDocumentUrls] = useState<string[]>(attendanceInfo?.documentUrls || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (documentUrls.length >= 2) {
      alert('Você só pode enviar até 2 comprovantes.');
      return;
    }

    try {
      setIsUploading(true);
      const url = await storageApi.uploadPaymentProof(file, group.id, tour.id);
      setDocumentUrls(prev => [...prev, url]);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      const errorMsg = error?.message || error?.error_description || 'Erro desconhecido';
      alert(`Erro ao fazer upload do comprovante: ${errorMsg}\n\nVerifique se o bucket "documents" foi criado no Supabase.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setDocumentUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = () => {
    onConfirm(
      tour.id,
      isPaid,
      isPaid ? paymentDate : null,
      isPaid ? paymentMethod : null,
      documentUrls
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="bg-white rounded-xl sm:rounded-[24px] shadow-2xl w-full max-w-md mx-4 sm:mx-auto relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-surface/50">
          <div className="flex items-start justify-between mb-2">
            <div>
               <h3 className="text-xl font-bold text-text-primary">Status do Pagamento</h3>
               <p className="text-sm text-text-secondary mt-1 line-clamp-1">{tour.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-text-disabled hover:text-text-primary transition-colors bg-white rounded-full border border-border"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Toggle Pago */}
          <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPaid ? 'bg-status-success/10 text-status-success' : 'bg-text-disabled/10 text-text-disabled'}`}>
                <DollarSign size={20} />
              </div>
              <div>
                <p className="font-bold text-text-primary">Passeio Pago</p>
                <p className="text-xs text-text-secondary">Marque se o pagamento já foi realizado</p>
              </div>
            </div>
            <button
              onClick={() => setIsPaid(!isPaid)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPaid ? 'bg-status-success' : 'bg-text-disabled'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPaid ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {isPaid && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Data do Pagamento */}
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Comprovante / Documento */}
          <div>
            <label className="text-sm font-semibold text-text-primary mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Comprovantes / Documentos
              </span>
              <span className="text-xs font-normal text-text-secondary">
                {documentUrls.length}/2 arquivos
              </span>
            </label>
            
            <div className="space-y-2 mb-4">
              {documentUrls.map((url, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-primary flex-shrink-0" />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-medium underline truncate"
                    >
                      Comprovante {idx + 1}
                    </a>
                  </div>
                  <button 
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1.5 text-status-error hover:bg-status-error/10 rounded-md transition-colors"
                    title="Remover documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {documentUrls.length < 2 && (
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${isUploading ? 'bg-surface border-border opacity-50 cursor-wait' : 'border-border hover:border-primary/50 hover:bg-primary/5'}
                `}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-primary animate-spin" />
                    <p className="text-sm font-medium text-text-secondary">Enviando documento...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <Upload size={20} />
                    </div>
                    <p className="text-sm font-bold text-text-primary">Fazer upload de comprovante</p>
                    <p className="text-xs text-text-secondary">PDF, JPG ou PNG (Máx. 5MB)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,image/*"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface/30">
          <Button fullWidth onClick={handleSave}>
            Salvar Informações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
