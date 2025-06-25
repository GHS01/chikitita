import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Weight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus,
  Brain,
  Target,
  History
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { useWeightSuggestions } from '@/hooks/useWeightSuggestions';

interface WeightSelectionData {
  selectedWeight: number;
  confidence: 'low' | 'medium' | 'high';
}

interface WeightSuggestion {
  suggestedWeight: number;
  confidenceScore: number;
  lastUsedWeight?: number;
  progressionTrend?: 'increasing' | 'stable' | 'decreasing';
  basedOnSessions: number;
}

interface WeightSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WeightSelectionData) => void;
  exerciseName: string;
  suggestion?: WeightSuggestion;
  isLoading?: boolean;
}

const WeightSelectionModal: React.FC<WeightSelectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  exerciseName,
  suggestion,
  isLoading = false
}) => {
  const [selectedWeight, setSelectedWeight] = useState<number>(25);
  const [customWeight, setCustomWeight] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 🏋️‍♂️ Hook para gestión inteligente de peso
  const {
    useWeightHistory,
    generateSmartRecommendation,
    getProgressionTrend,
    getAverageRPE
  } = useWeightSuggestions();

  // 📊 Obtener historial de peso para este ejercicio
  const { data: weightHistory = [] } = useWeightHistory(exerciseName, 5);

  // Inicializar peso cuando se recibe la sugerencia
  useEffect(() => {
    if (suggestion?.suggestedWeight) {
      setSelectedWeight(suggestion.suggestedWeight);
      setCustomWeight(suggestion.suggestedWeight.toString());
    }
  }, [suggestion]);

  const handleSubmit = () => {
    const finalWeight = isCustomMode ? parseFloat(customWeight) || selectedWeight : selectedWeight;
    
    if (finalWeight <= 0) {
      return; // Validación básica
    }

    const confidence = getConfidenceLevel(finalWeight);
    
    const data: WeightSelectionData = {
      selectedWeight: finalWeight,
      confidence
    };
    
    onSubmit(data);
  };

  const getConfidenceLevel = (weight: number): 'low' | 'medium' | 'high' => {
    if (!suggestion) return 'low';
    
    const diff = Math.abs(weight - suggestion.suggestedWeight);
    const percentDiff = (diff / suggestion.suggestedWeight) * 100;
    
    if (percentDiff <= 5) return 'high';
    if (percentDiff <= 15) return 'medium';
    return 'low';
  };

  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(2.5, selectedWeight + delta);
    setSelectedWeight(newWeight);
    setCustomWeight(newWeight.toString());
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.7) return 'Alta confianza';
    if (score >= 0.4) return 'Confianza media';
    return 'Baja confianza';
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendLabel = (trend?: string) => {
    switch (trend) {
      case 'increasing': return 'Progresando';
      case 'decreasing': return 'Reduciendo';
      default: return 'Estable';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}> {/* 🚫 DISABLED: No permitir cerrar para obligar completitud */}
      <DialogContent className="w-[90vw] max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto p-0 gap-0 rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="p-4 pb-2 lg:p-6 lg:pb-3 text-center">
          <DialogTitle className="flex items-center gap-2 justify-center text-lg lg:text-xl font-semibold text-gray-800">
            <ModernEmoji emoji="🏋️‍♂️" size={20} />
            ¿Qué peso usarás?
          </DialogTitle>
          <p className="text-sm lg:text-base text-gray-600 mt-1 font-medium">
            {exerciseName}
          </p>
        </DialogHeader>

        <div className="px-4 pb-2 lg:px-6 lg:pb-3">
          {/* 🤖 Sugerencia de IA Responsive */}
          {suggestion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 lg:p-4 mb-3 lg:mb-4">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm lg:text-base">Sugerencia de IA</span>
                </div>
                <Badge className={`text-xs lg:text-sm px-2 py-1 ${getConfidenceColor(suggestion.confidenceScore)}`}>
                  {getConfidenceLabel(suggestion.confidenceScore)}
                </Badge>
              </div>

              <div className="text-center">
                <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-900 mb-1 lg:mb-2">
                  {suggestion.suggestedWeight}kg
                </div>
                <div className="flex items-center justify-center gap-2 lg:gap-3 text-xs lg:text-sm text-blue-700">
                  {getTrendIcon(suggestion.progressionTrend)}
                  <span>{getTrendLabel(suggestion.progressionTrend)}</span>
                  {suggestion.lastUsedWeight && (
                    <>
                      <span>•</span>
                      <span>Último: {suggestion.lastUsedWeight}kg</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 🏋️‍♂️ Selector de Peso Responsive */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 lg:p-4 mb-3 lg:mb-4">
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <Weight className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600" />
              <span className="font-semibold text-gray-800 text-sm lg:text-base">Seleccionar Peso</span>
            </div>

            {!isCustomMode ? (
              <>
                {/* Peso Actual */}
                <div className="text-center mb-3 lg:mb-4">
                  <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">
                    {selectedWeight}kg
                  </div>
                </div>

                {/* Botones de Ajuste Responsive */}
                <div className="grid grid-cols-4 gap-1.5 lg:gap-2 mb-3 lg:mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(-5)}
                    className="text-xs lg:text-sm h-8 lg:h-10 px-2"
                  >
                    -5kg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(-2.5)}
                    className="text-xs lg:text-sm h-8 lg:h-10 px-2"
                  >
                    -2.5kg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(2.5)}
                    className="text-xs lg:text-sm h-8 lg:h-10 px-2"
                  >
                    +2.5kg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(5)}
                    className="text-xs lg:text-sm h-8 lg:h-10 px-2"
                  >
                    +5kg
                  </Button>
                </div>

                {/* Botones Principales Responsive */}
                <div className="flex gap-2 lg:gap-3 mb-2 lg:mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(-2.5)}
                    className="flex-1 h-8 lg:h-10"
                  >
                    <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(2.5)}
                    className="flex-1 h-8 lg:h-10"
                  >
                    <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Modo Personalizado */
              <div className="mb-2 lg:mb-3">
                <Input
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="Peso en kg"
                  step="0.5"
                  min="0"
                  className="text-center text-lg lg:text-xl h-10 lg:h-12"
                />
              </div>
            )}

            {/* Toggle Modo Personalizado */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="w-full text-xs lg:text-sm text-gray-500 h-6 lg:h-8 p-0"
            >
              {isCustomMode ? 'Usar botones' : 'Ingresar peso personalizado'}
            </Button>
          </div>

          {/* 💡 Recomendación Inteligente Responsive */}
          {suggestion && weightHistory.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 lg:p-4 mb-3 lg:mb-4">
              <div className="flex items-center gap-2 mb-2 lg:mb-3">
                <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                <span className="font-semibold text-green-900 text-sm lg:text-base">Recomendación IA</span>
              </div>
              <p className="text-xs lg:text-sm text-green-800 leading-relaxed mb-2 lg:mb-3">
                {generateSmartRecommendation(suggestion, weightHistory)}
              </p>
              <div className="flex items-center justify-center gap-3 lg:gap-4 text-xs lg:text-sm text-green-700">
                <span>RPE: {getAverageRPE(weightHistory).toFixed(1)}</span>
                <span>•</span>
                <span>{getTrendLabel(getProgressionTrend(weightHistory))}</span>
              </div>
            </div>
          )}

          {/* 🎯 Indicador de Confianza Responsive */}
          {suggestion && (
            <div className="text-center mb-2 lg:mb-3">
              <div className="flex items-center justify-center gap-2 text-xs lg:text-sm text-gray-600">
                <Target className="h-3 w-3 lg:h-4 lg:w-4" />
                <span>
                  Confianza: {getConfidenceLevel(isCustomMode ? parseFloat(customWeight) || selectedWeight : selectedWeight)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 🎯 Botón de Acción Único - Sin Cancelar para Obligar Completitud */}
        <div className="flex p-4 lg:p-6 pt-2 lg:pt-3 bg-gray-50 rounded-b-2xl">
          <Button
            onClick={handleSubmit}
            className="w-full h-10 lg:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm lg:text-base"
            disabled={isLoading || (isCustomMode && !customWeight)}
          >
            {isLoading ? 'Guardando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeightSelectionModal;
