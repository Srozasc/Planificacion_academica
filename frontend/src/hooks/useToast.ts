import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  isVisible: boolean;
}

interface UseToastReturn {
  toast: ToastState;
  showToast: (message: string, type?: 'error' | 'success' | 'warning' | 'info') => void;
  hideToast: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  return {
    toast,
    showToast,
    hideToast
  };
};

export default useToast;