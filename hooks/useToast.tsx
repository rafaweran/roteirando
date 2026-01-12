import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
    duration: number;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
    duration: 5000,
  });

  const showToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    setToast({
      message,
      type,
      isVisible: true,
      duration,
    });
  }, []);

  const showSuccess = useCallback((message: string, duration = 5000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration = 6000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration = 5000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration = 5500) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const handleClose = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={handleClose}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
};
