import express from 'express';
import { weightSuggestionService } from '../services/weightSuggestionService';
import { supabaseStorage } from '../supabaseStorage';
import { aiLearningService } from '../services/aiLearningService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 🏋️‍♂️ GET /api/weight-suggestions/:exerciseName
 * Obtiene sugerencia de peso para un ejercicio específico
 */
router.get('/:exerciseName', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const exerciseName = decodeURIComponent(req.params.exerciseName);

    console.log(`🤖 [API] Getting weight suggestion for user ${userId}, exercise: ${exerciseName}`);

    const suggestion = await weightSuggestionService.getWeightSuggestion(userId, exerciseName);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'No weight suggestion found for this exercise'
      });
    }

    res.json({
      success: true,
      suggestion: {
        suggestedWeight: suggestion.suggestedWeight,
        confidenceScore: suggestion.confidenceScore,
        lastUsedWeight: suggestion.lastUsedWeight,
        progressionTrend: suggestion.progressionTrend,
        basedOnSessions: suggestion.basedOnSessions,
        targetRpeRange: suggestion.targetRpeRange,
        muscleGroup: suggestion.muscleGroup,
        exerciseType: suggestion.exerciseType
      }
    });

  } catch (error) {
    console.error('❌ [API] Error getting weight suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting weight suggestion'
    });
  }
});

/**
 * 🏋️‍♂️ POST /api/weight-suggestions/record-usage
 * Registra el peso usado por el usuario para aprendizaje de IA
 */
router.post('/record-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      exerciseName,
      suggestedWeight,
      actualWeight,
      weightFeedback,
      rpeAchieved,
      repsCompleted,
      setsCompleted,
      sessionId
    } = req.body;

    // Validaciones básicas
    if (!exerciseName || actualWeight === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Exercise name and actual weight are required'
      });
    }

    if (actualWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Actual weight must be greater than 0'
      });
    }

    console.log(`📊 [API] Recording weight usage for user ${userId}:`, {
      exerciseName,
      suggestedWeight,
      actualWeight,
      weightFeedback
    });

    // Registrar uso de peso
    const weightHistory = await weightSuggestionService.recordWeightUsed(userId, {
      exerciseName,
      suggestedWeight: suggestedWeight || 0,
      actualWeight,
      weightFeedback,
      rpeAchieved,
      repsCompleted,
      setsCompleted,
      sessionId
    });

    res.json({
      success: true,
      weightHistory: {
        id: weightHistory.id,
        exerciseName: weightHistory.exerciseName,
        actualWeight: weightHistory.actualWeight,
        progressionPercentage: weightHistory.progressionPercentage,
        userOverride: weightHistory.userOverride
      },
      message: 'Weight usage recorded successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error recording weight usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording weight usage'
    });
  }
});

/**
 * 🏋️‍♂️ GET /api/weight-suggestions/history/:exerciseName
 * Obtiene historial de peso para un ejercicio específico
 */
router.get('/history/:exerciseName', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const exerciseName = decodeURIComponent(req.params.exerciseName);
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`📊 [API] Getting weight history for user ${userId}, exercise: ${exerciseName}`);

    const history = await supabaseStorage.getExerciseWeightHistory(userId, exerciseName, limit);

    res.json({
      success: true,
      history: history.map(entry => ({
        id: entry.id,
        workoutDate: entry.workoutDate,
        suggestedWeight: entry.suggestedWeight,
        actualWeight: entry.actualWeight,
        weightFeedback: entry.weightFeedback,
        rpeAchieved: entry.rpeAchieved,
        progressionPercentage: entry.progressionPercentage,
        userOverride: entry.userOverride
      })),
      total: history.length
    });

  } catch (error) {
    console.error('❌ [API] Error getting weight history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting weight history'
    });
  }
});

/**
 * 🎯 POST /api/weight-suggestions/set-feedback
 * Registra feedback detallado por set
 */
router.post('/set-feedback', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      exerciseLogId,
      setNumber,
      setRpe,
      weightFeeling,
      completedAsPlanned,
      actualReps,
      targetReps,
      restTimeSeconds,
      notes
    } = req.body;

    // Validaciones básicas
    if (!exerciseLogId || !setNumber) {
      return res.status(400).json({
        success: false,
        message: 'Exercise log ID and set number are required'
      });
    }

    console.log(`🎯 [API] Recording set feedback for user ${userId}:`, {
      exerciseLogId,
      setNumber,
      setRpe,
      weightFeeling
    });

    // Guardar feedback del set
    const setFeedback = await supabaseStorage.saveExerciseSetFeedback(userId, {
      exerciseLogId,
      setNumber,
      setRpe,
      weightFeeling,
      completedAsPlanned,
      actualReps,
      targetReps,
      restTimeSeconds,
      notes
    });

    res.json({
      success: true,
      setFeedback: {
        id: setFeedback.id,
        setNumber: setFeedback.setNumber,
        setRpe: setFeedback.setRpe,
        weightFeeling: setFeedback.weightFeeling,
        completedAsPlanned: setFeedback.completedAsPlanned,
        restTimeSeconds: setFeedback.restTimeSeconds
      },
      message: 'Set feedback recorded successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error recording set feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording set feedback'
    });
  }
});

/**
 * ⏱️ POST /api/weight-suggestions/rest-pattern
 * Registra patrón de tiempo de descanso
 */
router.post('/rest-pattern', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      exerciseName,
      muscleGroup,
      recommendedRestSeconds,
      actualRestSeconds,
      nextSetPerformance,
      fatigueLevel,
      sessionId,
      setNumber
    } = req.body;

    // Validaciones básicas
    if (!exerciseName || actualRestSeconds === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Exercise name and actual rest seconds are required'
      });
    }

    console.log(`⏱️ [API] Recording rest pattern for user ${userId}:`, {
      exerciseName,
      actualRestSeconds,
      nextSetPerformance
    });

    // Guardar patrón de descanso
    const restPattern = await supabaseStorage.saveRestTimePattern(userId, {
      exerciseName,
      muscleGroup,
      recommendedRestSeconds,
      actualRestSeconds,
      nextSetPerformance,
      fatigueLevel,
      sessionId,
      setNumber
    });

    res.json({
      success: true,
      restPattern: {
        id: restPattern.id,
        exerciseName: restPattern.exerciseName,
        actualRestSeconds: restPattern.actualRestSeconds,
        nextSetPerformance: restPattern.nextSetPerformance,
        fatigueLevel: restPattern.fatigueLevel
      },
      message: 'Rest pattern recorded successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error recording rest pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording rest pattern'
    });
  }
});

/**
 * 🤖 POST /api/weight-suggestions/process-ai-learning
 * Procesa datos de entrenamiento para mejorar sugerencias de IA
 */
router.post('/process-ai-learning', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    console.log(`🤖 [API] Processing AI learning for user ${userId}`);

    // Procesar datos de peso para aprendizaje de IA
    await aiLearningService.processWeightLearningData(userId);

    res.json({
      success: true,
      message: 'AI learning processed successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error processing AI learning:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing AI learning'
    });
  }
});

/**
 * 🚀 POST /api/weight-suggestions/initialize-data
 * Inicializa datos de peso para un usuario (solo para desarrollo/testing)
 */
router.post('/initialize-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    console.log(`🚀 [API] Initializing weight data for user ${userId}`);

    // Solo permitir para usuario de desarrollo
    if (userId !== 17) {
      return res.status(403).json({
        success: false,
        message: 'Data initialization only available for development user'
      });
    }

    // Importar dinámicamente para evitar problemas de dependencias
    const { initializeWeightData } = await import('../scripts/initWeightData');
    await initializeWeightData();

    res.json({
      success: true,
      message: 'Weight data initialized successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error initializing weight data:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing weight data'
    });
  }
});

export default router;
