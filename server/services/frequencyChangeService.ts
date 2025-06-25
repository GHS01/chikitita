import { supabase } from '../supabase';
import { scientificWorkoutService } from './scientificWorkoutService';
import { supabaseStorage } from '../supabaseStorage';

// 🔧 Tipos TypeScript para el sistema de cambios de frecuencia
export interface FrequencyChangeRecord {
  id: number;
  user_id: number;
  old_frequency: number;
  new_frequency: number;
  old_split_type?: string;
  suggested_split_type: string;
  active_mesocycle_id?: number;
  remaining_weeks?: number;
  user_decision: 'keep_current' | 'create_new' | 'pending';
  decision_reason?: string;
  created_at: string;
  processed_at?: string;
  status: 'pending' | 'processed' | 'cancelled';
}

/**
 * 🔄 Servicio para detectar y manejar cambios en frecuencia de entrenamiento
 * Implementa sistema híbrido con detección automática y decisión del usuario
 */

export interface FrequencyChangeDetection {
  changeDetected: boolean;
  oldFrequency: number;
  newFrequency: number;
  oldSplitType?: string;
  suggestedSplitType: string;
  activeMesocycle?: any;
  remainingWeeks?: number;
  changeId?: number;
}

export interface FrequencyChangeDecision {
  changeId: number;
  decision: 'keep_current' | 'create_new';
  reason?: string;
}

class FrequencyChangeService {
  
  /**
   * 🔍 Detectar cambios en frecuencia de entrenamiento
   */
  async detectFrequencyChange(
    userId: number, 
    newFrequency: number
  ): Promise<FrequencyChangeDetection> {
    try {
      console.log('🔍 [FrequencyChange] Detecting frequency change for user:', userId);
      
      // 1. Obtener preferencias actuales
      const currentPreferences = await supabaseStorage.getUserPreferences(userId);
      const oldFrequency = currentPreferences?.weeklyFrequency || 3;
      
      // 2. Verificar si hay cambio real
      if (oldFrequency === newFrequency) {
        console.log('🔍 [FrequencyChange] No frequency change detected');
        return {
          changeDetected: false,
          oldFrequency,
          newFrequency,
          suggestedSplitType: this.determineSplitType(newFrequency)
        };
      }
      
      console.log('🚨 [FrequencyChange] Frequency change detected:', {
        oldFrequency,
        newFrequency
      });
      
      // 3. Obtener mesociclo activo
      const activeMesocycle = await scientificWorkoutService.getActiveMesocycle(userId);
      
      // 4. Calcular splits
      const oldSplitType = activeMesocycle?.split_type;
      const suggestedSplitType = this.determineSplitType(newFrequency);
      
      // 5. Calcular semanas restantes
      let remainingWeeks = 0;
      if (activeMesocycle) {
        const endDate = new Date(activeMesocycle.end_date);
        const today = new Date();
        const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        remainingWeeks = Math.max(0, Math.ceil(remainingDays / 7));
      }
      
      // 6. Registrar cambio en base de datos
      const changeId = await this.recordFrequencyChange({
        userId,
        oldFrequency,
        newFrequency,
        oldSplitType,
        suggestedSplitType,
        activeMesocycleId: activeMesocycle?.id,
        remainingWeeks
      });
      
      return {
        changeDetected: true,
        oldFrequency,
        newFrequency,
        oldSplitType,
        suggestedSplitType,
        activeMesocycle,
        remainingWeeks,
        changeId
      };
      
    } catch (error) {
      console.error('❌ [FrequencyChange] Error detecting frequency change:', error);
      throw new Error('Failed to detect frequency change');
    }
  }
  
  /**
   * 📝 Registrar cambio de frecuencia en base de datos
   */
  private async recordFrequencyChange(data: {
    userId: number;
    oldFrequency: number;
    newFrequency: number;
    oldSplitType?: string;
    suggestedSplitType: string;
    activeMesocycleId?: number;
    remainingWeeks?: number;
  }): Promise<number> {
    try {
      const { data: result, error } = await supabase
        .from('frequency_change_tracking')
        .insert({
          user_id: data.userId,
          old_frequency: data.oldFrequency,
          new_frequency: data.newFrequency,
          old_split_type: data.oldSplitType,
          suggested_split_type: data.suggestedSplitType,
          active_mesocycle_id: data.activeMesocycleId,
          remaining_weeks: data.remainingWeeks,
          user_decision: 'pending',
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('❌ [FrequencyChange] Error recording change:', error);
        throw new Error('Failed to record frequency change');
      }
      
      console.log('✅ [FrequencyChange] Change recorded with ID:', result.id);
      return result.id;
      
    } catch (error) {
      console.error('❌ [FrequencyChange] Error in recordFrequencyChange:', error);
      throw error;
    }
  }
  
  /**
   * ✅ Procesar decisión del usuario
   */
  async processUserDecision(decision: FrequencyChangeDecision): Promise<{
    success: boolean;
    message: string;
    newMesocycle?: any;
  }> {
    try {
      console.log('✅ [FrequencyChange] Processing user decision:', decision);
      
      // 1. Obtener registro de cambio
      const { data: changeRecord, error: fetchError } = await supabase
        .from('frequency_change_tracking')
        .select('*')
        .eq('id', decision.changeId)
        .eq('status', 'pending')
        .single();
      
      if (fetchError || !changeRecord) {
        throw new Error('Change record not found or already processed');
      }
      
      // 2. Actualizar registro con decisión
      await supabase
        .from('frequency_change_tracking')
        .update({
          user_decision: decision.decision,
          decision_reason: decision.reason,
          processed_at: new Date().toISOString(),
          status: 'processed'
        })
        .eq('id', decision.changeId);
      
      // 3. Ejecutar acción según decisión
      if (decision.decision === 'create_new') {
        // Completar mesociclo actual y crear nuevo
        if (changeRecord.active_mesocycle_id) {
          await supabase
            .from('workout_mesocycles')
            .update({ status: 'completed' })
            .eq('id', changeRecord.active_mesocycle_id);
        }
        
        // Crear nuevo mesociclo con split sugerido
        const newMesocycle = await scientificWorkoutService.createMesocycle(
          changeRecord.user_id,
          changeRecord.suggested_split_type,
          6
        );
        
        console.log('✅ [FrequencyChange] New mesocycle created:', newMesocycle.id);
        
        return {
          success: true,
          message: `Nuevo mesociclo ${changeRecord.suggested_split_type} creado exitosamente`,
          newMesocycle
        };
      } else {
        // Mantener mesociclo actual
        console.log('✅ [FrequencyChange] Keeping current mesocycle');
        
        return {
          success: true,
          message: 'Mesociclo actual mantenido hasta completar'
        };
      }
      
    } catch (error) {
      console.error('❌ [FrequencyChange] Error processing decision:', error);
      throw new Error('Failed to process user decision');
    }
  }
  
  /**
   * 🧠 Determinar tipo de split basado en frecuencia
   * ✅ ALINEADO con scientificWorkoutService.ts - LÓGICA CIENTÍFICA OPTIMIZADA
   */
  private determineSplitType(weeklyFrequency: number): string {
    if (weeklyFrequency === 1) {
      return 'full_body'; // 1 día: Full Body (máximo estímulo)
    } else if (weeklyFrequency === 2) {
      return 'upper_lower'; // 2 días: Upper/Lower (división óptima)
    } else if (weeklyFrequency === 3) {
      return 'push_pull_legs'; // 3 días: Push/Pull/Legs (estándar)
    } else if (weeklyFrequency === 4) {
      return 'body_part_split'; // 4 días: Body Part Split (especialización)
    } else if (weeklyFrequency === 5 || weeklyFrequency === 6) {
      return 'push_pull_legs'; // 5-6 días: PPL x2 (frecuencia 2x)
    } else if (weeklyFrequency >= 7) {
      return 'body_part_split'; // 7+ días: Body Part + recuperación activa
    } else {
      return 'push_pull_legs'; // Fallback
    }
  }

  /**
   * 🔄 Generar asignación automática para 5+ días
   * Implementa lógica científica de repetición con recuperación óptima
   */
  async generateAutoAssignment(
    userId: number,
    weeklyFrequency: number,
    availableDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  ): Promise<{
    autoAssignment: any;
    scientificRationale: string;
    recoveryPattern: string;
    canOverride: boolean;
  }> {
    try {
      console.log('🔄 [FrequencyChange] Generating auto assignment for:', { userId, weeklyFrequency });

      const splitType = this.determineSplitType(weeklyFrequency);

      // Solo auto-asignar para 5+ días
      if (weeklyFrequency < 5) {
        return {
          autoAssignment: null,
          scientificRationale: 'Configuración manual recomendada para menos de 5 días',
          recoveryPattern: 'Manual',
          canOverride: true
        };
      }

      let assignment: any = {};
      let rationale = '';
      let recoveryPattern = '';

      if (weeklyFrequency === 5) {
        // 5 días: Push → Pull → Legs → Push → Pull
        const pplPattern = ['push', 'pull', 'legs', 'push', 'pull'];
        const selectedDays = availableDays.slice(0, 5);

        selectedDays.forEach((day, index) => {
          assignment[day] = {
            splitType: pplPattern[index],
            autoAssigned: true,
            recoveryHours: this.calculateRecoveryHours(pplPattern[index], pplPattern, index)
          };
        });

        rationale = 'PPL x2: Cada grupo muscular se entrena 2 veces por semana con 72h de recuperación mínima';
        recoveryPattern = 'Push: 72h, Pull: 72h, Legs: 72h';

      } else if (weeklyFrequency === 6) {
        // 6 días: Push → Pull → Legs → Push → Pull → Legs
        const pplPattern = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
        const selectedDays = availableDays.slice(0, 6);

        selectedDays.forEach((day, index) => {
          assignment[day] = {
            splitType: pplPattern[index],
            autoAssigned: true,
            recoveryHours: this.calculateRecoveryHours(pplPattern[index], pplPattern, index)
          };
        });

        rationale = 'PPL x2: Frecuencia 2x por semana con 48h de recuperación entre sesiones del mismo grupo';
        recoveryPattern = 'Push: 48h, Pull: 48h, Legs: 48h';

      } else if (weeklyFrequency >= 7) {
        // 7+ días: Body Part Split con recuperación activa
        const bodyPartPattern = ['chest_triceps', 'back_biceps', 'shoulders_abs', 'legs', 'arms', 'cardio', 'rest'];
        const selectedDays = availableDays.slice(0, 7);

        selectedDays.forEach((day, index) => {
          assignment[day] = {
            splitType: bodyPartPattern[index],
            autoAssigned: true,
            recoveryHours: bodyPartPattern[index] === 'rest' ? 0 : 168 // 7 días para grupos específicos
          };
        });

        rationale = 'Body Part Split: Cada grupo muscular se entrena 1 vez por semana con recuperación completa';
        recoveryPattern = 'Cada grupo: 168h (7 días) de recuperación';
      }

      console.log('✅ [FrequencyChange] Auto assignment generated:', assignment);

      return {
        autoAssignment: assignment,
        scientificRationale: rationale,
        recoveryPattern,
        canOverride: true
      };

    } catch (error) {
      console.error('❌ [FrequencyChange] Error generating auto assignment:', error);
      throw new Error('Failed to generate auto assignment');
    }
  }

  /**
   * 🧮 Calcular horas de recuperación entre sesiones
   */
  private calculateRecoveryHours(currentSplit: string, pattern: string[], currentIndex: number): number {
    // Buscar la próxima ocurrencia del mismo split
    for (let i = currentIndex + 1; i < pattern.length; i++) {
      if (pattern[i] === currentSplit) {
        return (i - currentIndex) * 24; // Días * 24 horas
      }
    }

    // Si no hay repetición en la semana, recuperación completa
    return (7 - currentIndex) * 24;
  }
  
  /**
   * 📊 Obtener cambios pendientes del usuario
   */
  async getPendingChanges(userId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('frequency_change_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [FrequencyChange] Error fetching pending changes:', error);
        throw new Error('Failed to fetch pending changes');
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ [FrequencyChange] Error in getPendingChanges:', error);
      throw error;
    }
  }
}

export const frequencyChangeService = new FrequencyChangeService();
