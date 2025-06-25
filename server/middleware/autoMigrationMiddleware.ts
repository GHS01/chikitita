import { Request, Response, NextFunction } from 'express';

/**
 * 🔄 Middleware de Migración Automática
 * Detecta y corrige mesociclos incompatibles automáticamente
 */

// Cache para evitar múltiples migraciones simultáneas
const migrationCache = new Map<number, { inProgress: boolean, lastCheck: number }>();
const MIGRATION_COOLDOWN = 5 * 60 * 1000; // 5 minutos

/**
 * 🔄 Middleware principal de migración automática
 */
export const autoMigrationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return next();
    }
    
    // Verificar cooldown
    const cacheEntry = migrationCache.get(userId);
    const now = Date.now();
    
    if (cacheEntry && (cacheEntry.inProgress || (now - cacheEntry.lastCheck) < MIGRATION_COOLDOWN)) {
      console.log('🔄 [AutoMigration] Skipping migration check (cooldown or in progress)');
      return next();
    }
    
    // Marcar como en progreso
    migrationCache.set(userId, { inProgress: true, lastCheck: now });
    
    console.log('🔄 [AutoMigration] Checking for migration needs for user:', userId);
    
    // Importar servicio dinámicamente para evitar dependencias circulares
    const { mesocycleMigrationService } = await import('../services/mesocycleMigrationService');
    
    // Verificar si necesita migración
    const stats = await mesocycleMigrationService.getMigrationStats(userId);
    
    if (stats.migrationNeeded) {
      console.log('🚨 [AutoMigration] Migration needed:', stats);
      
      // Ejecutar migración automática
      const result = await mesocycleMigrationService.migrateAllIncompatible(userId);
      
      console.log('✅ [AutoMigration] Auto-migration completed:', {
        userId,
        migrated: result.totalMigrated,
        total: result.totalDetected
      });
      
      // Agregar información de migración al request
      req.autoMigrationResult = {
        executed: true,
        ...result
      };
    } else {
      console.log('✅ [AutoMigration] No migration needed for user:', userId);
      req.autoMigrationResult = {
        executed: false,
        message: 'No migration needed'
      };
    }
    
    // Actualizar cache
    migrationCache.set(userId, { inProgress: false, lastCheck: now });
    
    next();
    
  } catch (error) {
    console.error('❌ [AutoMigration] Error in auto-migration middleware:', error);
    
    // Limpiar cache en caso de error
    if (req.user?.userId) {
      migrationCache.set(req.user.userId, { inProgress: false, lastCheck: Date.now() });
    }
    
    // No bloquear la petición, solo loggear el error
    next();
  }
};

/**
 * 🔄 Middleware para incluir resultado de migración en respuesta
 */
export const includeMigrationResultMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Interceptar res.json para incluir información de migración
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Si hay resultado de migración, incluirlo en la respuesta
      if (req.autoMigrationResult) {
        const responseData = {
          ...data,
          autoMigration: req.autoMigrationResult
        };
        
        console.log('📤 [AutoMigration] Including migration result in response');
        return originalJson.call(this, responseData);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
    
  } catch (error) {
    console.error('❌ [AutoMigration] Error in response middleware:', error);
    next();
  }
};

/**
 * 🔧 Middleware combinado para facilitar uso
 */
export const autoMigrationMiddlewareStack = [
  autoMigrationMiddleware,
  includeMigrationResultMiddleware
];

/**
 * 🔄 Middleware específico para endpoints de mesociclos
 */
export const mesocycleAutoMigrationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔄 [MesocycleMigration] Checking mesocycle compatibility...');
    
    const userId = req.user?.userId;
    if (!userId) {
      return next();
    }
    
    // Importar servicio
    const { mesocycleMigrationService } = await import('../services/mesocycleMigrationService');
    
    // Detectar incompatibilidades
    const migrations = await mesocycleMigrationService.detectIncompatibleMesocycles(userId);
    
    if (migrations.length > 0) {
      console.log('🚨 [MesocycleMigration] Found incompatible mesocycles, auto-migrating...');
      
      // Ejecutar migración automática
      const result = await mesocycleMigrationService.migrateAllIncompatible(userId);
      
      console.log('✅ [MesocycleMigration] Auto-migration completed:', result);
      
      // Agregar al request para logging
      req.mesocycleMigrationResult = result;
    }
    
    next();
    
  } catch (error) {
    console.error('❌ [MesocycleMigration] Error in mesocycle migration middleware:', error);
    // No bloquear la petición
    next();
  }
};

// Extender Request interface
declare global {
  namespace Express {
    interface Request {
      autoMigrationResult?: {
        executed: boolean;
        totalDetected?: number;
        totalMigrated?: number;
        failures?: number;
        results?: any[];
        message?: string;
      };
      mesocycleMigrationResult?: {
        totalDetected: number;
        totalMigrated: number;
        failures: number;
        results: any[];
      };
    }
  }
}
