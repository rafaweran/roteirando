import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { Tour } from '../types';
import { useToast } from '../hooks/useToast';

interface CancelTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  tour: Tour;
}

const CancelTourModal: React.FC<CancelTourModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tour
}) => {
  const { showWarning, showError } = useToast();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      showWarning('Por favor, informe o motivo do cancelamento.');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(reason.trim());
      // O modal será fechado pelo componente pai após sucesso
      setReason('');
    } catch (error) {
      console.error('Erro ao cancelar passeio:', error);
      showError('Erro ao cancelar passeio. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-status-error/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-status-error" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-text-primary">Cancelar Passeio</h3>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 line-clamp-2">{tour.name}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-text-disabled hover:text-text-primary transition-colors bg-white rounded-full border border-border hover:border-primary/30"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-text-secondary mb-4">
              Tem certeza que deseja cancelar a presença neste passeio? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="cancelReason" className="text-sm sm:text-base font-semibold text-text-primary">
                Motivo do cancelamento *
              </label>
              <textarea
                id="cancelReason"
                rows={4}
                className="w-full rounded-custom border border-border bg-white px-4 py-3 text-sm sm:text-base text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
                placeholder="Explique o motivo do cancelamento..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <p className="text-xs text-text-disabled">
                Este motivo será registrado e poderá ser visualizado pelo administrador.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-surface/30 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1 min-h-[52px] sm:h-11 text-base sm:text-sm font-semibold"
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 bg-status-error hover:bg-status-error/90 text-white order-1 sm:order-2 min-h-[52px] sm:h-11 text-base sm:text-sm font-semibold"
            disabled={isLoading || !reason.trim()}
            isLoading={isLoading}
          >
            {isLoading ? 'Cancelando...' : 'Cancelar Passeio'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelTourModal;

