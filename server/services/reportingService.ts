import { supabase } from '../supabase';
import { analyticsService } from './analyticsService';

interface WeeklyReport {
  userId: number;
  weekStartDate: string;
  weekEndDate: string;
  summary: {
    workoutsCompleted: number;
    totalDuration: number;
    averageRpe: number;
    averageSatisfaction: number;
    topExercises: string[];
    achievements: string[];
  };
  insights: string[];
  recommendations: string[];
  progressHighlights: string[];
}

interface MonthlyReport {
  userId: number;
  monthStartDate: string;
  monthEndDate: string;
  summary: {
    totalWorkouts: number;
    adherenceRate: number;
    strengthProgress: number;
    favoriteExercises: string[];
    improvements: string[];
  };
  trends: {
    rpetrend: number;
    satisfactionTrend: number;
    volumeTrend: number;
  };
  goals: {
    achieved: string[];
    inProgress: string[];
    suggested: string[];
  };
}

class ReportingService {
  /**
   * 📊 Generar reporte semanal automático
   */
  async generateWeeklyReport(userId: number, weekStartDate?: string): Promise<WeeklyReport> {
    console.log('📊 [Reporting] Generating weekly report for user:', userId);

    try {
      const startDate = weekStartDate ? new Date(weekStartDate) : this.getWeekStart(new Date());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Obtener datos de la semana
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_plans(name),
          workout_feedback_sessions(
            post_rpe,
            post_satisfaction,
            preferred_exercises,
            disliked_exercises
          )
        `)
        .eq('user_id', userId)
        .gte('started_at', startDateStr)
        .lte('started_at', endDateStr)
        .eq('status', 'completed');

      if (sessionsError) throw sessionsError;

      const completedSessions = sessions || [];

      // Calcular métricas básicas
      const totalDuration = completedSessions.reduce((sum, session) => {
        if (session.completed_at && session.started_at) {
          const duration = new Date(session.completed_at).getTime() - new Date(session.started_at).getTime();
          return sum + (duration / (1000 * 60)); // Convert to minutes
        }
        return sum;
      }, 0);

      const rpeValues = completedSessions
        .map(s => s.workout_feedback_sessions?.[0]?.post_rpe)
        .filter(Boolean);
      
      const satisfactionValues = completedSessions
        .map(s => s.workout_feedback_sessions?.[0]?.post_satisfaction)
        .filter(Boolean);

      const averageRpe = rpeValues.length > 0 
        ? rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length 
        : 0;

      const averageSatisfaction = satisfactionValues.length > 0 
        ? satisfactionValues.reduce((sum, val) => sum + val, 0) / satisfactionValues.length 
        : 0;

      // Ejercicios más frecuentes
      const exerciseFrequency: Record<string, number> = {};
      completedSessions.forEach(session => {
        const planName = session.workout_plans?.name;
        if (planName) {
          exerciseFrequency[planName] = (exerciseFrequency[planName] || 0) + 1;
        }
      });

      const topExercises = Object.entries(exerciseFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      // Generar insights y recomendaciones
      const insights = this.generateWeeklyInsights(completedSessions, averageRpe, averageSatisfaction);
      const recommendations = this.generateWeeklyRecommendations(completedSessions, averageRpe, averageSatisfaction);
      const achievements = this.generateWeeklyAchievements(completedSessions);

      return {
        userId,
        weekStartDate: startDateStr,
        weekEndDate: endDateStr,
        summary: {
          workoutsCompleted: completedSessions.length,
          totalDuration,
          averageRpe,
          averageSatisfaction,
          topExercises,
          achievements
        },
        insights,
        recommendations,
        progressHighlights: achievements
      };

    } catch (error) {
      console.error('❌ [Reporting] Error generating weekly report:', error);
      throw error;
    }
  }

  /**
   * 📈 Generar reporte mensual automático
   */
  async generateMonthlyReport(userId: number, monthStartDate?: string): Promise<MonthlyReport> {
    console.log('📈 [Reporting] Generating monthly report for user:', userId);

    try {
      const startDate = monthStartDate ? new Date(monthStartDate) : this.getMonthStart(new Date());
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Obtener métricas del mes
      const progressMetrics = await analyticsService.calculateProgressMetrics(userId, 30);
      const adherenceMetrics = await analyticsService.calculateAdherenceMetrics(userId, 30);
      const effectivenessMetrics = await analyticsService.calculateEffectivenessMetrics(userId, 30);

      // Calcular tendencias comparando con el mes anterior
      const prevMonthStart = new Date(startDate);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      
      const prevProgressMetrics = await analyticsService.calculateProgressMetrics(userId, 30);

      const volumeTrend = prevProgressMetrics.strengthProgress.totalVolumeKg > 0
        ? ((progressMetrics.strengthProgress.totalVolumeKg - prevProgressMetrics.strengthProgress.totalVolumeKg) / prevProgressMetrics.strengthProgress.totalVolumeKg) * 100
        : 0;

      // Ejercicios favoritos del mes
      const favoriteExercises = effectivenessMetrics.topExercises
        .slice(0, 5)
        .map(ex => ex.exerciseName);

      // Generar logros y mejoras
      const improvements = this.generateMonthlyImprovements(progressMetrics, adherenceMetrics);
      const achievedGoals = this.generateAchievedGoals(progressMetrics, adherenceMetrics);
      const suggestedGoals = this.generateSuggestedGoals(progressMetrics, adherenceMetrics);

      return {
        userId,
        monthStartDate: startDateStr,
        monthEndDate: endDateStr,
        summary: {
          totalWorkouts: Math.round(adherenceMetrics.totalPlannedWorkouts),
          adherenceRate: adherenceMetrics.completionRate,
          strengthProgress: progressMetrics.strengthProgress.volumeChange,
          favoriteExercises,
          improvements
        },
        trends: {
          rpetrend: progressMetrics.rpeMetrics.rpeChange,
          satisfactionTrend: effectivenessMetrics.satisfactionTrend,
          volumeTrend
        },
        goals: {
          achieved: achievedGoals,
          inProgress: [],
          suggested: suggestedGoals
        }
      };

    } catch (error) {
      console.error('❌ [Reporting] Error generating monthly report:', error);
      throw error;
    }
  }

  /**
   * 💾 Guardar reporte semanal en base de datos
   */
  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    console.log('💾 [Reporting] Saving weekly report to database');

    try {
      const { error } = await supabase
        .from('weekly_analytics')
        .upsert({
          user_id: report.userId,
          week_start_date: report.weekStartDate.split('T')[0],
          week_end_date: report.weekEndDate.split('T')[0],
          completed_workouts: report.summary.workoutsCompleted,
          avg_rpe: report.summary.averageRpe,
          avg_satisfaction: report.summary.averageSatisfaction,
          avg_workout_duration: report.summary.totalDuration / Math.max(1, report.summary.workoutsCompleted),
          insights: {
            insights: report.insights,
            recommendations: report.recommendations,
            achievements: report.summary.achievements,
            topExercises: report.summary.topExercises
          }
        }, {
          onConflict: 'user_id,week_start_date'
        });

      if (error) throw error;
      console.log('✅ [Reporting] Weekly report saved successfully');

    } catch (error) {
      console.error('❌ [Reporting] Error saving weekly report:', error);
      throw error;
    }
  }

  /**
   * 🔧 Helper: Obtener inicio de semana
   */
  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    return new Date(start.setDate(diff));
  }

  /**
   * 🔧 Helper: Obtener inicio de mes
   */
  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * 💡 Generar insights semanales
   */
  private generateWeeklyInsights(sessions: any[], avgRpe: number, avgSatisfaction: number): string[] {
    const insights: string[] = [];

    // Validar que hay datos suficientes
    if (sessions.length === 0) {
      insights.push('¡Es hora de comenzar! No hay entrenamientos registrados esta semana.');
      return insights;
    }

    // Insights basados en frecuencia real
    if (sessions.length >= 4) {
      insights.push('¡Excelente consistencia! Entrenaste 4+ veces esta semana.');
    } else if (sessions.length >= 2) {
      insights.push('Buena frecuencia de entrenamiento esta semana.');
    } else if (sessions.length === 1) {
      insights.push('Al menos mantuviste el hábito con 1 entrenamiento.');
    }

    // Insights basados en RPE real (solo si hay datos)
    if (avgRpe > 0) {
      if (avgRpe <= 6) {
        insights.push(`Tu intensidad promedio fue moderada (RPE ${avgRpe.toFixed(1)}). Considera aumentar el desafío.`);
      } else if (avgRpe >= 8) {
        insights.push(`Entrenaste con alta intensidad (RPE ${avgRpe.toFixed(1)}). Asegúrate de recuperarte bien.`);
      } else {
        insights.push(`Intensidad balanceada esta semana (RPE ${avgRpe.toFixed(1)}). ¡Buen trabajo!`);
      }
    }

    // Insights basados en satisfacción real (solo si hay datos)
    if (avgSatisfaction > 0) {
      if (avgSatisfaction >= 4) {
        insights.push(`¡Te gustaron mucho tus entrenamientos! (${avgSatisfaction.toFixed(1)}/5) Mantén esta motivación.`);
      } else if (avgSatisfaction <= 2) {
        insights.push(`Parece que no disfrutaste mucho (${avgSatisfaction.toFixed(1)}/5). Probemos variaciones.`);
      } else {
        insights.push(`Satisfacción moderada esta semana (${avgSatisfaction.toFixed(1)}/5). Hay espacio para mejorar.`);
      }
    }

    // Si no hay insights específicos, dar mensaje motivacional
    if (insights.length === 1 && sessions.length > 0) {
      insights.push('Sigue construyendo tu hábito de entrenamiento. ¡Cada sesión cuenta!');
    }

    return insights;
  }

  /**
   * 💡 Generar recomendaciones semanales inteligentes
   */
  private generateWeeklyRecommendations(sessions: any[], avgRpe: number, avgSatisfaction: number): string[] {
    const recommendations: string[] = [];

    // Validar que hay datos para hacer recomendaciones
    if (sessions.length === 0) {
      recommendations.push('Programa tu primer entrenamiento de la semana. ¡El primer paso es el más importante!');
      recommendations.push('Comienza con sesiones cortas de 20-30 minutos para crear el hábito.');
      return recommendations;
    }

    // Recomendaciones basadas en frecuencia real
    if (sessions.length < 2) {
      recommendations.push('Intenta agregar al menos una sesión más la próxima semana para mejores resultados.');
    } else if (sessions.length < 3) {
      recommendations.push('Considera entrenar 3 veces por semana para un progreso óptimo.');
    } else if (sessions.length >= 5) {
      recommendations.push('¡Excelente frecuencia! Asegúrate de incluir días de descanso para la recuperación.');
    }

    // Recomendaciones basadas en RPE real (solo si hay datos)
    if (avgRpe > 0) {
      if (avgRpe < 6) {
        recommendations.push('Tu intensidad está baja. Considera aumentar gradualmente el peso o las repeticiones.');
      } else if (avgRpe > 8.5) {
        recommendations.push('Tu intensidad está muy alta. Incluye sesiones más ligeras para evitar el sobreentrenamiento.');
      }
    }

    // Recomendaciones basadas en satisfacción real (solo si hay datos)
    if (avgSatisfaction > 0) {
      if (avgSatisfaction < 3) {
        recommendations.push('Probemos nuevos ejercicios o rutinas para mantener la motivación alta.');
      } else if (avgSatisfaction >= 4.5) {
        recommendations.push('¡Te encantan tus entrenamientos! Mantén esta rutina que funciona tan bien.');
      }
    }

    // Si no hay recomendaciones específicas, dar consejos generales
    if (recommendations.length === 0) {
      recommendations.push('Mantén la consistencia y escucha a tu cuerpo para ajustar la intensidad.');
    }

    return recommendations;
  }

  /**
   * 🏆 Generar logros semanales
   */
  private generateWeeklyAchievements(sessions: any[]): string[] {
    const achievements: string[] = [];

    if (sessions.length >= 5) {
      achievements.push('🔥 Guerrero de la semana - 5+ entrenamientos');
    } else if (sessions.length >= 3) {
      achievements.push('💪 Consistencia sólida - 3+ entrenamientos');
    }

    const totalDuration = sessions.reduce((sum, s) => {
      if (s.completed_at && s.started_at) {
        return sum + (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / (1000 * 60);
      }
      return sum;
    }, 0);

    if (totalDuration >= 300) {
      achievements.push('⏱️ Maratonista - 5+ horas de entrenamiento');
    }

    return achievements;
  }

  /**
   * 📈 Generar mejoras mensuales
   */
  private generateMonthlyImprovements(progressMetrics: any, adherenceMetrics: any): string[] {
    const improvements: string[] = [];

    if (progressMetrics.strengthProgress.volumeChange > 10) {
      improvements.push(`Aumento de volumen del ${progressMetrics.strengthProgress.volumeChange.toFixed(1)}%`);
    }

    if (adherenceMetrics.completionRate > 80) {
      improvements.push(`Excelente adherencia del ${adherenceMetrics.completionRate.toFixed(1)}%`);
    }

    if (adherenceMetrics.streakDays >= 7) {
      improvements.push(`Racha de ${adherenceMetrics.streakDays} días consecutivos`);
    }

    return improvements;
  }

  /**
   * 🎯 Generar objetivos logrados
   */
  private generateAchievedGoals(progressMetrics: any, adherenceMetrics: any): string[] {
    const goals: string[] = [];

    if (adherenceMetrics.completionRate >= 90) {
      goals.push('Meta de consistencia (90%+) ✅');
    }

    if (progressMetrics.strengthProgress.volumeChange > 15) {
      goals.push('Meta de progreso de fuerza (15%+) ✅');
    }

    return goals;
  }

  /**
   * 🎯 Generar objetivos sugeridos
   */
  private generateSuggestedGoals(progressMetrics: any, adherenceMetrics: any): string[] {
    const goals: string[] = [];

    if (adherenceMetrics.completionRate < 80) {
      goals.push('Alcanzar 80% de adherencia');
    }

    if (progressMetrics.strengthProgress.exerciseCount < 10) {
      goals.push('Probar 10+ ejercicios diferentes');
    }

    goals.push('Mantener RPE promedio entre 6-8');
    goals.push('Aumentar volumen total en 10%');

    return goals;
  }
}

export const reportingService = new ReportingService();
