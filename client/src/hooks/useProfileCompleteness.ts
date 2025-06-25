/**
 * 📊 Profile Completeness Hook
 * Hook para gestionar la completitud del perfil del usuario
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProfileCompletenessResult {
  completionPercentage: number;
  missingFields: string[];
  completedFields: string[];
  recommendations: string[];
  isReadyForWorkouts: boolean;
  missingFieldsByCategory?: {
    basic: MissingField[];
    fitness: MissingField[];
    health: MissingField[];
    preferences: MissingField[];
  };
  categoryProgress?: {
    basic: number;
    fitness: number;
    health: number;
    preferences: number;
  };
}

interface MissingField {
  key: string;
  label: string;
  isRequired: boolean;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

// 🏷️ Mapeo de campos EXACTO al backend - SINCRONIZADO
const FIELD_LABELS: Record<string, MissingField> = {
  // 🏃‍♂️ Básico (Crítico) - PESO ALTO
  'Nivel de Fitness': {
    key: 'fitnessLevel',
    label: 'Nivel de Fitness',
    isRequired: true,
    priority: 'high',
    description: 'Tu nivel actual de condición física'
  },
  'Objetivo de Fitness': {
    key: 'fitnessGoal',
    label: 'Objetivo de Fitness',
    isRequired: true,
    priority: 'high',
    description: 'Qué quieres lograr con el entrenamiento'
  },
  'Edad': {
    key: 'age',
    label: 'Edad',
    isRequired: true,
    priority: 'high',
    description: 'Tu edad para personalizar rutinas'
  },
  'Género': {
    key: 'gender',
    label: 'Género',
    isRequired: false,
    priority: 'medium',
    description: 'Tu género para personalización'
  },

  // 💪 Fitness (Crítico) - PESO ALTO
  'Nivel de Experiencia': {
    key: 'experienceLevel',
    label: 'Nivel de Experiencia',
    isRequired: true,
    priority: 'high',
    description: 'Tu experiencia con ejercicios'
  },
  'Frecuencia de Entrenamiento': {
    key: 'workoutFrequency',
    label: 'Frecuencia de Entrenamiento',
    isRequired: true,
    priority: 'high',
    description: 'Cuántos días por semana entrenas'
  },
  'Duración Preferida': {
    key: 'preferredWorkoutDuration',
    label: 'Duración Preferida',
    isRequired: false,
    priority: 'medium',
    description: 'Tiempo disponible por entrenamiento'
  },

  // 🏥 Salud (Importante para seguridad) - PESO MEDIO-ALTO
  'Limitaciones Físicas': {
    key: 'limitations',
    label: 'Limitaciones Físicas',
    isRequired: false,
    priority: 'medium',
    description: 'Lesiones o limitaciones a considerar'
  },
  'Lesiones': {
    key: 'injuries',
    label: 'Lesiones',
    isRequired: false,
    priority: 'medium',
    description: 'Lesiones previas o actuales'
  },

  // ⚙️ Preferencias (Opcional) - PESO MEDIO-BAJO
  'Equipamiento Preferido': {
    key: 'preferredEquipment',
    label: 'Equipamiento Preferido',
    isRequired: false,
    priority: 'low',
    description: 'Equipos disponibles para entrenar'
  },
  'Ubicación de Entrenamiento': {
    key: 'workoutLocation',
    label: 'Ubicación de Entrenamiento',
    isRequired: false,
    priority: 'low',
    description: 'Dónde prefieres entrenar'
  },
  'Horarios Preferidos': {
    key: 'timePreferences',
    label: 'Horarios Preferidos',
    isRequired: false,
    priority: 'low',
    description: 'Cuándo prefieres entrenar'
  }
};

// 🎨 Categorizar campos faltantes - SINCRONIZADO CON BACKEND
const categorizeMissingFields = (missingFields: string[]): ProfileCompletenessResult['missingFieldsByCategory'] => {
  const categorized = {
    basic: [] as MissingField[],
    fitness: [] as MissingField[],
    health: [] as MissingField[],
    preferences: [] as MissingField[]
  };

  // ✅ CAMPOS EXACTOS DEL BACKEND
  const basicFields = ['Nivel de Fitness', 'Objetivo de Fitness', 'Edad', 'Género'];
  const fitnessFields = ['Nivel de Experiencia', 'Frecuencia de Entrenamiento', 'Duración Preferida'];
  const healthFields = ['Limitaciones Físicas', 'Lesiones'];
  const preferenceFields = ['Equipamiento Preferido', 'Ubicación de Entrenamiento', 'Horarios Preferidos'];

  missingFields.forEach(field => {
    const fieldInfo = FIELD_LABELS[field];
    if (!fieldInfo) {
      console.warn('🚨 Campo no encontrado en FIELD_LABELS:', field);
      return;
    }

    if (basicFields.includes(field)) {
      categorized.basic.push(fieldInfo);
    } else if (fitnessFields.includes(field)) {
      categorized.fitness.push(fieldInfo);
    } else if (healthFields.includes(field)) {
      categorized.health.push(fieldInfo);
    } else if (preferenceFields.includes(field)) {
      categorized.preferences.push(fieldInfo);
    } else {
      console.warn('🚨 Campo no categorizado:', field);
    }
  });

  return categorized;
};

/**
 * 🎯 Hook principal para obtener completitud del perfil
 */
export function useProfileCompleteness() {
  return useQuery({
    queryKey: ['/api/user/real-completeness'],
    queryFn: async (): Promise<ProfileCompletenessResult> => {
      console.log('📊 [useProfileCompleteness] Fetching REAL profile completeness...');

      const response = await apiRequest('GET', '/api/user/real-completeness');
      const data = await response.json();

      // 🏷️ Procesar campos faltantes por categoría
      const missingFieldsByCategory = categorizeMissingFields(data.missingFields || []);

      // 📊 Calcular progreso por categoría
      const categoryProgress = {
        basic: Math.max(0, 100 - (missingFieldsByCategory.basic.length * 25)), // 4 campos básicos
        fitness: Math.max(0, 100 - (missingFieldsByCategory.fitness.length * 33)), // 3 campos fitness
        health: Math.max(0, 100 - (missingFieldsByCategory.health.length * 50)), // 2 campos salud
        preferences: Math.max(0, 100 - (missingFieldsByCategory.preferences.length * 33)) // 3 campos preferencias
      };

      const enhancedData = {
        ...data,
        completionPercentage: data.percentage, // 🔧 FIX: Mapear percentage a completionPercentage
        isReadyForWorkouts: data.percentage >= 70, // 🔧 FIX: Calcular si está listo
        recommendations: [], // 🔧 FIX: Agregar recomendaciones vacías por ahora
        missingFieldsByCategory,
        categoryProgress
      };

      console.log('📊 [useProfileCompleteness] Enhanced profile completeness result:', enhancedData);
      return enhancedData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * 🎨 Hook para obtener información de UI basada en completitud
 */
export function useProfileCompletenessUI() {
  const { data: completeness, isLoading, error } = useProfileCompleteness();

  // 🎨 Determinar color del progreso
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // 📝 Generar mensaje principal
  const getMainMessage = (completeness: ProfileCompletenessResult | undefined): string => {
    if (!completeness) return 'Cargando información del perfil...';
    
    const { completionPercentage, isReadyForWorkouts } = completeness;
    
    if (isReadyForWorkouts) {
      return `¡Perfil ${completionPercentage}% completo! Listo para rutinas personalizadas.`;
    }
    
    if (completionPercentage >= 50) {
      return `Perfil ${completionPercentage}% completo. Completa más datos para mejores rutinas.`;
    }
    
    return `Perfil ${completionPercentage}% completo. Necesitas más información para rutinas personalizadas.`;
  };

  // 🎯 Generar mensaje de acción
  const getActionMessage = (completeness: ProfileCompletenessResult | undefined): string => {
    if (!completeness) return '';
    
    const { isReadyForWorkouts, missingFields } = completeness;
    
    if (isReadyForWorkouts) {
      return 'Puedes generar rutinas automáticas o completar más datos para mayor precisión.';
    }
    
    if (missingFields.length <= 3) {
      return `Solo faltan ${missingFields.length} campos: ${missingFields.slice(0, 2).join(', ')}${missingFields.length > 2 ? '...' : ''}.`;
    }
    
    return 'Completa tu información básica para comenzar con rutinas personalizadas.';
  };

  // 🎨 Determinar icono
  const getIcon = (completeness: ProfileCompletenessResult | undefined): string => {
    if (!completeness) return '⏳';
    
    const { completionPercentage, isReadyForWorkouts } = completeness;
    
    if (isReadyForWorkouts) return '✅';
    if (completionPercentage >= 60) return '⚡';
    if (completionPercentage >= 30) return '📝';
    return '🚀';
  };

  // 🎨 Determinar variante del botón
  const getButtonVariant = (completeness: ProfileCompletenessResult | undefined): 'default' | 'secondary' | 'outline' => {
    if (!completeness) return 'outline';
    
    const { isReadyForWorkouts, completionPercentage } = completeness;
    
    if (isReadyForWorkouts) return 'secondary';
    if (completionPercentage >= 50) return 'default';
    return 'outline';
  };

  // 🎨 Obtener color por categoría
  const getCategoryColor = (category: string): string => {
    const colors = {
      basic: 'bg-red-100 text-red-800 border-red-200',
      fitness: 'bg-orange-100 text-orange-800 border-orange-200',
      health: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      preferences: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 🎯 Obtener icono por categoría
  const getCategoryIcon = (category: string): string => {
    const icons = {
      basic: '🏃‍♂️',
      fitness: '💪',
      health: '🏥',
      preferences: '⚙️'
    };
    return icons[category as keyof typeof icons] || '📝';
  };

  // 📊 Obtener prioridad de campos faltantes
  const getMissingFieldsByPriority = () => {
    if (!completeness?.missingFieldsByCategory) return { high: [], medium: [], low: [] };

    const allMissing = [
      ...completeness.missingFieldsByCategory.basic,
      ...completeness.missingFieldsByCategory.fitness,
      ...completeness.missingFieldsByCategory.health,
      ...completeness.missingFieldsByCategory.preferences
    ];

    return {
      high: allMissing.filter(f => f.priority === 'high'),
      medium: allMissing.filter(f => f.priority === 'medium'),
      low: allMissing.filter(f => f.priority === 'low')
    };
  };

  return {
    // Datos
    completeness,
    isLoading,
    error,

    // UI helpers
    progressColor: completeness ? getProgressColor(completeness.completionPercentage) : 'bg-gray-300',
    mainMessage: getMainMessage(completeness),
    actionMessage: getActionMessage(completeness),
    icon: getIcon(completeness),
    buttonVariant: getButtonVariant(completeness),

    // Estados
    isReady: completeness?.isReadyForWorkouts || false,
    needsBasicInfo: completeness ? completeness.completionPercentage < 50 : true,
    needsOptimization: completeness ? completeness.completionPercentage < 80 && completeness.isReadyForWorkouts : false,

    // Datos específicos
    percentage: completeness?.completionPercentage || 0,
    missingCount: completeness?.missingFields.length || 0,
    recommendations: completeness?.recommendations || [],

    // 🆕 Nuevas funcionalidades
    missingFieldsByCategory: completeness?.missingFieldsByCategory || { basic: [], fitness: [], health: [], preferences: [] },
    categoryProgress: completeness?.categoryProgress || { basic: 0, fitness: 0, health: 0, preferences: 0 },
    missingFieldsByPriority: getMissingFieldsByPriority(),
    getCategoryColor,
    getCategoryIcon
  };
}

/**
 * 🔄 Hook para refrescar completitud después de cambios
 */
export function useRefreshProfileCompleteness() {
  const { refetch } = useProfileCompleteness();
  
  return {
    refreshCompleteness: refetch
  };
}

export default useProfileCompleteness;
