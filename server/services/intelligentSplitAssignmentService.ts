import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';

/**
 * 🧠 Servicio de Asignación Inteligente de Splits
 * Implementa lógica científica automática para 5+ días con recuperación óptima
 */

export interface IntelligentAssignment {
  day: string;
  splitId: number;
  splitName: string;
  splitType: string;
  muscleGroups: string[];
  autoAssigned: boolean;
  recoveryHours: number;
  scientificReason: string;
}

export interface AssignmentResult {
  assignments: IntelligentAssignment[];
  scientificRationale: string;
  recoveryPattern: string;
  canOverride: boolean;
  warnings: string[];
}

class IntelligentSplitAssignmentService {

  /**
   * 🧠 Generar asignación inteligente basada en frecuencia
   */
  async generateIntelligentAssignment(
    userId: number,
    weeklyFrequency: number,
    availableDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  ): Promise<AssignmentResult> {
    try {
      console.log('🧠 [IntelligentAssignment] Generating for:', { userId, weeklyFrequency, availableDays });

      // Obtener splits disponibles
      const splits = await this.getAvailableSplits();
      
      // Determinar estrategia según frecuencia
      if (weeklyFrequency <= 4) {
        return this.generateManualAssignment(weeklyFrequency, splits);
      } else if (weeklyFrequency === 5) {
        return this.generatePPLx2Assignment(availableDays, splits, 5);
      } else if (weeklyFrequency === 6) {
        return this.generatePPLx2Assignment(availableDays, splits, 6);
      } else {
        return this.generateBodyPartAssignment(availableDays, splits);
      }

    } catch (error) {
      console.error('❌ [IntelligentAssignment] Error generating assignment:', error);
      throw new Error('Failed to generate intelligent assignment');
    }
  }

  /**
   * 🔄 Generar asignación PPL x2 para 5-6 días
   */
  private async generatePPLx2Assignment(
    availableDays: string[],
    splits: any[],
    frequency: number
  ): Promise<AssignmentResult> {
    
    const pushSplit = splits.find(s => s.split_name.toLowerCase().includes('push') || s.split_name.toLowerCase().includes('empuje'));
    const pullSplit = splits.find(s => s.split_name.toLowerCase().includes('pull') || s.split_name.toLowerCase().includes('tirón'));
    const legsSplit = splits.find(s => s.split_name.toLowerCase().includes('legs') || s.split_name.toLowerCase().includes('piernas'));

    if (!pushSplit || !pullSplit || !legsSplit) {
      throw new Error('PPL splits not found in database');
    }

    const pattern = frequency === 5 
      ? [pushSplit, pullSplit, legsSplit, pushSplit, pullSplit]
      : [pushSplit, pullSplit, legsSplit, pushSplit, pullSplit, legsSplit];

    const selectedDays = availableDays.slice(0, frequency);
    const assignments: IntelligentAssignment[] = [];

    selectedDays.forEach((day, index) => {
      const split = pattern[index];
      const recoveryHours = this.calculateRecoveryHours(split.split_name, pattern, index);
      
      assignments.push({
        day,
        splitId: split.id,
        splitName: split.split_name,
        splitType: split.split_type,
        muscleGroups: split.muscle_groups,
        autoAssigned: true,
        recoveryHours,
        scientificReason: `Frecuencia 2x por semana con ${recoveryHours}h de recuperación`
      });
    });

    return {
      assignments,
      scientificRationale: `PPL x2: Cada grupo muscular se entrena 2 veces por semana con recuperación óptima de ${frequency === 5 ? '72h' : '48h'} mínimo`,
      recoveryPattern: frequency === 5 ? 'Push: 72h, Pull: 72h, Legs: 72h' : 'Push: 48h, Pull: 48h, Legs: 48h',
      canOverride: true,
      warnings: frequency === 6 ? ['Recuperación de 48h es mínima - monitorear fatiga'] : []
    };
  }

  /**
   * 🏋️ Generar asignación Body Part para 7+ días
   */
  private async generateBodyPartAssignment(
    availableDays: string[],
    splits: any[]
  ): Promise<AssignmentResult> {
    
    const bodyPartSplits = splits.filter(s => s.split_type === 'body_part_split');
    
    if (bodyPartSplits.length < 4) {
      throw new Error('Insufficient body part splits in database');
    }

    const pattern = [
      bodyPartSplits.find(s => s.split_name.toLowerCase().includes('pecho')),
      bodyPartSplits.find(s => s.split_name.toLowerCase().includes('espalda')),
      bodyPartSplits.find(s => s.split_name.toLowerCase().includes('hombros')),
      bodyPartSplits.find(s => s.split_name.toLowerCase().includes('piernas')),
      bodyPartSplits.find(s => s.split_name.toLowerCase().includes('brazos')) || bodyPartSplits[0], // Fallback
    ];

    const selectedDays = availableDays.slice(0, Math.min(7, availableDays.length));
    const assignments: IntelligentAssignment[] = [];

    selectedDays.forEach((day, index) => {
      if (index < pattern.length && pattern[index]) {
        const split = pattern[index];
        assignments.push({
          day,
          splitId: split.id,
          splitName: split.split_name,
          splitType: split.split_type,
          muscleGroups: split.muscle_groups,
          autoAssigned: true,
          recoveryHours: 168, // 7 días
          scientificReason: 'Especialización máxima con recuperación completa de 7 días'
        });
      } else {
        // Días de descanso o cardio
        assignments.push({
          day,
          splitId: 0,
          splitName: 'Descanso/Cardio',
          splitType: 'rest',
          muscleGroups: [],
          autoAssigned: true,
          recoveryHours: 0,
          scientificReason: 'Recuperación activa o descanso completo'
        });
      }
    });

    return {
      assignments,
      scientificRationale: 'Body Part Split: Cada grupo muscular se entrena 1 vez por semana con recuperación completa de 7 días',
      recoveryPattern: 'Cada grupo: 168h (7 días) de recuperación',
      canOverride: true,
      warnings: ['Volumen alto - monitorear sobreentrenamiento', 'Incluir días de descanso activo']
    };
  }

  /**
   * 📝 Generar asignación manual para 1-4 días
   */
  private generateManualAssignment(frequency: number, splits: any[]): AssignmentResult {
    return {
      assignments: [],
      scientificRationale: `Para ${frequency} días se recomienda configuración manual para máxima personalización`,
      recoveryPattern: 'Manual - usuario decide',
      canOverride: true,
      warnings: frequency < 3 ? ['Frecuencia baja - considerar aumentar días'] : []
    };
  }

  /**
   * 🧮 Calcular horas de recuperación entre sesiones del mismo tipo
   */
  private calculateRecoveryHours(currentSplitName: string, pattern: any[], currentIndex: number): number {
    // Buscar la próxima ocurrencia del mismo tipo de split
    for (let i = currentIndex + 1; i < pattern.length; i++) {
      if (pattern[i] && pattern[i].split_name === currentSplitName) {
        return (i - currentIndex) * 24; // Días * 24 horas
      }
    }
    
    // Si no hay repetición en la semana, recuperación completa (7 días)
    return (7 - currentIndex) * 24;
  }

  /**
   * 📊 Obtener splits disponibles de la base de datos
   */
  private async getAvailableSplits(): Promise<any[]> {
    try {
      const { data: splits, error } = await supabase
        .from('scientific_splits')
        .select('*')
        .order('split_type', { ascending: true });

      if (error) {
        console.error('❌ [IntelligentAssignment] Error fetching splits:', error);
        throw new Error('Failed to fetch available splits');
      }

      return splits || [];

    } catch (error) {
      console.error('❌ [IntelligentAssignment] Error in getAvailableSplits:', error);
      throw error;
    }
  }

  /**
   * 💾 Aplicar asignación inteligente a la base de datos
   */
  async applyIntelligentAssignment(
    userId: number,
    assignments: IntelligentAssignment[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('💾 [IntelligentAssignment] Applying assignments for user:', userId);

      // Eliminar asignaciones anteriores
      await supabase
        .from('user_split_assignments')
        .delete()
        .eq('user_id', userId);

      // Insertar nuevas asignaciones
      const insertData = assignments
        .filter(a => a.splitId > 0) // Solo splits reales, no descansos
        .map(assignment => ({
          user_id: userId,
          day_name: assignment.day,
          split_id: assignment.splitId,
          split_type: assignment.splitType,
          weekly_frequency: assignments.length,
          is_active: true,
          auto_assigned: assignment.autoAssigned,
          recovery_hours: assignment.recoveryHours,
          scientific_reason: assignment.scientificReason
        }));

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('user_split_assignments')
          .insert(insertData);

        if (insertError) {
          console.error('❌ [IntelligentAssignment] Error inserting assignments:', insertError);
          throw new Error('Failed to insert assignments');
        }
      }

      console.log('✅ [IntelligentAssignment] Assignments applied successfully');

      return {
        success: true,
        message: `${insertData.length} asignaciones aplicadas exitosamente`
      };

    } catch (error) {
      console.error('❌ [IntelligentAssignment] Error applying assignments:', error);
      return {
        success: false,
        message: `Error aplicando asignaciones: ${error.message}`
      };
    }
  }

  /**
   * 🔍 Validar asignación manual del usuario
   */
  async validateUserAssignment(
    assignments: IntelligentAssignment[]
  ): Promise<{ isValid: boolean; warnings: string[]; suggestions: string[] }> {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Verificar recuperación entre sesiones del mismo tipo
    const splitOccurrences = new Map<string, number[]>();
    
    assignments.forEach((assignment, index) => {
      const splitType = assignment.splitType;
      if (!splitOccurrences.has(splitType)) {
        splitOccurrences.set(splitType, []);
      }
      splitOccurrences.get(splitType)!.push(index);
    });

    // Analizar recuperación
    splitOccurrences.forEach((indices, splitType) => {
      if (indices.length > 1) {
        for (let i = 0; i < indices.length - 1; i++) {
          const daysBetween = indices[i + 1] - indices[i];
          const hoursBetween = daysBetween * 24;
          
          if (hoursBetween < 48) {
            warnings.push(`${splitType}: Solo ${hoursBetween}h de recuperación (mínimo recomendado: 48h)`);
          }
        }
      }
    });

    // Sugerencias basadas en patrones
    if (assignments.length >= 5) {
      suggestions.push('Para 5+ días, considera usar asignación automática para optimizar recuperación');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }
}

export const intelligentSplitAssignmentService = new IntelligentSplitAssignmentService();
