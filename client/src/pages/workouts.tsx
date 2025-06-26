import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ModernEmoji, EmojiText } from "@/components/ui/modern-emoji";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import WorkoutFloatingWindow from "@/components/WorkoutFloatingWindow";
import WorkoutFeedbackForm from "@/components/WorkoutFeedbackForm";

import ScientificWorkoutModal from "@/components/ScientificWorkoutModal";
import {
  Play, CheckCircle, Clock, Target, Zap, BookOpen,
  Plus, TrendingUp, Calendar, Award, Brain, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useProfileCompletenessUI } from '@/hooks/useProfileCompleteness';
import ProfileCompletenessDetails from '@/components/ProfileCompletenessDetails';

// 🎨 Color coding profesional por grupo muscular
const getMuscleGroupColor = (muscleGroup: string) => {
  const colors = {
    pecho: 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-300 shadow-lg',
    espalda: 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-300 shadow-lg',
    piernas: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 shadow-lg',
    cuadriceps: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 shadow-lg',
    isquiotibiales: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 shadow-lg',
    hombros: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-300 shadow-lg',
    brazos: 'bg-gradient-to-r from-purple-600 to-violet-700 text-white border-purple-300 shadow-lg',
    biceps: 'bg-gradient-to-r from-purple-600 to-violet-700 text-white border-purple-300 shadow-lg',
    triceps: 'bg-gradient-to-r from-purple-600 to-violet-700 text-white border-purple-300 shadow-lg',
    abdomen: 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-300 shadow-lg',
    core: 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-300 shadow-lg',
    cardio: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-300 shadow-lg',
    gluteos: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-300 shadow-lg',
    pantorrillas: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-lg',
    default: 'bg-gradient-to-r from-slate-600 to-gray-700 text-white border-slate-300 shadow-lg'
  };

  const normalizedGroup = muscleGroup?.toLowerCase() || '';
  return colors[normalizedGroup as keyof typeof colors] || colors.default;
};

// 🎯 Obtener emoji por grupo muscular
const getMuscleGroupEmoji = (muscleGroup: string) => {
  const emojis = {
    pecho: '💪',
    espalda: '🔙',
    piernas: '🦵',
    cuadriceps: '🦵',
    isquiotibiales: '🦵',
    hombros: '🤲',
    brazos: '💪',
    biceps: '💪',
    triceps: '💪',
    abdomen: '🔥',
    core: '🔥',
    cardio: '❤️',
    default: '🏋️'
  };

  const normalizedGroup = muscleGroup?.toLowerCase() || '';
  return emojis[normalizedGroup as keyof typeof emojis] || emojis.default;
};

// 🎯 Generar descripción personalizada de la rutina
const generatePersonalizedDescription = (user: any, activeWorkout: any) => {
  if (!user || !activeWorkout) return null;

  // Calcular confianza IA basada en datos disponibles
  let aiConfidence = 60; // Base
  if (user.currentWeight) aiConfidence += 10;
  if (user.fitnessGoal) aiConfidence += 10;
  if (user.fitnessLevel) aiConfidence += 10;
  if (activeWorkout.duration) aiConfidence += 5;
  if (activeWorkout.personalizedInsights?.aiConfidence) {
    aiConfidence = Math.round(activeWorkout.personalizedInsights.aiConfidence * 100);
  }

  // Obtener objetivo en español
  const goalTranslations = {
    lose_weight: 'perder peso',
    gain_muscle: 'ganar músculo',
    maintain_weight: 'mantener peso',
    general_fitness: 'fitness general',
    strength: 'ganar fuerza',
    endurance: 'resistencia'
  };

  const goal = goalTranslations[user.fitnessGoal as keyof typeof goalTranslations] || 'fitness general';
  const weight = user.currentWeight || 'No especificado';
  const duration = activeWorkout.duration || '45';
  const userName = user.fullName?.split(' ')[0] || 'Usuario';

  return {
    title: `Rutina Personalizada y Diseñada Solo Para Ti ${userName} | Confianza IA: ${aiConfidence}%`,
    description: `Creada analizando tu peso (${weight}kg), objetivo (${goal}), y disponibilidad (${duration}min). Cada ejercicio fue seleccionado específicamente para tu progreso.`,
    tip: `Tip: Completa más datos en tu perfil para rutinas 95%+ precisas`,
    titleEmoji: '🎯',
    tipEmoji: '💡'
  };
};

// 🌍 FUNCIONES AUXILIARES PARA TRADUCCIÓN Y FORMATO
function translateDayToSpanish(dayString: string): string {
  const dayTranslations: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };

  // Extraer solo el día si viene con información adicional como "monday (Push)"
  const dayOnly = dayString.toLowerCase().split(' ')[0];
  return dayTranslations[dayOnly] || dayString;
}

function formatMesocycleName(fullName: string): string {
  // Remover redundancia "Mesociclo" del inicio
  // "Mesociclo push pull_legs - 21/6/2025" → "push pull_legs - 21/6/2025"
  return fullName.replace(/^Mesociclo\s+/i, '');
}

export default function Workouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [showScientificModal, setShowScientificModal] = useState(false);
  const [showCompletenessDetails, setShowCompletenessDetails] = useState(false);
  const { t } = useTranslation();

  // 📊 Hook para completitud del perfil
  const {
    completeness,
    isLoading: isLoadingCompleteness,
    progressColor,
    mainMessage,
    actionMessage,
    icon,
    buttonVariant,
    isReady,
    needsBasicInfo,
    percentage,
    missingCount,
    recommendations
  } = useProfileCompletenessUI();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['/api/workouts'],
    queryFn: async () => {
      console.log('🔍 [Frontend] Fetching workouts...');
      const response = await apiRequest('GET', '/api/workouts');
      return await response.json();
    },
  });

  const { data: activeWorkout } = useQuery({
    queryKey: ['/api/workouts/active'], // 🔧 FIXED: Removed Date.now() to stop infinite loop
    queryFn: async () => {
      console.log('🔍 [Frontend] Fetching active workout...');
      const response = await apiRequest('GET', '/api/workouts/active');
      const data = await response.json();
      console.log('🔍 [Frontend] Active workout data:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 🔧 FIXED: Restored normal cache
  });

  // 🛌 DESHABILITADO TEMPORALMENTE: Query para verificar si hoy es día de descanso
  const todayWorkoutStatus = null; // 🚨 DISABLED to stop infinite loop

  // Obtener datos del usuario para la descripción personalizada
  const { data: user } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      console.log('🔍 [Frontend] Fetching user profile...');
      const response = await apiRequest('GET', '/api/user/profile');
      return await response.json();
    },
  });

  // 🎯 NUEVO: Obtener preferencias del usuario para weekly goal dinámico
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user/preferences'],
    queryFn: async () => {
      console.log('🔍 [Frontend] Fetching user preferences...');
      const response = await apiRequest('GET', '/api/user/preferences');
      return await response.json();
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/workouts/sessions'],
    queryFn: async () => {
      console.log('🔍 [Frontend] Fetching sessions...');
      const response = await apiRequest('GET', '/api/workouts/sessions');
      const data = await response.json();
      console.log('📋 [Frontend] Sessions fetched:', data);
      console.log('📊 [Frontend] Sessions type:', typeof data, 'isArray:', Array.isArray(data));
      return data;
    },
    onError: (error) => {
      console.error('❌ [Frontend] Error fetching sessions:', error);
    }
  });



  // 🧬 NUEVA: Mutación para generar rutina científica
  const generateScientificPlanMutation = useMutation({
    mutationFn: async (scientificData: any) => {
      // Primero crear/actualizar mesociclo si es necesario
      const mesocycleResponse = await apiRequest('POST', '/api/scientific-workouts/create-mesocycle', {
        splitType: scientificData.splitData.split_type,
        durationWeeks: 6
      });

      // Luego generar rutina usando el endpoint específico para rutinas científicas
      const response = await apiRequest('POST', '/api/scientific-workouts/generate-workout', {
        selectedSplitId: scientificData.selectedSplitId,
        energyLevel: scientificData.energyLevel,
        availableTime: scientificData.availableTime,
        personalizedPreferences: scientificData.personalizedPreferences,
        splitData: scientificData.splitData
      });

      const result = await response.json();

      // 🚨 MANEJAR ERRORES DE LIMITACIONES FÍSICAS
      if (!response.ok) {
        if (result.error === 'LIMITACIÓN_FÍSICA_DETECTADA') {
          throw new Error(`⚠️ LIMITACIÓN FÍSICA: ${result.message}\n\n${result.details.recommendation}`);
        }
        throw new Error(result.message || 'Error generando rutina');
      }

      return result;
    },
    onSuccess: (data) => {
      // 🚨 FORZAR INVALIDACIÓN COMPLETA DEL CACHÉ
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/intelligent-workouts/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scientific-workouts/active-mesocycle'] });

      // 🚨 FORZAR REFETCH INMEDIATO
      queryClient.refetchQueries({ queryKey: ['/api/scientific-workouts/active-mesocycle'] });

      setShowScientificModal(false);
      toast({
        title: "🧬 Rutina Científica Generada!",
        description: `Sistema híbrido: Ciencia + IA personalizada - ${data.workoutPlan.exercises?.length || 0} ejercicios optimizados`,
      });
    },
    onError: (error) => {
      console.error('❌ [Frontend] Error generating scientific plan:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la rutina científica. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Mutación para generar rutina con feedback inteligente
  const generateIntelligentPlanMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await apiRequest('POST', '/api/intelligent-workouts/feedback', feedbackData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/intelligent-workouts/today'] });
      setShowFeedbackForm(false);
      toast({
        title: "🧠 Rutina Ultra-Personalizada Generada!",
        description: `IA Confianza: ${Math.round((data.workoutPlan.personalizedInsights.aiConfidence || 0.5) * 100)}% - ${data.workoutPlan.exercises?.length || 0} ejercicios personalizados`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error generando rutina inteligente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para generar rutina simple (sin feedback)
  const generateSimplePlanMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 [Frontend] Starting simple plan generation...');
      const response = await apiRequest('POST', '/api/intelligent-workouts/generate-simple');
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ [Frontend] Simple plan generation successful:', data);
      console.log('📊 [Frontend] Response structure:', {
        hasWorkoutPlan: !!data.workoutPlan,
        hasExercises: !!data.workoutPlan?.exercises,
        exerciseCount: data.workoutPlan?.exercises?.length,
        hasPersonalizedInsights: !!data.workoutPlan?.personalizedInsights,
        fullData: data
      });

      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/intelligent-workouts/today'] });
      toast({
        title: "Rutina Personalizada Generada!",
        description: `Basada en tu perfil - ${data.workoutPlan?.exercises?.length || 0} ejercicios`,
      });
    },
    onError: (error) => {
      console.error('❌ [Frontend] Simple plan generation failed:', error);
      console.error('📋 [Frontend] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Error generando rutina",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🚀 NUEVA: Función para detectar si es primera vez del usuario
  const isFirstTimeUser = () => {
    // Si no hay rutinas activas ni historial, es primera vez
    return !activeWorkout && (!workouts || workouts.length === 0);
  };

  // Función para manejar el clic en "Generate New Plan"
  const handleGenerateNewPlan = () => {
    // 🧬 TODOS LOS USUARIOS: Usar modal científico inteligente
    setShowScientificModal(true);
  };



  // Función para manejar feedback del formulario
  const handleFeedbackSubmit = (feedbackData: any) => {
    const feedbackWithPreviousRoutine = {
      ...feedbackData,
      previousRoutineId: activeWorkout?.id || (workouts && workouts[0]?.id)
    };
    generateIntelligentPlanMutation.mutate(feedbackWithPreviousRoutine);
  };

  // Función para saltar feedback y generar rutina simple
  const handleSkipFeedback = () => {
    setShowFeedbackForm(false);
    generateSimplePlanMutation.mutate();
  };

  // 🧬 NUEVA: Función para manejar rutina científica
  const handleScientificSubmit = (scientificData: any) => {
    console.log('🧬 [Frontend] Scientific workout data:', scientificData);
    generateScientificPlanMutation.mutate(scientificData);
  };

  // 🧬 NUEVA: Función para cerrar modal científico
  const handleCloseScientificModal = () => {
    setShowScientificModal(false);
  };

  const startWorkoutMutation = useMutation({
    mutationFn: async (workoutPlanId: number) => {
      const response = await apiRequest('POST', '/api/workouts/sessions', {
        workoutPlanId,
        startedAt: new Date().toISOString(),
        status: 'in_progress',
      });
      // Parse the JSON from the response
      return await response.json();
    },
    onSuccess: (session, workoutPlanId) => {
      console.log('🚀 Session created successfully:', session);
      console.log('🔍 Session ID:', session?.id);

      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });

      // Set active session and show floating window
      setActiveSession({
        session: session, // session is now the parsed JSON object with id
        workoutPlan: activeWorkout
      });

      console.log('🔧 Setting activeSession:', {
        session: session,
        workoutPlan: activeWorkout
      });
      setShowFloatingWindow(true);

      toast({
        title: t('workouts.workoutStarted'),
        description: t('workouts.trackProgress'),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="mobile-container py-4 sm:py-8">
        <div className="animate-pulse space-y-6 sm:space-y-8">
          <div className="h-6 sm:h-8 bg-muted rounded w-2/3 sm:w-1/3"></div>
          <div className="mobile-grid">
            <div className="mobile-grid-main h-64 sm:h-96 bg-muted rounded-2xl"></div>
            <div className="mobile-grid-sidebar">
              <div className="h-24 sm:h-32 bg-muted rounded-xl"></div>
              <div className="h-48 sm:h-64 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Proteger contra sessions que no sea array
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  console.log('🔧 [Frontend] Sessions array protection:', {
    originalSessions: sessions,
    isArray: Array.isArray(sessions),
    sessionsArray: sessionsArray.length
  });

  // 🔧 FIX: Calcular progreso de la semana actual (Lunes a Domingo)
  const completedThisWeek = sessionsArray.filter((session: any) => {
    // 🚨 FIX: Verificar que la sesión tenga datos válidos
    if (!session || !session.startedAt) return false;

    const sessionDate = new Date(session.startedAt);
    const today = new Date();

    // Obtener el lunes de esta semana
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + 1); // Lunes = 1
    currentMonday.setHours(0, 0, 0, 0);

    // Obtener el domingo de esta semana
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6); // Domingo
    currentSunday.setHours(23, 59, 59, 999);

    // 🚨 FIX: Aceptar múltiples estados de completado
    const isCompleted = session.status === 'completed' ||
                       session.status === 'finished' ||
                       (session.completedAt && session.completedAt !== null);

    const isThisWeek = sessionDate >= currentMonday && sessionDate <= currentSunday;

    console.log('🔍 [Session Filter]', {
      sessionId: session.id,
      status: session.status,
      completedAt: session.completedAt,
      isCompleted,
      isThisWeek,
      sessionDate: sessionDate.toISOString(),
      currentMonday: currentMonday.toISOString(),
      currentSunday: currentSunday.toISOString()
    });

    return isThisWeek && isCompleted;
  }).length || 0;

  // 🔧 FIX: Weekly goal REAL basado en ejercicios de la rutina actual
  const weeklyGoal = (() => {
    // 1. PRIORIDAD: Contar ejercicios de la rutina actual
    if (activeWorkout?.exercises && Array.isArray(activeWorkout.exercises)) {
      const exerciseCount = activeWorkout.exercises.length;
      console.log('🎯 [Weekly Goal] Using current workout exercises:', exerciseCount);
      return exerciseCount;
    }

    // 2. Si hay mesociclo activo, usar sus días de entrenamiento
    if (todayWorkoutStatus?.mesocycle?.training_days) {
      const trainingDays = todayWorkoutStatus.mesocycle.training_days;
      if (Array.isArray(trainingDays)) {
        return trainingDays.length;
      }
    }

    // 3. Si hay preferencias del usuario, usarlas
    if (userPreferences?.weeklyFrequency) {
      return userPreferences.weeklyFrequency;
    }

    // 4. Fallback basado en el tipo de split del mesociclo
    if (todayWorkoutStatus?.mesocycle?.split_type) {
      const splitType = todayWorkoutStatus.mesocycle.split_type;
      if (splitType === 'push_pull_legs') return 6; // PPL típicamente 6 días
      if (splitType === 'upper_lower') return 4; // Upper/Lower típicamente 4 días
      if (splitType === 'body_part_split') return 5; // Body part típicamente 5 días
    }

    // 5. Fallback final
    return 3;
  })();

  // 🔧 FIX: Calcular semana actual del mesociclo dinámicamente
  const currentMesocycleWeek = (() => {
    console.log('🔍 [DEBUG] todayWorkoutStatus:', todayWorkoutStatus);
    console.log('🔍 [DEBUG] todayWorkoutStatus?.mesocycle:', todayWorkoutStatus?.mesocycle);

    if (todayWorkoutStatus?.mesocycle) {
      const startDate = new Date(todayWorkoutStatus.mesocycle.start_date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const currentWeek = Math.min(Math.ceil(diffDays / 7), todayWorkoutStatus.mesocycle.duration_weeks || 6);
      console.log('🗓️ [Mesocycle Week] Calculated week:', currentWeek, 'from start date:', startDate.toISOString());
      return currentWeek;
    }

    console.log('🔍 [DEBUG] No mesocycle found, using fallback. activeWorkout?.weekNumber:', activeWorkout?.weekNumber);
    console.log('🔍 [WEEK DEBUG] activeWorkout full object:', activeWorkout);
    console.log('🔍 [WEEK DEBUG] activeWorkout?.weekNumber value:', activeWorkout?.weekNumber);
    console.log('🔍 [WEEK DEBUG] Final fallback result:', activeWorkout?.weekNumber || 1);

    // Fallback al número de semana del workout si no hay mesociclo
    return activeWorkout?.weekNumber || 1;
  })();
  // 🔧 FIX: Calcular tiempo total de la semana actual (Lunes a Domingo)
  const totalTimeThisWeek = sessionsArray.filter((session: any) => {
    const sessionDate = new Date(session.startedAt);
    const today = new Date();

    // Obtener el lunes de esta semana
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + 1); // Lunes = 1
    currentMonday.setHours(0, 0, 0, 0);

    // Obtener el domingo de esta semana
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6); // Domingo
    currentSunday.setHours(23, 59, 59, 999);

    return sessionDate >= currentMonday && sessionDate <= currentSunday && session.status === 'completed';
  }).reduce((total: number, session: any) => {
    if (session.completedAt) {
      const duration = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
      return total + (duration / (1000 * 60)); // Convert to minutes
    }
    return total;
  }, 0) || 0;

  return (
    <div className="mobile-container py-4 sm:py-8">
      {/* Header - MOBILE OPTIMIZED */}
      <div className="mobile-header">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('workouts.yourWorkoutPlans')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('workouts.aiGeneratedRoutines')}</p>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            onClick={handleGenerateNewPlan}
            disabled={generateIntelligentPlanMutation.isPending || generateSimplePlanMutation.isPending}
            className="mobile-button w-full sm:w-auto"
            size="sm"
          >
            <Brain className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">
              {(generateIntelligentPlanMutation.isPending || generateSimplePlanMutation.isPending) ? 'Generando...' : 'Generar Plan'}
            </span>
          </Button>
        </div>
      </div>

      <div className="mobile-grid">
        {/* Main Workout Area */}
        <div className="mobile-grid-main">
          {/* 🛌 VERIFICAR SI ES DÍA DE DESCANSO PRIMERO */}
          {todayWorkoutStatus?.isRestDay ? (
            <Card className="text-center py-12 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200 shadow-xl">
              <CardContent className="px-6">
                {/* Icono moderno de descanso */}
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold mb-4 text-emerald-800">
                  {todayWorkoutStatus.message?.replace('🛌', '') || "¡Hoy es tu día de descanso!"}
                </h3>

                <p className="text-emerald-700 mb-6 max-w-md mx-auto leading-relaxed">
                  {todayWorkoutStatus.motivationalMessage?.replace('💪', '') || "El descanso es tan importante como el entrenamiento. Tu cuerpo se está recuperando y creciendo. ¡Relájate y vuelve mañana recargado!"}
                </p>

                {todayWorkoutStatus.nextWorkoutDay && (
                  <div className="bg-white/70 rounded-xl p-4 max-w-sm mx-auto mb-4 border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">
                      Próximo entrenamiento: <span className="font-bold text-emerald-800">{translateDayToSpanish(todayWorkoutStatus.nextWorkoutDay)}</span>
                    </p>
                  </div>
                )}

                {todayWorkoutStatus.mesocycle && (
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 max-w-sm mx-auto border border-slate-200">
                    <p className="text-sm text-slate-700 font-medium">
                      Mesociclo: <span className="font-bold text-slate-800">{formatMesocycleName(todayWorkoutStatus.mesocycle.name)}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (todayWorkoutStatus && !todayWorkoutStatus.isRestDay && todayWorkoutStatus.workoutPlan) ? (
            // 🔧 NUEVO: Mostrar workout del sistema inteligente
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <ModernEmoji emoji="🧠" size={20} luxury={true} />
                    </div>
                    <span>Rutina Inteligente de Hoy</span>
                  </CardTitle>
                  <Badge className="bg-green-600 text-white font-bold">
                    {todayWorkoutStatus.splitAssignment?.splitName || 'Entrenamiento'}
                  </Badge>
                </div>
                <CardDescription>
                  <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
                        IA
                      </div>
                      <div className="text-sm font-bold text-gray-800 leading-tight flex items-center space-x-2">
                        <ModernEmoji emoji="🎯" size={16} luxury={true} />
                        <span>Rutina personalizada para {todayWorkoutStatus.dayOfWeek}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-200">
                      Rutina generada por IA basada en tu mesociclo: {todayWorkoutStatus.mesocycle?.name}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Intelligent Workout */}
                <Card className="border-2 border-green-300 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-800 text-base sm:text-lg truncate">{todayWorkoutStatus.workoutPlan.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
                            <span className="bg-green-100 text-green-800 px-2 sm:px-2.5 py-0.5 rounded-lg font-semibold text-xs">
                              Hoy
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 sm:px-2.5 py-0.5 rounded-lg font-semibold text-xs">
                              {todayWorkoutStatus.workoutPlan.duration || 45} min
                            </span>
                            <span className="text-green-700 font-semibold text-xs sm:text-sm">Listo para comenzar</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => startWorkoutMutation.mutate(todayWorkoutStatus.workoutPlan.id)}
                        disabled={startWorkoutMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-sm"
                        size="sm"
                      >
                        {startWorkoutMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span className="hidden sm:inline">Iniciando...</span>
                            <span className="sm:hidden">Iniciando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4" />
                            <span className="hidden sm:inline">Comenzar</span>
                            <span className="sm:hidden">Comenzar</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ) : activeWorkout ? (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <ModernEmoji emoji="🗓️" size={20} luxury={true} />
                    </div>
                    <span>{t('workouts.thisWeekSchedule')}</span>
                  </CardTitle>
                  <Badge className="bg-blue-600 text-white font-bold">
                    {t('workouts.week')} {currentMesocycleWeek}
                  </Badge>
                </div>
                <CardDescription>
                  {(() => {
                    // Esperar a que ambos datos estén disponibles
                    if (!user || !activeWorkout) {
                      return (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Cargando descripción personalizada...</span>
                        </div>
                      );
                    }

                    console.log('🔍 [DEBUG] user:', user);
                    console.log('🔍 [DEBUG] activeWorkout:', activeWorkout);
                    const personalizedDesc = generatePersonalizedDescription(user, activeWorkout);
                    console.log('🔍 [DEBUG] personalizedDesc:', personalizedDesc);

                    return personalizedDesc ? (
                      <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
                            IA
                          </div>
                          <div className="text-sm font-bold text-gray-800 leading-tight flex items-center space-x-2">
                            <ModernEmoji emoji={personalizedDesc.titleEmoji} size={16} luxury={true} />
                            <span>{personalizedDesc.title}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-200">
                          {personalizedDesc.description}
                        </div>
                        <div className="flex items-center space-x-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <div className="bg-amber-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center">
                            <ModernEmoji emoji={personalizedDesc.tipEmoji} size={12} luxury={true} />
                          </div>
                          <div className="text-xs text-amber-800 font-semibold">
                            {personalizedDesc.tip}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {activeWorkout.description}
                      </div>
                    );
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Workout */}
                <Card className="border-2 border-green-300 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-800 text-base sm:text-lg truncate">{activeWorkout.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
                            <span className="bg-green-100 text-green-800 px-2 sm:px-2.5 py-0.5 rounded-lg font-semibold text-xs">
                              {t('common.today')}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 sm:px-2.5 py-0.5 rounded-lg font-semibold text-xs">
                              {activeWorkout.duration} min
                            </span>
                            <span className="text-green-700 font-semibold text-xs sm:text-sm">{t('workouts.readyToStart')}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => startWorkoutMutation.mutate(activeWorkout.id)}
                        disabled={startWorkoutMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-sm"
                        size="sm"
                      >
                        {startWorkoutMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span className="hidden sm:inline">{t('workouts.starting')}</span>
                            <span className="sm:hidden">Iniciando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('workouts.start')}</span>
                            <span className="sm:hidden">Comenzar</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>



                {/* Exercise Preview - Diseño Profesional */}
                {activeWorkout.exercises && (
                  <div className="mt-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-2 rounded-lg shadow-lg">
                        <ModernEmoji emoji="🏋️" size={20} />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">{t('workouts.todaysExercises')}</h4>
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-3 py-1 text-sm font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200">
                        {(activeWorkout.exercises as any[]).length} ejercicios
                      </Badge>
                    </div>
                    <TooltipProvider>
                      <Accordion type="multiple" className="space-y-3">
                        {(activeWorkout.exercises as any[]).map((exercise, index) => (
                          <AccordionItem
                            key={index}
                            value={`exercise-${index}`}
                            className="border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline">
                              <div className="w-full">
                                {/* MOBILE OPTIMIZED HEADER */}
                                <div className="flex items-start justify-between w-full">
                                  <div className="flex items-start space-x-2 min-w-0 flex-1">
                                    <ModernEmoji
                                      emoji={getMuscleGroupEmoji(exercise.muscleGroup)}
                                      size={18}
                                      className="flex-shrink-0 mt-0.5"
                                      luxury={true}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-bold text-left text-sm sm:text-base text-slate-800 leading-tight">
                                        {exercise.name}
                                      </h5>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {exercise.sets && (
                                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                                            {exercise.sets} sets
                                          </span>
                                        )}
                                        {exercise.reps && (
                                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                                            {exercise.reps} reps
                                          </span>
                                        )}
                                        <Badge
                                          variant="outline"
                                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${getMuscleGroupColor(exercise.muscleGroup)} border-0`}
                                        >
                                          {exercise.muscleGroup || 'General'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-1.5 rounded-full hover:from-indigo-600 hover:to-purple-700 cursor-help transition-all duration-200 shadow-md">
                                          <Info className="h-3 w-3" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="max-w-xs">
                                        <div className="space-y-1">
                                          <p className="font-medium flex items-center">
                                            <ModernEmoji emoji="🎯" size={14} className="mr-1" luxury={true} />
                                            {exercise.muscleGroup || t('workouts.muscleGroup')}
                                          </p>
                                          <p className="text-xs flex items-center">
                                            <ModernEmoji emoji="⏱️" size={12} className="mr-1" />
                                            {t('workouts.rest')}: {exercise.rest || 60}s
                                          </p>
                                          {exercise.weight && (
                                            <p className="text-xs flex items-center">
                                              <ModernEmoji emoji="🏋️" size={12} className="mr-1" luxury={true} />
                                              {t('workouts.weight')}: {exercise.weight}kg
                                            </p>
                                          )}
                                          <p className="text-xs flex items-center">
                                            <ModernEmoji emoji="📊" size={12} className="mr-1" />
                                            {t('workouts.difficulty')}: {activeWorkout.difficulty}
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="mobile-card-content">
                              <div className="border-t border-slate-200 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                                {/* EXERCISE NAME FULL - MOBILE OPTIMIZED */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                                  <h6 className="font-bold text-base sm:text-lg text-blue-800 mb-2 leading-tight">
                                    {exercise.name}
                                  </h6>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {exercise.sets && (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                                        {exercise.sets} series
                                      </span>
                                    )}
                                    {exercise.reps && (
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                                        {exercise.reps} reps
                                      </span>
                                    )}
                                    {exercise.duration && (
                                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm font-semibold">
                                        {exercise.duration}s
                                      </span>
                                    )}
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-semibold">
                                      {exercise.rest || 60}s descanso
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 sm:p-4 rounded-lg border border-slate-200">
                                  <h6 className="font-bold text-sm mb-3 flex items-center text-slate-800">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-1.5 rounded-lg mr-2 shadow-md">
                                      <ModernEmoji emoji="📝" size={14} luxury={true} />
                                    </div>
                                    {t('workouts.instructions')}:
                                  </h6>
                                  <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    {exercise.instructions || t('workouts.performExercise')}
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
                                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 sm:p-4 rounded-lg border border-amber-200 shadow-sm">
                                    <p className="font-bold text-amber-800 mb-3 flex items-center text-sm">
                                      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-1 rounded-md mr-2">
                                        <ModernEmoji emoji="🎯" size={14} luxury={true} />
                                      </div>
                                      {t('workouts.tips')}:
                                    </p>
                                    <ul className="text-amber-700 space-y-2 font-medium text-sm">
                                      <li className="flex items-start">
                                        <span className="text-amber-600 mr-2 flex-shrink-0">•</span>
                                        <span>Mantén control en la bajada</span>
                                      </li>
                                      <li className="flex items-start">
                                        <span className="text-amber-600 mr-2 flex-shrink-0">•</span>
                                        <span>Respira correctamente</span>
                                      </li>
                                      <li className="flex items-start">
                                        <span className="text-amber-600 mr-2 flex-shrink-0">•</span>
                                        <span>Enfócate en la forma</span>
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg border border-blue-200 shadow-sm">
                                    <p className="font-bold text-blue-800 mb-3 flex items-center text-sm">
                                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-1 rounded-md mr-2">
                                        📊
                                      </div>
                                      {t('workouts.details')}:
                                    </p>
                                    <div className="text-blue-700 space-y-2 font-medium text-sm">
                                      <p className="flex items-start">
                                        <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                                        <span>{t('workouts.group')}: {exercise.muscleGroup || 'General'}</span>
                                      </p>
                                      <p className="flex items-start">
                                        <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                                        <span>{t('workouts.rest')}: {exercise.rest || 60} {t('workouts.seconds')}</span>
                                      </p>
                                      {exercise.weight && (
                                        <p className="flex items-start">
                                          <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                                          <span>{t('workouts.weight')}: {exercise.weight}kg</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TooltipProvider>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-8 sm:py-12">
              <CardContent className="px-4 sm:px-6">
                <div className="bg-muted/50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{t('workouts.noActiveWorkoutPlan')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  {t('workouts.generatePersonalized')}
                </p>

                {/* 📊 Profile Completeness Section */}
                {!isLoadingCompleteness && completeness && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <span className="text-2xl">{icon}</span>
                      <h4 className="font-semibold text-gray-800">Completitud del Perfil</h4>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-mono font-bold">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Messages */}
                    <p className="text-sm text-gray-700 mb-2 font-medium">{mainMessage}</p>
                    <p className="text-xs text-gray-600 mb-4">{actionMessage}</p>

                    {/* Missing Fields Info */}
                    {missingCount > 0 && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mb-4">
                        <span className="font-semibold">Faltan {missingCount} campos</span> para rutinas más precisas
                      </div>
                    )}

                    {/* Toggle Details Button */}
                    {missingCount > 0 && (
                      <Button
                        onClick={() => setShowCompletenessDetails(!showCompletenessDetails)}
                        variant="outline"
                        size="sm"
                        className="w-full text-sm mb-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Info className="h-4 w-4 mr-2" />
                        {showCompletenessDetails ? 'Ocultar Detalles' : 'Ver Qué Falta Completar'}
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showCompletenessDetails ? 'rotate-180' : ''}`} />
                      </Button>
                    )}

                    {/* Completeness Details */}
                    {showCompletenessDetails && missingCount > 0 && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                        <ProfileCompletenessDetails
                          showCategories={true}
                          showPriorities={true}
                          compact={true}
                        />
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => window.location.href = '/profile'}
                      variant={buttonVariant}
                      size="sm"
                      className="w-full text-sm"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      {isReady ? 'Optimizar Perfil' : 'Completar Perfil'}
                    </Button>
                  </div>
                )}

                {/* Generate Plan Button - Solo si el perfil está listo */}
                {isReady && (
                  <Button
                    onClick={handleGenerateNewPlan}
                    disabled={generateIntelligentPlanMutation.isPending || generateSimplePlanMutation.isPending}
                    size="sm"
                    className="text-sm px-4 py-2"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{(generateIntelligentPlanMutation.isPending || generateSimplePlanMutation.isPending) ? t('workouts.generating') : t('workouts.generateFirstPlan')}</span>
                    <span className="sm:hidden">{(generateIntelligentPlanMutation.isPending || generateSimplePlanMutation.isPending) ? 'Generando...' : 'Generar Plan'}</span>
                  </Button>
                )}

                {/* Message when profile is not ready */}
                {!isReady && !isLoadingCompleteness && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
                    Completa tu perfil para generar rutinas personalizadas
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="mobile-grid-sidebar">
          {/* Mesocycle Week Info */}
          {todayWorkoutStatus?.mesocycle && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Mesociclo Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Semana:</span>
                    <span className="font-mono font-bold text-blue-800">
                      {currentMesocycleWeek} de {todayWorkoutStatus.mesocycle.duration_weeks || 6}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Tipo:</span>
                    <span className="font-medium text-blue-800">
                      {todayWorkoutStatus.mesocycle.split_type === 'push_pull_legs' ? 'Push/Pull/Legs' :
                       todayWorkoutStatus.mesocycle.split_type === 'upper_lower' ? 'Upper/Lower' :
                       todayWorkoutStatus.mesocycle.split_type === 'body_part_split' ? 'Por Grupos' :
                       todayWorkoutStatus.mesocycle.split_type}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('workouts.weeklyProgress')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{activeWorkout?.exercises ? 'Ejercicios Completados' : t('workouts.workoutsCompleted')}</span>
                  <span className="font-mono">{(() => {
                    console.log('🔍 [Weekly Progress Debug]', {
                      completedThisWeek,
                      weeklyGoal,
                      sessionsArrayLength: sessionsArray.length,
                      userPreferences,
                      todayWorkoutStatus: todayWorkoutStatus?.mesocycle,
                      activeWorkoutExercises: activeWorkout?.exercises?.length
                    });
                    return `${completedThisWeek}/${weeklyGoal}`;
                  })()}</span>
                </div>
                <Progress value={(completedThisWeek / weeklyGoal) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('workouts.totalTime')}</span>
                  <span className="font-mono">{Math.round(totalTimeThisWeek)}m</span>
                </div>
                <Progress value={Math.min((totalTimeThisWeek / 300) * 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Exercise Library */}
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-6 text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('workouts.exerciseLibrary')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('workouts.browseExercises')}
              </p>
              <Button variant="outline" size="sm">
                {t('workouts.browseNow')}
              </Button>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 text-primary mr-2" />
                {t('common.aiRecommendations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-sm mb-2 flex items-center space-x-1">
                  <span className="font-semibold flex items-center space-x-1">
                    <ModernEmoji emoji="💡" size={14} />
                    <span>{t('common.suggestion')}</span>
                  </span>
                  <span>{t('workouts.formImprovement')}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('workouts.increaseWeightSuggestion')}
                </p>
              </div>
              <div className="bg-secondary/5 rounded-lg p-3">
                <p className="text-sm mb-2">
                  <span className="font-semibold flex items-center space-x-1">
                    <ModernEmoji emoji="🎯" size={14} luxury={true} />
                    <span>{t('common.goalUpdate')}</span>
                  </span> You're ahead of {t('common.schedule')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Consider adding 1 extra cardio session this week.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          {sessionsArray && sessionsArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('workouts.recentSessions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionsArray.slice(0, 3).map((session: any, index: number) => (
                    <div key={session.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        session.status === 'completed' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {t('workouts.session')} {sessionsArray.length - index}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startedAt).toLocaleDateString()} • {session.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Workout Window */}
      {showFloatingWindow && activeSession && (
        <>
          {console.log('🔧 Rendering WorkoutFloatingWindow with activeSession:', activeSession)}
          {console.log('🔧 activeSession.session:', activeSession.session)}
          {console.log('🔧 activeSession.workoutPlan:', activeSession.workoutPlan)}
          <WorkoutFloatingWindow
            session={activeSession.session}
            workoutPlan={activeSession.workoutPlan}
            onClose={() => {
              setShowFloatingWindow(false);
              setActiveSession(null);
            }}
            onFinish={async () => {
              console.log('🎯 onFinish called, invalidating all queries...');

              // Close window first to prevent re-renders
              setShowFloatingWindow(false);
              setActiveSession(null);

              // Wait a moment for state to settle
              await new Promise(resolve => setTimeout(resolve, 200));

              try {
                // Force invalidate ALL cached data
                console.log('🔄 Invalidating cached data...');
                await queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
                await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
                await queryClient.invalidateQueries({ queryKey: ['/api/progress'] });

                // Force immediate refetch with fresh data
                console.log('🔄 Refetching queries...');
                await queryClient.refetchQueries({ queryKey: ['/api/workouts/sessions'] });

                // FORCE manual call to dashboard stats (React Query won't call it if no component is using it)
                console.log('🔄 Manually calling dashboard stats...');
                const { authService } = await import("../lib/auth");
                const response = await fetch('/api/dashboard/stats', {
                  credentials: 'include',
                  headers: {
                    ...authService.getAuthHeader(),
                  },
                });

                if (response.ok) {
                  const dashboardData = await response.json();
                  console.log('✅ Dashboard stats fetched manually:', dashboardData);

                  // Update the query cache with fresh data
                  queryClient.setQueryData(['/api/dashboard/stats'], dashboardData);
                } else {
                  console.error('❌ Failed to fetch dashboard stats:', response.status);
                }

                console.log('✅ All queries refreshed!');
              } catch (error) {
                console.error('❌ Error refreshing queries:', error);
              }

              toast({
                title: "Workout Completed!",
                description: "Great job! Your workout has been saved.",
              });
            }}
          />
        </>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <WorkoutFeedbackForm
              onSubmit={handleFeedbackSubmit}
              onSkip={handleSkipFeedback}
              isLoading={generateIntelligentPlanMutation.isPending}
              previousWorkout={activeWorkout}
            />
          </div>
        </div>
      )}



      {/* 🧬 NUEVO: Scientific Workout Modal */}
      {showScientificModal && (
        <ScientificWorkoutModal
          onSubmit={handleScientificSubmit}
          onClose={handleCloseScientificModal}
          isLoading={generateScientificPlanMutation.isPending}
          userName={user?.fullName?.split(' ')[0] || 'Usuario'}
        />
      )}
    </div>
  );
}
