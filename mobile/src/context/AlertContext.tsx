import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal, { AlertType } from '../components/AlertModal';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (
    title: string, 
    message: string, 
    type?: AlertType, 
    onConfirm?: () => void, 
    confirmText?: string,
    showCancel?: boolean,
    cancelText?: string,
    onCancel?: () => void
  ) => void;
  hideAlert: () => void;
}

export const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ title: '', message: '' });

  const hideAlert = () => {
    setVisible(false);
  };

  const showAlert = (
    title: string, 
    message: string, 
    type: AlertType = 'info', 
    onConfirm?: () => void, 
    confirmText = 'OK',
    showCancel = false,
    cancelText = 'Cancel',
    onCancel?: () => void
  ) => {
    setOptions({ title, message, type, onConfirm, confirmText, showCancel, cancelText, onCancel });
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    if (options.onCancel) {
      setTimeout(() => {
        options.onCancel?.();
      }, 300);
    }
  };

  const handleConfirm = () => {
    setVisible(false);
    if (options.onConfirm) {
      // Small delay to allow exit animation to finish
      setTimeout(() => {
        options.onConfirm?.();
      }, 300);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AlertModal 
        visible={visible} 
        title={options.title} 
        message={options.message} 
        type={options.type}
        onClose={handleCancel} 
        onConfirm={handleConfirm}
        confirmText={options.confirmText}
        showCancel={options.showCancel}
        cancelText={options.cancelText}
      />
    </AlertContext.Provider>
  );
};
