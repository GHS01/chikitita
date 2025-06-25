/**
 * 🧠 AI Learning Service
 * Sistema de aprendizaje que mejora las rutinas automáticas basado en feedback y patrones
 */

import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';
import { splitAssignmentService } from './splitAssignmentService';
import { autoWorkoutService } from './autoWorkoutService';

interface LearningData {
  userId: number;
  assignmentPatterns: any[];
  workoutFeedback: any[];
  completionRates: any[];
  preferenceEvolution: any[];
}

interface AIInsights {
  preferredSplits: string[];
  optimalDuration: number;
  bestDays: string[];
  muscleGroupPreferences: string[];
  intensityPattern: string;
  recommendations: string[];
}

export class AILearningService {

  /**
   * 🧠 Analizar patrones de asignaciones del usuario
   */
  async analyzeUserAssignmentPatterns(userId: number): Promise<any> {
    try {
      console.log('🧠 [AILearning] Analyzing assignment patterns for user:', userId);

      // Obtener historial de asignaciones
      const { data: assignmentHistory, error } = await supabase
        .from('user_split_assignments')
        .select(`
          *,
          scientific_splits (
            split_name,
            split_type,
            muscle_groups,
            difficulty_level
          )
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('❌ [AILearning] Error getting assignment history:', error);
        throw new Error(`Failed to get assignment history: ${error.message}`);
      }

      // Analizar patrones
      const patterns = {
        totalAssignments: assignmentHistory?.length || 0,
        mostUsedSplits: this.getMostUsedSplits(assignmentHistory || []),
        preferredDays: this.getPreferredDays(assignmentHistory || []),
        muscleGroupFrequency: this.getMuscleGroupFrequency(assignmentHistory || []),
        difficultyProgression: this.getDifficultyProgression(assignmentHistory || [])
      };

      console.log('🧠 [AILearning] Assignment patterns analyzed:', patterns);
      return patterns;

    } catch (error) {
      console.error('❌ [AILearning] Error in analyzeUserAssignmentPatterns:', error);
      throw error;
    }
  }

  /**
   * 📊 Analizar feedback de rutinas completadas
   */
  async analyzeWorkoutFeedback(userId: number): Promise<any> {
    try {
      console.log('📊 [AILearning] Analyzing workout feedback for user:', userId);

      // Obtener rutinas pre-generadas usadas
      const { data: usedWorkouts, error } = await supabase
        .from('pre_generated_workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_used', true)
        .order('created_at', { ascending: false })
        .limit(50); // Últimas 50 rutinas

      if (error) {
        console.error('❌ [AILearning] Error getting used workouts:', error);
        throw new Error(`Failed to get used workouts: ${error.message}`);
      }

      // Analizar feedback
      const feedback = {
        totalCompletedWorkouts: usedWorkouts?.length || 0,
        averageDuration: this.calculateAverageDuration(usedWorkouts || []),
        splitPerformance: this.analyzeSplitPerformance(usedWorkouts || []),
        muscleGroupSuccess: this.analyzeMuscleGroupSuccess(usedWorkouts || []),
        aiConfidenceCorrelation: this.analyzeAIConfidenceCorrelation(usedWorkouts || [])
      };

      console.log('📊 [AILearning] Workout feedback analyzed:', feedback);
      return feedback;

    } catch (error) {
      console.error('❌ [AILearning] Error in analyzeWorkoutFeedback:', error);
      throw error;
    }
  }

  /**
   * 🎯 Generar insights y recomendaciones de IA
   */
  async generateAIInsights(userId: number): Promise<AIInsights> {
    try {
      console.log('🎯 [AILearning] Generating AI insights for user:', userId);

      // Obtener datos de análisis
      const [assignmentPatterns, workoutFeedback, userPreferences] = await Promise.all([
        this.analyzeUserAssignmentPatterns(userId),
        this.analyzeWorkoutFeedback(userId),
        supabaseStorage.getUserPreferences(userId)
      ]);

      // Generar insights
      const insights: AIInsights = {
        preferredSplits: this.extractPreferredSplits(assignmentPatterns, workoutFeedback),
        optimalDuration: this.calculateOptimalDuration(workoutFeedback, userPreferences),
        bestDays: this.identifyBestDays(assignmentPatterns, workoutFeedback),
        muscleGroupPreferences: this.extractMuscleGroupPreferences(assignmentPatterns, workoutFeedback),
        intensityPattern: this.identifyIntensityPattern(workoutFeedback, userPreferences),
        recommendations: this.generateRecommendations(assignmentPatterns, workoutFeedback, userPreferences)
      };

      console.log('🎯 [AILearning] AI insights generated:', insights);
      return insights;

    } catch (error) {
      console.error('❌ [AILearning] Error in generateAIInsights:', error);
      throw error;
    }
  }

  /**
   * 🔄 Optimizar rutinas futuras basado en aprendizaje
   */
  async optimizeFutureWorkouts(userId: number): Promise<void> {
    try {
      console.log('🔄 [AILearning] Optimizing future workouts for user:', userId);

      // Obtener insights de IA
      const insights = await this.generateAIInsights(userId);

      // Aplicar optimizaciones
      await this.applyOptimizations(userId, insights);

      console.log('✅ [AILearning] Future workouts optimized');

    } catch (error) {
      console.error('❌ [AILearning] Error in optimizeFutureWorkouts:', error);
      throw error;
    }
  }

  /**
   * 🧠 NUEVO: Actualizar preferencias del usuario basado en feedback post-workout
   */
  async updateUserPreferences(userId: number, feedbackData: any): Promise<void> {
    try {
      console.log('🧠 [AILearning] Updating user preferences based on feedback:', {
        userId,
        rpe: feedbackData.rpe,
        satisfaction: feedbackData.satisfaction,
        fatigue: feedbackData.fatigue
      });

      // 1. Analizar feedback para ajustar preferencias
      const adjustments = this.analyzeFeedbackForAdjustments(feedbackData);

      // 2. Obtener preferencias actuales
      const currentPreferences = await supabaseStorage.getUserPreferences(userId);

      // 3. Aplicar ajustes inteligentes
      const updatedPreferences = this.applyIntelligentAdjustments(currentPreferences, adjustments, feedbackData);

      // 4. Guardar preferencias actualizadas
      if (updatedPreferences) {
        await supabaseStorage.updateUserPreferences(userId, updatedPreferences);
        console.log('✅ [AILearning] User preferences updated successfully');
      }

      // 5. Registrar decisión de IA para tracking
      await this.logAIDecision(userId, 'preference_update', {
        feedback: feedbackData,
        adjustments,
        updatedPreferences
      });

    } catch (error) {
      console.error('❌ [AILearning] Error updating user preferences:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * 📈 Calcular tasa de éxito de splits
   */
  private analyzeSplitPerformance(workouts: any[]): any {
    const splitStats: { [key: string]: { total: number; avgConfidence: number } } = {};

    workouts.forEach(workout => {
      const splitName = workout.split_name;
      if (!splitStats[splitName]) {
        splitStats[splitName] = { total: 0, avgConfidence: 0 };
      }
      splitStats[splitName].total++;
      splitStats[splitName].avgConfidence += workout.ai_confidence_score || 0;
    });

    // Calcular promedios
    Object.keys(splitStats).forEach(split => {
      splitStats[split].avgConfidence = splitStats[split].avgConfidence / splitStats[split].total;
    });

    return splitStats;
  }

  /**
   * 💪 Analizar éxito por grupo muscular
   */
  private analyzeMuscleGroupSuccess(workouts: any[]): any {
    const muscleStats: { [key: string]: number } = {};

    workouts.forEach(workout => {
      workout.target_muscle_groups?.forEach((muscle: string) => {
        muscleStats[muscle] = (muscleStats[muscle] || 0) + 1;
      });
    });

    return muscleStats;
  }

  /**
   * 🎯 Extraer splits preferidos
   */
  private extractPreferredSplits(patterns: any, feedback: any): string[] {
    const splitFrequency = patterns.mostUsedSplits || {};
    const splitPerformance = feedback.splitPerformance || {};

    // Combinar frecuencia de uso con rendimiento
    const splitScores: { [key: string]: number } = {};

    Object.keys(splitFrequency).forEach(split => {
      const frequency = splitFrequency[split];
      const performance = splitPerformance[split]?.avgConfidence || 0.5;
      splitScores[split] = frequency * performance;
    });

    // Ordenar por puntuación y devolver top 3
    return Object.entries(splitScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([split]) => split);
  }

  /**
   * ⏱️ Calcular duración óptima
   */
  private calculateOptimalDuration(feedback: any, preferences: any): number {
    const avgDuration = feedback.averageDuration || 45;
    const preferredTime = preferences?.preferredWorkoutDuration || 45;
    
    // Promedio ponderado entre duración real y preferida
    return Math.round((avgDuration * 0.7 + preferredTime * 0.3));
  }

  /**
   * 📅 Identificar mejores días
   */
  private identifyBestDays(patterns: any, feedback: any): string[] {
    const preferredDays = patterns.preferredDays || {};
    
    // Ordenar días por frecuencia de uso
    return Object.entries(preferredDays)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([day]) => day);
  }

  /**
   * 💪 Extraer preferencias de grupos musculares
   */
  private extractMuscleGroupPreferences(patterns: any, feedback: any): string[] {
    const muscleFrequency = patterns.muscleGroupFrequency || {};
    const muscleSuccess = feedback.muscleGroupSuccess || {};

    // Combinar frecuencia con éxito
    const muscleScores: { [key: string]: number } = {};

    Object.keys(muscleFrequency).forEach(muscle => {
      const frequency = muscleFrequency[muscle];
      const success = muscleSuccess[muscle] || 1;
      muscleScores[muscle] = frequency * success;
    });

    return Object.entries(muscleScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([muscle]) => muscle);
  }

  /**
   * 🔥 Identificar patrón de intensidad
   */
  private identifyIntensityPattern(feedback: any, preferences: any): string {
    const avgConfidence = feedback.aiConfidenceCorrelation || 0.7;
    
    if (avgConfidence > 0.8) return 'high';
    if (avgConfidence > 0.6) return 'moderate';
    return 'light';
  }

  /**
   * 💡 Generar recomendaciones
   */
  private generateRecommendations(patterns: any, feedback: any, preferences: any): string[] {
    const recommendations: string[] = [];

    // Recomendación basada en splits más exitosos
    const topSplits = this.extractPreferredSplits(patterns, feedback);
    if (topSplits.length > 0) {
      recommendations.push(`Continúa enfocándote en ${topSplits[0]} - es tu split más exitoso`);
    }

    // Recomendación de duración
    const optimalDuration = this.calculateOptimalDuration(feedback, preferences);
    if (optimalDuration !== 45) {
      recommendations.push(`Considera ajustar la duración a ${optimalDuration} minutos para mejores resultados`);
    }

    // Recomendación de días
    const bestDays = this.identifyBestDays(patterns, feedback);
    if (bestDays.length > 0) {
      recommendations.push(`${bestDays[0]} parece ser tu mejor día de entrenamiento`);
    }

    return recommendations;
  }

  /**
   * 🔧 Aplicar optimizaciones
   */
  private async applyOptimizations(userId: number, insights: AIInsights): Promise<void> {
    // Aquí se pueden aplicar las optimizaciones a futuras rutinas
    // Por ejemplo, ajustar parámetros de generación automática
    console.log('🔧 [AILearning] Applying optimizations based on insights:', insights);
  }

  // Métodos auxiliares para análisis de patrones
  private getMostUsedSplits(assignments: any[]): any {
    const splitCount: { [key: string]: number } = {};
    assignments.forEach(assignment => {
      const splitName = assignment.scientific_splits?.split_name;
      if (splitName) {
        splitCount[splitName] = (splitCount[splitName] || 0) + 1;
      }
    });
    return splitCount;
  }

  private getPreferredDays(assignments: any[]): any {
    const dayCount: { [key: string]: number } = {};
    assignments.forEach(assignment => {
      const day = assignment.day_name;
      if (day) {
        dayCount[day] = (dayCount[day] || 0) + 1;
      }
    });
    return dayCount;
  }

  private getMuscleGroupFrequency(assignments: any[]): any {
    const muscleCount: { [key: string]: number } = {};
    assignments.forEach(assignment => {
      const muscles = assignment.scientific_splits?.muscle_groups || [];
      muscles.forEach((muscle: string) => {
        muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
      });
    });
    return muscleCount;
  }

  private getDifficultyProgression(assignments: any[]): any {
    return assignments.map(assignment => ({
      date: assignment.assigned_at,
      difficulty: assignment.scientific_splits?.difficulty_level || 'intermediate'
    }));
  }

  private calculateAverageDuration(workouts: any[]): number {
    if (workouts.length === 0) return 45;
    const total = workouts.reduce((sum, workout) => sum + (workout.estimated_duration || 45), 0);
    return Math.round(total / workouts.length);
  }

  private analyzeAIConfidenceCorrelation(workouts: any[]): number {
    if (workouts.length === 0) return 0.7;
    const total = workouts.reduce((sum, workout) => sum + (workout.ai_confidence_score || 0.7), 0);
    return total / workouts.length;
  }

  /**
   * 🧠 NUEVO: Analizar feedback para determinar ajustes necesarios
   */
  private analyzeFeedbackForAdjustments(feedbackData: any): any {
    const adjustments: any = {};

    // Ajustar intensidad basado en RPE
    if (feedbackData.rpe <= 4) {
      adjustments.intensityAdjustment = 'increase'; // Muy fácil, aumentar intensidad
    } else if (feedbackData.rpe >= 9) {
      adjustments.intensityAdjustment = 'decrease'; // Muy difícil, reducir intensidad
    }

    // Ajustar duración basado en fatiga
    if (feedbackData.fatigue >= 4) {
      adjustments.durationAdjustment = 'decrease'; // Mucha fatiga, reducir duración
    } else if (feedbackData.fatigue <= 2) {
      adjustments.durationAdjustment = 'increase'; // Poca fatiga, puede aumentar duración
    }

    // Ajustar frecuencia basado en satisfacción
    if (feedbackData.satisfaction <= 2) {
      adjustments.frequencyAdjustment = 'decrease'; // Baja satisfacción, reducir frecuencia
    } else if (feedbackData.satisfaction >= 4) {
      adjustments.frequencyAdjustment = 'maintain_or_increase'; // Alta satisfacción, mantener o aumentar
    }

    return adjustments;
  }

  /**
   * 🎯 NUEVO: Aplicar ajustes inteligentes a las preferencias
   */
  private applyIntelligentAdjustments(currentPreferences: any, adjustments: any, feedbackData: any): any {
    if (!currentPreferences) return null;

    const updated = { ...currentPreferences };
    let hasChanges = false;

    // Ajustar duración preferida
    if (adjustments.durationAdjustment === 'decrease' && updated.preferredWorkoutDuration > 30) {
      updated.preferredWorkoutDuration = Math.max(30, updated.preferredWorkoutDuration - 5);
      hasChanges = true;
    } else if (adjustments.durationAdjustment === 'increase' && updated.preferredWorkoutDuration < 90) {
      updated.preferredWorkoutDuration = Math.min(90, updated.preferredWorkoutDuration + 5);
      hasChanges = true;
    }

    // Ajustar frecuencia semanal
    if (adjustments.frequencyAdjustment === 'decrease' && updated.weeklyFrequency > 2) {
      updated.weeklyFrequency = Math.max(2, updated.weeklyFrequency - 1);
      hasChanges = true;
    } else if (adjustments.frequencyAdjustment === 'maintain_or_increase' && updated.weeklyFrequency < 6) {
      // Solo aumentar si la satisfacción es muy alta (5/5)
      if (feedbackData.satisfaction === 5) {
        updated.weeklyFrequency = Math.min(6, updated.weeklyFrequency + 1);
        hasChanges = true;
      }
    }

    // Actualizar ejercicios preferidos/evitados
    if (feedbackData.preferredExercises?.length > 0) {
      updated.preferredExercises = [...(updated.preferredExercises || []), ...feedbackData.preferredExercises];
      hasChanges = true;
    }

    if (feedbackData.dislikedExercises?.length > 0) {
      updated.avoidedExercises = [...(updated.avoidedExercises || []), ...feedbackData.dislikedExercises];
      hasChanges = true;
    }

    return hasChanges ? updated : null;
  }

  /**
   * 📝 NUEVO: Registrar decisión de IA para tracking
   */
  private async logAIDecision(userId: number, decisionType: string, decisionData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_decisions')
        .insert({
          user_id: userId,
          decision_type: decisionType,
          decision_data: decisionData,
          reasoning: {
            source: 'post_workout_feedback',
            confidence: 0.8,
            timestamp: new Date().toISOString()
          },
          confidence_level: 0.8
        });

      if (error) {
        console.error('❌ [AILearning] Error logging AI decision:', error);
      }
    } catch (error) {
      console.error('❌ [AILearning] Error in logAIDecision:', error);
    }
  }
  /**
   * 🏋️‍♂️ NUEVO: Procesar datos de peso para mejorar sugerencias de IA
   */
  async processWeightLearningData(userId: number): Promise<void> {
    try {
      console.log(`🏋️‍♂️ [AI Learning] Processing weight data for user ${userId}`);

      // Obtener todos los ejercicios únicos del usuario
      const { data: exercises, error } = await supabase
        .from('exercise_weight_history')
        .select('exercise_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueExercises = [...new Set(exercises?.map(e => e.exercise_name) || [])];

      // Procesar cada ejercicio
      for (const exerciseName of uniqueExercises) {
        await this.processExerciseWeightData(userId, exerciseName);
      }

      console.log(`✅ [AI Learning] Processed weight data for ${uniqueExercises.length} exercises`);

    } catch (error) {
      console.error('❌ [AI Learning] Error processing weight data:', error);
      throw error;
    }
  }

  /**
   * 🎯 Procesar datos específicos de peso de un ejercicio
   */
  private async processExerciseWeightData(userId: number, exerciseName: string): Promise<void> {
    try {
      console.log(`🔍 [AI Learning] Processing weight data for exercise: ${exerciseName}`);

      // Obtener historial de peso (últimas 4 semanas)
      const { data: weightHistory, error } = await supabase
        .from('exercise_weight_history')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .gte('workout_date', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('workout_date', { ascending: false })
        .limit(20);

      if (error || !weightHistory?.length) {
        console.log(`⚠️ [AI Learning] No weight data found for ${exerciseName}`);
        return;
      }

      // Obtener feedback de sets relacionado
      const { data: setFeedback, error: feedbackError } = await supabase
        .from('exercise_set_feedback')
        .select(`
          *,
          exercise_logs!inner(
            exercise_name,
            workout_sessions!inner(user_id)
          )
        `)
        .eq('exercise_logs.workout_sessions.user_id', userId)
        .eq('exercise_logs.exercise_name', exerciseName)
        .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedbackError) {
        console.error('Error fetching set feedback:', feedbackError);
      }

      // Generar nueva recomendación
      const recommendation = this.generateWeightRecommendation(weightHistory, setFeedback || []);

      // Actualizar sugerencia de IA
      await this.updateWeightSuggestion(userId, exerciseName, recommendation);

      console.log(`✅ [AI Learning] Updated weight recommendation for ${exerciseName}: ${recommendation.suggestedWeight}kg (confidence: ${recommendation.confidenceScore})`);

    } catch (error) {
      console.error(`❌ [AI Learning] Error processing exercise ${exerciseName}:`, error);
    }
  }

  /**
   * 🧮 Generar recomendación de peso usando algoritmo de aprendizaje
   */
  private generateWeightRecommendation(weightHistory: any[], setFeedback: any[]): any {
    if (weightHistory.length === 0) {
      throw new Error('No weight data available for recommendation');
    }

    // Análisis de tendencias de peso
    const recentWeights = weightHistory.slice(0, 5).map(w => w.actual_weight || 0);
    const olderWeights = weightHistory.slice(5, 10).map(w => w.actual_weight || 0);

    const avgRecentWeight = recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length;
    const avgOlderWeight = olderWeights.length > 0
      ? olderWeights.reduce((a, b) => a + b, 0) / olderWeights.length
      : avgRecentWeight;

    // Determinar tendencia
    let progressionTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const weightChange = avgRecentWeight - avgOlderWeight;
    const changePercentage = Math.abs(weightChange) / avgOlderWeight * 100;

    if (changePercentage > 5) {
      progressionTrend = weightChange > 0 ? 'increasing' : 'decreasing';
    }

    // Análisis de RPE y feedback
    const recentFeedback = setFeedback.slice(0, 10);
    const avgRpe = recentFeedback.length > 0
      ? recentFeedback.reduce((sum, f) => sum + (f.set_rpe || 7), 0) / recentFeedback.length
      : 7;

    const weightFeelings = recentFeedback.map(f => f.weight_feeling).filter(Boolean);
    const tooLightCount = weightFeelings.filter(f => f === 'too_light').length;
    const tooHeavyCount = weightFeelings.filter(f => f === 'too_heavy').length;
    const perfectCount = weightFeelings.filter(f => f === 'perfect').length;

    // Calcular nuevo peso sugerido
    let newWeight = avgRecentWeight;
    let reasoning = 'Manteniendo peso actual';

    // Lógica de ajuste basada en RPE y feedback
    if (avgRpe < 6 || tooLightCount > perfectCount) {
      // Peso muy fácil, incrementar
      const increment = progressionTrend === 'increasing' ? 0.075 : 0.05; // 7.5% o 5%
      newWeight = avgRecentWeight * (1 + increment);
      reasoning = `RPE bajo (${avgRpe.toFixed(1)}) o peso muy fácil. Incrementando ${(increment * 100).toFixed(1)}%`;
    } else if (avgRpe > 9 || tooHeavyCount > perfectCount) {
      // Peso muy pesado, reducir
      const decrement = progressionTrend === 'decreasing' ? 0.075 : 0.05; // 7.5% o 5%
      newWeight = avgRecentWeight * (1 - decrement);
      reasoning = `RPE alto (${avgRpe.toFixed(1)}) o peso muy pesado. Reduciendo ${(decrement * 100).toFixed(1)}%`;
    } else if (avgRpe >= 6 && avgRpe <= 8 && perfectCount >= tooLightCount + tooHeavyCount) {
      // Peso perfecto, incremento progresivo pequeño
      const increment = 0.025; // 2.5%
      newWeight = avgRecentWeight * (1 + increment);
      reasoning = `RPE óptimo (${avgRpe.toFixed(1)}) y feedback positivo. Progresión gradual +2.5%`;
    }

    // Redondear a múltiplos de 2.5kg
    newWeight = Math.round(newWeight / 2.5) * 2.5;

    // Calcular confianza basada en cantidad de datos
    const dataPoints = weightHistory.length + setFeedback.length;
    let confidenceScore = Math.min(0.95, 0.3 + (dataPoints * 0.02));

    // Ajustar confianza basada en consistencia
    const weightVariance = this.calculateVariance(recentWeights);
    if (weightVariance > 25) { // Alta variabilidad
      confidenceScore *= 0.8;
    }

    return {
      suggestedWeight: Math.max(2.5, newWeight), // Mínimo 2.5kg
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      reasoning,
      progressionTrend,
      basedOnSessions: weightHistory.length
    };
  }

  /**
   * 💾 Actualizar sugerencia de peso en la base de datos
   */
  private async updateWeightSuggestion(userId: number, exerciseName: string, recommendation: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_weight_suggestions')
        .upsert({
          user_id: userId,
          exercise_name: exerciseName,
          suggested_weight: recommendation.suggestedWeight,
          confidence_score: recommendation.confidenceScore,
          based_on_sessions: recommendation.basedOnSessions,
          progression_trend: recommendation.progressionTrend,
          target_rpe_range: '6-8',
          muscle_group: this.getMuscleGroupFromExercise(exerciseName),
          exercise_type: this.getExerciseTypeFromName(exerciseName),
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id,exercise_name' });

      if (error) throw error;

    } catch (error) {
      console.error('Error updating weight suggestion:', error);
      throw error;
    }
  }

  /**
   * 🧮 Calcular varianza de un array de números
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return variance;
  }

  /**
   * 💪 Obtener grupo muscular de un ejercicio
   */
  private getMuscleGroupFromExercise(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    if (name.includes('press') || name.includes('pecho')) return 'Pecho';
    if (name.includes('curl') || name.includes('bíceps')) return 'Bíceps';
    if (name.includes('extensión') || name.includes('tríceps')) return 'Tríceps';
    if (name.includes('elevación') || name.includes('lateral') || name.includes('hombro')) return 'Hombros';
    if (name.includes('remo') || name.includes('jalón') || name.includes('espalda')) return 'Espalda';
    if (name.includes('sentadilla') || name.includes('prensa') || name.includes('cuádriceps') || name.includes('pierna')) return 'Piernas';
    return 'General';
  }

  /**
   * 🏋️‍♂️ Obtener tipo de ejercicio
   */
  private getExerciseTypeFromName(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    if (name.includes('press') || name.includes('sentadilla') || name.includes('remo') || name.includes('jalón')) return 'compound';
    return 'isolation';
  }
}

export const aiLearningService = new AILearningService();
