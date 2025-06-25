/**
 * 🗓️ Split Assignment Service
 * Maneja la asignación de splits sugeridos a días específicos del usuario
 */

import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';

interface SplitAssignment {
  day_name: string;
  split_id: number;
  split_type: string;
  weekly_frequency: number;
}

interface WeeklySchedule {
  monday?: { id: number; split_type: string };
  tuesday?: { id: number; split_type: string };
  wednesday?: { id: number; split_type: string };
  thursday?: { id: number; split_type: string };
  friday?: { id: number; split_type: string };
  saturday?: { id: number; split_type: string };
  sunday?: { id: number; split_type: string };
}

export class SplitAssignmentService {
  
  /**
   * 🎯 Guardar asignación de splits a días específicos - OPTIMIZADO
   */
  async saveSplitAssignments(userId: number, weeklySchedule: WeeklySchedule, weeklyFrequency: number): Promise<void> {
    try {
      console.log('🗓️ [SplitAssignment] Saving assignments for user:', userId);
      console.log('🗓️ [SplitAssignment] Weekly schedule:', weeklySchedule);
      console.log('🗓️ [SplitAssignment] Weekly frequency:', weeklyFrequency);

      // 🧹 ELIMINAR asignaciones anteriores (en lugar de desactivar)
      await this.deleteUserAssignments(userId);

      // 🗓️ Crear nuevas asignaciones
      const assignments: SplitAssignment[] = [];

      Object.entries(weeklySchedule).forEach(([dayName, splitData]) => {
        if (splitData) {
          assignments.push({
            day_name: dayName,
            split_id: splitData.id,
            split_type: splitData.split_type,
            weekly_frequency: weeklyFrequency
          });
        }
      });

      if (assignments.length === 0) {
        console.log('🗓️ [SplitAssignment] No assignments to save');
        return;
      }

      // 💾 Insertar nuevas asignaciones (siempre activas)
      const { data, error } = await supabase
        .from('user_split_assignments')
        .insert(
          assignments.map(assignment => ({
            user_id: userId,
            ...assignment,
            is_active: true
          }))
        );

      if (error) {
        console.error('❌ [SplitAssignment] Error saving assignments:', error);
        throw new Error(`Failed to save split assignments: ${error.message}`);
      }

      console.log('✅ [SplitAssignment] Assignments saved successfully:', assignments.length);

    } catch (error) {
      console.error('❌ [SplitAssignment] Error in saveSplitAssignments:', error);
      throw error;
    }
  }

  /**
   * 🔄 Obtener asignaciones activas del usuario
   */
  async getUserSplitAssignments(userId: number): Promise<{
    assignments: any[];
    weeklySchedule: WeeklySchedule;
  }> {
    try {
      console.log('🗓️ [SplitAssignment] Getting assignments for user:', userId);

      const { data: assignments, error } = await supabase
        .from('user_split_assignments')
        .select(`
          *,
          scientific_splits (
            id,
            split_name,
            split_type,
            muscle_groups,
            scientific_rationale
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('day_name');

      if (error) {
        console.error('❌ [SplitAssignment] Error getting assignments:', error);
        throw new Error(`Failed to get split assignments: ${error.message}`);
      }

      // 🗓️ Convertir a formato WeeklySchedule
      const weeklySchedule: WeeklySchedule = {};
      
      assignments?.forEach(assignment => {
        const dayKey = assignment.day_name as keyof WeeklySchedule;
        weeklySchedule[dayKey] = {
          id: assignment.split_id,
          split_type: assignment.split_type
        };
      });

      console.log('✅ [SplitAssignment] Retrieved assignments:', assignments?.length || 0);
      console.log('🗓️ [SplitAssignment] Weekly schedule:', weeklySchedule);

      return {
        assignments: assignments || [],
        weeklySchedule
      };

    } catch (error) {
      console.error('❌ [SplitAssignment] Error in getUserSplitAssignments:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener split asignado para un día específico
   */
  async getSplitForDay(userId: number, dayName: string): Promise<any | null> {
    try {
      console.log('🗓️ [SplitAssignment] Getting split for day:', dayName, 'user:', userId);

      const { data: assignment, error } = await supabase
        .from('user_split_assignments')
        .select(`
          *,
          scientific_splits (
            id,
            split_name,
            split_type,
            muscle_groups,
            scientific_rationale,
            recovery_time_hours,
            difficulty_level
          )
        `)
        .eq('user_id', userId)
        .eq('day_name', dayName)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ [SplitAssignment] Error getting split for day:', error);
        throw new Error(`Failed to get split for day: ${error.message}`);
      }

      if (!assignment) {
        console.log('🗓️ [SplitAssignment] No split assigned for day:', dayName);
        return null;
      }

      console.log('✅ [SplitAssignment] Split found for day:', dayName, assignment.scientific_splits?.split_name);
      return assignment.scientific_splits;

    } catch (error) {
      console.error('❌ [SplitAssignment] Error in getSplitForDay:', error);
      throw error;
    }
  }

  /**
   * 🧹 ELIMINAR asignaciones anteriores del usuario - SOLUCIÓN OPTIMIZADA
   */
  private async deleteUserAssignments(userId: number): Promise<void> {
    try {
      console.log('🗑️ [SplitAssignment] Deleting previous assignments for user:', userId);

      const { error } = await supabase
        .from('user_split_assignments')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [SplitAssignment] Error deleting previous assignments:', error);
        throw new Error(`Failed to delete previous assignments: ${error.message}`);
      }

      console.log('✅ [SplitAssignment] Previous assignments deleted successfully');

    } catch (error) {
      console.error('❌ [SplitAssignment] Error in deleteUserAssignments:', error);
      throw error;
    }
  }

  /**
   * 🚨 ELIMINADO: Función de fallback hardcodeado
   * Esta función ha sido eliminada para forzar el uso de configuración real del usuario
   */
  private throwConfigurationError(): never {
    throw new Error('CONFIGURACIÓN_INCOMPLETA: Usuario debe configurar días disponibles reales antes de usar el sistema');
  }

  /**
   * 🔄 Validar que las asignaciones respeten los días disponibles del usuario
   */
  validateAssignments(weeklySchedule: WeeklySchedule, userAvailableDays: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!userAvailableDays || userAvailableDays.length === 0) {
      this.throwConfigurationError();
    }

    const assignedDays = Object.keys(weeklySchedule);

    // Validar que solo se asignen días disponibles del usuario
    assignedDays.forEach(day => {
      if (!userAvailableDays.includes(day)) {
        errors.push(`El día ${day} no está disponible según tu configuración de días de entrenamiento`);
      }
    });

    // Validar que se asignen al menos 2 días
    if (assignedDays.length < 2) {
      errors.push('Debes asignar al menos 2 días de entrenamiento');
    }

    // Validar que no se excedan los días disponibles
    if (assignedDays.length > availableDays.length) {
      errors.push(`No puedes asignar más de ${availableDays.length} días para una frecuencia de ${weeklyFrequency} días`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const splitAssignmentService = new SplitAssignmentService();
