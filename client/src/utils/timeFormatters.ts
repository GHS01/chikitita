/**
 * 🎨 FORMATEADORES DE TIEMPO - FITBRO
 * 
 * Sistema de formateo consistente para toda la aplicación
 * Trabaja en conjunto con timeSystem.ts
 * 
 * @author Colin - Ingeniero de Sistemas
 * @version 1.0.0
 * @date Enero 2025
 * @location client/src/utils/ (MOVIDO PARA RESOLVER IMPORTS)
 */

import { timeSystem } from './timeSystem';

// 🎯 TIPOS DE FORMATO
export type TimeFormat = '12h' | '24h';
export type DateFormat = 'short' | 'medium' | 'long' | 'full';
export type LocaleType = 'es-ES' | 'en-US' | 'en-GB';

// ⚙️ CONFIGURACIÓN DE FORMATEO
export const FORMAT_CONFIG = {
  defaultTimeFormat: '12h' as TimeFormat,
  defaultDateFormat: 'medium' as DateFormat,
  defaultLocale: 'es-ES' as LocaleType,
  
  // Formatos personalizados para la app
  chatTimestamp: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: true
  },
  
  workoutDuration: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false
  },
  
  mealPlanTime: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: true
  },
  
  progressDate: {
    weekday: 'short' as const,
    month: 'short' as const,
    day: 'numeric' as const
  }
} as const;

// 🕐 CLASE PRINCIPAL DE FORMATEO
export class TimeFormatter {
  private locale: string;

  constructor(locale: string = FORMAT_CONFIG.defaultLocale) {
    this.locale = locale;
  }

  // 🎯 FORMATEO PARA CHAT (AI Trainer, mensajes)
  public formatChatTime(date?: Date): string {
    const time = date || timeSystem.now();
    return time.toLocaleTimeString(this.locale, FORMAT_CONFIG.chatTimestamp);
  }

  // 🏋️ FORMATEO PARA WORKOUTS (duración, sesiones)
  public formatWorkoutTime(date?: Date): string {
    const time = date || timeSystem.now();
    return time.toLocaleTimeString(this.locale, FORMAT_CONFIG.workoutDuration);
  }

  // 🍽️ FORMATEO PARA MEAL PLANS
  public formatMealTime(date?: Date): string {
    const time = date || timeSystem.now();
    return time.toLocaleTimeString(this.locale, FORMAT_CONFIG.mealPlanTime);
  }

  // 📊 FORMATEO PARA PROGRESS (fechas de progreso)
  public formatProgressDate(date?: Date): string {
    const time = date || timeSystem.now();
    return time.toLocaleDateString(this.locale, FORMAT_CONFIG.progressDate);
  }

  // 📅 FORMATEO DE FECHA COMPLETA
  public formatFullDate(date?: Date, format: DateFormat = 'medium'): string {
    const time = date || timeSystem.now();
    
    const formatOptions: Record<DateFormat, Intl.DateTimeFormatOptions> = {
      short: { month: 'numeric', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' },
      full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };

    return time.toLocaleDateString(this.locale, formatOptions[format]);
  }

  // ⏱️ FORMATEO DE DURACIÓN (segundos a MM:SS)
  public formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 📈 FORMATEO PARA DASHBOARD (tiempo relativo)
  public formatRelativeTime(date: Date): string {
    const now = timeSystem.now();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return this.formatFullDate(date, 'short');
  }

  // 🎯 FORMATEO PERSONALIZADO
  public formatCustom(date?: Date, options?: Intl.DateTimeFormatOptions): string {
    const time = date || timeSystem.now();
    return time.toLocaleString(this.locale, options);
  }

  // ⚙️ CAMBIAR LOCALE
  public setLocale(locale: LocaleType): void {
    this.locale = locale;
  }
}

// 🚀 INSTANCIA GLOBAL
export const timeFormatter = new TimeFormatter();

// 🎯 FUNCIONES DE CONVENIENCIA

/**
 * Formatear tiempo para chat (19:47 PM)
 */
export const formatChatTime = (date?: Date): string => 
  timeFormatter.formatChatTime(date);

/**
 * Formatear tiempo para workouts (19:47)
 */
export const formatWorkoutTime = (date?: Date): string => 
  timeFormatter.formatWorkoutTime(date);

/**
 * Formatear tiempo para meal plans (7:47 PM)
 */
export const formatMealTime = (date?: Date): string =>
  timeFormatter.formatMealTime(date);

/**
 * Convertir timestamp UTC de DB a hora local para mostrar
 * Usado específicamente para meal plans y datos de Supabase
 */
export const convertUTCToLocal = (utcTimestamp: string): Date => {
  // Crear Date desde UTC timestamp
  const utcDate = new Date(utcTimestamp);

  // JavaScript automáticamente convierte a hora local del navegador
  return utcDate;
};

/**
 * Formatear timestamp UTC de DB como hora local
 */
export const formatDBTimestamp = (utcTimestamp: string, options?: Intl.DateTimeFormatOptions): string => {
  const localDate = convertUTCToLocal(utcTimestamp);
  const defaultOptions = {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: true
  };

  return localDate.toLocaleTimeString('es-ES', options || defaultOptions);
};

/**
 * Formatear fecha para progress (Lun, Ene 28)
 */
export const formatProgressDate = (date?: Date): string => 
  timeFormatter.formatProgressDate(date);

/**
 * Formatear fecha completa (28 de enero de 2025)
 */
export const formatFullDate = (date?: Date, format?: DateFormat): string => 
  timeFormatter.formatFullDate(date, format);

/**
 * Formatear duración en MM:SS
 */
export const formatDuration = (seconds: number): string => 
  timeFormatter.formatDuration(seconds);

/**
 * Formatear tiempo relativo (Hace 5 min)
 */
export const formatRelativeTime = (date: Date): string => 
  timeFormatter.formatRelativeTime(date);

/**
 * Formateo personalizado
 */
export const formatCustomTime = (date?: Date, options?: Intl.DateTimeFormatOptions): string => 
  timeFormatter.formatCustom(date, options);

// 🎯 EXPORT POR DEFECTO
export default timeFormatter;

/**
 * 📋 GUÍA DE USO:
 * 
 * // 💬 Para AI Trainer Chat
 * import { formatChatTime } from '@/utils/timeFormatters';
 * const chatTime = formatChatTime(); // "2:47 PM"
 * 
 * // 🏋️ Para Workouts
 * import { formatWorkoutTime } from '@/utils/timeFormatters';
 * const workoutTime = formatWorkoutTime(); // "14:47"
 * 
 * // 🍽️ Para Meal Plans
 * import { formatMealTime, formatDBTimestamp } from '@/utils/timeFormatters';
 * const mealTime = formatMealTime(); // "2:47 PM"
 * const dbTime = formatDBTimestamp("2025-05-31T08:09:46.786034+00"); // "3:09 AM" (local)
 * 
 * // 📊 Para Progress
 * import { formatProgressDate } from '@/utils/timeFormatters';
 * const progressDate = formatProgressDate(); // "Lun, Ene 28"
 * 
 * // ⏱️ Para Duración
 * import { formatDuration } from '@/utils/timeFormatters';
 * const duration = formatDuration(125); // "02:05"
 */
