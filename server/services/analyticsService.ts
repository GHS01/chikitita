import { supabase } from '../supabase';

/**
 * 🔧 Helper: Determinar si una sesión está completada
 * Valida múltiples criterios para detectar sesiones completadas correctamente
 */
function isSessionCompleted(session: any): boolean {
  // Criterios para considerar una sesión como completada:
  // 1. Status explícito 'completed' o 'finished'
  // 2. Tiene completed_at definido (no null)
  // 3. Tiene exercise_logs asociados (se verificará en el contexto)
  return (
    session.status === 'completed' ||
    session.status === 'finished' ||
    (session.completed_at !== null && session.completed_at !== undefined)
  );
}

interface ProgressMetrics {
  strengthProgress: {
    totalVolumeKg: number;
    volumeChange: number;
    averageWeight: number;
    weightChange: number;
    exerciseCount: number;
  };
  rpeMetrics: {
    averageRpe: number;
    rpeChange: number;
    consistencyScore: number;
  };
  frequencyMetrics: {
    muscleGroupFrequency: Record<string, number>;
    exerciseFrequency: Record<string, number>;
    weeklyFrequency: number;
  };
}

interface AdherenceMetrics {
  completionRate: number;
  streakDays: number;
  averageWorkoutDuration: number;
  preferredWorkoutTimes: string[];
  missedWorkouts: number;
  totalPlannedWorkouts: number;
  weeklyPattern?: number[]; // Patrón de adherencia por día de la semana
  availableTrainingDays?: string[]; // Días disponibles del usuario
}

interface EffectivenessMetrics {
  topSplits: Array<{
    splitName: string;
    averageSatisfaction: number;
    averageRpe: number;
    completionRate: number;
    progressScore: number;
  }>;
  topExercises: Array<{
    exerciseName: string;
    preferenceScore: number;
    progressRate: number;
    averageRpe: number;
  }>;
  rpeProgressCorrelation: number;
  satisfactionTrend: number;
}

class AnalyticsService {
  /**
   * 📊 Calcular métricas de progreso
   */
  async calculateProgressMetrics(userId: number, days: number = 30): Promise<ProgressMetrics> {
    console.log('📊 [Analytics] Calculating progress metrics for user:', userId);

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const midDate = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000).toISOString();

      // Obtener logs de ejercicios con feedback (LEFT JOIN para manejar workout_plan_id null)
      const { data: exerciseLogs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          workout_sessions!inner(
            user_id,
            started_at,
            workout_plan_id,
            workout_plans(name)
          ),
          exercise_set_feedback(
            set_rpe,
            weight_feeling
          )
        `)
        .eq('workout_sessions.user_id', userId)
        .gte('workout_sessions.started_at', startDate)
        .lte('workout_sessions.started_at', endDate);

      if (logsError) throw logsError;

      // Calcular métricas de fuerza
      const totalVolume = exerciseLogs?.reduce((sum, log) => {
        const weight = parseFloat(log.weight_used || '0');
        const reps = log.reps_completed || 0;
        return sum + (weight * reps);
      }, 0) || 0;

      const firstHalfLogs = exerciseLogs?.filter(log => 
        log.workout_sessions.started_at <= midDate
      ) || [];
      
      const secondHalfLogs = exerciseLogs?.filter(log => 
        log.workout_sessions.started_at > midDate
      ) || [];

      const firstHalfVolume = firstHalfLogs.reduce((sum, log) => {
        const weight = parseFloat(log.weight_used || '0');
        const reps = log.reps_completed || 0;
        return sum + (weight * reps);
      }, 0);

      const secondHalfVolume = secondHalfLogs.reduce((sum, log) => {
        const weight = parseFloat(log.weight_used || '0');
        const reps = log.reps_completed || 0;
        return sum + (weight * reps);
      }, 0);

      const volumeChange = firstHalfVolume > 0 
        ? ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100 
        : 0;

      // Calcular métricas de RPE
      const rpeValues = exerciseLogs?.map(log => 
        log.exercise_set_feedback?.[0]?.set_rpe
      ).filter(Boolean) || [];

      const averageRpe = rpeValues.length > 0 
        ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length 
        : 0;

      // Calcular frecuencia de grupos musculares
      const muscleGroupFrequency: Record<string, number> = {};
      const exerciseFrequency: Record<string, number> = {};

      exerciseLogs?.forEach(log => {
        const exerciseName = log.exercise_name;
        exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1;
        
        // Mapear ejercicios a grupos musculares (simplificado)
        const muscleGroup = this.mapExerciseToMuscleGroup(exerciseName);
        muscleGroupFrequency[muscleGroup] = (muscleGroupFrequency[muscleGroup] || 0) + 1;
      });

      const uniqueWeeks = new Set(
        exerciseLogs?.map(log => {
          const date = new Date(log.workout_sessions.started_at);
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          return weekStart.toISOString().split('T')[0];
        })
      ).size;

      return {
        strengthProgress: {
          totalVolumeKg: totalVolume,
          volumeChange,
          averageWeight: exerciseLogs?.length > 0 
            ? exerciseLogs.reduce((sum, log) => sum + parseFloat(log.weight_used || '0'), 0) / exerciseLogs.length
            : 0,
          weightChange: 0, // TODO: Calculate weight progression
          exerciseCount: Object.keys(exerciseFrequency).length
        },
        rpeMetrics: {
          averageRpe,
          rpeChange: 0, // TODO: Calculate RPE trend
          consistencyScore: this.calculateConsistencyScore(rpeValues)
        },
        frequencyMetrics: {
          muscleGroupFrequency,
          exerciseFrequency,
          weeklyFrequency: uniqueWeeks
        }
      };

    } catch (error) {
      console.error('❌ [Analytics] Error calculating progress metrics:', error);
      throw error;
    }
  }

  /**
   * 📈 Calcular métricas de adherencia - RECOMPILED
   */
  async calculateAdherenceMetrics(userId: number, days: number = 30): Promise<AdherenceMetrics> {
    console.log('📈 [Analytics] Calculating adherence metrics for user:', userId);

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // ✅ RESTAURADO: Sistema original sin validaciones de días disponibles

      // Obtener sesiones de entrenamiento
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', startDate)
        .lte('started_at', endDate)
        .order('started_at', { ascending: true });

      if (sessionsError) throw sessionsError;

      // ✅ CORRECCIÓN: Usar función helper para detectar sesiones completadas
      const completedSessions = sessions?.filter(s => isSessionCompleted(s)) || [];

      console.log(`🔍 [Analytics] Total sessions: ${sessions?.length || 0}, Completed: ${completedSessions.length}`);
      sessions?.forEach(s => {
        console.log(`📊 Session ${s.id}: status='${s.status}', completed_at=${s.completed_at}, isCompleted=${isSessionCompleted(s)}`);
      });
      const totalSessions = sessions?.length || 0;

      // Calcular streak de días consecutivos
      const streakDays = this.calculateStreakDays(completedSessions);

      // Calcular duración promedio
      const averageDuration = completedSessions.length > 0
        ? completedSessions.reduce((sum, session) => {
            if (session.completed_at && session.started_at) {
              const duration = new Date(session.completed_at).getTime() - new Date(session.started_at).getTime();
              return sum + (duration / (1000 * 60)); // Convert to minutes
            }
            return sum;
          }, 0) / completedSessions.length
        : 0;

      // Analizar horarios preferidos
      const workoutTimes = completedSessions.map(session => {
        const hour = new Date(session.started_at).getHours();
        if (hour < 12) return 'Mañana';
        if (hour < 18) return 'Tarde';
        return 'Noche';
      });

      const timeFrequency = workoutTimes.reduce((acc, time) => {
        acc[time] = (acc[time] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const preferredTimes = Object.entries(timeFrequency)
        .sort(([,a], [,b]) => b - a)
        .map(([time]) => time);

      // Calcular patrón semanal basado en días disponibles del usuario
      const weeklyPattern = this.calculateWeeklyPattern(completedSessions);

      return {
        completionRate: totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0,
        streakDays,
        averageWorkoutDuration: averageDuration,
        preferredWorkoutTimes: preferredTimes,
        missedWorkouts: totalSessions - completedSessions.length,
        totalPlannedWorkouts: totalSessions,
        weeklyPattern
      };

    } catch (error) {
      console.error('❌ [Analytics] Error calculating adherence metrics:', error);
      throw error;
    }
  }

  /**
   * 🎯 Calcular métricas de efectividad
   */
  async calculateEffectivenessMetrics(userId: number, days: number = 30): Promise<EffectivenessMetrics> {
    console.log('🎯 [Analytics] Calculating effectiveness metrics for user:', userId);

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Obtener feedback de sesiones con información de splits (LEFT JOIN para manejar workout_plan_id null)
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('workout_feedback_sessions')
        .select(`
          *,
          workout_sessions!inner(
            user_id,
            started_at,
            workout_plan_id,
            workout_plans(name)
          )
        `)
        .eq('workout_sessions.user_id', userId)
        .gte('workout_sessions.started_at', startDate)
        .lte('workout_sessions.started_at', endDate);

      if (feedbackError) throw feedbackError;

      // Analizar splits más exitosos
      const splitMetrics: Record<string, any> = {};
      
      feedbackData?.forEach(feedback => {
        // Manejar casos donde workout_plan_id es null (rutinas generadas dinámicamente)
        const splitName = feedback.workout_sessions.workout_plans?.name || 'Rutina Personalizada';

        if (!splitMetrics[splitName]) {
          splitMetrics[splitName] = {
            sessions: 0,
            totalSatisfaction: 0,
            totalRpe: 0,
            totalProgress: 0
          };
        }

        splitMetrics[splitName].sessions++;
        splitMetrics[splitName].totalSatisfaction += feedback.post_satisfaction || 0;
        splitMetrics[splitName].totalRpe += feedback.post_rpe || 0;
        splitMetrics[splitName].totalProgress += feedback.post_progress_feeling || 0;
      });

      const topSplits = Object.entries(splitMetrics).map(([splitName, metrics]) => ({
        splitName,
        averageSatisfaction: metrics.totalSatisfaction / metrics.sessions,
        averageRpe: metrics.totalRpe / metrics.sessions,
        completionRate: 100, // TODO: Calculate actual completion rate
        progressScore: metrics.totalProgress / metrics.sessions
      })).sort((a, b) => b.averageSatisfaction - a.averageSatisfaction);

      // Analizar ejercicios favoritos
      const exercisePreferences: Record<string, { preferred: number; disliked: number }> = {};
      
      feedbackData?.forEach(feedback => {
        feedback.preferred_exercises?.forEach(exercise => {
          if (!exercisePreferences[exercise]) {
            exercisePreferences[exercise] = { preferred: 0, disliked: 0 };
          }
          exercisePreferences[exercise].preferred++;
        });
        
        feedback.disliked_exercises?.forEach(exercise => {
          if (!exercisePreferences[exercise]) {
            exercisePreferences[exercise] = { preferred: 0, disliked: 0 };
          }
          exercisePreferences[exercise].disliked++;
        });
      });

      const topExercises = Object.entries(exercisePreferences).map(([exerciseName, prefs]) => ({
        exerciseName,
        preferenceScore: prefs.preferred - prefs.disliked,
        progressRate: 0, // TODO: Calculate progress rate
        averageRpe: 0 // TODO: Calculate average RPE for exercise
      })).sort((a, b) => b.preferenceScore - a.preferenceScore);

      return {
        topSplits: topSplits.slice(0, 5),
        topExercises: topExercises.slice(0, 10),
        rpeProgressCorrelation: 0, // TODO: Calculate correlation
        satisfactionTrend: this.calculateSatisfactionTrend(feedbackData || [])
      };

    } catch (error) {
      console.error('❌ [Analytics] Error calculating effectiveness metrics:', error);
      throw error;
    }
  }

  /**
   * 🔧 Helper: Mapear ejercicio a grupo muscular
   */
  private mapExerciseToMuscleGroup(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('press') || name.includes('pecho') || name.includes('chest')) {
      return 'Pecho';
    }
    if (name.includes('pull') || name.includes('row') || name.includes('espalda') || name.includes('back')) {
      return 'Espalda';
    }
    if (name.includes('squat') || name.includes('leg') || name.includes('pierna') || name.includes('cuadriceps')) {
      return 'Piernas';
    }
    if (name.includes('shoulder') || name.includes('hombro') || name.includes('deltoid')) {
      return 'Hombros';
    }
    if (name.includes('bicep') || name.includes('curl')) {
      return 'Bíceps';
    }
    if (name.includes('tricep') || name.includes('dip')) {
      return 'Tríceps';
    }
    
    return 'General';
  }

  /**
   * 🔧 Helper: Calcular score de consistencia
   */
  private calculateConsistencyScore(rpeValues: number[]): number {
    if (rpeValues.length < 2) return 100;
    
    const mean = rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length;
    const variance = rpeValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rpeValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - (standardDeviation * 10));
  }

  /**
   * 🔧 Helper: Calcular días consecutivos de entrenamiento
   */
  private calculateStreakDays(sessions: any[]): number {
    if (!sessions.length) return 0;
    
    const dates = sessions.map(s => new Date(s.started_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort();
    
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
    
    return maxStreak;
  }

  /**
   * 🔧 Helper: Calcular tendencia de satisfacción
   */
  private calculateSatisfactionTrend(feedbackData: any[]): number {
    if (feedbackData.length < 2) return 0;
    
    const sortedData = feedbackData.sort((a, b) => 
      new Date(a.workout_sessions.started_at).getTime() - new Date(b.workout_sessions.started_at).getTime()
    );
    
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, f) => sum + (f.post_satisfaction || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, f) => sum + (f.post_satisfaction || 0), 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  /**
   * ✅ RESTAURADO: Función helper para días de entrenamiento
   */
  private getDefaultTrainingDays(): string[] {
    // Patrón estándar de entrenamiento (3-4 días por semana)
    return ['monday', 'wednesday', 'friday'];
  }

  /**
   * 🔧 Helper: Calcular patrón semanal basado en días disponibles
   */
  private calculateWeeklyPattern(sessions: any[], availableTrainingDays?: string[]): number[] {
    const trainingDays = availableTrainingDays || this.getDefaultTrainingDays();
    if (!sessions.length) return [];

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Contar entrenamientos por día de la semana
    const workoutsByDay: Record<string, number> = {};
    const totalWeeksByDay: Record<string, number> = {};

    // Inicializar contadores para días disponibles
    trainingDays.forEach(day => {
      workoutsByDay[day] = 0;
      totalWeeksByDay[day] = 0;
    });

    // Contar entrenamientos por día
    sessions.forEach(session => {
      const sessionDate = new Date(session.started_at);
      const dayOfWeek = dayNames[sessionDate.getDay()];

      if (trainingDays.includes(dayOfWeek)) {
        workoutsByDay[dayOfWeek]++;
      }
    });

    // Calcular número de semanas en el período
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    const weeksDiff = firstSession && lastSession
      ? Math.ceil((new Date(lastSession.started_at).getTime() - new Date(firstSession.started_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
      : 1;

    // Calcular porcentaje de adherencia por día disponible
    const pattern: number[] = [];
    dayNames.forEach(day => {
      if (trainingDays.includes(day)) {
        const adherenceRate = weeksDiff > 0 ? (workoutsByDay[day] / weeksDiff) * 100 : 0;
        pattern.push(Math.min(100, Math.round(adherenceRate)));
      } else {
        pattern.push(0); // 0% para días no disponibles
      }
    });

    return pattern;
  }
}

export const analyticsService = new AnalyticsService();
