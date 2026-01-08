import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 4000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      console.log('🔔 Toast visível, iniciando timer de', duration, 'ms');
      const timer = setTimeout(() => {
        console.log('🔔 Timer do toast expirado, fechando...');
        try {
          onClose();
        } catch (error) {
          console.error('❌ Erro ao fechar toast:', error);
        }
      }, duration);
      return () => {
        console.log('🔔 Limpando timer do toast');
        clearTimeout(timer);
      };
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) {
    console.log('🔔 Toast não está visível, não renderizando');
    return null;
  }

  console.log('🔔 Renderizando toast:', { message, type, isVisible });

  const bgColor = type === 'success' ? 'bg-status-success' : 'bg-status-error';
  const Icon = type === 'success' ? CheckCircle2 : XCircle;

  try {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className={`
          ${bgColor} text-white rounded-lg shadow-lg p-4 pr-10 min-w-[300px] max-w-md
          flex items-start gap-3 relative
        `}>
          <Icon size={20} className="flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-sm font-medium">{message || 'Mensagem vazia'}</p>
          <button
            onClick={() => {
              console.log('🔔 Botão de fechar toast clicado');
              try {
                onClose();
              } catch (error) {
                console.error('❌ Erro ao fechar toast no botão:', error);
              }
            }}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={16} />
        </button>
      </div>
    </div>
    );
  } catch (error) {
    console.error('❌ Erro ao renderizar toast:', error);
    return null;
  }
};

export default Toast;

