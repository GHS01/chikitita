import { SupabaseStorage } from '../supabaseStorage';
import { InsertNotification } from '../../shared/schema';

export class NotificationService {
  private storage: SupabaseStorage;

  constructor() {
    this.storage = new SupabaseStorage();
  }

  // 🏋️ Workout Notifications
  async createWorkoutReminder(userId: number) {
    const notification: InsertNotification = {
      userId,
      type: 'workout',
      category: 'reminder',
      title: '¡Hora de entrenar! 💪',
      message: 'No olvides completar tu rutina de hoy para mantener tu progreso.',
      icon: '🏋️',
      actionUrl: '/workouts',
      actionLabel: 'Ver rutina',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createWorkoutCompleted(userId: number, workoutName: string) {
    const notification: InsertNotification = {
      userId,
      type: 'workout',
      category: 'achievement',
      title: '¡Entrenamiento completado! 🎉',
      message: `Has completado "${workoutName}". ¡Excelente trabajo!`,
      icon: '✅',
      actionUrl: '/progress',
      actionLabel: 'Ver progreso',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createWorkoutStreak(userId: number, streakDays: number) {
    const notification: InsertNotification = {
      userId,
      type: 'workout',
      category: 'achievement',
      title: `¡Racha de ${streakDays} días! 🔥`,
      message: `Has entrenado ${streakDays} días consecutivos. ¡Sigue así!`,
      icon: '🔥',
      actionUrl: '/profile',
      actionLabel: 'Ver estadísticas',
      priority: 'high',
    };

    return this.storage.createNotification(notification);
  }

  // 🥗 Nutrition Notifications
  async createNutritionPlanGenerated(userId: number) {
    const notification: InsertNotification = {
      userId,
      type: 'nutrition',
      category: 'update',
      title: '¡Plan alimenticio generado! 🥗',
      message: 'Tu nuevo plan de comidas está listo. Revisa tus comidas del día.',
      icon: '🍽️',
      actionUrl: '/nutrition',
      actionLabel: 'Ver plan',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createWaterGoalReached(userId: number) {
    const notification: InsertNotification = {
      userId,
      type: 'nutrition',
      category: 'achievement',
      title: '¡Meta de hidratación alcanzada! 💧',
      message: 'Has completado tu objetivo diario de agua. ¡Excelente!',
      icon: '💧',
      actionUrl: '/nutrition',
      actionLabel: 'Ver progreso',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createMealReminder(userId: number, mealType: string, mealTime: string) {
    const mealEmojis = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎'
    };

    const notification: InsertNotification = {
      userId,
      type: 'nutrition',
      category: 'reminder',
      title: `Hora de ${mealType} ${mealEmojis[mealType as keyof typeof mealEmojis] || '🍽️'}`,
      message: `Es hora de tu ${mealType} (${mealTime}). Revisa tu plan alimenticio.`,
      icon: mealEmojis[mealType as keyof typeof mealEmojis] || '🍽️',
      actionUrl: '/nutrition',
      actionLabel: 'Ver comidas',
      priority: 'normal',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Expires in 2 hours
    };

    return this.storage.createNotification(notification);
  }

  // 📊 Progress Notifications
  async createWeightGoalProgress(userId: number, progressPercentage: number, goalType: string) {
    const isGoalReached = progressPercentage >= 100;
    
    const notification: InsertNotification = {
      userId,
      type: 'progress',
      category: isGoalReached ? 'achievement' : 'update',
      title: isGoalReached
        ? '¡Meta de peso alcanzada! 🎯'
        : `Progreso: ${progressPercentage.toFixed(0)}% 📈`,
      message: isGoalReached
        ? `¡Felicidades! Has alcanzado tu objetivo de ${goalType === 'lose_weight' ? 'pérdida' : 'ganancia'} de peso.`
        : `Has completado el ${progressPercentage.toFixed(0)}% de tu objetivo de peso. ¡Sigue así!`,
      icon: isGoalReached ? '🏆' : '📊',
      actionUrl: '/profile',
      actionLabel: 'Ver progreso',
      priority: isGoalReached ? 'high' : 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createWeeklyProgressSummary(userId: number, workoutsCompleted: number, weightChange: number) {
    const notification: InsertNotification = {
      userId,
      type: 'progress',
      category: 'update',
      title: 'Resumen semanal 📅',
      message: `Esta semana: ${workoutsCompleted} entrenamientos completados, ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg de cambio.`,
      icon: '📊',
      actionUrl: '/profile',
      actionLabel: 'Ver detalles',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  // 🤖 AI Trainer Notifications
  async createTrainerMessage(userId: number, message: string) {
    const notification: InsertNotification = {
      userId,
      type: 'ai_trainer',
      category: 'update',
      title: 'Mensaje de tu entrenador 🤖',
      message: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '🤖',
      actionUrl: '/ai-trainer',
      actionLabel: 'Ver mensaje',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createTrainerConfigurationNeeded(userId: number) {
    const notification: InsertNotification = {
      userId,
      type: 'ai_trainer',
      category: 'alert',
      title: 'Configura tu entrenador IA ⚙️',
      message: 'Personaliza tu entrenador IA para obtener consejos más específicos.',
      icon: '⚙️',
      actionUrl: '/ai-trainer',
      actionLabel: 'Configurar',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  // ⚙️ System Notifications
  async createProfileIncomplete(userId: number, missingFields: string[]) {
    const notification: InsertNotification = {
      userId,
      type: 'system',
      category: 'alert',
      title: 'Completa tu perfil 👤',
      message: `Faltan datos: ${missingFields.join(', ')}. Completa tu perfil para mejores recomendaciones.`,
      icon: '⚠️',
      actionUrl: '/profile',
      actionLabel: 'Completar perfil',
      priority: 'normal',
    };

    return this.storage.createNotification(notification);
  }

  async createWelcomeNotification(userId: number, userName: string) {
    const notification: InsertNotification = {
      userId,
      type: 'system',
      category: 'update',
      title: `¡Bienvenido a Fitbro, ${userName}! 🎉`,
      message: 'Estamos emocionados de acompañarte en tu viaje fitness. ¡Comencemos!',
      icon: '🎉',
      actionUrl: '/profile',
      actionLabel: 'Configurar perfil',
      priority: 'high',
    };

    return this.storage.createNotification(notification);
  }

  // Utility methods
  async createCustomNotification(
    userId: number,
    type: string,
    category: string,
    title: string,
    message: string,
    options: Partial<InsertNotification> = {}
  ) {
    const notification: InsertNotification = {
      userId,
      type,
      category,
      title,
      message,
      priority: 'normal',
      ...options,
    };

    return this.storage.createNotification(notification);
  }

  async cleanupExpiredNotifications() {
    // This would be called by a cron job to clean up expired notifications
    // Implementation would depend on your database setup
    console.log('Cleaning up expired notifications...');
  }
}

export const notificationService = new NotificationService();
