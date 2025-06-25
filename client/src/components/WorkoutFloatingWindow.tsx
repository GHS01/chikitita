import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Play, Pause, Square, SkipForward, CheckCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { WorkoutSession, WorkoutPlan, ExerciseLog } from '@shared/schema';
import { EmojiText, ModernEmoji } from '@/components/ui/modern-emoji';
// 🕐 SISTEMA HORARIO CENTRALIZADO
import { now, createDBTimestamp } from '@/utils/timeSystem';
import { formatDuration } from '@/utils/timeFormatters';
import SetFeedbackModal from '@/components/SetFeedbackModal';
import PostWorkoutFeedbackModal from '@/components/PostWorkoutFeedbackModal';
import WeightSelectionModal from '@/components/WeightSelectionModal';

interface WorkoutFloatingWindowProps {
  session: WorkoutSession;
  workoutPlan: WorkoutPlan;
  onClose: () => void;
  onFinish: () => void;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
}

const WORKOUT_SUGGESTIONS = [
  "💧 Hidrátate cada 15 minutos",
  "🫁 Respira profundo entre sets",
  "📱 Mantén buena postura",
  "🔥 Concéntrate en la forma correcta",
  "💪 Visualiza tus músculos trabajando",
  "⚡ Mantén la intensidad constante",
  "🎯 Enfócate en el músculo objetivo",
  "🧘 Controla la respiración",
  "💯 Calidad sobre cantidad",
  "🚀 ¡Tú puedes con esto!"
];

const ANCHORED_SUGGESTIONS = [
  "💧 Hidrátate",
  "🫁 Respira",
  "📱 Postura"
];

const WorkoutFloatingWindow = React.memo(function WorkoutFloatingWindow({
  session,
  workoutPlan,
  onClose,
  onFinish
}: WorkoutFloatingWindowProps) {
  // Debug: Log session to see its structure
  console.log('🔍 WorkoutFloatingWindow received props:', {
    session,
    workoutPlan,
    onClose,
    onFinish
  });
  console.log('🔍 WorkoutFloatingWindow session:', session);
  console.log('🔍 Session ID:', session?.id);
  console.log('🔍 Session type:', typeof session);
  console.log('🔍 Session keys:', session ? Object.keys(session) : 'session is null/undefined');

  // Safety check: if session.id is undefined, don't render the component
  if (!session?.id) {
    console.error('❌ Session ID is undefined, cannot render WorkoutFloatingWindow');
    console.error('❌ Full session object:', session);
    return null;
  }
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(true); // 🔧 FIXED: Iniciar pausado hasta que se confirme el primer peso
  const [totalTime, setTotalTime] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false); // 🚀 NUEVO: Estado para controlar si el entrenamiento ha iniciado realmente

  // 🚀 UX IMPROVEMENT: Loading states for buttons
  const [isNextExerciseLoading, setIsNextExerciseLoading] = useState(false);
  const [isRestLoading, setIsRestLoading] = useState(false);
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);

  // 🎯 Estado para feedback de sets
  const [showSetFeedbackModal, setShowSetFeedbackModal] = useState(false);
  const [pendingExerciseLogId, setPendingExerciseLogId] = useState<number | null>(null);
  const [isSavingSetFeedback, setIsSavingSetFeedback] = useState(false);

  // 🎯 Estado para feedback post-entrenamiento
  const [showPostWorkoutModal, setShowPostWorkoutModal] = useState(false);
  const [isSavingPostFeedback, setIsSavingPostFeedback] = useState(false);

  // 🏋️‍♂️ Estados para sistema de peso inteligente
  const [showWeightSelectionModal, setShowWeightSelectionModal] = useState(false);
  const [currentExerciseWeight, setCurrentExerciseWeight] = useState<number | null>(null);
  const [weightSuggestion, setWeightSuggestion] = useState<any>(null);
  const [isLoadingWeightSuggestion, setIsLoadingWeightSuggestion] = useState(false);
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, number>>({});
  const [needsWeightSelection, setNeedsWeightSelection] = useState(false);

  // ⏱️ Estados para medición de tiempo de descanso
  const [totalRestTime, setTotalRestTime] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // 🚀 NUEVO: Estados para gestión de fases del entrenamiento
  const [workoutPhase, setWorkoutPhase] = useState<'not_started' | 'exercising' | 'resting' | 'exercise_complete' | 'workout_complete'>('not_started');
  const [currentSetState, setCurrentSetState] = useState<'ready' | 'in_progress' | 'completed'>('ready');
  const [restTimer, setRestTimer] = useState(0); // Cronómetro independiente para descanso
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  const restIntervalRef = useRef<NodeJS.Timeout>();
  const suggestionIntervalRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  // Parse exercises from workout plan
  const exercises: Exercise[] = workoutPlan.exercises ?
    (Array.isArray(workoutPlan.exercises) ? workoutPlan.exercises : []) : [];

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  // 🏋️‍♂️ Función para obtener sugerencia de peso
  const getWeightSuggestion = async (exerciseName: string) => {
    try {
      setIsLoadingWeightSuggestion(true);
      const response = await apiRequest('GET', `/api/weight-suggestions/${encodeURIComponent(exerciseName)}`);
      const data = await response.json();

      if (data.success) {
        setWeightSuggestion(data.suggestion);
        return data.suggestion;
      } else {
        console.log('No weight suggestion available for:', exerciseName);
        return null;
      }
    } catch (error) {
      console.error('Error getting weight suggestion:', error);
      return null;
    } finally {
      setIsLoadingWeightSuggestion(false);
    }
  };

  // ⏱️ Tiempo de descanso ahora manejado por restTimer independiente

  // Fetch exercise logs for this session
  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['exercise-logs', session.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/workouts/sessions/${session.id}/logs`);
      return await response.json();
    },
  });

  // Calculate current exercise and set based on completed logs
  const calculateCurrentProgress = () => {
    if (!exerciseLogs.length || !exercises.length) {
      return { exerciseIndex: 0, setNumber: 1 };
    }

    // Group logs by exercise name
    const logsByExercise = exerciseLogs.reduce((acc: any, log: any) => {
      if (!acc[log.exerciseName]) {
        acc[log.exerciseName] = [];
      }
      acc[log.exerciseName].push(log);
      return acc;
    }, {});

    console.log('📊 Logs by exercise:', logsByExercise);

    // Find current exercise index
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const completedSets = logsByExercise[exercise.name]?.length || 0;
      const totalSets = exercise.sets || 3;

      console.log(`🔍 Exercise ${i + 1}: ${exercise.name}, completed: ${completedSets}/${totalSets}`);

      if (completedSets < totalSets) {
        // This exercise is not complete
        return {
          exerciseIndex: i,
          setNumber: completedSets + 1
        };
      }
    }

    // All exercises completed
    return {
      exerciseIndex: exercises.length - 1,
      setNumber: exercises[exercises.length - 1]?.sets || 3
    };
  };

  // Mutations
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      console.log('🔄 Updating session with:', updates);
      const response = await apiRequest('PATCH', `/api/workouts/sessions/${session.id}`, updates);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Session updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
    },
    onError: (error) => {
      console.error('❌ Error updating session:', error);
    }
  });

  const createExerciseLogMutation = useMutation({
    mutationFn: async (logData: any) => {
      console.log('🔥 MUTATION STARTED - Creating exercise log:', logData);
      console.log('🔥 Session ID:', session.id);
      console.log('🔥 API URL:', `/api/workouts/sessions/${session.id}/logs`);

      const requestBody = {
        sessionId: session.id,
        ...logData
      };
      console.log('🔥 Request body:', requestBody);
      console.log('🔥 Request body JSON:', JSON.stringify(requestBody, null, 2));

      const response = await apiRequest('POST', `/api/workouts/sessions/${session.id}/logs`, requestBody);
      console.log('🔥 Response status:', response.status);

      const result = await response.json();
      console.log('🔥 Response data:', result);

      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Exercise log created successfully:', data);
      // 🚀 OPTIMIZATION: Reduced query invalidations - only invalidate specific queries
      queryClient.invalidateQueries({
        queryKey: ['exercise-logs', session.id],
        exact: true
      });
    },
    onError: (error) => {
      console.error('❌ Error creating exercise log:', error);
    }
  });

  // 🎯 Mutación para crear feedback de sets
  const createSetFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      console.log('📝 Creating set feedback:', feedbackData);
      const response = await apiRequest('POST', '/api/workout-feedback/set-feedback', feedbackData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Set feedback created successfully:', data);
      setShowSetFeedbackModal(false);
      setPendingExerciseLogId(null);
      setIsSavingSetFeedback(false);

      // ⏱️ Iniciar descanso automáticamente después del feedback
      const totalSets = parseInt(String(currentExercise?.sets || 3));
      if (currentSet < totalSets) {
        console.log('⏸️ Starting automatic rest period after set completion');
        startRest();
      } else if (currentExerciseIndex < totalExercises - 1) {
        console.log('⏸️ Starting rest period between exercises');
        startRest();
      }
    },
    onError: (error) => {
      console.error('❌ Error creating set feedback:', error);
      setIsSavingSetFeedback(false);
    }
  });

  // 🎯 Mutación para crear feedback post-entrenamiento
  const createPostWorkoutFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      console.log('📝 Creating post-workout feedback:', feedbackData);
      const response = await apiRequest('POST', '/api/workout-feedback/post-workout', {
        sessionId: session.id,
        ...feedbackData
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Post-workout feedback created successfully:', data);
      setShowPostWorkoutModal(false);
      setIsSavingPostFeedback(false);
      // Cerrar la ventana flotante después del feedback
      onFinish();
    },
    onError: (error) => {
      console.error('❌ Error creating post-workout feedback:', error);
      setIsSavingPostFeedback(false);
    }
  });

  // 🏋️‍♂️ Mutación para registrar uso de peso
  const recordWeightUsageMutation = useMutation({
    mutationFn: async (weightData: any) => {
      console.log('🏋️‍♂️ Recording weight usage:', weightData);
      const response = await apiRequest('POST', '/api/weight-suggestions/record-usage', weightData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Weight usage recorded successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Error recording weight usage:', error);
    }
  });

  // Initialize current progress from database (DISABLED - conflicts with manual navigation)
  // useEffect(() => {
  //   if (exerciseLogs.length > 0 && exercises.length > 0) {
  //     const progress = calculateCurrentProgress();
  //     console.log('🔄 Setting progress from database:', progress);
  //     setCurrentExerciseIndex(progress.exerciseIndex);
  //     setCurrentSet(progress.setNumber);
  //   }
  // }, [exerciseLogs, exercises]);

  // Timer effects
  useEffect(() => {
    // 🚀 NUEVO: Solo iniciar cronómetro si el entrenamiento ha comenzado y no está pausado
    if (!isPaused && workoutStarted) {
      intervalRef.current = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, workoutStarted]); // 🚀 NUEVO: Añadir workoutStarted como dependencia

  // 🚀 NUEVO: Cronómetro independiente para tiempo de descanso
  useEffect(() => {
    let restInterval: NodeJS.Timeout;

    if (workoutPhase === 'resting') {
      restInterval = setInterval(() => {
        setRestTimer(prev => prev + 1);
      }, 1000);
    } else {
      setRestTimer(0); // Reset cuando no está descansando
    }

    return () => {
      if (restInterval) clearInterval(restInterval);
    };
  }, [workoutPhase]);



  // Suggestion rotation effect
  useEffect(() => {
    suggestionIntervalRef.current = setInterval(() => {
      setCurrentSuggestion(prev => (prev + 1) % WORKOUT_SUGGESTIONS.length);
    }, 45000); // Change every 45 seconds

    return () => {
      if (suggestionIntervalRef.current) {
        clearInterval(suggestionIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    return formatDuration(seconds); // 🕐 SISTEMA CENTRALIZADO
  };

  const handleCompleteSet = async () => {
    if (!currentExercise) {
      console.error('❌ No current exercise found');
      return;
    }

    // 🏋️‍♂️ NUEVO: Verificar si necesitamos seleccionar peso para nuevo ejercicio (solo primer set)
    const exerciseWeight = exerciseWeights[currentExercise.name] || currentExerciseWeight;
    if (!exerciseWeight && currentSet === 1) {
      console.log('🏋️‍♂️ Need to select weight for NEW exercise:', currentExercise.name, 'Set:', currentSet);
      setNeedsWeightSelection(true);

      // Obtener sugerencia de peso
      const suggestion = await getWeightSuggestion(currentExercise.name);
      setWeightSuggestion(suggestion);
      setShowWeightSelectionModal(true);
      return;
    }

    // 🏋️‍♂️ VERIFICACIÓN: Si no es el primer set, usar peso ya establecido
    if (currentSet > 1 && !exerciseWeight) {
      console.error('❌ No weight found for exercise:', currentExercise.name, 'Set:', currentSet);
      console.error('❌ This should not happen - weight should be set in first set');
      return;
    }

    setIsCompleting(true);
    console.log('🚀 STARTING handleCompleteSet');
    console.log('📋 Current exercise:', currentExercise);
    console.log('📋 Current set:', currentSet);
    console.log('📋 Session ID:', session.id);
    console.log('🏋️‍♂️ Using weight:', exerciseWeight);

    try {
      console.log('💪 Completing set for exercise:', currentExercise.name);

      const logData = {
        exerciseName: currentExercise.name,
        setNumber: currentSet,
        repsCompleted: parseInt(currentExercise.reps) || 0,
        weightUsed: exerciseWeight ? exerciseWeight.toString() : null,
        restTimeSeconds: restTimer || 0, // Tiempo de descanso real medido
      };

      console.log('📝 About to create exercise log with data:', logData);

      // Log the completed set with real data
      const result = await createExerciseLogMutation.mutateAsync(logData);

      console.log('✅ Set logged successfully, result:', result);

      // 🎯 Mostrar modal de feedback de set (ahora incluye RPE)
      if (result?.exerciseLog?.id) {
        setPendingExerciseLogId(result.exerciseLog.id);
        setShowSetFeedbackModal(true);
      }

      const totalSets = currentExercise.sets || 3;

      // 🚀 NUEVO FLUJO: Después de completar set, cambiar a fase de descanso
      setCurrentSetState('completed');
      setWorkoutPhase('resting');
      setIsPaused(true); // Pausar cronómetro principal automáticamente

      // Si es el último set del ejercicio, marcar ejercicio como completado
      if (currentSet >= totalSets) {
        console.log(`🏁 Exercise "${currentExercise.name}" completed!`);
        setExerciseCompleted(true);
        setWorkoutPhase('exercise_complete');
      } else {
        console.log(`⏸️ Set ${currentSet} completed, starting rest period`);
      }
    } catch (error) {
      console.error('❌ Error completing set:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkipSet = () => {
    const totalSets = currentExercise?.sets || 3;

    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    } else {
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
      } else {
        handleFinishWorkout();
      }
    }
  };

  // 🎯 NUEVO: Función para determinar el texto del botón principal según el flujo mejorado
  const getButtonText = () => {
    const totalSets = currentExercise?.sets || 3;

    switch (workoutPhase) {
      case 'not_started':
        return "Iniciar";

      case 'exercising':
        return `Completar Set ${currentSet}/${totalSets}`;

      case 'resting':
        // Si estamos en el último set del ejercicio, mostrar "Sig. Ejercicio"
        if (currentSet >= totalSets) {
          return currentExerciseIndex === totalExercises - 1 ? "Finalizar" : "Sig. Ejercicio";
        }
        return `Empezar Set ${currentSet + 1}/${totalSets}`;

      case 'exercise_complete':
        return currentExerciseIndex === totalExercises - 1 ? "Finalizar" : "Sig. Ejercicio";

      case 'workout_complete':
        return "Finalizar";

      default:
        return "Iniciar";
    }
  };

  // 🚀 NUEVA: Función para iniciar el entrenamiento
  const handleStartWorkout = async () => {
    if (!currentExercise) {
      console.error('❌ No current exercise found');
      return;
    }

    console.log('🚀 Starting workout for exercise:', currentExercise.name);

    // Verificar si necesitamos seleccionar peso para el primer ejercicio
    const exerciseWeight = exerciseWeights[currentExercise.name] || currentExerciseWeight;
    if (!exerciseWeight) {
      console.log('🏋️‍♂️ Need to select weight for first exercise:', currentExercise.name);
      setNeedsWeightSelection(true);

      // Obtener sugerencia de peso
      const suggestion = await getWeightSuggestion(currentExercise.name);
      setWeightSuggestion(suggestion);
      setShowWeightSelectionModal(true);
      return;
    }

    // Si ya tiene peso, iniciar directamente
    setWorkoutStarted(true);
    setWorkoutPhase('exercising'); // 🚀 NUEVO: Establecer fase de ejercicio
    setCurrentSetState('in_progress'); // 🚀 NUEVO: Set en progreso
    setIsPaused(false); // Iniciar cronómetro
    console.log('✅ Workout started successfully');
  };

  // 🚀 NUEVA: Función para empezar el siguiente set después del descanso
  const handleStartNextSet = () => {
    console.log(`🚀 Starting next set: ${currentSet + 1}`);

    // Avanzar al siguiente set
    setCurrentSet(prev => prev + 1);

    // Cambiar a fase de ejercicio
    setWorkoutPhase('exercising');
    setCurrentSetState('in_progress');

    // Reanudar cronómetro principal
    setIsPaused(false);

    console.log(`✅ Set ${currentSet + 1} started`);
  };

  // 🚀 NUEVA: Función para registrar ejercicio completado en base de datos
  const registerCompletedExercise = async () => {
    if (!currentExercise) {
      console.error('❌ No current exercise to register');
      return;
    }

    try {
      console.log(`📝 Registering completed exercise: ${currentExercise.name}`);

      // Calcular duración estimada del ejercicio
      const estimatedDuration = Math.max(2, (currentExercise.sets || 3) * 2); // 2 minutos por set mínimo
      const exerciseWeight = exerciseWeights[currentExercise.name] || currentExerciseWeight;

      // Registrar en historial semanal para estadísticas
      await logExerciseToWeeklyHistory(
        currentExercise.name,
        estimatedDuration,
        'strength'
      );

      // Crear log de ejercicio completado (resumen)
      const completedExerciseLog = {
        exerciseName: currentExercise.name,
        setNumber: currentExercise.sets || 3, // Total de sets completados
        repsCompleted: parseInt(currentExercise.reps) || 0,
        weightUsed: exerciseWeight ? exerciseWeight.toString() : null,
        restTimeSeconds: totalRestTime, // Tiempo total de descanso acumulado
        notes: `Ejercicio completado - ${currentExercise.sets || 3} sets`
      };

      const result = await createExerciseLogMutation.mutateAsync(completedExerciseLog);
      console.log('✅ Exercise completion registered:', result);

      // Reset tiempo de descanso total para el siguiente ejercicio
      setTotalRestTime(0);

    } catch (error) {
      console.error('❌ Error registering completed exercise:', error);
      throw error; // Re-throw para manejar en handleNextExercise
    }
  };

  // 🎯 NUEVO: Función para determinar qué acción ejecutar según el flujo mejorado
  const handleMainAction = () => {
    const totalSets = currentExercise?.sets || 3;

    switch (workoutPhase) {
      case 'not_started':
        handleStartWorkout();
        break;

      case 'exercising':
        handleCompleteSet();
        break;

      case 'resting':
        // Si estamos en el último set del ejercicio, ir al siguiente ejercicio
        if (currentSet >= totalSets) {
          if (currentExerciseIndex === totalExercises - 1) {
            handleFinishWorkout();
          } else {
            handleNextExercise();
          }
        } else {
          // Empezar el siguiente set
          handleStartNextSet();
        }
        break;

      case 'exercise_complete':
        if (currentExerciseIndex === totalExercises - 1) {
          handleFinishWorkout();
        } else {
          handleNextExercise();
        }
        break;

      case 'workout_complete':
        handleFinishWorkout();
        break;

      default:
        handleStartWorkout();
    }
  };

  // Function to log exercise to weekly history (NON-BLOCKING)
  const logExerciseToWeeklyHistory = useCallback(async (exerciseName: string, durationMinutes: number, exerciseType?: string) => {
    // 🚀 OPTIMIZATION: Return immediately, run in background
    return new Promise<void>((resolve) => {
      resolve(); // Resolve immediately to not block UI

      // Run actual logging in background
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('❌ No auth token found for weekly history logging');
            return;
          }

          const historyData = {
            workoutDate: now().toISOString().split('T')[0], // 🕐 SISTEMA CENTRALIZADO
            exerciseName,
            durationMinutes,
            exerciseType: exerciseType || 'general',
            workoutPlanId: workoutPlan.id,
            sessionId: session.id,
          };

          console.log('📝 Logging exercise to weekly history (background):', historyData);

          const response = await apiRequest('POST', '/api/weekly-history', historyData);
          const result = await response.json();
          console.log('✅ Exercise logged to weekly history (background):', result);
        } catch (error) {
          console.error('❌ Error logging exercise to weekly history (background):', error);
          // Don't throw - this is background operation
        }
      }, 50); // Very small delay to not block UI
    });
  }, [workoutPlan.id, session.id]);

  const handleFinishWorkout = async () => {
    try {
      console.log('🏁 Starting workout completion...');

      const updatedSession = await updateSessionMutation.mutateAsync({
        status: 'completed',
        completedAt: createDBTimestamp(), // 🕐 SISTEMA CENTRALIZADO
        exercises: null // Clear exercises data if needed
      });

      console.log('🎉 Workout completed successfully:', updatedSession);

      // Force refresh of ALL related queries
      await queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/workouts/active'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/progress'] });

      // CRITICAL: Invalidate weekly history queries for Rutinas tab
      await queryClient.invalidateQueries({ queryKey: ['/api/weekly-history/current'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/weekly-history/summaries'] });
      await queryClient.invalidateQueries({ queryKey: ['weekly-history'] });

      // Force refetch immediately
      await queryClient.refetchQueries({ queryKey: ['/api/workouts/sessions'] });
      await queryClient.refetchQueries({ queryKey: ['/api/dashboard/stats'] });
      await queryClient.refetchQueries({ queryKey: ['/api/weekly-history/current'] });

      console.log('🔄 All queries invalidated');

      // Trigger storage event to notify other components
      localStorage.setItem('workout-completed', now().getTime().toString()); // 🕐 SISTEMA CENTRALIZADO
      localStorage.removeItem('workout-completed'); // Remove immediately to trigger event

      // 🎯 Mostrar modal de feedback post-entrenamiento
      setShowPostWorkoutModal(true);

      // 🤖 Procesar aprendizaje de IA en segundo plano
      setTimeout(async () => {
        try {
          console.log('🤖 Processing AI learning after workout completion...');
          await apiRequest('POST', '/api/weight-suggestions/process-ai-learning');
          console.log('✅ AI learning processed successfully');
        } catch (error) {
          console.error('❌ Error processing AI learning:', error);
          // No mostrar error al usuario, es un proceso en segundo plano
        }
      }, 2000); // Esperar 2 segundos para no interferir con el flujo principal

    } catch (error) {
      console.error('❌ Error finishing workout:', error);
    }
  };

  // 🚀 NUEVA: Función de transición entre ejercicios con registro completo
  const handleNextExercise = useCallback(async () => {
    if (!currentExercise || isNextExerciseLoading) {
      console.error('❌ No current exercise found or already loading');
      return;
    }

    console.log('🚀 TRANSITIONING TO NEXT EXERCISE - Current:', currentExercise.name);
    setIsNextExerciseLoading(true);

    try {
      // 1. Registrar ejercicio completado en base de datos
      await registerCompletedExercise();

      // 2. Verificar si hay más ejercicios
      if (currentExerciseIndex < totalExercises - 1) {
        // Mover al siguiente ejercicio
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1); // Reset al primer set
        setExerciseCompleted(false); // Reset flag
        setWorkoutPhase('not_started'); // Volver a estado inicial para nuevo ejercicio
        setCurrentSetState('ready');

        // 🚨 CRÍTICO: Limpiar peso del ejercicio anterior para forzar modal
        setCurrentExerciseWeight(null);
        setNeedsWeightSelection(false);

        // 🚨 CRÍTICO: Limpiar peso del nuevo ejercicio del diccionario
        const nextExercise = exercises[currentExerciseIndex + 1];
        if (nextExercise) {
          setExerciseWeights(prev => {
            const newWeights = { ...prev };
            delete newWeights[nextExercise.name]; // Eliminar peso del nuevo ejercicio
            return newWeights;
          });
          console.log(`🧹 Cleared weight for new exercise: ${nextExercise.name}`);
        }

        console.log(`➡️ Moving to exercise: ${exercises[currentExerciseIndex + 1]?.name}`);
        console.log('🏋️‍♂️ Ready for weight selection for new exercise');
      } else {
        // Último ejercicio completado
        console.log('🎉 All exercises completed!');
        setWorkoutPhase('workout_complete');
        await handleFinishWorkout();
      }

    } catch (error) {
      console.error('❌ Error transitioning to next exercise:', error);
    } finally {
      setIsNextExerciseLoading(false);
    }
  }, [currentExercise, isNextExerciseLoading, currentExerciseIndex, totalExercises, exercises]);



  // ⏱️ Funciones para manejo de descanso
  const startRest = () => {
    console.log('⏸️ Starting rest period');
    setWorkoutPhase('resting');
    setIsPaused(true); // Pausar cronómetro principal
  };

  const endRest = () => {
    const restDuration = restTimer; // 🚀 NUEVO: Usar cronómetro independiente
    console.log(`⏱️ Rest ended. Duration: ${restDuration} seconds`);

    setTotalRestTime(prev => prev + restDuration);
    setWorkoutPhase('exercising');
    setIsPaused(false); // Reanudar cronómetro principal

    // Guardar patrón de descanso para IA
    if (currentExercise) {
      saveRestPattern(restDuration);
    }
  };

  const saveRestPattern = async (actualRestSeconds: number) => {
    if (!currentExercise) return;

    try {
      await apiRequest('POST', '/api/weight-suggestions/rest-pattern', {
        exerciseName: currentExercise.name,
        muscleGroup: getMuscleGroupFromExercise(currentExercise.name),
        recommendedRestSeconds: getRecommendedRestTime(currentExercise.name),
        actualRestSeconds,
        sessionId: session.id,
        setNumber: currentSet
      });
    } catch (error) {
      console.error('Error saving rest pattern:', error);
    }
  };

  const getMuscleGroupFromExercise = (exerciseName: string): string => {
    const name = exerciseName.toLowerCase();
    if (name.includes('press') || name.includes('pecho')) return 'Pecho';
    if (name.includes('curl') || name.includes('bíceps')) return 'Bíceps';
    if (name.includes('extensión') || name.includes('tríceps')) return 'Tríceps';
    if (name.includes('elevación') || name.includes('lateral') || name.includes('hombro')) return 'Hombros';
    if (name.includes('remo') || name.includes('jalón') || name.includes('espalda')) return 'Espalda';
    if (name.includes('sentadilla') || name.includes('prensa') || name.includes('cuádriceps') || name.includes('pierna')) return 'Piernas';
    return 'General';
  };

  const getRecommendedRestTime = (exerciseName: string): number => {
    const name = exerciseName.toLowerCase();
    // Ejercicios compuestos: 2-3 minutos (120-180 segundos)
    if (name.includes('press') || name.includes('sentadilla') || name.includes('remo') || name.includes('jalón')) {
      return 150; // 2.5 minutos
    }
    // Ejercicios de aislamiento: 1-2 minutos (60-120 segundos)
    return 90; // 1.5 minutos
  };

  const handlePauseResume = () => {
    if (workoutPhase === 'exercising') {
      startRest();
    } else if (workoutPhase === 'resting') {
      endRest();
    }
  };

  // 🏋️‍♂️ Función para manejar selección de peso
  const handleWeightSelection = async (weightData: { selectedWeight: number; confidence: string }) => {
    if (!currentExercise) return;

    try {
      console.log('🏋️‍♂️ Weight selected:', weightData);

      // Guardar peso para este ejercicio
      setCurrentExerciseWeight(weightData.selectedWeight);
      setExerciseWeights(prev => ({
        ...prev,
        [currentExercise.name]: weightData.selectedWeight
      }));

      // Registrar uso de peso para aprendizaje de IA
      if (weightSuggestion) {
        recordWeightUsageMutation.mutate({
          exerciseName: currentExercise.name,
          suggestedWeight: weightSuggestion.suggestedWeight,
          actualWeight: weightData.selectedWeight,
          sessionId: session.id
        });
      }

      // Cerrar modal y continuar
      setShowWeightSelectionModal(false);
      setNeedsWeightSelection(false);
      setIsCompleting(false); // Reset completing state

      // 🚀 NUEVO: Si el entrenamiento no ha iniciado, iniciarlo ahora
      if (!workoutStarted) {
        setWorkoutStarted(true);
        setWorkoutPhase('exercising'); // 🚀 NUEVO: Establecer fase de ejercicio
        setCurrentSetState('in_progress'); // 🚀 NUEVO: Set en progreso
        setIsPaused(false); // Iniciar cronómetro
        console.log('✅ Workout started after weight selection');
        return; // No completar set aún, solo iniciar
      }

      // 🚨 CORRECCIÓN CRÍTICA: NO auto-completar set al seleccionar peso para nuevo ejercicio
      // El usuario debe hacer el ejercicio manualmente y presionar "Completar Set"
      console.log('✅ Weight selected for existing workout. User must complete set manually.');

      // Solo establecer que está listo para ejercitar
      setWorkoutPhase('exercising');
      setCurrentSetState('in_progress');
      setIsPaused(false);

    } catch (error) {
      console.error('❌ Error handling weight selection:', error);
    }
  };

  // 🎯 Función para manejar el envío del feedback de set (ahora incluye RPE y peso)
  const handleSetFeedbackSubmit = (feedbackData: any) => {
    if (!pendingExerciseLogId) {
      console.error('❌ No pending exercise log ID for feedback');
      return;
    }

    setIsSavingSetFeedback(true);
    console.log('📝 Submitting set feedback:', feedbackData);

    // Guardar feedback del set con RPE
    createSetFeedbackMutation.mutate({
      exerciseLogId: pendingExerciseLogId,
      setRpe: feedbackData.setRpe,
      completedAsPlanned: feedbackData.completedAsPlanned,
      weightFeeling: feedbackData.weightFeeling
    });

    // Si hay feedback de peso, actualizar historial para aprendizaje de IA
    if (feedbackData.weightFeeling && currentExercise) {
      const exerciseWeight = exerciseWeights[currentExercise.name] || currentExerciseWeight;

      recordWeightUsageMutation.mutate({
        exerciseName: currentExercise.name,
        suggestedWeight: weightSuggestion?.suggestedWeight || exerciseWeight,
        actualWeight: exerciseWeight,
        weightFeedback: feedbackData.weightFeeling,
        rpeAchieved: feedbackData.setRpe,
        repsCompleted: feedbackData.actualReps || parseInt(currentExercise.reps),
        setsCompleted: 1,
        sessionId: session.id
      });
    }
  };

  // 🎯 Función para saltar el feedback de set
  const handleSkipSetFeedback = () => {
    setShowSetFeedbackModal(false);
    setPendingExerciseLogId(null);
  };

  // 🎯 Función para manejar el envío del feedback post-entrenamiento
  const handlePostWorkoutSubmit = (feedbackData: any) => {
    setIsSavingPostFeedback(true);
    createPostWorkoutFeedbackMutation.mutate({
      rpe: feedbackData.rpe,
      satisfaction: feedbackData.satisfaction,
      fatigue: feedbackData.fatigue,
      progressFeeling: feedbackData.progressFeeling,
      preferredExercises: feedbackData.preferredExercises,
      dislikedExercises: feedbackData.dislikedExercises,
      notes: feedbackData.notes
    });
  };

  // 🎯 Función para saltar el feedback post-entrenamiento
  const handleSkipPostWorkoutFeedback = () => {
    setShowPostWorkoutModal(false);
    onFinish();
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl shadow-2xl cursor-pointer z-50 hover:shadow-3xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold font-mono">{formatTime(totalTime)}</span>
          <div className="text-xs opacity-75">
            {currentExerciseIndex + 1}/{totalExercises}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-white rounded-2xl shadow-2xl border-0 z-50 overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-sm animate-pulse"></div>
          <h3 className="font-semibold text-white truncate text-sm">
            {workoutPlan.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/80 hover:text-white text-lg font-light w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            −
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="p-4 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-3xl font-bold text-gray-800 mb-1 font-mono">
          {formatTime(totalTime)}
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Tiempo total</div>

        {/* 🚀 NUEVO: Cronómetro de descanso independiente */}
        {workoutPhase === 'resting' && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-lg font-bold text-orange-800 font-mono">
              {formatTime(restTimer)}
            </div>
            <div className="text-xs text-orange-600 uppercase tracking-wide">Tiempo de descanso</div>
          </div>
        )}

        {/* 🎯 Información de descanso recomendado */}
        {workoutPhase === 'resting' && currentExercise && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-medium text-blue-800 text-center">
              Descanso Recomendado: {formatTime(getRecommendedRestTime(currentExercise.name))}
            </div>
            {restTimer >= getRecommendedRestTime(currentExercise.name) && (
              <div className="text-xs text-green-700 font-medium mt-1 text-center">
                ✅ Descanso óptimo alcanzado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Exercise */}
      <div className="p-5 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Ejercicio {currentExerciseIndex + 1}/{totalExercises}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalExercises }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i <= currentExerciseIndex ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="font-bold text-gray-900 mb-2 text-lg leading-tight">
          {currentExercise?.name || 'Ejercicio no encontrado'}
        </div>

        {/* 🎯 Indicador de Set Actual */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-blue-600 font-semibold">
            Set {currentSet}/{currentExercise?.sets || 3}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: currentExercise?.sets || 3 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < currentSet - 1 ? 'bg-green-500' : i === currentSet - 1 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">{currentExercise?.sets || 3}</span>
            <span>sets</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{currentExercise?.reps}</span>
            <span>reps</span>
          </div>
          {currentExercise?.weight && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{currentExercise.weight}</span>
              <span>kg</span>
            </div>
          )}
        </div>


      </div>

      {/* Action Buttons */}
      <div className="p-5 bg-gray-50">
        <div className="flex gap-3">
          <button
            onClick={handleMainAction}
            disabled={workoutPhase === 'resting' || isNextExerciseLoading || isFinishingWorkout}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
          >
            {isNextExerciseLoading || isFinishingWorkout ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                {isFinishingWorkout ? 'Finalizando...' : 'Procesando...'}
              </>
            ) : currentExerciseIndex === totalExercises - 1 && currentSet > (currentExercise?.sets || 3) ? (
              <>
                <CheckCircle size={16} />
                Finalizar
              </>
            ) : currentSet <= (currentExercise?.sets || 3) ? (
              <>
                <CheckCircle size={16} />
                {getButtonText()}
              </>
            ) : (
              <>
                <SkipForward size={16} />
                Siguiente Ejercicio
              </>
            )}
          </button>
          <button
            onClick={handlePauseResume}
            disabled={isCompleting}
            className={`text-white py-2.5 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 ${
              workoutPhase === 'resting'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isCompleting ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                Iniciando...
              </>
            ) : workoutPhase === 'resting' ? (
              <>
                <Play size={14} />
                Continuar
              </>
            ) : (
              <>
                <Pause size={14} />
                Descansar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
            <ModernEmoji emoji="💡" size={12} luxury={true} />
          </div>
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sugerencia</div>
        </div>
        <div className="text-sm text-gray-700 mb-3 leading-relaxed">
          <EmojiText size={14} luxury={true}>
            {WORKOUT_SUGGESTIONS[currentSuggestion]}
          </EmojiText>
        </div>

        {/* Anchored suggestions */}
        <div className="flex flex-wrap gap-2">
          {ANCHORED_SUGGESTIONS.map((suggestion, index) => (
            <span
              key={index}
              className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium"
            >
              <EmojiText size={12}>
                {suggestion}
              </EmojiText>
            </span>
          ))}
        </div>
      </div>

      {/* 🎯 Modal de Feedback de Set */}
      <SetFeedbackModal
        isOpen={showSetFeedbackModal}
        onClose={handleSkipSetFeedback}
        onSubmit={handleSetFeedbackSubmit}
        exerciseName={currentExercise?.name || 'Ejercicio'}
        setNumber={currentSet}
        isLoading={isSavingSetFeedback}
      />

      {/* 🎯 Modal de Feedback Post-Entrenamiento */}
      <PostWorkoutFeedbackModal
        isOpen={showPostWorkoutModal}
        onClose={handleSkipPostWorkoutFeedback}
        onSubmit={handlePostWorkoutSubmit}
        workoutName={workoutPlan.name}
        exercises={exercises.map(ex => ex.name)}
        isLoading={isSavingPostFeedback}
      />

      {/* 🏋️‍♂️ Modal de Selección de Peso */}
      <WeightSelectionModal
        isOpen={showWeightSelectionModal}
        onClose={() => {
          setShowWeightSelectionModal(false);
          setNeedsWeightSelection(false);
        }}
        onSubmit={handleWeightSelection}
        exerciseName={currentExercise?.name || 'Ejercicio'}
        suggestion={weightSuggestion}
        isLoading={isLoadingWeightSuggestion}
      />
    </div>
  );
});

export default WorkoutFloatingWindow;
