import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';
import { scientificWorkoutService } from './scientificWorkoutService';

/**
 * 🔄 Servicio de Migración Automática de Mesociclos
 * Detecta y corrige mesociclos incompatibles con la nueva lógica científica
 */

export interface MesocycleMigration {
  mesocycleId: number;
  userId: number;
  currentSplitType: string;
  correctSplitType: string;
  weeklyFrequency: number;
  needsMigration: boolean;
  migrationReason: string;
}

class MesocycleMigrationService {
  
  /**
   * 🔍 Detectar mesociclos que necesitan migración
   */
  async detectIncompatibleMesocycles(userId?: number): Promise<MesocycleMigration[]> {
    try {
      console.log('🔍 [Migration] Detecting incompatible mesocycles...');
      
      // Obtener mesociclos activos
      let query = supabase
        .from('workout_mesocycles')
        .select('*')
        .eq('status', 'active');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data: mesocycles, error } = await query;
      
      if (error) {
        console.error('❌ [Migration] Error fetching mesocycles:', error);
        throw new Error('Failed to fetch mesocycles');
      }
      
      const migrations: MesocycleMigration[] = [];
      
      for (const mesocycle of mesocycles || []) {
        // Obtener preferencias del usuario
        const preferences = await supabaseStorage.getUserPreferences(mesocycle.user_id);
        const weeklyFrequency = preferences?.weeklyFrequency || 3;
        
        // Determinar split correcto según nueva lógica científica
        const correctSplitType = this.determineCorrectSplitType(weeklyFrequency);
        
        // Verificar si necesita migración
        const needsMigration = mesocycle.split_type !== correctSplitType;
        
        if (needsMigration) {
          migrations.push({
            mesocycleId: mesocycle.id,
            userId: mesocycle.user_id,
            currentSplitType: mesocycle.split_type,
            correctSplitType,
            weeklyFrequency,
            needsMigration: true,
            migrationReason: `Frecuencia ${weeklyFrequency} días requiere ${correctSplitType}, pero tiene ${mesocycle.split_type}`
          });
        }
      }
      
      console.log(`🔍 [Migration] Found ${migrations.length} mesocycles needing migration`);
      return migrations;
      
    } catch (error) {
      console.error('❌ [Migration] Error detecting incompatible mesocycles:', error);
      throw error;
    }
  }
  
  /**
   * 🔄 Migrar mesociclo específico
   */
  async migrateMesocycle(migration: MesocycleMigration): Promise<{
    success: boolean;
    message: string;
    updatedMesocycle?: any;
  }> {
    try {
      console.log('🔄 [Migration] Migrating mesocycle:', migration.mesocycleId);
      
      // 1. Actualizar split_type del mesociclo
      const { data: updatedMesocycle, error: updateError } = await supabase
        .from('workout_mesocycles')
        .update({
          split_type: migration.correctSplitType,
          mesocycle_name: `Mesociclo ${migration.correctSplitType} - ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', migration.mesocycleId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ [Migration] Error updating mesocycle:', updateError);
        throw new Error('Failed to update mesocycle');
      }
      
      // 2. Regenerar horarios con nueva lógica
      await this.regenerateMesocycleSchedule(migration.mesocycleId, migration.correctSplitType, migration.weeklyFrequency);
      
      // 3. Limpiar cache de rutinas obsoletas
      await this.cleanObsoleteWorkoutCache(migration.userId);
      
      console.log('✅ [Migration] Mesocycle migrated successfully:', migration.mesocycleId);
      
      return {
        success: true,
        message: `Mesociclo migrado de ${migration.currentSplitType} a ${migration.correctSplitType}`,
        updatedMesocycle
      };
      
    } catch (error) {
      console.error('❌ [Migration] Error migrating mesocycle:', error);
      return {
        success: false,
        message: `Error migrando mesociclo: ${error.message}`
      };
    }
  }
  
  /**
   * 🔄 Migrar todos los mesociclos incompatibles
   */
  async migrateAllIncompatible(userId?: number): Promise<{
    totalDetected: number;
    totalMigrated: number;
    failures: number;
    results: any[];
  }> {
    try {
      console.log('🔄 [Migration] Starting bulk migration...');
      
      // Detectar mesociclos incompatibles
      const migrations = await this.detectIncompatibleMesocycles(userId);
      
      if (migrations.length === 0) {
        console.log('✅ [Migration] No mesocycles need migration');
        return {
          totalDetected: 0,
          totalMigrated: 0,
          failures: 0,
          results: []
        };
      }
      
      // Migrar cada mesociclo
      const results = [];
      let migrated = 0;
      let failures = 0;
      
      for (const migration of migrations) {
        const result = await this.migrateMesocycle(migration);
        results.push({
          mesocycleId: migration.mesocycleId,
          userId: migration.userId,
          ...result
        });
        
        if (result.success) {
          migrated++;
        } else {
          failures++;
        }
      }
      
      console.log(`✅ [Migration] Bulk migration completed: ${migrated}/${migrations.length} successful`);
      
      return {
        totalDetected: migrations.length,
        totalMigrated: migrated,
        failures,
        results
      };
      
    } catch (error) {
      console.error('❌ [Migration] Error in bulk migration:', error);
      throw error;
    }
  }
  
  /**
   * 🧠 Determinar split correcto según lógica científica
   */
  private determineCorrectSplitType(weeklyFrequency: number): string {
    if (weeklyFrequency === 1) {
      return 'full_body';
    } else if (weeklyFrequency === 2) {
      return 'upper_lower';
    } else if (weeklyFrequency === 3) {
      return 'push_pull_legs';
    } else if (weeklyFrequency === 4) {
      return 'body_part_split';
    } else if (weeklyFrequency === 5 || weeklyFrequency === 6) {
      return 'push_pull_legs';
    } else if (weeklyFrequency >= 7) {
      return 'body_part_split';
    } else {
      return 'push_pull_legs';
    }
  }
  
  /**
   * 🔄 Regenerar horarios del mesociclo
   */
  private async regenerateMesocycleSchedule(mesocycleId: number, splitType: string, weeklyFrequency: number): Promise<void> {
    try {
      console.log('🔄 [Migration] Regenerating schedule for mesocycle:', mesocycleId);
      
      // Obtener splits del nuevo tipo
      const { data: splits, error: splitsError } = await supabase
        .from('scientific_splits')
        .select('*')
        .eq('split_type', splitType);
      
      if (splitsError || !splits || splits.length === 0) {
        console.error('❌ [Migration] No splits found for type:', splitType);
        return;
      }
      
      // Generar nuevo horario usando scientificWorkoutService
      const schedule = await scientificWorkoutService.generateWeeklySchedule(splits, weeklyFrequency);
      
      // Actualizar mesociclo con nuevo horario
      await supabase
        .from('workout_mesocycles')
        .update({
          weekly_schedule: schedule
        })
        .eq('id', mesocycleId);
      
      console.log('✅ [Migration] Schedule regenerated successfully');
      
    } catch (error) {
      console.error('❌ [Migration] Error regenerating schedule:', error);
      throw error;
    }
  }
  
  /**
   * 🧹 Limpiar cache de rutinas obsoletas
   */
  private async cleanObsoleteWorkoutCache(userId: number): Promise<void> {
    try {
      console.log('🧹 [Migration] Cleaning obsolete workout cache for user:', userId);
      
      // Eliminar rutinas pre-generadas obsoletas
      await supabase
        .from('pre_generated_workouts')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', new Date().toISOString());
      
      console.log('✅ [Migration] Cache cleaned successfully');
      
    } catch (error) {
      console.error('❌ [Migration] Error cleaning cache:', error);
      // No lanzar error, es operación de limpieza
    }
  }
  
  /**
   * 📊 Obtener estadísticas de migración
   */
  async getMigrationStats(userId?: number): Promise<{
    totalMesocycles: number;
    compatibleMesocycles: number;
    incompatibleMesocycles: number;
    migrationNeeded: boolean;
  }> {
    try {
      const migrations = await this.detectIncompatibleMesocycles(userId);
      
      let totalQuery = supabase
        .from('workout_mesocycles')
        .select('id', { count: 'exact' })
        .eq('status', 'active');
      
      if (userId) {
        totalQuery = totalQuery.eq('user_id', userId);
      }
      
      const { count: totalMesocycles } = await totalQuery;
      
      return {
        totalMesocycles: totalMesocycles || 0,
        compatibleMesocycles: (totalMesocycles || 0) - migrations.length,
        incompatibleMesocycles: migrations.length,
        migrationNeeded: migrations.length > 0
      };
      
    } catch (error) {
      console.error('❌ [Migration] Error getting stats:', error);
      throw error;
    }
  }
}

export const mesocycleMigrationService = new MesocycleMigrationService();
