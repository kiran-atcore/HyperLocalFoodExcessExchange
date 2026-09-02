import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal, { AlertType } from '../components/AlertModal';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  confirmText?: string;
}

interface AlertContextType {
  showAlert: (title: string, message: string, type?: AlertType, onConfirm?: () => void, confirmText?: string) => void;
}

export const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ title: '', message: '' });

  const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, confirmText = 'OK') => {
    setOptions({ title, message, type, onConfirm, confirmText });
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
    if (options.onConfirm) {
      // Small delay to allow exit animation to finish
      setTimeout(() => {
        options.onConfirm?.();
      }, 300);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal 
        visible={visible} 
        title={options.title} 
        message={options.message} 
        type={options.type}
        onClose={handleClose} 
        confirmText={options.confirmText}
      />
    </AlertContext.Provider>
  );
};
