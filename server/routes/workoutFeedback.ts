import express from 'express';
import { workoutFeedbackService } from '../services/workoutFeedbackService';
import { intelligentFeedbackService } from '../services/intelligentFeedbackService';
import { aiLearningService } from '../services/aiLearningService';
import { supabase } from '../supabase';

const router = express.Router();

/**
 * 🎯 POST /api/workout-feedback/pre-workout
 * Crear feedback pre-entrenamiento
 */
router.post('/pre-workout', async (req, res) => {
  try {
    const { userId, sessionId, energy, motivation, availableTime, limitations } = req.body;

    console.log('📝 [API] Creating pre-workout feedback:', {
      userId,
      sessionId,
      energy,
      motivation,
      availableTime,
      limitations
    });

    // Validaciones
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'userId y sessionId son requeridos'
      });
    }

    if (energy < 1 || energy > 5) {
      return res.status(400).json({
        success: false,
        message: 'Energy debe estar entre 1 y 5'
      });
    }

    if (motivation < 1 || motivation > 5) {
      return res.status(400).json({
        success: false,
        message: 'Motivation debe estar entre 1 y 5'
      });
    }

    const feedbackData = {
      energy,
      motivation,
      availableTime,
      limitations: limitations || ''
    };

    const result = await workoutFeedbackService.createPreWorkoutFeedback(
      userId,
      sessionId,
      feedbackData
    );

    res.json({
      success: true,
      feedback: result,
      message: 'Feedback pre-entrenamiento guardado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error creating pre-workout feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🎯 POST /api/workout-feedback/post-workout
 * Crear feedback post-entrenamiento
 */
router.post('/post-workout', async (req, res) => {
  try {
    const {
      sessionId,
      rpe,
      satisfaction,
      fatigue,
      progressFeeling,
      preferredExercises,
      dislikedExercises,
      notes
    } = req.body;

    console.log('📝 [API] Creating post-workout feedback:', {
      sessionId,
      rpe,
      satisfaction,
      fatigue,
      progressFeeling
    });

    // Validaciones
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId es requerido'
      });
    }

    if (rpe < 1 || rpe > 10) {
      return res.status(400).json({
        success: false,
        message: 'RPE debe estar entre 1 y 10'
      });
    }

    if (satisfaction < 1 || satisfaction > 5) {
      return res.status(400).json({
        success: false,
        message: 'Satisfaction debe estar entre 1 y 5'
      });
    }

    const feedbackData = {
      rpe,
      satisfaction,
      fatigue,
      progressFeeling,
      preferredExercises: preferredExercises || [],
      dislikedExercises: dislikedExercises || [],
      notes: notes || ''
    };

    const result = await workoutFeedbackService.createPostWorkoutFeedback(
      sessionId,
      feedbackData
    );

    // 🧠 NUEVA FUNCIONALIDAD: Procesar feedback inteligentemente
    try {
      console.log('🧠 [API] Triggering intelligent feedback processing...');

      // Obtener user_id de la sesión para el procesamiento
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (session?.user_id) {
        // Procesar feedback con IA de forma asíncrona
        intelligentFeedbackService.consolidateUserProfile(session.user_id)
          .then(() => {
            console.log('✅ [API] Intelligent feedback processing completed');
          })
          .catch(error => {
            console.error('❌ [API] Error in intelligent feedback processing:', error);
          });

        // Actualizar preferencias de IA basadas en feedback
        aiLearningService.updateUserPreferences(session.user_id, {
          rpe: feedbackData.rpe,
          satisfaction: feedbackData.satisfaction,
          fatigue: feedbackData.fatigue,
          progressFeeling: feedbackData.progressFeeling,
          preferredExercises: feedbackData.preferredExercises,
          dislikedExercises: feedbackData.dislikedExercises
        }).catch(error => {
          console.error('❌ [API] Error updating AI preferences:', error);
        });
      }
    } catch (error) {
      console.error('❌ [API] Error in post-feedback processing:', error);
      // No fallar la respuesta principal por errores de procesamiento
    }

    res.json({
      success: true,
      feedback: result,
      message: 'Feedback post-entrenamiento guardado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error creating post-workout feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🎯 POST /api/workout-feedback/set-feedback
 * Crear feedback de set individual
 */
router.post('/set-feedback', async (req, res) => {
  try {
    const { exerciseLogId, setRpe, completedAsPlanned, weightFeeling, notes } = req.body;

    console.log('📝 [API] Creating set feedback:', {
      exerciseLogId,
      setRpe,
      completedAsPlanned,
      weightFeeling
    });

    // Validaciones
    if (!exerciseLogId) {
      return res.status(400).json({
        success: false,
        message: 'exerciseLogId es requerido'
      });
    }

    if (setRpe < 1 || setRpe > 10) {
      return res.status(400).json({
        success: false,
        message: 'setRpe debe estar entre 1 y 10'
      });
    }

    const validWeightFeelings = ['too_light', 'perfect', 'too_heavy'];
    if (weightFeeling && !validWeightFeelings.includes(weightFeeling)) {
      return res.status(400).json({
        success: false,
        message: 'weightFeeling debe ser: too_light, perfect, o too_heavy'
      });
    }

    const feedbackData = {
      exerciseLogId,
      setRpe,
      completedAsPlanned: completedAsPlanned !== false, // default true
      weightFeeling: weightFeeling || 'perfect',
      notes: notes || ''
    };

    const result = await workoutFeedbackService.createSetFeedback(feedbackData);

    res.json({
      success: true,
      feedback: result,
      message: 'Feedback de set guardado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error creating set feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/workout-feedback/session/:sessionId
 * Obtener feedback de una sesión
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'sessionId debe ser un número válido'
      });
    }

    const feedback = await workoutFeedbackService.getSessionFeedback(sessionId);

    res.json({
      success: true,
      feedback,
      message: 'Feedback de sesión obtenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting session feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📈 GET /api/workout-feedback/metrics/:userId
 * Obtener métricas promedio de feedback
 */
router.get('/metrics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const metrics = await workoutFeedbackService.calculateAverageMetrics(userId, days);

    res.json({
      success: true,
      metrics,
      message: 'Métricas de feedback obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting feedback metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
