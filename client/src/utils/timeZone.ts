/**
 * 🌍 CONFIGURACIÓN DE ZONA HORARIA - FITBRO
 * 
 * Configuración y utilidades para manejo de zonas horarias
 * Complementa el sistema horario centralizado
 * 
 * @author Colin - Ingeniero de Sistemas
 * @version 1.0.0
 * @date Enero 2025
 * @location client/src/utils/ (MOVIDO PARA RESOLVER IMPORTS)
 */

import { timeSystem } from './timeSystem';

// 🌍 ZONAS HORARIAS SOPORTADAS
export const SUPPORTED_TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC'
] as const;

export type SupportedTimezone = typeof SUPPORTED_TIMEZONES[number];

// 🕐 CONFIGURACIÓN DE ZONA HORARIA
export interface TimezoneConfig {
  timezone: string;
  displayName: string;
  offset: string;
  locale: string;
}

// 🌍 UTILIDADES DE ZONA HORARIA
export class TimezoneUtils {
  
  /**
   * Detectar zona horaria del navegador
   */
  public static detectBrowserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('🌍 [TimezoneUtils] Failed to detect browser timezone');
      return 'UTC';
    }
  }

  /**
   * Obtener offset de zona horaria en minutos
   */
  public static getTimezoneOffset(timezone?: string): number {
    const tz = timezone || this.detectBrowserTimezone();
    const now = timeSystem.now();
    
    try {
      // Crear fecha en timezone específico
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      
      return (utcDate.getTime() - tzDate.getTime()) / (1000 * 60);
    } catch (error) {
      console.warn('🌍 [TimezoneUtils] Failed to calculate offset for:', tz);
      return 0;
    }
  }

  /**
   * Formatear offset como string (+05:30, -03:00)
   */
  public static formatOffset(offsetMinutes: number): string {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Obtener nombre de display de zona horaria
   */
  public static getTimezoneDisplayName(timezone?: string): string {
    const tz = timezone || this.detectBrowserTimezone();
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'long'
      });
      
      const parts = formatter.formatToParts(timeSystem.now());
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      
      return timeZonePart?.value || tz;
    } catch (error) {
      return tz;
    }
  }

  /**
   * Verificar si una zona horaria es válida
   */
  public static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convertir fecha a zona horaria específica
   */
  public static convertToTimezone(date: Date, timezone: string): Date {
    try {
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
      const targetTime = new Date(utcTime + (this.getTimezoneOffset(timezone) * 60000));
      return targetTime;
    } catch (error) {
      console.warn('🌍 [TimezoneUtils] Failed to convert to timezone:', timezone);
      return date;
    }
  }

  /**
   * Obtener configuración completa de zona horaria
   */
  public static getTimezoneConfig(timezone?: string): TimezoneConfig {
    const tz = timezone || this.detectBrowserTimezone();
    const offset = this.getTimezoneOffset(tz);
    
    return {
      timezone: tz,
      displayName: this.getTimezoneDisplayName(tz),
      offset: this.formatOffset(offset),
      locale: 'es-ES' // Default locale
    };
  }
}

// 🚀 FUNCIONES DE CONVENIENCIA

/**
 * Detectar zona horaria del navegador
 */
export const detectTimezone = (): string => TimezoneUtils.detectBrowserTimezone();

/**
 * Obtener offset de zona horaria
 */
export const getTimezoneOffset = (timezone?: string): number => 
  TimezoneUtils.getTimezoneOffset(timezone);

/**
 * Formatear offset como string
 */
export const formatTimezoneOffset = (offsetMinutes: number): string => 
  TimezoneUtils.formatOffset(offsetMinutes);

/**
 * Obtener nombre de display
 */
export const getTimezoneDisplayName = (timezone?: string): string => 
  TimezoneUtils.getTimezoneDisplayName(timezone);

/**
 * Verificar si zona horaria es válida
 */
export const isValidTimezone = (timezone: string): boolean => 
  TimezoneUtils.isValidTimezone(timezone);

/**
 * Obtener configuración completa
 */
export const getTimezoneConfig = (timezone?: string): TimezoneConfig => 
  TimezoneUtils.getTimezoneConfig(timezone);

// 🎯 EXPORT POR DEFECTO
export default TimezoneUtils;

/**
 * 📋 GUÍA DE USO:
 * 
 * // 🌍 Detectar zona horaria
 * import { detectTimezone } from '@/utils/timeZone';
 * const userTimezone = detectTimezone(); // "America/New_York"
 * 
 * // ⏰ Obtener offset
 * import { getTimezoneOffset } from '@/utils/timeZone';
 * const offset = getTimezoneOffset(); // -300 (minutos)
 * 
 * // 📋 Configuración completa
 * import { getTimezoneConfig } from '@/utils/timeZone';
 * const config = getTimezoneConfig(); 
 * // { timezone: "America/New_York", displayName: "Eastern Standard Time", offset: "-05:00", locale: "es-ES" }
 */
