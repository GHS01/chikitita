import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';
import type { 
  FeedbackRawData, 
  InsertFeedbackRawData, 
  UserFeedbackProfile, 
  InsertUserFeedbackProfile,
  AiDecision,
  InsertAiDecision 
} from '../../shared/schema';

// 🧠 Tipos para el sistema de feedback inteligente
interface ConsolidatedProfile {
  // Preferencias consolidadas
  energyLevel: 'low' | 'medium' | 'high';
  availableTime: number; // minutos
  preferredIntensity: 'light' | 'moderate' | 'intense';
  
  // Grupos musculares preferidos por día
  muscleGroupPreferences: {
    [dayOfWeek: string]: string[];
  };
  
  // Ejercicios preferidos y evitados
  preferredExercises: string[];
  avoidedExercises: string[];
  
  // Patrones temporales
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening';
  consistentDays: string[];
  
  // Limitaciones y restricciones
  limitations: string[];
  
  // Metadatos de consolidación
  lastUpdated: Date;
  confidenceScore: number;
  dataSourcesUsed: string[];
}

interface WeightedFeedback {
  data: any;
  weight: number;
  timestamp: Date;
  type: string;
}

/**
 * 🧠 Servicio de Feedback Inteligente Consolidado
 * Procesa y consolida todos los tipos de feedback del usuario
 */
export class IntelligentFeedbackService {
  
  /**
   * Guarda feedback raw y dispara consolidación
   */
  async saveFeedbackRaw(
    userId: number, 
    feedbackType: string, 
    rawData: any, 
    context: any = {}
  ): Promise<FeedbackRawData> {
    console.log(`🧠 [IntelligentFeedback] Saving raw feedback: ${feedbackType} for user ${userId}`);
    
    const feedbackRaw: InsertFeedbackRawData = {
      feedbackType,
      rawData,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        timeOfDay: this.getTimeOfDay()
      }
    };
    
    // Guardar en Supabase
    const savedFeedback = await supabaseStorage.saveFeedbackRaw(userId, feedbackRaw);
    
    // Disparar consolidación asíncrona
    this.consolidateUserProfile(userId).catch(error => {
      console.error(`❌ [IntelligentFeedback] Error consolidating profile for user ${userId}:`, error);
    });
    
    return savedFeedback;
  }
  
  /**
   * Consolida el perfil del usuario basado en todo su feedback
   */
  async consolidateUserProfile(userId: number): Promise<UserFeedbackProfile> {
    console.log(`🧠 [IntelligentFeedback] Consolidating profile for user ${userId}`);
    
    try {
      // 1. Obtener todos los tipos de feedback
      const [
        workoutFeedback,
        firstDayFeedback,
        rejectedPlans,
        completedSessions
      ] = await Promise.all([
        supabaseStorage.getUserWorkoutPreferences(userId),
        supabaseStorage.getFirstDayPreferences(userId),
        supabaseStorage.getRejectedWorkoutPlans(userId),
        supabaseStorage.getRecentWorkoutSessions(userId, 20) // últimas 20 sesiones
      ]);
      
      // 2. Aplicar pesos temporales y por tipo
      const weightedData = this.applyIntelligentWeights({
        workoutFeedback,
        firstDayFeedback,
        rejectedPlans,
        completedSessions
      });
      
      // 3. Resolver conflictos y consolidar
      const consolidatedProfile = this.resolveConflictsAndConsolidate(weightedData);
      
      // 4. Calcular score de confianza
      const confidenceScore = this.calculateConfidenceScore(weightedData, consolidatedProfile);
      
      // 5. Guardar perfil consolidado
      const profileData: InsertUserFeedbackProfile = {
        consolidatedPreferences: consolidatedProfile,
        dataSources: weightedData.map(w => w.type),
        confidenceScore,
        totalFeedbackCount: weightedData.length,
        lastFeedbackDate: new Date()
      };
      
      const savedProfile = await supabaseStorage.saveUserFeedbackProfile(userId, profileData);
      
      // 6. Registrar decisión de IA
      await this.logAiDecision(userId, 'profile_consolidation', {
        profileVersion: savedProfile.version,
        confidenceScore,
        dataSourcesCount: weightedData.length
      }, {
        reason: 'Automatic profile consolidation triggered by new feedback',
        algorithm: 'weighted_temporal_consolidation',
        conflictsResolved: this.getConflictsResolved(weightedData)
      });
      
      console.log(`✅ [IntelligentFeedback] Profile consolidated for user ${userId} with confidence ${confidenceScore}`);
      return savedProfile;
      
    } catch (error) {
      console.error(`❌ [IntelligentFeedback] Error consolidating profile:`, error);
      throw error;
    }
  }
  
  /**
   * Aplica pesos inteligentes basados en temporalidad y tipo de feedback
   */
  private applyIntelligentWeights(feedbackData: any): WeightedFeedback[] {
    const weightedData: WeightedFeedback[] = [];
    const now = new Date();
    
    // Procesar workout feedback (peso alto, decae con tiempo)
    if (feedbackData.workoutFeedback?.length > 0) {
      feedbackData.workoutFeedback.forEach((feedback: any) => {
        const daysSince = this.getDaysSince(feedback.createdAt);
        const temporalWeight = Math.max(0.1, 1 - (daysSince / 56)); // 8 semanas
        const typeWeight = 0.9; // Alto peso para feedback de rutinas
        
        weightedData.push({
          data: feedback,
          weight: temporalWeight * typeWeight,
          timestamp: feedback.createdAt,
          type: 'workout_feedback'
        });
      });
    }
    
    // Procesar feedback de rechazo (peso muy alto para evitar repetir errores)
    if (feedbackData.rejectedPlans?.length > 0) {
      feedbackData.rejectedPlans.forEach((rejection: any) => {
        const daysSince = this.getDaysSince(rejection.rejectedAt);
        const temporalWeight = Math.max(0.2, 1 - (daysSince / 84)); // 12 semanas para rechazos
        const typeWeight = 0.95; // Peso muy alto para evitar repetir errores
        
        weightedData.push({
          data: rejection,
          weight: temporalWeight * typeWeight,
          timestamp: rejection.rejectedAt,
          type: 'rejection_feedback'
        });
      });
    }
    
    // Procesar first day feedback (peso menor, puede cambiar con experiencia)
    if (feedbackData.firstDayFeedback?.length > 0) {
      feedbackData.firstDayFeedback.forEach((firstDay: any) => {
        const daysSince = this.getDaysSince(firstDay.createdAt);
        const temporalWeight = Math.max(0.1, 1 - (daysSince / 28)); // 4 semanas
        const typeWeight = 0.6; // Peso menor, preferencias pueden cambiar
        
        weightedData.push({
          data: firstDay,
          weight: temporalWeight * typeWeight,
          timestamp: firstDay.createdAt,
          type: 'first_day_feedback'
        });
      });
    }
    
    // Procesar sesiones completadas (feedback implícito)
    if (feedbackData.completedSessions?.length > 0) {
      feedbackData.completedSessions.forEach((session: any) => {
        const daysSince = this.getDaysSince(session.completedAt);
        const temporalWeight = Math.max(0.1, 1 - (daysSince / 42)); // 6 semanas
        const typeWeight = 0.7; // Peso moderado para feedback implícito
        
        weightedData.push({
          data: session,
          weight: temporalWeight * typeWeight,
          timestamp: session.completedAt,
          type: 'completed_session'
        });
      });
    }
    
    return weightedData.sort((a, b) => b.weight - a.weight); // Ordenar por peso descendente
  }
  
  /**
   * Resuelve conflictos y consolida preferencias
   */
  private resolveConflictsAndConsolidate(weightedData: WeightedFeedback[]): ConsolidatedProfile {
    // Inicializar perfil consolidado
    const profile: ConsolidatedProfile = {
      energyLevel: 'medium',
      availableTime: 45,
      preferredIntensity: 'moderate',
      muscleGroupPreferences: {},
      preferredExercises: [],
      avoidedExercises: [],
      preferredTimeOfDay: 'morning',
      consistentDays: [],
      limitations: [],
      lastUpdated: new Date(),
      confidenceScore: 0,
      dataSourcesUsed: []
    };
    
    // Consolidar energyLevel con promedio ponderado
    const energyLevels = weightedData
      .filter(w => w.data.energyLevel)
      .map(w => ({ level: this.mapEnergyToNumber(w.data.energyLevel), weight: w.weight }));
    
    if (energyLevels.length > 0) {
      const weightedAverage = energyLevels.reduce((sum, e) => sum + (e.level * e.weight), 0) / 
                             energyLevels.reduce((sum, e) => sum + e.weight, 0);
      profile.energyLevel = this.mapNumberToEnergy(weightedAverage);
    }
    
    // Consolidar availableTime
    const availableTimes = weightedData
      .filter(w => w.data.availableTime)
      .map(w => ({ time: w.data.availableTime, weight: w.weight }));
    
    if (availableTimes.length > 0) {
      const weightedAverage = availableTimes.reduce((sum, t) => sum + (t.time * t.weight), 0) / 
                             availableTimes.reduce((sum, t) => sum + t.weight, 0);
      profile.availableTime = Math.round(weightedAverage);
    }
    
    // Consolidar ejercicios evitados (alta prioridad)
    const avoidedExercises = new Set<string>();
    weightedData
      .filter(w => w.data.avoidedExercises || w.data.specificDislikes?.exercises)
      .forEach(w => {
        const avoided = w.data.avoidedExercises || w.data.specificDislikes?.exercises || [];
        avoided.forEach((exercise: string) => avoidedExercises.add(exercise));
      });
    profile.avoidedExercises = Array.from(avoidedExercises);
    
    // Consolidar preferencias de grupos musculares por día
    const musclePrefs: { [day: string]: { [muscle: string]: number } } = {};
    weightedData
      .filter(w => w.data.todayMusclePreference || w.data.muscleGroupsSelected)
      .forEach(w => {
        const day = w.data.dayOfWeek || 'general';
        const muscles = w.data.todayMusclePreference || w.data.muscleGroupsSelected || [];
        
        if (!musclePrefs[day]) musclePrefs[day] = {};
        
        muscles.forEach((muscle: string) => {
          musclePrefs[day][muscle] = (musclePrefs[day][muscle] || 0) + w.weight;
        });
      });
    
    // Convertir a preferencias consolidadas
    Object.keys(musclePrefs).forEach(day => {
      const sortedMuscles = Object.entries(musclePrefs[day])
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3) // Top 3 grupos musculares por día
        .map(([muscle]) => muscle);
      
      if (sortedMuscles.length > 0) {
        profile.muscleGroupPreferences[day] = sortedMuscles;
      }
    });
    
    profile.dataSourcesUsed = [...new Set(weightedData.map(w => w.type))];
    
    return profile;
  }
  
  // Métodos auxiliares
  private getDaysSince(date: Date | string): number {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
  
  private mapEnergyToNumber(energy: string): number {
    const map: { [key: string]: number } = { 'low': 1, 'medium': 2, 'high': 3 };
    return map[energy] || 2;
  }
  
  private mapNumberToEnergy(num: number): 'low' | 'medium' | 'high' {
    if (num <= 1.5) return 'low';
    if (num <= 2.5) return 'medium';
    return 'high';
  }
  
  private calculateConfidenceScore(weightedData: WeightedFeedback[], profile: ConsolidatedProfile): number {
    // Score basado en cantidad de datos, consistencia y recencia
    const dataCount = weightedData.length;
    const totalWeight = weightedData.reduce((sum, w) => sum + w.weight, 0);
    const avgWeight = totalWeight / dataCount;
    
    // Normalizar a 0-1
    const dataScore = Math.min(dataCount / 10, 1); // Máximo con 10 feedbacks
    const weightScore = Math.min(avgWeight, 1);
    const consistencyScore = this.calculateConsistencyScore(weightedData);
    
    return Math.round(((dataScore + weightScore + consistencyScore) / 3) * 100) / 100;
  }
  
  private calculateConsistencyScore(weightedData: WeightedFeedback[]): number {
    // Medir consistencia en preferencias
    // Por simplicidad, retornar 0.7 (implementar lógica más compleja después)
    return 0.7;
  }
  
  private getConflictsResolved(weightedData: WeightedFeedback[]): any {
    // Identificar conflictos resueltos
    return {
      energyLevelConflicts: 0,
      muscleGroupConflicts: 0,
      timeConflicts: 0
    };
  }
  
  /**
   * Registra una decisión de la IA
   */
  async logAiDecision(
    userId: number,
    decisionType: string,
    decisionData: any,
    reasoning: any,
    confidenceLevel: number = 0.8
  ): Promise<AiDecision> {
    const decision: InsertAiDecision = {
      decisionType,
      decisionData,
      reasoning,
      confidenceLevel
    };
    
    return await supabaseStorage.saveAiDecision(userId, decision);
  }
  
  /**
   * Obtiene el perfil consolidado del usuario
   */
  async getUserConsolidatedProfile(userId: number): Promise<UserFeedbackProfile | null> {
    return await supabaseStorage.getUserFeedbackProfile(userId);
  }
}

// Instancia singleton
export const intelligentFeedbackService = new IntelligentFeedbackService();
