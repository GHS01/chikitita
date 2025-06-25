/**
 * ⏰ Workout Cron Service
 * Tareas programadas para auto-generación de rutinas
 */

import cron from 'node-cron';
import { supabase } from '../supabase';
import { workoutCacheService } from './workoutCacheService';
import { autoWorkoutService } from './autoWorkoutService';
import { splitAssignmentService } from './splitAssignmentService';

export class WorkoutCronService {
  private isRunning = false;

  /**
   * 🚀 Inicializar todos los cron jobs
   */
  initializeCronJobs(): void {
    console.log('⏰ [WorkoutCron] Initializing cron jobs...');

    // 🌙 Cron job principal: Generar rutinas cada noche a las 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      await this.nightlyWorkoutGeneration();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Ajustar según tu zona horaria
    });

    // 🧹 Limpieza semanal: Domingos a las 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
      await this.weeklyCleanup();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // 📊 Reporte diario: Todos los días a las 6:00 AM
    cron.schedule('0 6 * * *', async () => {
      await this.dailyReport();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    console.log('✅ [WorkoutCron] Cron jobs initialized successfully');
  }

  /**
   * 🌙 Generación nocturna de rutinas
   */
  async nightlyWorkoutGeneration(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ [WorkoutCron] Nightly generation already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🌙 [WorkoutCron] Starting nightly workout generation...');

    try {
      // 1. Obtener todos los usuarios con asignaciones activas
      const activeUsers = await this.getActiveUsers();
      console.log(`👥 [WorkoutCron] Found ${activeUsers.length} active users`);

      let totalGenerated = 0;
      let errors = 0;

      // 2. Generar rutinas para cada usuario
      for (const userId of activeUsers) {
        try {
          console.log(`🎯 [WorkoutCron] Generating cache for user ${userId}...`);
          
          // Generar cache para los próximos 3 días
          await workoutCacheService.generateCacheForUser(userId, 3);
          
          totalGenerated++;
          console.log(`✅ [WorkoutCron] Cache generated for user ${userId}`);
          
        } catch (error) {
          console.error(`❌ [WorkoutCron] Error generating cache for user ${userId}:`, error);
          errors++;
        }
      }

      console.log(`🌙 [WorkoutCron] Nightly generation completed: ${totalGenerated} users processed, ${errors} errors`);

    } catch (error) {
      console.error('❌ [WorkoutCron] Error in nightly generation:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 🧹 Limpieza semanal
   */
  async weeklyCleanup(): Promise<void> {
    console.log('🧹 [WorkoutCron] Starting weekly cleanup...');

    try {
      // 1. Limpiar rutinas pre-generadas antiguas (más de 7 días)
      await autoWorkoutService.cleanupOldWorkouts(7);

      // 2. Limpiar rutinas diarias completadas antiguas (más de 30 días)
      await this.cleanupOldDailyPlans(30);

      // 3. Obtener estadísticas de limpieza
      const cacheStats = await workoutCacheService.getCacheStats();
      console.log('📊 [WorkoutCron] Cache stats after cleanup:', cacheStats);

      console.log('✅ [WorkoutCron] Weekly cleanup completed successfully');

    } catch (error) {
      console.error('❌ [WorkoutCron] Error in weekly cleanup:', error);
    }
  }

  /**
   * 📊 Reporte diario
   */
  async dailyReport(): Promise<void> {
    console.log('📊 [WorkoutCron] Generating daily report...');

    try {
      // 1. Estadísticas del cache
      const cacheStats = await workoutCacheService.getCacheStats();

      // 2. Usuarios activos
      const activeUsers = await this.getActiveUsers();

      // 3. Rutinas generadas hoy
      const today = new Date().toISOString().split('T')[0];
      const todayWorkouts = await this.getTodayGeneratedWorkouts(today);

      const report = {
        date: today,
        activeUsers: activeUsers.length,
        cacheStats,
        todayWorkouts: todayWorkouts.length,
        systemHealth: 'healthy' // Se puede expandir con más métricas
      };

      console.log('📊 [WorkoutCron] Daily report:', JSON.stringify(report, null, 2));

      // Aquí se podría enviar el reporte por email o guardarlo en BD
      // await this.saveReport(report);

    } catch (error) {
      console.error('❌ [WorkoutCron] Error generating daily report:', error);
    }
  }

  /**
   * 🔄 Regenerar cache para usuario específico
   */
  async regenerateUserCache(userId: number): Promise<void> {
    console.log(`🔄 [WorkoutCron] Regenerating cache for user ${userId}...`);

    try {
      await workoutCacheService.regenerateUserCache(userId);
      console.log(`✅ [WorkoutCron] Cache regenerated for user ${userId}`);
    } catch (error) {
      console.error(`❌ [WorkoutCron] Error regenerating cache for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 🎯 Generar rutinas bajo demanda para usuario
   */
  async generateOnDemand(userId: number, daysAhead: number = 7): Promise<void> {
    console.log(`🎯 [WorkoutCron] Generating on-demand cache for user ${userId}, ${daysAhead} days ahead...`);

    try {
      await workoutCacheService.generateCacheForUser(userId, daysAhead);
      console.log(`✅ [WorkoutCron] On-demand generation completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ [WorkoutCron] Error in on-demand generation for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 👥 Obtener usuarios activos (con asignaciones de splits)
   */
  private async getActiveUsers(): Promise<number[]> {
    try {
      const { data: assignments, error } = await supabase
        .from('user_split_assignments')
        .select('user_id')
        .eq('is_active', true);

      if (error) {
        console.error('❌ [WorkoutCron] Error getting active users:', error);
        throw new Error(`Failed to get active users: ${error.message}`);
      }

      // Obtener IDs únicos
      const uniqueUserIds = [...new Set(assignments?.map(a => a.user_id) || [])];
      return uniqueUserIds;

    } catch (error) {
      console.error('❌ [WorkoutCron] Error in getActiveUsers:', error);
      throw error;
    }
  }

  /**
   * 🧹 Limpiar planes diarios antiguos
   */
  private async cleanupOldDailyPlans(daysOld: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const { error } = await supabase
        .from('daily_workout_plans')
        .delete()
        .lt('workout_date', cutoffDateStr);

      if (error) {
        console.error('❌ [WorkoutCron] Error cleaning up old daily plans:', error);
        throw new Error(`Failed to cleanup old daily plans: ${error.message}`);
      }

      console.log(`✅ [WorkoutCron] Cleaned up daily plans older than ${daysOld} days`);

    } catch (error) {
      console.error('❌ [WorkoutCron] Error in cleanupOldDailyPlans:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener rutinas generadas hoy
   */
  private async getTodayGeneratedWorkouts(today: string): Promise<any[]> {
    try {
      const { data: workouts, error } = await supabase
        .from('pre_generated_workouts')
        .select('id, user_id, split_type')
        .eq('workout_date', today);

      if (error) {
        console.error('❌ [WorkoutCron] Error getting today workouts:', error);
        throw new Error(`Failed to get today workouts: ${error.message}`);
      }

      return workouts || [];

    } catch (error) {
      console.error('❌ [WorkoutCron] Error in getTodayGeneratedWorkouts:', error);
      throw error;
    }
  }

  /**
   * 🛑 Detener todos los cron jobs
   */
  stopAllJobs(): void {
    console.log('🛑 [WorkoutCron] Stopping all cron jobs...');
    cron.getTasks().forEach((task) => {
      task.stop();
    });
    console.log('✅ [WorkoutCron] All cron jobs stopped');
  }

  /**
   * 📊 Obtener estado de los cron jobs
   */
  getJobsStatus(): any {
    const tasks = cron.getTasks();
    return {
      totalJobs: tasks.size,
      isRunning: this.isRunning,
      jobs: Array.from(tasks.entries()).map(([name, task]) => ({
        name,
        running: task.running
      }))
    };
  }
}

export const workoutCronService = new WorkoutCronService();
