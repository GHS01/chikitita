import { Request, Response, NextFunction } from 'express';
import { frequencyChangeService } from '../services/frequencyChangeService';

/**
 * 🔄 Middleware para detectar cambios en frecuencia de entrenamiento
 * Se ejecuta antes de actualizar preferencias del usuario
 */

// Extender Request para incluir datos de cambio de frecuencia
declare global {
  namespace Express {
    interface Request {
      frequencyChangeDetection?: {
        changeDetected: boolean;
        oldFrequency: number;
        newFrequency: number;
        oldSplitType?: string;
        suggestedSplitType: string;
        activeMesocycle?: any;
        remainingWeeks?: number;
        changeId?: number;
      };
    }
  }
}

/**
 * 🔍 Middleware principal de detección de cambios
 */
export const detectFrequencyChangeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔍 [Middleware] Checking for frequency changes...');
    
    // Verificar si la petición incluye weeklyFrequency
    const { weeklyFrequency } = req.body;
    
    if (!weeklyFrequency || !req.user?.userId) {
      console.log('🔍 [Middleware] No frequency change to detect');
      return next();
    }
    
    // Detectar cambio de frecuencia
    const detection = await frequencyChangeService.detectFrequencyChange(
      req.user.userId,
      parseInt(weeklyFrequency)
    );
    
    // Agregar detección al request
    req.frequencyChangeDetection = detection;
    
    if (detection.changeDetected) {
      console.log('🚨 [Middleware] Frequency change detected:', {
        oldFrequency: detection.oldFrequency,
        newFrequency: detection.newFrequency,
        oldSplit: detection.oldSplitType,
        suggestedSplit: detection.suggestedSplitType,
        remainingWeeks: detection.remainingWeeks
      });
    }
    
    next();
    
  } catch (error) {
    console.error('❌ [Middleware] Error in frequency change detection:', error);
    // No bloquear la petición, solo loggear el error
    next();
  }
};

/**
 * 📤 Middleware para incluir detección en respuesta
 */
export const includeFrequencyChangeInResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Interceptar res.json para incluir detección de cambios
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Si hay detección de cambio, incluirla en la respuesta
      if (req.frequencyChangeDetection?.changeDetected) {
        const responseData = {
          ...data,
          frequencyChangeDetection: {
            changeDetected: req.frequencyChangeDetection.changeDetected,
            oldFrequency: req.frequencyChangeDetection.oldFrequency,
            newFrequency: req.frequencyChangeDetection.newFrequency,
            oldSplitType: req.frequencyChangeDetection.oldSplitType,
            suggestedSplitType: req.frequencyChangeDetection.suggestedSplitType,
            remainingWeeks: req.frequencyChangeDetection.remainingWeeks,
            changeId: req.frequencyChangeDetection.changeId,
            activeMesocycle: req.frequencyChangeDetection.activeMesocycle ? {
              id: req.frequencyChangeDetection.activeMesocycle.id,
              split_type: req.frequencyChangeDetection.activeMesocycle.split_type,
              duration_weeks: req.frequencyChangeDetection.activeMesocycle.duration_weeks
            } : null
          }
        };
        
        console.log('📤 [Middleware] Including frequency change detection in response');
        return originalJson.call(this, responseData);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
    
  } catch (error) {
    console.error('❌ [Middleware] Error in response middleware:', error);
    next();
  }
};

/**
 * 🔧 Middleware combinado para facilitar uso
 */
export const frequencyChangeMiddleware = [
  detectFrequencyChangeMiddleware,
  includeFrequencyChangeInResponse
];
