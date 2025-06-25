/**
 * 🕐 SISTEMA HORARIO CENTRALIZADO - FITBRO
 * 
 * Sistema principal que controla TODA la aplicación desde la raíz
 * Soluciona inconsistencias horarias entre UTC y hora local del sistema
 * 
 * @author Colin - Ingeniero de Sistemas
 * @version 1.0.0
 * @date Enero 2025
 * @location client/src/utils/ (MOVIDO PARA RESOLVER IMPORTS)
 */

// ⚙️ CONFIGURACIÓN GLOBAL DEL SISTEMA
export const TIME_CONFIG = {
  // Usar siempre hora local del sistema del usuario
  useLocalTime: true,
  
  // Formato por defecto
  defaultFormat: '12h', // '12h' | '24h'
  
  // Locale por defecto
  defaultLocale: 'es-ES',
  
  // Zona horaria (auto-detectada)
  autoDetectTimezone: true,
  
  // Debug mode
  debugMode: process.env.NODE_ENV === 'development'
} as const;

// 🕐 CLASE PRINCIPAL DEL SISTEMA HORARIO
export class TimeSystem {
  private static instance: TimeSystem;
  private timezone: string;
  private locale: string;

  private constructor() {
    // Auto-detectar timezone del navegador
    this.timezone = this.detectTimezone();
    this.locale = TIME_CONFIG.defaultLocale;
    
    if (TIME_CONFIG.debugMode) {
      console.log('🕐 [TimeSystem] Initialized');
      console.log('├── Timezone:', this.timezone);
      console.log('├── Locale:', this.locale);
      console.log('└── Config:', TIME_CONFIG);
    }
  }

  // 🎯 SINGLETON PATTERN
  public static getInstance(): TimeSystem {
    if (!TimeSystem.instance) {
      TimeSystem.instance = new TimeSystem();
    }
    return TimeSystem.instance;
  }

  // 🌍 AUTO-DETECTAR TIMEZONE
  private detectTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('🕐 [TimeSystem] Failed to detect timezone, using UTC');
      return 'UTC';
    }
  }

  // ⏰ OBTENER HORA ACTUAL (REEMPLAZA new Date())
  public now(): Date {
    return new Date();
  }

  // 📅 OBTENER FECHA ACTUAL (YYYY-MM-DD) - HORA LOCAL
  public getCurrentDate(): string {
    const now = this.now();
    // 🔧 FIX: Usar fecha local en lugar de UTC para evitar timezone conflicts
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 🕐 OBTENER HORA ACTUAL (0-23)
  public getCurrentHour(): number {
    return this.now().getHours();
  }

  // ⏱️ OBTENER MINUTOS ACTUALES (0-59)
  public getCurrentMinute(): number {
    return this.now().getMinutes();
  }

  // 🔢 OBTENER TIMESTAMP UNIX
  public getTimestamp(): number {
    return this.now().getTime();
  }

  // 🌍 OBTENER TIMEZONE
  public getTimezone(): string {
    return this.timezone;
  }

  // 🗣️ OBTENER LOCALE
  public getLocale(): string {
    return this.locale;
  }

  // ⚙️ CAMBIAR LOCALE
  public setLocale(locale: string): void {
    this.locale = locale;
    if (TIME_CONFIG.debugMode) {
      console.log('🕐 [TimeSystem] Locale changed to:', locale);
    }
  }

  // ⚙️ CAMBIAR TIMEZONE
  public setTimezone(timezone: string): void {
    this.timezone = timezone;
    if (TIME_CONFIG.debugMode) {
      console.log('🕐 [TimeSystem] Timezone changed to:', timezone);
    }
  }

  // 📋 CREAR TIMESTAMP PARA BASE DE DATOS
  public createDBTimestamp(): string {
    // SIEMPRE UTC para base de datos (como debe ser)
    // La conversión a hora local se hace en el frontend al mostrar
    const now = this.now();
    return now.toISOString();
  }

  // 🧪 MÉTODO DE DEBUG
  public debug(): void {
    const now = this.now();
    const dbTimestamp = this.createDBTimestamp();
    const timezoneOffset = now.getTimezoneOffset();

    console.log('🕐 [TimeSystem DEBUG]');
    console.log('├── Current time (ISO UTC):', now.toISOString());
    console.log('├── Current time (Local):', now.toLocaleString());
    console.log('├── DB Timestamp (Local):', dbTimestamp);
    console.log('├── Timezone offset (min):', timezoneOffset);
    console.log('├── Current hour:', this.getCurrentHour());
    console.log('├── Current minute:', this.getCurrentMinute());
    console.log('├── Current date:', this.getCurrentDate());
    console.log('├── Timezone:', this.getTimezone());
    console.log('├── Locale:', this.getLocale());
    console.log('└── Unix Timestamp:', this.getTimestamp());
  }
}

// 🚀 INSTANCIA GLOBAL EXPORTADA
export const timeSystem = TimeSystem.getInstance();

// 🎯 FUNCIONES DE CONVENIENCIA (SHORTCUTS)

/**
 * Obtener hora actual del sistema
 * Reemplaza todos los new Date() en la aplicación
 */
export const now = (): Date => timeSystem.now();

/**
 * Obtener fecha actual (YYYY-MM-DD)
 */
export const getCurrentDate = (): string => timeSystem.getCurrentDate();

/**
 * Obtener hora actual (0-23)
 */
export const getCurrentHour = (): number => timeSystem.getCurrentHour();

/**
 * Obtener minutos actuales (0-59)
 */
export const getCurrentMinute = (): number => timeSystem.getCurrentMinute();

/**
 * Obtener timestamp Unix
 */
export const getTimestamp = (): number => timeSystem.getTimestamp();

/**
 * Crear timestamp para base de datos
 */
export const createDBTimestamp = (): string => timeSystem.createDBTimestamp();

/**
 * Debug del sistema horario
 */
export const debugTime = (): void => timeSystem.debug();

// 🎯 EXPORT POR DEFECTO
export default timeSystem;

/**
 * 📋 GUÍA DE USO:
 * 
 * // ❌ ANTES (Inconsistente)
 * const time = new Date();
 * const hour = new Date().getHours();
 * 
 * // ✅ AHORA (Centralizado)
 * import { now, getCurrentHour } from '@/utils/timeSystem';
 * const time = now();
 * const hour = getCurrentHour();
 * 
 * // 🧪 DEBUG
 * import { debugTime } from '@/utils/timeSystem';
 * debugTime(); // Muestra info completa del sistema
 */
