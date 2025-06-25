/**
 * 🔍 Hook para gestionar el estado del mesociclo del usuario
 * Determina si puede crear nuevo mesociclo o debe editar el existente
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MesocycleStatus {
  hasActiveMesocycle: boolean;
  hasWorkoutHistory: boolean;
  canCreateNew: boolean;
  mustEdit: boolean;
  activeMesocycle?: {
    id: number;
    mesocycle_name: string;
    start_date: string;
    end_date: string;
    split_type: string;
    duration_weeks: number;
    status: string;
  };
}

interface MesocycleStatusResponse {
  success: boolean;
  status: MesocycleStatus;
  message: string;
}

/**
 * 🔍 Hook principal para obtener estado del mesociclo
 */
export function useMesocycleStatus() {
  return useQuery<MesocycleStatusResponse>({
    queryKey: ['/api/scientific-workouts/mesocycle-status'],
    queryFn: async () => {
      console.log('🔍 [useMesocycleStatus] Fetching mesocycle status...');
      
      const response = await apiRequest('GET', '/api/scientific-workouts/mesocycle-status');
      const data = await response.json();
      
      console.log('🔍 [useMesocycleStatus] Status received:', data);
      return data;
    },
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * 🎯 Hook simplificado que retorna solo el estado
 */
export function useMesocycleState() {
  const { data, isLoading, error, refetch } = useMesocycleStatus();

  return {
    status: data?.status || null,
    isLoading,
    error,
    refetch,
    // Helpers para UI condicional
    canCreateNew: data?.status?.canCreateNew ?? false,
    mustEdit: data?.status?.mustEdit ?? false,
    hasActiveMesocycle: data?.status?.hasActiveMesocycle ?? false,
    activeMesocycle: data?.status?.activeMesocycle || null
  };
}

/**
 * 🛡️ Hook para validar si puede realizar acciones
 */
export function useMesocycleActions() {
  const { status, isLoading } = useMesocycleState();
  
  return {
    canCreateMesocycle: !isLoading && status?.canCreateNew === true,
    canEditMesocycle: !isLoading && status?.mustEdit === true,
    canGenerateWorkouts: !isLoading && status?.hasActiveMesocycle === true,
    isLoading,
    status
  };
}

/**
 * 🎨 Hook para obtener textos de UI condicional
 */
export function useMesocycleUITexts() {
  const { status, isLoading } = useMesocycleState();
  
  if (isLoading) {
    return {
      primaryButtonText: 'Cargando...',
      primaryButtonAction: 'loading',
      description: 'Verificando estado del mesociclo...',
      title: 'Cargando'
    };
  }
  
  if (status?.canCreateNew) {
    return {
      primaryButtonText: 'Crear Primer Mesociclo',
      primaryButtonAction: 'create',
      description: 'Configura tu primer mesociclo eligiendo el split científico que mejor se adapte a tus objetivos',
      title: 'Sin Mesociclo Activo'
    };
  }
  
  if (status?.mustEdit) {
    return {
      primaryButtonText: 'Editar Mesociclo Actual',
      primaryButtonAction: 'edit',
      description: `Tienes un mesociclo activo: ${status.activeMesocycle?.mesocycle_name}. Puedes editar los días de entrenamiento.`,
      title: 'Mesociclo Activo'
    };
  }
  
  return {
    primaryButtonText: 'Configurar',
    primaryButtonAction: 'configure',
    description: 'Completa tu configuración para continuar',
    title: 'Configuración Requerida'
  };
}

export default useMesocycleStatus;
