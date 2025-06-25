/**
 * 🏋️‍♂️ Hook para gestionar sugerencias de peso inteligentes
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface WeightSuggestion {
  suggestedWeight: number;
  confidenceScore: number;
  lastUsedWeight?: number;
  progressionTrend: 'increasing' | 'stable' | 'decreasing';
  basedOnSessions: number;
  targetRpeRange: string;
  muscleGroup: string;
  exerciseType: string;
}

interface WeightUsageData {
  exerciseName: string;
  suggestedWeight: number;
  actualWeight: number;
  weightFeedback?: 'too_light' | 'perfect' | 'too_heavy';
  rpeAchieved?: number;
  repsCompleted?: number;
  setsCompleted?: number;
  sessionId: number;
}

export const useWeightSuggestions = () => {
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const queryClient = useQueryClient();

  /**
   * 🔍 Obtener sugerencia de peso para un ejercicio
   */
  const getWeightSuggestion = useCallback(async (exerciseName: string): Promise<WeightSuggestion | null> => {
    try {
      setIsLoadingSuggestion(true);
      const response = await apiRequest('GET', `/api/weight-suggestions/${encodeURIComponent(exerciseName)}`);
      const data = await response.json();
      
      if (data.success) {
        return data.suggestion;
      } else {
        console.log('No weight suggestion available for:', exerciseName);
        return null;
      }
    } catch (error) {
      console.error('Error getting weight suggestion:', error);
      return null;
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, []);

  /**
   * 📊 Mutación para registrar uso de peso
   */
  const recordWeightUsageMutation = useMutation({
    mutationFn: async (weightData: WeightUsageData) => {
      console.log('🏋️‍♂️ Recording weight usage:', weightData);
      const response = await apiRequest('POST', '/api/weight-suggestions/record-usage', weightData);
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log('✅ Weight usage recorded successfully:', data);
      
      // Invalidar cache de sugerencias para este ejercicio
      queryClient.invalidateQueries({ 
        queryKey: ['weight-suggestion', variables.exerciseName] 
      });
      
      // Invalidar historial de peso
      queryClient.invalidateQueries({ 
        queryKey: ['weight-history', variables.exerciseName] 
      });
    },
    onError: (error) => {
      console.error('❌ Error recording weight usage:', error);
    }
  });

  /**
   * 🎯 Mutación para registrar feedback de set
   */
  const recordSetFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      console.log('🎯 Recording set feedback:', feedbackData);
      const response = await apiRequest('POST', '/api/weight-suggestions/set-feedback', feedbackData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Set feedback recorded successfully:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['set-feedback'] });
    },
    onError: (error) => {
      console.error('❌ Error recording set feedback:', error);
    }
  });

  /**
   * ⏱️ Mutación para registrar patrón de descanso
   */
  const recordRestPatternMutation = useMutation({
    mutationFn: async (restData: any) => {
      console.log('⏱️ Recording rest pattern:', restData);
      const response = await apiRequest('POST', '/api/weight-suggestions/rest-pattern', restData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Rest pattern recorded successfully:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['rest-patterns'] });
    },
    onError: (error) => {
      console.error('❌ Error recording rest pattern:', error);
    }
  });

  /**
   * 🤖 Mutación para procesar aprendizaje de IA
   */
  const processAILearningMutation = useMutation({
    mutationFn: async () => {
      console.log('🤖 Processing AI learning...');
      const response = await apiRequest('POST', '/api/weight-suggestions/process-ai-learning');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ AI learning processed successfully:', data);
      
      // Invalidar todas las sugerencias de peso para refrescar con nuevos datos
      queryClient.invalidateQueries({ queryKey: ['weight-suggestion'] });
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
    },
    onError: (error) => {
      console.error('❌ Error processing AI learning:', error);
    }
  });

  /**
   * 📊 Query para obtener historial de peso
   */
  const useWeightHistory = (exerciseName: string, limit: number = 10) => {
    return useQuery({
      queryKey: ['weight-history', exerciseName, limit],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/weight-suggestions/history/${encodeURIComponent(exerciseName)}?limit=${limit}`);
        const data = await response.json();
        return data.success ? data.history : [];
      },
      enabled: !!exerciseName,
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  /**
   * 🎯 Query para obtener sugerencia de peso con cache
   */
  const useWeightSuggestionQuery = (exerciseName: string) => {
    return useQuery({
      queryKey: ['weight-suggestion', exerciseName],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/weight-suggestions/${encodeURIComponent(exerciseName)}`);
        const data = await response.json();
        return data.success ? data.suggestion : null;
      },
      enabled: !!exerciseName,
      staleTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
    });
  };

  /**
   * 🔄 Función para refrescar sugerencias después de cambios
   */
  const refreshSuggestions = useCallback(async (exerciseName?: string) => {
    if (exerciseName) {
      await queryClient.invalidateQueries({ 
        queryKey: ['weight-suggestion', exerciseName] 
      });
    } else {
      await queryClient.invalidateQueries({ 
        queryKey: ['weight-suggestion'] 
      });
    }
  }, [queryClient]);

  /**
   * 📈 Función para obtener tendencia de progresión
   */
  const getProgressionTrend = useCallback((history: any[]): 'increasing' | 'stable' | 'decreasing' => {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(0, 3);
    const older = history.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.actualWeight, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.actualWeight, 0) / older.length;
    
    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (changePercentage > 5) return 'increasing';
    if (changePercentage < -5) return 'decreasing';
    return 'stable';
  }, []);

  /**
   * 🎯 Función para calcular RPE promedio
   */
  const getAverageRPE = useCallback((history: any[]): number => {
    if (history.length === 0) return 7;
    
    const rpeValues = history
      .filter(entry => entry.rpeAchieved)
      .map(entry => entry.rpeAchieved);
    
    if (rpeValues.length === 0) return 7;
    
    return rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  }, []);

  /**
   * 💡 Función para generar recomendación inteligente
   */
  const generateSmartRecommendation = useCallback((
    suggestion: WeightSuggestion | null,
    history: any[]
  ): string => {
    if (!suggestion) return 'Comienza con un peso cómodo y ajusta según tu sensación.';
    
    const trend = getProgressionTrend(history);
    const avgRPE = getAverageRPE(history);
    const confidence = suggestion.confidenceScore;
    
    let recommendation = '';
    
    if (confidence > 0.8) {
      recommendation = `Recomendación alta confianza: ${suggestion.suggestedWeight}kg. `;
    } else if (confidence > 0.6) {
      recommendation = `Sugerencia moderada: ${suggestion.suggestedWeight}kg. `;
    } else {
      recommendation = `Sugerencia inicial: ${suggestion.suggestedWeight}kg. `;
    }
    
    if (trend === 'increasing' && avgRPE < 7) {
      recommendation += 'Estás progresando bien, puedes seguir aumentando gradualmente.';
    } else if (trend === 'decreasing' || avgRPE > 8) {
      recommendation += 'Considera mantener o reducir ligeramente el peso para optimizar la técnica.';
    } else {
      recommendation += 'Mantén el peso actual y enfócate en la calidad del movimiento.';
    }
    
    return recommendation;
  }, [getProgressionTrend, getAverageRPE]);

  return {
    // Funciones principales
    getWeightSuggestion,
    refreshSuggestions,
    
    // Mutaciones
    recordWeightUsage: recordWeightUsageMutation.mutate,
    recordSetFeedback: recordSetFeedbackMutation.mutate,
    recordRestPattern: recordRestPatternMutation.mutate,
    processAILearning: processAILearningMutation.mutate,
    
    // Queries
    useWeightHistory,
    useWeightSuggestionQuery,
    
    // Utilidades
    getProgressionTrend,
    getAverageRPE,
    generateSmartRecommendation,
    
    // Estados
    isLoadingSuggestion,
    isRecordingWeight: recordWeightUsageMutation.isPending,
    isRecordingFeedback: recordSetFeedbackMutation.isPending,
    isRecordingRest: recordRestPatternMutation.isPending,
    isProcessingAI: processAILearningMutation.isPending,
  };
};
