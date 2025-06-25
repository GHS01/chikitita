/**
 * 🔄 Recovery Manager Hook
 * Hook para gestionar automáticamente la recuperación muscular
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface RecoveryStatus {
  muscle_group: string;
  recovery_status: 'ready' | 'recovering' | 'overdue';
  next_available_date: string;
  last_trained_date?: string;
}

interface RecoveryDashboard {
  recoveryStatus: { [muscle: string]: RecoveryStatus };
  statistics: {
    totalMuscles: number;
    readyMuscles: number;
    recoveringMuscles: number;
    readyPercentage: number;
  };
  todayRecommendation: string;
  optimalWorkout: any;
}

export function useRecoveryManager() {
  const queryClient = useQueryClient();
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

  // Obtener dashboard de recuperación
  const { 
    data: recoveryDashboard, 
    isLoading: loadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery<{ dashboard: RecoveryDashboard }>({
    queryKey: ['/api/scientific-workouts/recovery-dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scientific-workouts/recovery-dashboard');
      return await response.json();
    },
    refetchInterval: autoUpdateEnabled ? 5 * 60 * 1000 : false, // Actualizar cada 5 minutos
    staleTime: 2 * 60 * 1000, // Considerar datos frescos por 2 minutos
  });

  // Verificar recuperación de músculos específicos
  const checkMuscleRecoveryMutation = useMutation({
    mutationFn: async (muscleGroups: string[]) => {
      const response = await apiRequest('POST', '/api/scientific-workouts/check-recovery', {
        muscleGroups
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('🔍 Recovery check result:', data);
    },
    onError: (error) => {
      console.error('❌ Error checking recovery:', error);
      toast.error('Error al verificar recuperación muscular');
    },
  });

  // Actualizar estado de recuperación después del entrenamiento
  const updateRecoveryMutation = useMutation({
    mutationFn: async ({ 
      muscleGroups, 
      workoutIntensity = 'moderate', 
      workoutDuration = 45 
    }: {
      muscleGroups: string[];
      workoutIntensity?: 'low' | 'moderate' | 'high';
      workoutDuration?: number;
    }) => {
      const response = await apiRequest('POST', '/api/scientific-workouts/update-recovery-status', {
        muscleGroups,
        workoutIntensity,
        workoutDuration
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Recovery updated:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/scientific-workouts/recovery-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scientific-workouts/today-recommendation'] });
      
      toast.success(`Recuperación actualizada: ${data.recoveryHours}h para ${data.updatedStatus.recoveryStatus ? Object.keys(data.updatedStatus.recoveryStatus).length : 0} grupos musculares`);
    },
    onError: (error) => {
      console.error('❌ Error updating recovery:', error);
      toast.error('Error al actualizar estado de recuperación');
    },
  });

  // Planificar semana con recuperación automática
  const planWeekMutation = useMutation({
    mutationFn: async ({ 
      weekStartDate, 
      preferredDays = [] 
    }: {
      weekStartDate: string;
      preferredDays?: string[];
    }) => {
      const response = await apiRequest('POST', '/api/scientific-workouts/plan-week', {
        weekStartDate,
        preferredDays
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('📅 Week planned:', data);
      toast.success('Semana planificada con recuperación optimizada');
    },
    onError: (error) => {
      console.error('❌ Error planning week:', error);
      toast.error('Error al planificar la semana');
    },
  });

  // Verificar si músculos específicos están listos para entrenar
  const checkMusclesReady = useCallback(async (muscleGroups: string[]) => {
    try {
      const result = await checkMuscleRecoveryMutation.mutateAsync(muscleGroups);
      return result.recovery?.ready || false;
    } catch (error) {
      console.error('Error checking if muscles are ready:', error);
      return false;
    }
  }, [checkMuscleRecoveryMutation]);

  // Actualizar recuperación después de completar entrenamiento
  const completeWorkout = useCallback(async (
    muscleGroups: string[], 
    intensity: 'low' | 'moderate' | 'high' = 'moderate',
    duration: number = 45
  ) => {
    try {
      await updateRecoveryMutation.mutateAsync({
        muscleGroups,
        workoutIntensity: intensity,
        workoutDuration: duration
      });
      return true;
    } catch (error) {
      console.error('Error completing workout:', error);
      return false;
    }
  }, [updateRecoveryMutation]);

  // Obtener recomendación inteligente para hoy
  const getTodayRecommendation = useCallback(() => {
    if (!recoveryDashboard?.dashboard) return null;

    const { recoveryStatus, optimalWorkout } = recoveryDashboard.dashboard;
    
    // Verificar qué músculos están listos
    const readyMuscles = Object.entries(recoveryStatus)
      .filter(([_, status]) => status.recovery_status === 'ready')
      .map(([muscle, _]) => muscle);

    return {
      readyMuscles,
      optimalWorkout,
      canTrain: readyMuscles.length > 0,
      recommendation: recoveryDashboard.dashboard.todayRecommendation
    };
  }, [recoveryDashboard]);

  // Calcular tiempo hasta que un músculo esté listo
  const getTimeUntilReady = useCallback((muscle: string) => {
    if (!recoveryDashboard?.dashboard?.recoveryStatus[muscle]) return 0;

    const status = recoveryDashboard.dashboard.recoveryStatus[muscle];
    if (status.recovery_status === 'ready') return 0;

    const now = new Date();
    const nextDate = new Date(status.next_available_date);
    const diffMs = nextDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60))); // Horas
  }, [recoveryDashboard]);

  // Obtener músculos que necesitan más tiempo de recuperación
  const getOverdueMuscles = useCallback(() => {
    if (!recoveryDashboard?.dashboard?.recoveryStatus) return [];

    return Object.entries(recoveryDashboard.dashboard.recoveryStatus)
      .filter(([_, status]) => status.recovery_status === 'overdue')
      .map(([muscle, _]) => muscle);
  }, [recoveryDashboard]);

  // Auto-actualización inteligente
  useEffect(() => {
    if (!autoUpdateEnabled) return;

    const interval = setInterval(() => {
      // Solo actualizar si hay músculos en recuperación
      if (recoveryDashboard?.dashboard?.statistics?.recoveringMuscles > 0) {
        refetchDashboard();
      }
    }, 60 * 1000); // Cada minuto

    return () => clearInterval(interval);
  }, [autoUpdateEnabled, recoveryDashboard, refetchDashboard]);

  // Notificaciones automáticas
  useEffect(() => {
    if (!recoveryDashboard?.dashboard) return;

    const overdueMuscles = getOverdueMuscles();
    if (overdueMuscles.length > 0) {
      toast.warning(`Músculos con recuperación atrasada: ${overdueMuscles.join(', ')}`);
    }
  }, [recoveryDashboard, getOverdueMuscles]);

  return {
    // Datos
    recoveryDashboard: recoveryDashboard?.dashboard || null,
    isLoading: loadingDashboard,
    error: dashboardError,

    // Funciones principales
    checkMusclesReady,
    completeWorkout,
    getTodayRecommendation,
    getTimeUntilReady,
    getOverdueMuscles,

    // Mutaciones
    checkMuscleRecovery: checkMuscleRecoveryMutation.mutateAsync,
    updateRecovery: updateRecoveryMutation.mutateAsync,
    planWeek: planWeekMutation.mutateAsync,

    // Estados de carga
    isCheckingRecovery: checkMuscleRecoveryMutation.isPending,
    isUpdatingRecovery: updateRecoveryMutation.isPending,
    isPlanningWeek: planWeekMutation.isPending,

    // Configuración
    autoUpdateEnabled,
    setAutoUpdateEnabled,
    refetchDashboard,

    // Utilidades
    isRecoveryOptimal: recoveryDashboard?.dashboard?.statistics?.readyPercentage >= 70,
    canTrainToday: getTodayRecommendation()?.canTrain || false,
    readyMuscleCount: recoveryDashboard?.dashboard?.statistics?.readyMuscles || 0,
    recoveringMuscleCount: recoveryDashboard?.dashboard?.statistics?.recoveringMuscles || 0
  };
}
