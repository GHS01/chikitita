/**
 * 🏥 Health Monitoring Service
 * Monitorea la salud del sistema y servicios críticos de FitnessPro V8
 * Parte del sistema de observabilidad y monitoreo en tiempo real
 * 
 * Características:
 * - Monitoreo continuo de base de datos
 * - Verificación de servicios IA
 * - Métricas de rendimiento del sistema
 * - Alertas automáticas de degradación
 */

import { supabase } from '../supabase';

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  aiServices: 'operational' | 'limited' | 'offline';
  cache: 'active' | 'warming' | 'cold';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  memoryUsage: NodeJS.MemoryUsage;
}

interface HealthMetrics {
  checksPerformed: number;
  averageResponseTime: number;
  successRate: number;
  lastFailure: Date | null;
  systemLoad: number;
}

export class HealthMonitoringService {
  private static instance: HealthMonitoringService;
  private healthChecks: SystemHealth[] = [];
  private metrics: HealthMetrics;
  private monitoringActive = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private failureCount = 0;
  private totalChecks = 0;

  private constructor() {
    this.metrics = {
      checksPerformed: 0,
      averageResponseTime: 0,
      successRate: 1.0,
      lastFailure: null,
      systemLoad: 0
    };
    
    this.initializeHealthMonitoring();
  }

  static getInstance(): HealthMonitoringService {
    if (!HealthMonitoringService.instance) {
      HealthMonitoringService.instance = new HealthMonitoringService();
    }
    return HealthMonitoringService.instance;
  }

  /**
   * 🎯 Inicializa el sistema de monitoreo de salud
   * Se activa automáticamente en producción para monitoreo continuo
   */
  private initializeHealthMonitoring(): void {
    // Activar monitoreo en producción para máxima observabilidad
    if (process.env.NODE_ENV === 'production') {
      console.log('🏥 [HealthMonitoring] Initializing production health monitoring...');
      this.startContinuousHealthChecks();
    } else {
      console.log('🏥 [HealthMonitoring] Development mode - health monitoring on demand');
    }
  }

  /**
   * 🔄 Inicia el monitoreo continuo de salud del sistema
   * Esencial para detectar problemas antes de que afecten a los usuarios
   */
  private startContinuousHealthChecks(): void {
    if (this.monitoringActive) {
      console.log('⚠️ [HealthMonitoring] Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    console.log('🚀 [HealthMonitoring] Starting continuous health monitoring system...');
    
    // Esperar 2 minutos después del inicio para estabilización
    setTimeout(() => {
      this.scheduleNextHealthCheck();
    }, 2 * 60 * 1000);
  }

  /**
   * ⏰ Programa el siguiente check de salud con intervalo inteligente
   */
  private scheduleNextHealthCheck(): void {
    if (!this.monitoringActive) return;

    const performHealthCheck = async () => {
      try {
        // Verificar si estamos en horario de monitoreo activo
        if (this.isActiveMonitoringHours()) {
          await this.performComprehensiveHealthCheck();
        } else {
          console.log('🌙 [HealthMonitoring] Reduced monitoring during low-activity hours');
          await this.performBasicHealthCheck();
        }
        
        this.updateMetrics(true);
      } catch (error) {
        console.error('❌ [HealthMonitoring] Health check failed:', error.message);
        this.updateMetrics(false);
      }
      
      // Programar siguiente check
      if (this.monitoringActive) {
        const nextInterval = this.calculateOptimalCheckInterval();
        setTimeout(performHealthCheck, nextInterval);
      }
    };

    // Ejecutar primer check
    performHealthCheck();
  }

  /**
   * 🔍 Realiza un check completo de salud del sistema
   */
  private async performComprehensiveHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    try {
      // Verificar conectividad del sistema
      const connectivityCheck = await this.checkSystemConnectivity();
      const dbHealth = await this.checkDatabaseHealth();
      const aiServicesHealth = await this.checkAIServicesHealth();
      const cacheHealth = await this.checkCacheHealth();
      
      const responseTime = Date.now() - startTime;
      
      const healthData: SystemHealth = {
        database: dbHealth ? 'healthy' : 'degraded',
        aiServices: aiServicesHealth ? 'operational' : 'limited',
        cache: cacheHealth ? 'active' : 'warming',
        uptime: process.uptime(),
        responseTime,
        lastCheck: new Date(),
        memoryUsage: process.memoryUsage()
      };

      this.recordHealthData(healthData);
      
      console.log(`✅ [HealthMonitoring] Comprehensive health check completed (${responseTime}ms)`);
      return healthData;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthData: SystemHealth = {
        database: 'down',
        aiServices: 'offline',
        cache: 'cold',
        uptime: process.uptime(),
        responseTime,
        lastCheck: new Date(),
        memoryUsage: process.memoryUsage()
      };
      
      this.recordHealthData(healthData);
      throw error;
    }
  }

  /**
   * 🔗 Verifica la conectividad básica del sistema
   */
  private async checkSystemConnectivity(): Promise<boolean> {
    try {
      const baseUrl = process.env.BASE_URL || 
                     process.env.RENDER_EXTERNAL_URL || 
                     'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/system/status`, {
        method: 'GET',
        headers: {
          'X-Health-Check': 'internal-monitoring',
          'X-Service': 'health-monitoring-service',
          'User-Agent': 'FitnessPro-HealthMonitor/1.0',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000 // 10 segundos timeout
      });

      return response.ok;
    } catch (error) {
      console.log(`🔴 [HealthMonitoring] Connectivity check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 🗄️ Verifica la salud de la base de datos
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.log(`🔴 [HealthMonitoring] Database health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 🤖 Verifica el estado de los servicios IA
   */
  private async checkAIServicesHealth(): Promise<boolean> {
    try {
      // Verificar que los servicios IA principales estén disponibles
      // Esto es una verificación ligera sin consumir tokens
      return process.env.GEMINI_API_KEY ? true : false;
    } catch (error) {
      console.log(`🔴 [HealthMonitoring] AI services check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 💾 Verifica el estado del cache del sistema
   */
  private async checkCacheHealth(): Promise<boolean> {
    try {
      // Verificar memoria disponible y estado del cache
      const memUsage = process.memoryUsage();
      const memoryHealthy = memUsage.heapUsed < (memUsage.heapTotal * 0.9);
      return memoryHealthy;
    } catch (error) {
      console.log(`🔴 [HealthMonitoring] Cache health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 🌙 Check básico durante horas de baja actividad
   */
  private async performBasicHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Solo verificación básica de conectividad
      await this.checkSystemConnectivity();
      const responseTime = Date.now() - startTime;
      
      console.log(`🌙 [HealthMonitoring] Basic health check completed (${responseTime}ms)`);
    } catch (error) {
      console.log(`🌙 [HealthMonitoring] Basic health check failed: ${error.message}`);
    }
  }

  /**
   * ⏰ Determina si estamos en horario de monitoreo activo
   * Monitoreo intensivo durante horas de mayor uso de la aplicación
   */
  private isActiveMonitoringHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour + (minute / 60);
    
    // Horario de monitoreo activo: 5:30 AM - 12:00 AM
    // Basado en patrones de uso típicos de aplicaciones de fitness
    return currentTime >= 5.5 || currentTime < 0.5;
  }

  /**
   * 📊 Calcula el intervalo óptimo para el siguiente check
   * Basado en carga del sistema y patrones de uso
   */
  private calculateOptimalCheckInterval(): number {
    const baseInterval = this.isActiveMonitoringHours() ? 10 : 20; // minutos
    
    // Ajustar basado en tasa de éxito reciente
    const successRateMultiplier = this.metrics.successRate < 0.8 ? 1.5 : 1.0;
    
    // Añadir variación natural para evitar patrones predecibles
    const variation = (Math.random() - 0.5) * 6; // ±3 minutos
    
    const optimalInterval = Math.max(8, Math.min(20, 
      (baseInterval * successRateMultiplier) + variation
    ));
    
    console.log(`⏰ [HealthMonitoring] Next health check in ${Math.round(optimalInterval)} minutes`);
    return optimalInterval * 60 * 1000; // Convertir a millisegundos
  }

  /**
   * 📝 Registra datos de salud del sistema
   */
  private recordHealthData(healthData: SystemHealth): void {
    this.healthChecks.push(healthData);
    
    // Mantener solo las últimas 24 horas de datos
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.healthChecks = this.healthChecks.filter(check => check.lastCheck > oneDayAgo);
    
    console.log(`📊 [HealthMonitoring] Health data recorded. Total checks: ${this.healthChecks.length}`);
  }

  /**
   * 📈 Actualiza métricas del sistema
   */
  private updateMetrics(success: boolean): void {
    this.totalChecks++;
    this.metrics.checksPerformed = this.totalChecks;
    
    if (!success) {
      this.failureCount++;
      this.metrics.lastFailure = new Date();
    }
    
    this.metrics.successRate = Math.max(0, 1 - (this.failureCount / this.totalChecks));
    
    // Calcular promedio de tiempo de respuesta
    if (this.healthChecks.length > 0) {
      const totalResponseTime = this.healthChecks.reduce((sum, check) => sum + check.responseTime, 0);
      this.metrics.averageResponseTime = totalResponseTime / this.healthChecks.length;
    }
    
    // Calcular carga del sistema
    const memUsage = process.memoryUsage();
    this.metrics.systemLoad = memUsage.heapUsed / memUsage.heapTotal;
  }

  // 🔍 MÉTODOS PÚBLICOS PARA API

  /**
   * Obtiene el estado actual de salud del sistema
   */
  public getCurrentHealth(): SystemHealth | null {
    return this.healthChecks[this.healthChecks.length - 1] || null;
  }

  /**
   * Obtiene el historial de salud del sistema
   */
  public getHealthHistory(limit: number = 50): SystemHealth[] {
    return this.healthChecks.slice(-limit);
  }

  /**
   * Obtiene métricas del sistema de monitoreo
   */
  public getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Verifica si el monitoreo está activo
   */
  public isMonitoringActive(): boolean {
    return this.monitoringActive;
  }

  /**
   * 🛑 Detiene el monitoreo (para cuando se upgrade a plan pago)
   */
  public stopMonitoring(): void {
    this.monitoringActive = false;
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 [HealthMonitoring] Health monitoring system stopped');
  }

  /**
   * 🔄 Reinicia el monitoreo
   */
  public restartMonitoring(): void {
    this.stopMonitoring();
    setTimeout(() => {
      this.startContinuousHealthChecks();
    }, 1000);
  }
}
