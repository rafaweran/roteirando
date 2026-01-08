import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'info';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isLoading,
  variant = 'info'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="bg-white rounded-[20px] shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {variant === 'danger' && (
              <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center flex-shrink-0 text-status-error">
                <AlertTriangle size={24} />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {description}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="text-text-disabled hover:text-text-primary transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="bg-surface p-4 flex gap-3 justify-end border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-10 px-6"
          >
            {cancelLabel}
          </Button>
          <Button 
            className={`h-10 px-6 ${variant === 'danger' ? 'bg-status-error hover:bg-red-700' : ''}`}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;