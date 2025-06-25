import { supabase } from '../supabase';
import { analyticsService } from './analyticsService';

interface StagnationAnalysis {
  isStagnant: boolean;
  stagnationType: 'strength' | 'satisfaction' | 'fatigue' | 'volume' | 'none';
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  indicators: string[];
  recommendations: string[];
  suggestedAction: 'continue' | 'deload' | 'change_phase' | 'rest' | 'change_exercises';
  suggestedPhase?: 'strength' | 'hypertrophy' | 'definition' | 'recovery';
}

interface PeriodizationData {
  currentPhase: string;
  weeksInPhase: number;
  progressTrend: 'improving' | 'stable' | 'declining';
  avgRpe: number;
  avgSatisfaction: number;
  avgFatigue: number;
  volumeChange: number;
  strengthProgress: number;
}

class PeriodizationService {
  /**
   * 🧠 Analizar estancamiento del usuario
   */
  async analyzeStagnation(userId: number): Promise<StagnationAnalysis> {
    console.log('🧠 [Periodization] Analyzing stagnation for user:', userId);

    try {
      // Obtener datos de los últimos 21 días (3 semanas)
      const [progressMetrics, adherenceMetrics, effectivenessMetrics] = await Promise.all([
        analyticsService.calculateProgressMetrics(userId, 21),
        analyticsService.calculateAdherenceMetrics(userId, 21),
        analyticsService.calculateEffectivenessMetrics(userId, 21)
      ]);

      // Obtener análisis previo si existe
      const { data: previousAnalysis } = await supabase
        .from('periodization_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      const currentData: PeriodizationData = {
        currentPhase: previousAnalysis?.current_phase || 'hypertrophy',
        weeksInPhase: previousAnalysis?.weeks_in_phase || 0,
        progressTrend: this.determineProgressTrend(progressMetrics),
        avgRpe: progressMetrics.rpeMetrics.averageRpe,
        avgSatisfaction: effectivenessMetrics.satisfactionTrend + 3, // Normalize to 1-5 scale
        avgFatigue: 3, // TODO: Calculate from feedback data
        volumeChange: progressMetrics.strengthProgress.volumeChange,
        strengthProgress: progressMetrics.strengthProgress.volumeChange
      };

      // Analizar diferentes tipos de estancamiento
      const stagnationAnalysis = this.detectStagnationPatterns(currentData);

      // Guardar análisis en base de datos
      await this.saveAnalysis(userId, currentData, stagnationAnalysis);

      return stagnationAnalysis;

    } catch (error) {
      console.error('❌ [Periodization] Error analyzing stagnation:', error);
      throw error;
    }
  }

  /**
   * 🔍 Detectar patrones de estancamiento
   */
  private detectStagnationPatterns(data: PeriodizationData): StagnationAnalysis {
    const indicators: string[] = [];
    const recommendations: string[] = [];
    let stagnationType: StagnationAnalysis['stagnationType'] = 'none';
    let severity: StagnationAnalysis['severity'] = 'low';
    let confidence = 0;

    // 1. Análisis de progreso de fuerza
    if (Math.abs(data.strengthProgress) < 5 && data.weeksInPhase >= 3) {
      indicators.push('Progreso de fuerza estancado (<5% en 3+ semanas)');
      stagnationType = 'strength';
      severity = data.weeksInPhase >= 6 ? 'high' : 'medium';
      confidence += 0.3;
      recommendations.push('Considera cambiar el rango de repeticiones o aumentar la intensidad');
    }

    // 2. Análisis de RPE
    if (data.avgRpe >= 8.5) {
      indicators.push('RPE promedio muy alto (≥8.5) - posible sobreentrenamiento');
      if (stagnationType === 'none') stagnationType = 'fatigue';
      severity = 'high';
      confidence += 0.25;
      recommendations.push('Reduce la intensidad o toma una semana de descarga');
    } else if (data.avgRpe <= 5) {
      indicators.push('RPE promedio muy bajo (≤5) - falta de estímulo');
      if (stagnationType === 'none') stagnationType = 'strength';
      severity = 'medium';
      confidence += 0.2;
      recommendations.push('Aumenta la intensidad o el volumen de entrenamiento');
    }

    // 3. Análisis de satisfacción
    if (data.avgSatisfaction <= 2.5) {
      indicators.push('Satisfacción baja (≤2.5) - posible aburrimiento o desmotivación');
      if (stagnationType === 'none') stagnationType = 'satisfaction';
      severity = data.avgSatisfaction <= 2 ? 'high' : 'medium';
      confidence += 0.2;
      recommendations.push('Introduce nuevos ejercicios o cambia el estilo de entrenamiento');
    }

    // 4. Análisis de volumen
    if (data.volumeChange < -10) {
      indicators.push('Volumen de entrenamiento en declive (>10% reducción)');
      if (stagnationType === 'none') stagnationType = 'volume';
      severity = 'medium';
      confidence += 0.15;
      recommendations.push('Revisa tu capacidad de recuperación y adherencia al plan');
    }

    // 5. Análisis de tiempo en fase
    if (data.weeksInPhase >= 8) {
      indicators.push(`Tiempo prolongado en fase ${data.currentPhase} (${data.weeksInPhase} semanas)`);
      severity = 'high';
      confidence += 0.1;
      recommendations.push('Es momento de cambiar de fase de entrenamiento');
    }

    // Determinar acción sugerida
    const suggestedAction = this.determineSuggestedAction(data, stagnationType, severity);
    const suggestedPhase = this.determineSuggestedPhase(data.currentPhase, stagnationType);

    // Si no hay indicadores, no hay estancamiento
    const isStagnant = indicators.length > 0 && confidence >= 0.3;

    return {
      isStagnant,
      stagnationType,
      severity,
      confidence: Math.min(confidence, 1),
      indicators,
      recommendations,
      suggestedAction,
      suggestedPhase
    };
  }

  /**
   * 🎯 Determinar acción sugerida
   */
  private determineSuggestedAction(
    data: PeriodizationData, 
    stagnationType: StagnationAnalysis['stagnationType'],
    severity: StagnationAnalysis['severity']
  ): StagnationAnalysis['suggestedAction'] {
    
    if (data.avgRpe >= 8.5 || severity === 'high') {
      return data.avgFatigue >= 4 ? 'rest' : 'deload';
    }

    if (stagnationType === 'satisfaction') {
      return 'change_exercises';
    }

    if (stagnationType === 'strength' && data.weeksInPhase >= 6) {
      return 'change_phase';
    }

    if (data.weeksInPhase >= 8) {
      return 'change_phase';
    }

    return 'continue';
  }

  /**
   * 🔄 Determinar fase sugerida
   */
  private determineSuggestedPhase(
    currentPhase: string, 
    stagnationType: StagnationAnalysis['stagnationType']
  ): StagnationAnalysis['suggestedPhase'] {
    
    if (stagnationType === 'fatigue') {
      return 'recovery';
    }

    // Ciclo normal de periodización
    switch (currentPhase) {
      case 'strength':
        return 'hypertrophy';
      case 'hypertrophy':
        return 'definition';
      case 'definition':
        return 'strength';
      case 'recovery':
        return 'hypertrophy';
      default:
        return 'hypertrophy';
    }
  }

  /**
   * 📈 Determinar tendencia de progreso
   */
  private determineProgressTrend(progressMetrics: any): 'improving' | 'stable' | 'declining' {
    const volumeChange = progressMetrics.strengthProgress.volumeChange;
    const rpeChange = progressMetrics.rpeMetrics.rpeChange || 0;

    if (volumeChange > 10 && rpeChange <= 0.5) {
      return 'improving';
    } else if (volumeChange < -5 || rpeChange > 1) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * 💾 Guardar análisis en base de datos
   */
  private async saveAnalysis(
    userId: number, 
    data: PeriodizationData, 
    analysis: StagnationAnalysis
  ): Promise<void> {
    console.log('💾 [Periodization] Saving analysis to database');

    try {
      const { error } = await supabase
        .from('periodization_analysis')
        .insert({
          user_id: userId,
          analysis_date: new Date().toISOString().split('T')[0],
          current_phase: data.currentPhase,
          weeks_in_phase: data.weeksInPhase + 1, // Increment weeks
          progress_trend: data.progressTrend,
          avg_rpe: data.avgRpe,
          avg_satisfaction: data.avgSatisfaction,
          avg_fatigue: data.avgFatigue,
          stagnation_detected: analysis.isStagnant,
          recommended_action: analysis.suggestedAction,
          recommended_phase: analysis.suggestedPhase,
          confidence_score: analysis.confidence,
          user_decision: 'pending'
        });

      if (error) throw error;
      console.log('✅ [Periodization] Analysis saved successfully');

    } catch (error) {
      console.error('❌ [Periodization] Error saving analysis:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener historial de análisis
   */
  async getAnalysisHistory(userId: number, limit: number = 10) {
    console.log('📊 [Periodization] Getting analysis history for user:', userId);

    try {
      const { data, error } = await supabase
        .from('periodization_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('analysis_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      console.log('✅ [Periodization] Analysis history retrieved:', data?.length, 'records');
      return data || [];

    } catch (error) {
      console.error('❌ [Periodization] Error getting analysis history:', error);
      throw error;
    }
  }

  /**
   * ✅ Actualizar decisión del usuario
   */
  async updateUserDecision(
    analysisId: number, 
    decision: 'accepted' | 'rejected', 
    feedback?: string
  ): Promise<void> {
    console.log('✅ [Periodization] Updating user decision:', { analysisId, decision });

    try {
      const { error } = await supabase
        .from('periodization_analysis')
        .update({
          user_decision: decision,
          user_feedback: feedback || null
        })
        .eq('id', analysisId);

      if (error) throw error;
      console.log('✅ [Periodization] User decision updated successfully');

    } catch (error) {
      console.error('❌ [Periodization] Error updating user decision:', error);
      throw error;
    }
  }

  /**
   * 🔄 Obtener recomendaciones activas
   */
  async getActiveRecommendations(userId: number) {
    console.log('🔄 [Periodization] Getting active recommendations for user:', userId);

    try {
      const { data, error } = await supabase
        .from('periodization_analysis')
        .select('*')
        .eq('user_id', userId)
        .eq('user_decision', 'pending')
        .eq('stagnation_detected', true)
        .order('analysis_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      console.log('✅ [Periodization] Active recommendations retrieved:', data?.length, 'records');
      return data?.[0] || null;

    } catch (error) {
      console.error('❌ [Periodization] Error getting active recommendations:', error);
      throw error;
    }
  }

  /**
   * 🧠 Generar sugerencias inteligentes contextuales
   */
  async generateIntelligentSuggestions(userId: number) {
    console.log('🧠 [Periodization] Generating intelligent suggestions for user:', userId);

    try {
      // Obtener historial de análisis
      const history = await this.getAnalysisHistory(userId, 10);

      // Obtener métricas actuales
      const [progressMetrics, adherenceMetrics, effectivenessMetrics] = await Promise.all([
        analyticsService.calculateProgressMetrics(userId, 21),
        analyticsService.calculateAdherenceMetrics(userId, 21),
        analyticsService.calculateEffectivenessMetrics(userId, 21)
      ]);

      const suggestions = [];

      // Análisis de patrones históricos
      if (history.length >= 3) {
        const recentDecisions = history.slice(0, 3);
        const rejectedCount = recentDecisions.filter(h => h.user_decision === 'rejected').length;

        if (rejectedCount >= 2) {
          suggestions.push({
            type: 'pattern_analysis',
            priority: 'high',
            title: 'Patrón de Rechazo Detectado',
            message: 'Has rechazado varias recomendaciones recientes. ¿Necesitas ajustar tus objetivos?',
            action: 'review_goals'
          });
        }
      }

      // Análisis de adherencia
      if (adherenceMetrics.completionRate < 70) {
        suggestions.push({
          type: 'adherence_concern',
          priority: 'high',
          title: 'Adherencia Baja Detectada',
          message: `Tu adherencia es del ${adherenceMetrics.completionRate.toFixed(1)}%. Considera rutinas más cortas o flexibles.`,
          action: 'adjust_schedule'
        });
      }

      // Análisis de satisfacción
      if (effectivenessMetrics.satisfactionTrend < -0.5) {
        suggestions.push({
          type: 'satisfaction_decline',
          priority: 'medium',
          title: 'Satisfacción en Declive',
          message: 'Tu satisfacción con los entrenamientos está bajando. Probemos nuevos ejercicios.',
          action: 'change_exercises'
        });
      }

      // Análisis de progreso estancado
      if (Math.abs(progressMetrics.strengthProgress.volumeChange) < 3) {
        suggestions.push({
          type: 'progress_stagnation',
          priority: 'medium',
          title: 'Progreso Estancado',
          message: 'Tu volumen de entrenamiento no ha cambiado significativamente. Considera aumentar la intensidad.',
          action: 'increase_intensity'
        });
      }

      // Sugerencias de optimización
      if (progressMetrics.rpeMetrics.averageRpe < 6) {
        suggestions.push({
          type: 'optimization',
          priority: 'low',
          title: 'Potencial de Crecimiento',
          message: 'Tu RPE promedio es bajo. Podrías manejar más intensidad para mejores resultados.',
          action: 'increase_intensity'
        });
      }

      // Sugerencias de recuperación
      if (progressMetrics.rpeMetrics.averageRpe > 8.5) {
        suggestions.push({
          type: 'recovery_needed',
          priority: 'high',
          title: 'Señales de Sobreentrenamiento',
          message: 'Tu RPE promedio es muy alto. Es momento de una semana de descarga.',
          action: 'deload_week'
        });
      }

      // Sugerencias de variedad
      const exerciseCount = progressMetrics.strengthProgress.exerciseCount;
      if (exerciseCount < 8) {
        suggestions.push({
          type: 'variety_suggestion',
          priority: 'low',
          title: 'Aumentar Variedad',
          message: `Solo has hecho ${exerciseCount} ejercicios diferentes. Más variedad puede mejorar tu progreso.`,
          action: 'add_exercises'
        });
      }

      // Ordenar por prioridad
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      return {
        suggestions: suggestions.slice(0, 5), // Máximo 5 sugerencias
        totalSuggestions: suggestions.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [Periodization] Error generating intelligent suggestions:', error);
      throw error;
    }
  }

  /**
   * 📈 Generar plan de transición personalizado
   */
  async generateTransitionPlan(userId: number, fromPhase: string, toPhase: string) {
    console.log('📈 [Periodization] Generating transition plan:', { userId, fromPhase, toPhase });

    try {
      // Obtener métricas actuales para personalizar el plan
      const progressMetrics = await analyticsService.calculateProgressMetrics(userId, 21);

      const transitionPlans = {
        'strength_to_hypertrophy': {
          duration: '1 semana de transición',
          changes: [
            'Reducir peso en 10-15%',
            'Aumentar repeticiones a 8-12',
            'Reducir descanso a 60-90 segundos',
            'Añadir ejercicios de aislamiento'
          ],
          focus: 'Adaptación al mayor volumen',
          warning: 'Espera mayor fatiga muscular los primeros días'
        },
        'hypertrophy_to_definition': {
          duration: '1-2 semanas de transición',
          changes: [
            'Reducir peso en 15-20%',
            'Aumentar repeticiones a 15-20',
            'Reducir descanso a 30-60 segundos',
            'Añadir cardio entre sets'
          ],
          focus: 'Adaptación cardiovascular',
          warning: 'Mayor demanda cardiovascular'
        },
        'definition_to_strength': {
          duration: '2 semanas de transición',
          changes: [
            'Aumentar peso gradualmente',
            'Reducir repeticiones a 5-8',
            'Aumentar descanso a 2-3 minutos',
            'Enfocarse en ejercicios compuestos'
          ],
          focus: 'Readaptación neuromuscular',
          warning: 'Toma tiempo readaptar el sistema nervioso'
        }
      };

      const planKey = `${fromPhase}_to_${toPhase}`;
      const plan = transitionPlans[planKey] || {
        duration: '1-2 semanas',
        changes: ['Ajustar parámetros gradualmente'],
        focus: 'Transición suave',
        warning: 'Escucha a tu cuerpo durante el cambio'
      };

      // Personalizar basado en métricas del usuario
      if (progressMetrics.rpeMetrics.averageRpe > 8) {
        plan.warning = 'Tu RPE actual es alto. Toma la transición más lentamente.';
      }

      return {
        fromPhase,
        toPhase,
        plan,
        personalizedTips: this.generatePersonalizedTips(progressMetrics),
        estimatedAdaptationTime: this.estimateAdaptationTime(fromPhase, toPhase, progressMetrics)
      };

    } catch (error) {
      console.error('❌ [Periodization] Error generating transition plan:', error);
      throw error;
    }
  }

  /**
   * 💡 Generar tips personalizados
   */
  private generatePersonalizedTips(progressMetrics: any): string[] {
    const tips = [];

    if (progressMetrics.rpeMetrics.consistencyScore < 70) {
      tips.push('Tu RPE varía mucho. Trata de mantener un esfuerzo más consistente.');
    }

    if (progressMetrics.strengthProgress.volumeChange > 20) {
      tips.push('Has progresado rápidamente. Asegúrate de que tu técnica siga siendo perfecta.');
    }

    if (Object.keys(progressMetrics.frequencyMetrics.muscleGroupFrequency).length < 4) {
      tips.push('Considera entrenar más grupos musculares para un desarrollo balanceado.');
    }

    return tips;
  }

  /**
   * ⏱️ Estimar tiempo de adaptación
   */
  private estimateAdaptationTime(fromPhase: string, toPhase: string, progressMetrics: any): string {
    let baseTime = 7; // días base

    // Ajustar basado en la transición
    if (fromPhase === 'strength' && toPhase === 'hypertrophy') baseTime = 5;
    if (fromPhase === 'hypertrophy' && toPhase === 'definition') baseTime = 10;
    if (fromPhase === 'definition' && toPhase === 'strength') baseTime = 14;

    // Ajustar basado en métricas del usuario
    if (progressMetrics.rpeMetrics.averageRpe > 8) baseTime += 3;
    if (progressMetrics.rpeMetrics.consistencyScore < 70) baseTime += 2;

    return `${baseTime} días aproximadamente`;
  }
}

export const periodizationService = new PeriodizationService();
