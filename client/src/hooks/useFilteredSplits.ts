import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMesocycleState } from './useMesocycleStatus';

interface Split {
  id: number;
  split_name: string;
  split_type: string;
  muscle_groups: string[];
  recovery_time_hours: number;
  scientific_rationale: string;
  difficulty_level: string;
}

interface MesocycleData {
  id: number;
  split_type: string;
  start_date: string;
  end_date: string;
  status: string;
  duration_weeks: number;
}

/**
 * 🧠 Hook para obtener splits filtrados dinámicamente según estado del mesociclo
 * 
 * LÓGICA EVOLUTIVA:
 * - Durante mesociclo ACTIVO: Solo splits del tipo actual (consistencia)
 * - Mesociclo COMPLETADO: Todos los splits (evolución)
 * - Sin mesociclo: Todos los splits (primera vez)
 */
export function useFilteredSplits() {
  // 🔍 Obtener estado del mesociclo
  const { hasActiveMesocycle, isLoading: mesocycleLoading } = useMesocycleState();

  // 🔬 Obtener todos los splits disponibles
  const { 
    data: allSplitsData, 
    isLoading: splitsLoading, 
    error: splitsError 
  } = useQuery({
    queryKey: ['scientific-splits'],
    queryFn: async () => {
      const response = await fetch('/api/scientific-workouts/splits', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch splits');
      }
      
      const data = await response.json();
      return data.splits as Split[];
    }
  });

  // 🎯 Obtener datos del mesociclo desde el estado (ya incluido en useMesocycleState)
  const { activeMesocycle: activeMesocycleData } = useMesocycleState();

  // 🧮 Calcular splits filtrados dinámicamente
  const filteredSplits = React.useMemo(() => {
    if (!allSplitsData) return [];

    // 🚨 CASO 1: Sin mesociclo activo - Mostrar todos los splits (primera vez)
    if (!hasActiveMesocycle || !activeMesocycleData) {
      console.log('🔄 [FilteredSplits] No active mesocycle - showing all splits for selection');
      return allSplitsData;
    }

    // 🚨 CASO 2: Verificar si mesociclo está dentro del período activo
    const today = new Date();
    const startDate = new Date(activeMesocycleData.start_date);
    const endDate = new Date(activeMesocycleData.end_date);
    
    const isWithinActivePeriod = today >= startDate && today <= endDate;

    if (isWithinActivePeriod) {
      // 🔒 MESOCICLO ACTIVO: Solo splits del tipo actual (mantener consistencia)
      const filtered = allSplitsData.filter(split => 
        split.split_type === activeMesocycleData.split_type
      );
      
      console.log(`🔒 [FilteredSplits] Active mesocycle (${activeMesocycleData.split_type}) - showing ${filtered.length} compatible splits`);
      return filtered;
    } else {
      // 🚀 MESOCICLO COMPLETADO: Todos los splits (permitir evolución)
      console.log('🚀 [FilteredSplits] Mesocycle completed - showing all splits for evolution');
      return allSplitsData;
    }
  }, [allSplitsData, hasActiveMesocycle, activeMesocycleData]);

  // 📊 Estado de carga combinado
  const isLoading = mesocycleLoading || splitsLoading;

  // 🎯 Información del contexto actual
  const filterContext = React.useMemo(() => {
    if (!hasActiveMesocycle || !activeMesocycleData) {
      return {
        mode: 'creation' as const,
        description: 'Selección libre para nuevo mesociclo',
        splitType: null,
        totalAvailable: allSplitsData?.length || 0,
        filtered: filteredSplits.length
      };
    }

    const today = new Date();
    const endDate = new Date(activeMesocycleData.end_date);
    const isWithinActivePeriod = today <= endDate;

    if (isWithinActivePeriod) {
      return {
        mode: 'active_editing' as const,
        description: `Editando mesociclo ${activeMesocycleData.split_type} activo`,
        splitType: activeMesocycleData.split_type,
        totalAvailable: allSplitsData?.length || 0,
        filtered: filteredSplits.length,
        remainingDays: Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      };
    } else {
      return {
        mode: 'evolution' as const,
        description: 'Mesociclo completado - evolución disponible',
        splitType: null,
        totalAvailable: allSplitsData?.length || 0,
        filtered: filteredSplits.length
      };
    }
  }, [hasActiveMesocycle, activeMesocycleData, allSplitsData, filteredSplits]);

  return {
    splits: filteredSplits,
    allSplits: allSplitsData || [],
    isLoading,
    error: splitsError,
    filterContext,
    // 🔄 Función para refrescar datos
    refetch: () => {
      // Implementar refetch si es necesario
    }
  };
}

// 🎯 Hook simplificado para casos donde solo se necesitan los splits
export function useAvailableSplits() {
  const { splits, isLoading, error } = useFilteredSplits();
  return { splits, isLoading, error };
}
