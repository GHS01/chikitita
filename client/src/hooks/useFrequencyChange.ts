import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 🔄 Hook para manejar cambios en frecuencia de entrenamiento
 * Detecta cambios, muestra modal de decisión, y procesa respuestas del usuario
 */

interface FrequencyChangeData {
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
}

interface FrequencyChangeDetection {
  changeDetected: boolean;
  oldFrequency: number;
  newFrequency: number;
  oldSplitType?: string;
  suggestedSplitType: string;
  remainingWeeks?: number;
  changeId?: number;
  activeMesocycle?: any;
}

export const useFrequencyChange = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentChangeData, setCurrentChangeData] = useState<FrequencyChangeData | null>(null);
  const queryClient = useQueryClient();

  // Query para obtener cambios pendientes
  const { data: pendingChanges, refetch: refetchPendingChanges } = useQuery({
    queryKey: ['frequency-changes', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/user/frequency-changes/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending changes');
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Verificar cada 30 segundos
  });

  // Mutation para procesar decisión del usuario
  const processDecisionMutation = useMutation({
    mutationFn: async ({ changeId, decision, reason }: {
      changeId: number;
      decision: 'keep_current' | 'create_new';
      reason?: string;
    }) => {
      const response = await fetch('/api/user/frequency-changes/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ changeId, decision, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to process decision');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ [FrequencyChange] Decision processed successfully:', data);

      // 🔄 INVALIDAR TODOS LOS CACHES RELACIONADOS
      queryClient.invalidateQueries({ queryKey: ['frequency-changes'] });
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] }); // 🚨 CRÍTICO: Cache específico
      queryClient.invalidateQueries({ queryKey: ['scientific-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['mesocycle-status'] });

      // 🔄 FORZAR REFETCH INMEDIATO de preferencias
      queryClient.refetchQueries({ queryKey: ['/api/user/preferences'] });

      // Cerrar modal
      setShowModal(false);
      setCurrentChangeData(null);

      // Mostrar notificación de éxito
      if (data.newMesocycle) {
        console.log('🎉 [FrequencyChange] New mesocycle created:', data.newMesocycle.id);

        // 🔄 REFETCH ADICIONAL después de crear mesociclo
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ['/api/user/preferences'] });
          queryClient.refetchQueries({ queryKey: ['scientific-workouts'] });
        }, 500);
      }
    },
    onError: (error) => {
      console.error('❌ [FrequencyChange] Error processing decision:', error);
    }
  });

  // Detectar cambios automáticamente cuando se actualiza la respuesta de preferencias
  const handleFrequencyChangeDetection = (detection: FrequencyChangeDetection) => {
    if (detection.changeDetected && detection.changeId) {
      console.log('🚨 [FrequencyChange] Change detected, showing modal:', detection);
      
      setCurrentChangeData({
        changeId: detection.changeId,
        oldFrequency: detection.oldFrequency,
        newFrequency: detection.newFrequency,
        oldSplitType: detection.oldSplitType,
        suggestedSplitType: detection.suggestedSplitType,
        remainingWeeks: detection.remainingWeeks,
        activeMesocycle: detection.activeMesocycle
      });
      
      setShowModal(true);
    }
  };

  // Verificar cambios pendientes al cargar
  useEffect(() => {
    if (pendingChanges && pendingChanges.length > 0) {
      const latestChange = pendingChanges[0];
      console.log('🔍 [FrequencyChange] Found pending change:', latestChange);
      
      setCurrentChangeData({
        changeId: latestChange.id,
        oldFrequency: latestChange.old_frequency,
        newFrequency: latestChange.new_frequency,
        oldSplitType: latestChange.old_split_type,
        suggestedSplitType: latestChange.suggested_split_type,
        remainingWeeks: latestChange.remaining_weeks,
        activeMesocycle: latestChange.active_mesocycle_id ? {
          id: latestChange.active_mesocycle_id,
          split_type: latestChange.old_split_type || '',
          duration_weeks: 6 // Default, se puede mejorar
        } : undefined
      });
      
      setShowModal(true);
    }
  }, [pendingChanges]);

  // Función para procesar decisión
  const processDecision = async (decision: 'keep_current' | 'create_new', reason?: string) => {
    if (!currentChangeData) return;
    
    await processDecisionMutation.mutateAsync({
      changeId: currentChangeData.changeId,
      decision,
      reason
    });
  };

  // Función para cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentChangeData(null);
  };

  return {
    // Estado
    showModal,
    currentChangeData,
    isProcessing: processDecisionMutation.isPending,
    
    // Datos
    pendingChanges,
    
    // Funciones
    handleFrequencyChangeDetection,
    processDecision,
    closeModal,
    refetchPendingChanges,
    
    // Estados de mutación
    isSuccess: processDecisionMutation.isSuccess,
    isError: processDecisionMutation.isError,
    error: processDecisionMutation.error
  };
};

// Hook para integrar con actualizaciones de preferencias
export const usePreferencesWithFrequencyDetection = () => {
  const { handleFrequencyChangeDetection } = useFrequencyChange();
  
  const updatePreferences = async (preferences: any) => {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }

    const data = await response.json();
    
    // Verificar si hay detección de cambio de frecuencia
    if (data.frequencyChangeDetection) {
      handleFrequencyChangeDetection(data.frequencyChangeDetection);
    }
    
    return data;
  };

  return {
    updatePreferences
  };
};
