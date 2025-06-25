/**
 * 🏋️‍♂️ Weight Suggestion Service
 * Sistema inteligente para sugerir pesos basado en historial del usuario y aprendizaje de IA
 */

import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';
import type { 
  AiWeightSuggestion, 
  InsertAiWeightSuggestion,
  ExerciseWeightHistory,
  InsertExerciseWeightHistory 
} from '../../shared/schema';

interface WeightSuggestionInput {
  exerciseName: string;
  muscleGroup?: string;
  exerciseType?: string;
  targetRpeRange?: string;
}

interface WeightProgressionData {
  lastWeight: number;
  lastRpe: number;
  lastFeedback: 'too_light' | 'perfect' | 'too_heavy';
  sessionCount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export class WeightSuggestionService {
  
  /**
   * Obtiene sugerencia de peso para un ejercicio específico
   */
  async getWeightSuggestion(userId: number, exerciseName: string): Promise<AiWeightSuggestion | null> {
    try {
      console.log(`🤖 [WeightSuggestion] Getting suggestion for user ${userId}, exercise: ${exerciseName}`);
      
      // 1. Buscar sugerencia existente y válida
      const { data: existingSuggestion, error } = await supabase
        .from('ai_weight_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .gt('valid_until', new Date().toISOString())
        .single();
      
      if (existingSuggestion && !error) {
        console.log(`✅ [WeightSuggestion] Found valid suggestion: ${existingSuggestion.suggested_weight}kg`);
        return existingSuggestion as AiWeightSuggestion;
      }
      
      // 2. Si no hay sugerencia válida, generar nueva
      console.log(`🔄 [WeightSuggestion] No valid suggestion found, generating new one...`);
      return await this.generateNewWeightSuggestion(userId, exerciseName);
      
    } catch (error) {
      console.error('❌ [WeightSuggestion] Error getting weight suggestion:', error);
      return null;
    }
  }
  
  /**
   * Genera nueva sugerencia de peso basada en historial del usuario
   */
  private async generateNewWeightSuggestion(userId: number, exerciseName: string): Promise<AiWeightSuggestion | null> {
    try {
      // 1. Obtener historial de peso del usuario para este ejercicio
      const progressionData = await this.getWeightProgressionData(userId, exerciseName);
      
      // 2. Calcular nuevo peso sugerido
      const suggestion = this.calculateWeightSuggestion(exerciseName, progressionData);
      
      // 3. Guardar sugerencia en base de datos
      const savedSuggestion = await this.saveWeightSuggestion(userId, suggestion);
      
      console.log(`✅ [WeightSuggestion] Generated new suggestion: ${suggestion.suggestedWeight}kg (confidence: ${suggestion.confidenceScore})`);
      return savedSuggestion;
      
    } catch (error) {
      console.error('❌ [WeightSuggestion] Error generating new suggestion:', error);
      return null;
    }
  }
  
  /**
   * Obtiene datos de progresión de peso del usuario
   */
  private async getWeightProgressionData(userId: number, exerciseName: string): Promise<WeightProgressionData | null> {
    try {
      // Obtener historial de peso de las últimas 4 semanas
      const { data: weightHistory, error } = await supabase
        .from('exercise_weight_history')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .gte('workout_date', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('workout_date', { ascending: false })
        .limit(10);
      
      if (error || !weightHistory?.length) {
        console.log(`📊 [WeightSuggestion] No weight history found for ${exerciseName}`);
        return null;
      }
      
      const latest = weightHistory[0];
      const sessionCount = weightHistory.length;
      
      // Calcular tendencia
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (weightHistory.length >= 3) {
        const recent = weightHistory.slice(0, 3);
        const weights = recent.map(h => h.actual_weight || 0);
        const avgRecent = weights.reduce((a, b) => a + b, 0) / weights.length;
        const older = weightHistory.slice(3, 6);
        const olderWeights = older.map(h => h.actual_weight || 0);
        const avgOlder = olderWeights.length > 0 ? olderWeights.reduce((a, b) => a + b, 0) / olderWeights.length : avgRecent;
        
        if (avgRecent > avgOlder * 1.05) trend = 'increasing';
        else if (avgRecent < avgOlder * 0.95) trend = 'decreasing';
      }
      
      return {
        lastWeight: latest.actual_weight || 0,
        lastRpe: latest.rpe_achieved || 7,
        lastFeedback: latest.weight_feedback || 'perfect',
        sessionCount,
        trend
      };
      
    } catch (error) {
      console.error('❌ [WeightSuggestion] Error getting progression data:', error);
      return null;
    }
  }
  
  /**
   * Calcula sugerencia de peso usando algoritmo inteligente
   */
  private calculateWeightSuggestion(exerciseName: string, progressionData: WeightProgressionData | null): InsertAiWeightSuggestion {
    // Pesos base por tipo de ejercicio (para usuarios nuevos)
    const baseWeights: Record<string, number> = {
      'Press de Banca': 40,
      'Press Inclinado': 35,
      'Elevaciones Laterales': 15,
      'Curl de Bíceps': 12.5,
      'Extensiones de Tríceps': 20,
      'Remo': 45,
      'Jalones': 40,
      'Sentadillas': 60,
      'Prensa de Piernas': 80,
      'Extensiones de Cuádriceps': 30
    };
    
    // Buscar peso base por nombre similar
    let baseWeight = 25; // peso por defecto
    for (const [key, weight] of Object.entries(baseWeights)) {
      if (exerciseName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(exerciseName.toLowerCase())) {
        baseWeight = weight;
        break;
      }
    }
    
    let suggestedWeight = baseWeight;
    let confidenceScore = 0.3; // baja confianza para usuarios nuevos
    let progressionTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    
    // Si hay datos de progresión, usar algoritmo inteligente
    if (progressionData) {
      const { lastWeight, lastRpe, lastFeedback, sessionCount, trend } = progressionData;
      
      // Ajustar peso basado en RPE y feedback
      if (lastFeedback === 'too_light' || lastRpe < 6) {
        // Peso muy fácil, incrementar
        suggestedWeight = lastWeight * 1.1; // +10%
      } else if (lastFeedback === 'too_heavy' || lastRpe > 9) {
        // Peso muy pesado, reducir
        suggestedWeight = lastWeight * 0.9; // -10%
      } else if (lastRpe >= 6 && lastRpe <= 8 && lastFeedback === 'perfect') {
        // Peso perfecto, incremento progresivo pequeño
        suggestedWeight = lastWeight * 1.025; // +2.5%
      } else {
        // Mantener peso similar
        suggestedWeight = lastWeight;
      }
      
      // Ajustar confianza basada en cantidad de sesiones
      confidenceScore = Math.min(0.95, 0.3 + (sessionCount * 0.1));
      progressionTrend = trend;
    }
    
    // Redondear a múltiplos de 2.5kg
    suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;
    
    return {
      exerciseName,
      suggestedWeight,
      confidenceScore,
      basedOnSessions: progressionData?.sessionCount || 0,
      lastUsedWeight: progressionData?.lastWeight,
      progressionTrend,
      targetRpeRange: '6-8',
      muscleGroup: this.getMuscleGroupFromExercise(exerciseName),
      exerciseType: this.getExerciseTypeFromName(exerciseName),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // válido por 7 días
    };
  }
  
  /**
   * Guarda sugerencia de peso en base de datos
   */
  private async saveWeightSuggestion(userId: number, suggestion: InsertAiWeightSuggestion): Promise<AiWeightSuggestion> {
    const { data, error } = await supabase
      .from('ai_weight_suggestions')
      .upsert({
        user_id: userId,
        exercise_name: suggestion.exerciseName,
        suggested_weight: suggestion.suggestedWeight,
        confidence_score: suggestion.confidenceScore,
        based_on_sessions: suggestion.basedOnSessions,
        last_used_weight: suggestion.lastUsedWeight,
        progression_trend: suggestion.progressionTrend,
        target_rpe_range: suggestion.targetRpeRange,
        muscle_group: suggestion.muscleGroup,
        exercise_type: suggestion.exerciseType,
        valid_until: suggestion.validUntil
      })
      .select()
      .single();

    if (error) throw error;
    return data as AiWeightSuggestion;
  }
  
  /**
   * Registra peso usado por el usuario para aprendizaje
   */
  async recordWeightUsed(userId: number, data: {
    exerciseName: string;
    suggestedWeight: number;
    actualWeight: number;
    weightFeedback?: 'too_light' | 'perfect' | 'too_heavy';
    rpeAchieved?: number;
    repsCompleted?: number;
    setsCompleted?: number;
    sessionId?: number | string;
  }): Promise<ExerciseWeightHistory> {
    try {
      const progressionPercentage = data.suggestedWeight > 0 
        ? ((data.actualWeight - data.suggestedWeight) / data.suggestedWeight) * 100 
        : 0;
      
      const { data: saved, error } = await supabase
        .from('exercise_weight_history')
        .insert({
          user_id: userId,
          exercise_name: data.exerciseName,
          suggested_weight: data.suggestedWeight,
          actual_weight: data.actualWeight,
          weight_feedback: data.weightFeedback,
          rpe_achieved: data.rpeAchieved,
          reps_completed: data.repsCompleted,
          sets_completed: data.setsCompleted,
          session_id: typeof data.sessionId === 'string' ? parseInt(data.sessionId) || null : data.sessionId,
          progression_percentage: progressionPercentage,
          user_override: Math.abs(data.actualWeight - data.suggestedWeight) > 2.5,
          workout_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`📊 [WeightSuggestion] Recorded weight usage: ${data.actualWeight}kg for ${data.exerciseName}`);
      return saved as ExerciseWeightHistory;
      
    } catch (error) {
      console.error('❌ [WeightSuggestion] Error recording weight used:', error);
      throw error;
    }
  }
  
  /**
   * Utilidades para clasificar ejercicios
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
  
  private getExerciseTypeFromName(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    if (name.includes('press') || name.includes('sentadilla') || name.includes('remo') || name.includes('jalón')) return 'compound';
    return 'isolation';
  }
}

export const weightSuggestionService = new WeightSuggestionService();
