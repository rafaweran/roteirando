import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const config = {
    success: {
      bg: 'bg-status-success',
      icon: CheckCircle2,
      iconColor: 'text-white',
      border: 'border-status-success/30',
    },
    error: {
      bg: 'bg-status-error',
      icon: XCircle,
      iconColor: 'text-white',
      border: 'border-status-error/30',
    },
    warning: {
      bg: 'bg-status-warning',
      icon: AlertTriangle,
      iconColor: 'text-white',
      border: 'border-status-warning/30',
    },
    info: {
      bg: 'bg-primary',
      icon: Info,
      iconColor: 'text-white',
      border: 'border-primary/30',
    },
  };

  const { bg, icon: Icon, iconColor, border } = config[type];

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-right-4 duration-300">
      <div className={`
        ${bg} text-white rounded-xl shadow-2xl p-4 pr-10 min-w-[320px] max-w-md
        flex items-start gap-3 relative border-2 ${border}
        backdrop-blur-sm
      `}>
        <div className="flex-shrink-0">
          <Icon size={22} className={iconColor} strokeWidth={2.5} />
        </div>
        <p className="flex-1 text-sm font-medium leading-relaxed pr-2">
          {message}
        </p>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-all hover:scale-110 active:scale-95"
          aria-label="Fechar"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-white/40 animate-shrink-width"
              style={{
                animation: `shrink ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;

