import React, { useState } from 'react';
import { X, Calendar, Target, Clock, AlertTriangle } from 'lucide-react';

/**
 * 🔄 Modal para manejar cambios en frecuencia de entrenamiento
 * Permite al usuario decidir entre mantener mesociclo actual o crear uno nuevo
 */

interface FrequencyChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeData: {
    changeId: number;
    oldFrequency: number;
    newFrequency: number;
    oldSplitType?: string;
    suggestedSplitType: string;
    remainingWeeks?: number;
    activeMesocycle?: {
      id: number;
      split_type: string;
      duration_weeks: number;
    };
  };
  onDecision: (decision: 'keep_current' | 'create_new', reason?: string) => Promise<void>;
}

const FrequencyChangeModal: React.FC<FrequencyChangeModalProps> = ({
  isOpen,
  onClose,
  changeData,
  onDecision
}) => {
  const [selectedDecision, setSelectedDecision] = useState<'keep_current' | 'create_new' | null>(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDecision = async () => {
    if (!selectedDecision) return;
    
    setIsProcessing(true);
    try {
      await onDecision(selectedDecision, reason);
      onClose();
    } catch (error) {
      console.error('Error processing decision:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSplitType = (splitType: string) => {
    const splitMap: { [key: string]: string } = {
      'push_pull_legs': 'Push/Pull/Legs',
      'upper_lower': 'Upper/Lower',
      'full_body': 'Full Body',
      'body_part_split': 'Body Part Split'
    };
    return splitMap[splitType] || splitType;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cambio de Frecuencia Detectado</h2>
              <p className="text-sm text-gray-600">Tu disponibilidad de entrenamiento ha cambiado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Change Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Resumen del Cambio</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Frecuencia Anterior:</span>
                <p className="text-blue-900">{changeData.oldFrequency} días por semana</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Nueva Frecuencia:</span>
                <p className="text-blue-900">{changeData.newFrequency} días por semana</p>
              </div>
              {changeData.oldSplitType && (
                <div>
                  <span className="text-blue-700 font-medium">Split Actual:</span>
                  <p className="text-blue-900">{formatSplitType(changeData.oldSplitType)}</p>
                </div>
              )}
              <div>
                <span className="text-blue-700 font-medium">Split Sugerido:</span>
                <p className="text-blue-900">{formatSplitType(changeData.suggestedSplitType)}</p>
              </div>
            </div>
          </div>

          {/* Current Mesocycle Info */}
          {changeData.activeMesocycle && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Mesociclo Actual
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-medium">Split:</span>
                  <p className="text-gray-900">{formatSplitType(changeData.activeMesocycle.split_type)}</p>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Semanas Restantes:</span>
                  <p className="text-gray-900">{changeData.remainingWeeks || 0} semanas</p>
                </div>
              </div>
            </div>
          )}

          {/* Decision Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">¿Qué deseas hacer?</h3>
            
            {/* Option 1: Keep Current */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedDecision === 'keep_current' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDecision('keep_current')}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  checked={selectedDecision === 'keep_current'}
                  onChange={() => setSelectedDecision('keep_current')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Mantener Mesociclo Actual
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Continúa con tu mesociclo {changeData.oldSplitType ? formatSplitType(changeData.oldSplitType) : 'actual'} 
                    hasta completar las {changeData.remainingWeeks || 0} semanas restantes.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    ✅ Preserva tu progreso actual<br/>
                    ✅ Mantiene consistencia en el entrenamiento<br/>
                    ⚠️ No se adapta inmediatamente a tu nueva disponibilidad
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: Create New */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedDecision === 'create_new' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDecision('create_new')}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  checked={selectedDecision === 'create_new'}
                  onChange={() => setSelectedDecision('create_new')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Crear Nuevo Mesociclo
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Inicia un nuevo mesociclo {formatSplitType(changeData.suggestedSplitType)} 
                    adaptado a tu nueva frecuencia de {changeData.newFrequency} días.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    ✅ Se adapta inmediatamente a tu disponibilidad<br/>
                    ✅ Split optimizado para {changeData.newFrequency} días<br/>
                    ⚠️ Reinicia el progreso del mesociclo
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          {selectedDecision && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Razón del cambio (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Cambié mi horario de trabajo, tengo más tiempo disponible..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            onClick={handleDecision}
            disabled={!selectedDecision || isProcessing}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedDecision && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Decisión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequencyChangeModal;
