/**
 * 💾 Workout Cache Service
 * Sistema inteligente de cache para rutinas pre-generadas
 */

import { supabase } from '../supabase';
import { supabaseStorage } from '../supabaseStorage';
import { autoWorkoutService } from './autoWorkoutService';
import { splitAssignmentService } from './splitAssignmentService';
import { getCurrentDate } from '../utils/timeSystem';

interface CacheStatus {
  userId: number;
  totalCached: number;
  nextWeekCached: number;
  oldestCached: string;
  newestCached: string;
  needsGeneration: string[];
}

export class WorkoutCacheService {

  /**
   * 🎯 Verificar estado del cache para un usuario
   */
  async getCacheStatus(userId: number): Promise<CacheStatus> {
    try {
      console.log('🔍 [WorkoutCache] Checking cache status for user:', userId);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const todayStr = today.toISOString().split('T')[0];
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      // Obtener rutinas en cache
      const { data: cachedWorkouts, error } = await supabase
        .from('pre_generated_workouts')
        .select('workout_date, is_consumed')
        .eq('user_id', userId)
        .gte('workout_date', todayStr)
        .order('workout_date');

      if (error) {
        console.error('❌ [WorkoutCache] Error checking cache status:', error);
        throw new Error(`Failed to check cache status: ${error.message}`);
      }

      const cached = cachedWorkouts || [];
      const nextWeekCached = cached.filter(w => w.workout_date <= nextWeekStr).length;

      // Obtener asignaciones para determinar qué días necesitan rutinas
      const { assignments } = await splitAssignmentService.getUserSplitAssignments(userId);
      const assignedDays = assignments.map(a => a.day_name);

      // Determinar qué días necesitan generación
      const needsGeneration: string[] = [];
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        const dayName = this.getDayName(checkDate.getDay());

        // Si este día tiene asignación pero no tiene cache
        if (assignedDays.includes(dayName)) {
          const hasCached = cached.some(w => w.workout_date === checkDateStr && !w.is_consumed);
          if (!hasCached) {
            needsGeneration.push(checkDateStr);
          }
        }
      }

      const status: CacheStatus = {
        userId,
        totalCached: cached.length,
        nextWeekCached,
        oldestCached: cached.length > 0 ? cached[0].workout_date : '',
        newestCached: cached.length > 0 ? cached[cached.length - 1].workout_date : '',
        needsGeneration
      };

      console.log('✅ [WorkoutCache] Cache status:', status);
      return status;

    } catch (error) {
      console.error('❌ [WorkoutCache] Error in getCacheStatus:', error);
      throw error;
    }
  }

  /**
   * 🚀 Generar cache para los próximos días
   */
  async generateCacheForUser(userId: number, daysAhead: number = 7): Promise<void> {
    try {
      console.log('🚀 [WorkoutCache] Generating cache for user:', userId, 'days ahead:', daysAhead);

      // Verificar estado actual del cache
      const cacheStatus = await this.getCacheStatus(userId);

      if (cacheStatus.needsGeneration.length === 0) {
        console.log('✅ [WorkoutCache] Cache is up to date, no generation needed');
        return;
      }

      console.log('🔄 [WorkoutCache] Need to generate for dates:', cacheStatus.needsGeneration);

      // Obtener asignaciones del usuario
      const { assignments } = await splitAssignmentService.getUserSplitAssignments(userId);

      if (assignments.length === 0) {
        console.log('⚠️ [WorkoutCache] No split assignments found, skipping cache generation');
        return;
      }

      // Generar rutinas para fechas faltantes
      const workoutsToGenerate = [];
      
      for (const dateStr of cacheStatus.needsGeneration) {
        const date = new Date(dateStr);
        const dayName = this.getDayName(date.getDay());
        
        // Buscar asignación para este día
        const assignment = assignments.find(a => a.day_name === dayName);
        
        if (assignment) {
          console.log('🎯 [WorkoutCache] Generating workout for:', dateStr, dayName, assignment.scientific_splits?.split_name);
          
          const workout = await autoWorkoutService.generateWorkoutForDay({
            userId,
            targetDate: dateStr,
            dayName,
            splitAssignment: assignment.scientific_splits
          });

          if (workout) {
            workoutsToGenerate.push(workout);
          }
        }
      }

      // Guardar rutinas generadas en cache
      if (workoutsToGenerate.length > 0) {
        await autoWorkoutService.savePreGeneratedWorkouts(workoutsToGenerate);
        console.log('✅ [WorkoutCache] Generated and cached', workoutsToGenerate.length, 'workouts');
      }

    } catch (error) {
      console.error('❌ [WorkoutCache] Error generating cache:', error);
      throw error;
    }
  }

  /**
   * 🔄 Regenerar cache completo para un usuario
   */
  async regenerateUserCache(userId: number): Promise<void> {
    try {
      console.log('🔄 [WorkoutCache] Regenerating complete cache for user:', userId);

      // Limpiar cache existente
      await this.clearUserCache(userId);

      // Generar nuevo cache
      await this.generateCacheForUser(userId, 14); // 2 semanas adelante

      console.log('✅ [WorkoutCache] Cache regenerated successfully');

    } catch (error) {
      console.error('❌ [WorkoutCache] Error regenerating cache:', error);
      throw error;
    }
  }

  /**
   * 🧹 Limpiar cache de un usuario
   */
  async clearUserCache(userId: number): Promise<void> {
    try {
      console.log('🧹 [WorkoutCache] Clearing cache for user:', userId);

      const { error } = await supabase
        .from('pre_generated_workouts')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [WorkoutCache] Error clearing cache:', error);
        throw new Error(`Failed to clear cache: ${error.message}`);
      }

      console.log('✅ [WorkoutCache] Cache cleared successfully');

    } catch (error) {
      console.error('❌ [WorkoutCache] Error in clearUserCache:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener rutina del cache o generar si no existe
   */
  async getOrGenerateWorkout(userId: number, workoutDate: string): Promise<any> {
    try {
      console.log('🎯 [WorkoutCache] Getting or generating workout for:', workoutDate);

      // Intentar obtener del cache primero
      let workout = await autoWorkoutService.getPreGeneratedWorkout(userId, workoutDate);

      if (workout) {
        console.log('✅ [WorkoutCache] Workout found in cache:', workout.split_name);
        return workout;
      }

      // Si no está en cache, generar on-demand
      console.log('🔄 [WorkoutCache] Workout not in cache, generating on-demand...');

      const date = new Date(workoutDate);
      const dayName = this.getDayName(date.getDay());

      // Obtener asignación para este día
      const splitAssignment = await splitAssignmentService.getSplitForDay(userId, dayName);

      if (!splitAssignment) {
        console.log('⚠️ [WorkoutCache] No split assigned for day:', dayName);
        return null;
      }

      // Generar rutina
      workout = await autoWorkoutService.generateWorkoutForDay({
        userId,
        targetDate: workoutDate,
        dayName,
        splitAssignment
      });

      if (workout) {
        // Guardar en cache para futuras consultas
        await autoWorkoutService.savePreGeneratedWorkouts([workout]);
        console.log('✅ [WorkoutCache] Workout generated and cached');
      }

      return workout;

    } catch (error) {
      console.error('❌ [WorkoutCache] Error in getOrGenerateWorkout:', error);
      throw error;
    }
  }

  /**
   * 🔄 Actualizar cache cuando cambian las asignaciones
   */
  async updateCacheOnAssignmentChange(userId: number): Promise<void> {
    try {
      console.log('🔄 [WorkoutCache] Updating cache due to assignment change for user:', userId);

      // Limpiar cache futuro (mantener rutinas ya usadas)
      const today = getCurrentDate();
      
      const { error } = await supabase
        .from('pre_generated_workouts')
        .delete()
        .eq('user_id', userId)
        .gte('workout_date', today)
        .eq('is_consumed', false);

      if (error) {
        console.error('❌ [WorkoutCache] Error updating cache:', error);
        throw new Error(`Failed to update cache: ${error.message}`);
      }

      // Regenerar cache con nuevas asignaciones
      await this.generateCacheForUser(userId, 7);

      console.log('✅ [WorkoutCache] Cache updated successfully');

    } catch (error) {
      console.error('❌ [WorkoutCache] Error in updateCacheOnAssignmentChange:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas del cache
   */
  async getCacheStats(): Promise<any> {
    try {
      console.log('📊 [WorkoutCache] Getting cache statistics...');

      const { data: stats, error } = await supabase
        .from('pre_generated_workouts')
        .select('user_id, is_consumed, workout_date')
        .gte('workout_date', getCurrentDate());

      if (error) {
        console.error('❌ [WorkoutCache] Error getting cache stats:', error);
        throw new Error(`Failed to get cache stats: ${error.message}`);
      }

      const totalCached = stats?.length || 0;
      const usedWorkouts = stats?.filter(s => s.is_consumed).length || 0;
      const uniqueUsers = new Set(stats?.map(s => s.user_id)).size;

      const cacheStats = {
        totalCached,
        usedWorkouts,
        availableWorkouts: totalCached - usedWorkouts,
        uniqueUsers,
        cacheHitRate: totalCached > 0 ? (usedWorkouts / totalCached * 100).toFixed(2) : 0
      };

      console.log('📊 [WorkoutCache] Cache stats:', cacheStats);
      return cacheStats;

    } catch (error) {
      console.error('❌ [WorkoutCache] Error in getCacheStats:', error);
      throw error;
    }
  }

  /**
   * 🗓️ Obtener nombre del día
   */
  private getDayName(dayIndex: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  }
}

export const workoutCacheService = new WorkoutCacheService();
