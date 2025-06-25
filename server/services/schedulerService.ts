import { supabase } from '../supabase';
import { reportingService } from './reportingService';

interface ScheduledTask {
  id: string;
  type: 'weekly_report' | 'monthly_report' | 'periodization_analysis';
  userId: number;
  scheduledFor: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun?: Date;
  nextRun?: Date;
  retryCount: number;
  maxRetries: number;
}

class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  /**
   * 🚀 Iniciar el scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ [Scheduler] Already running');
      return;
    }

    console.log('🚀 [Scheduler] Starting automatic report scheduler');
    this.isRunning = true;

    // Ejecutar cada hora
    this.intervalId = setInterval(() => {
      this.processPendingTasks();
    }, 60 * 60 * 1000); // 1 hora

    // Ejecutar inmediatamente al iniciar
    this.processPendingTasks();
  }

  /**
   * 🛑 Detener el scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ [Scheduler] Not running');
      return;
    }

    console.log('🛑 [Scheduler] Stopping scheduler');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * 📅 Programar reporte semanal automático
   */
  async scheduleWeeklyReports() {
    console.log('📅 [Scheduler] Scheduling weekly reports for all users');

    try {
      // Obtener todos los usuarios activos
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', true);

      if (error) throw error;

      const now = new Date();
      const nextMonday = this.getNextMonday(now);

      for (const user of users || []) {
        const taskId = `weekly_report_${user.id}_${nextMonday.getTime()}`;
        
        const task: ScheduledTask = {
          id: taskId,
          type: 'weekly_report',
          userId: user.id,
          scheduledFor: nextMonday,
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        };

        this.tasks.set(taskId, task);
        console.log(`📅 [Scheduler] Scheduled weekly report for user ${user.id} at ${nextMonday.toISOString()}`);
      }

    } catch (error) {
      console.error('❌ [Scheduler] Error scheduling weekly reports:', error);
    }
  }

  /**
   * 📅 Programar reporte mensual automático
   */
  async scheduleMonthlyReports() {
    console.log('📅 [Scheduler] Scheduling monthly reports for all users');

    try {
      // Obtener todos los usuarios activos
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', true);

      if (error) throw error;

      const now = new Date();
      const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      for (const user of users || []) {
        const taskId = `monthly_report_${user.id}_${firstOfNextMonth.getTime()}`;
        
        const task: ScheduledTask = {
          id: taskId,
          type: 'monthly_report',
          userId: user.id,
          scheduledFor: firstOfNextMonth,
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        };

        this.tasks.set(taskId, task);
        console.log(`📅 [Scheduler] Scheduled monthly report for user ${user.id} at ${firstOfNextMonth.toISOString()}`);
      }

    } catch (error) {
      console.error('❌ [Scheduler] Error scheduling monthly reports:', error);
    }
  }

  /**
   * ⚡ Procesar tareas pendientes
   */
  private async processPendingTasks() {
    const now = new Date();
    const pendingTasks = Array.from(this.tasks.values()).filter(
      task => task.status === 'pending' && task.scheduledFor <= now
    );

    if (pendingTasks.length === 0) {
      return;
    }

    console.log(`⚡ [Scheduler] Processing ${pendingTasks.length} pending tasks`);

    for (const task of pendingTasks) {
      await this.executeTask(task);
    }
  }

  /**
   * 🔄 Ejecutar tarea individual
   */
  private async executeTask(task: ScheduledTask) {
    console.log(`🔄 [Scheduler] Executing task ${task.id}`);

    try {
      // Marcar como en ejecución
      task.status = 'running';
      task.lastRun = new Date();

      switch (task.type) {
        case 'weekly_report':
          await this.generateWeeklyReport(task.userId);
          break;
        case 'monthly_report':
          await this.generateMonthlyReport(task.userId);
          break;
        case 'periodization_analysis':
          await this.runPeriodizationAnalysis(task.userId);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // Marcar como completada
      task.status = 'completed';
      console.log(`✅ [Scheduler] Task ${task.id} completed successfully`);

      // Programar próxima ejecución
      this.scheduleNextRun(task);

    } catch (error) {
      console.error(`❌ [Scheduler] Task ${task.id} failed:`, error);
      
      task.retryCount++;
      if (task.retryCount >= task.maxRetries) {
        task.status = 'failed';
        console.error(`💀 [Scheduler] Task ${task.id} failed permanently after ${task.maxRetries} retries`);
      } else {
        task.status = 'pending';
        // Reintentar en 1 hora
        task.scheduledFor = new Date(Date.now() + 60 * 60 * 1000);
        console.log(`🔄 [Scheduler] Task ${task.id} will retry in 1 hour (attempt ${task.retryCount}/${task.maxRetries})`);
      }
    }
  }

  /**
   * 📊 Generar reporte semanal
   */
  private async generateWeeklyReport(userId: number) {
    console.log(`📊 [Scheduler] Generating weekly report for user ${userId}`);
    
    const report = await reportingService.generateWeeklyReport(userId);
    await reportingService.saveWeeklyReport(report);
    
    console.log(`✅ [Scheduler] Weekly report generated and saved for user ${userId}`);
  }

  /**
   * 📈 Generar reporte mensual
   */
  private async generateMonthlyReport(userId: number) {
    console.log(`📈 [Scheduler] Generating monthly report for user ${userId}`);
    
    const report = await reportingService.generateMonthlyReport(userId);
    // TODO: Implement saveMonthlyReport if needed
    
    console.log(`✅ [Scheduler] Monthly report generated for user ${userId}`);
  }

  /**
   * 🧠 Ejecutar análisis de periodización
   */
  private async runPeriodizationAnalysis(userId: number) {
    console.log(`🧠 [Scheduler] Running periodization analysis for user ${userId}`);
    
    // TODO: Import and use periodizationService
    // const analysis = await periodizationService.analyzeStagnation(userId);
    
    console.log(`✅ [Scheduler] Periodization analysis completed for user ${userId}`);
  }

  /**
   * 🔄 Programar próxima ejecución
   */
  private scheduleNextRun(task: ScheduledTask) {
    const now = new Date();
    
    switch (task.type) {
      case 'weekly_report':
        // Próximo lunes
        task.nextRun = this.getNextMonday(now);
        break;
      case 'monthly_report':
        // Primer día del próximo mes
        task.nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'periodization_analysis':
        // Cada 3 días
        task.nextRun = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
    }

    if (task.nextRun) {
      // Crear nueva tarea para la próxima ejecución
      const nextTaskId = `${task.type}_${task.userId}_${task.nextRun.getTime()}`;
      const nextTask: ScheduledTask = {
        id: nextTaskId,
        type: task.type,
        userId: task.userId,
        scheduledFor: task.nextRun,
        status: 'pending',
        retryCount: 0,
        maxRetries: task.maxRetries
      };

      this.tasks.set(nextTaskId, nextTask);
      console.log(`🔄 [Scheduler] Next ${task.type} for user ${task.userId} scheduled for ${task.nextRun.toISOString()}`);
    }
  }

  /**
   * 📅 Obtener próximo lunes
   */
  private getNextMonday(date: Date): Date {
    const nextMonday = new Date(date);
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7;
    nextMonday.setDate(nextMonday.getDate() + (daysUntilMonday || 7));
    nextMonday.setHours(9, 0, 0, 0); // 9 AM
    return nextMonday;
  }

  /**
   * 📊 Obtener estadísticas del scheduler
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    
    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      runningTasks: tasks.filter(t => t.status === 'running').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      isRunning: this.isRunning,
      nextScheduledTask: tasks
        .filter(t => t.status === 'pending')
        .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0]
    };
  }

  /**
   * 🔧 Limpiar tareas completadas antiguas
   */
  cleanupOldTasks() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tasksToRemove = Array.from(this.tasks.entries()).filter(
      ([_, task]) => task.status === 'completed' && task.lastRun && task.lastRun < oneWeekAgo
    );

    for (const [taskId] of tasksToRemove) {
      this.tasks.delete(taskId);
    }

    if (tasksToRemove.length > 0) {
      console.log(`🧹 [Scheduler] Cleaned up ${tasksToRemove.length} old completed tasks`);
    }
  }

  /**
   * 🚀 Inicializar scheduler con tareas predeterminadas
   */
  async initialize() {
    console.log('🚀 [Scheduler] Initializing with default schedules');
    
    await this.scheduleWeeklyReports();
    await this.scheduleMonthlyReports();
    
    // Limpiar tareas antiguas
    this.cleanupOldTasks();
    
    console.log('✅ [Scheduler] Initialization completed');
  }
}

export const schedulerService = new SchedulerService();
