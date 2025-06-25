import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ModernConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'success' | 'warning' | 'info';
}

const ModernConfirmDialog: React.FC<ModernConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Aceptar',
  type = 'success'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconColor: 'text-green-500',
          bgGradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          buttonBg: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        };
      case 'warning':
        return {
          iconColor: 'text-amber-500',
          bgGradient: 'from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
        };
      case 'info':
        return {
          iconColor: 'text-blue-500',
          bgGradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
        };
      default:
        return {
          iconColor: 'text-green-500',
          bgGradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          buttonBg: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${styles.bgGradient} rounded-t-2xl p-6 border-b ${styles.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full bg-white/80 ${styles.iconColor}`}>
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/50 transition-colors duration-200"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 ${styles.buttonBg} text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernConfirmDialog;
