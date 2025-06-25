import express from 'express';
import { periodizationService } from '../services/periodizationService';

const router = express.Router();

/**
 * 🧠 POST /api/periodization/analyze/:userId
 * Analizar estancamiento y generar recomendaciones
 */
router.post('/analyze/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('🧠 [API] Analyzing stagnation for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const analysis = await periodizationService.analyzeStagnation(userId);

    res.json({
      success: true,
      analysis,
      message: 'Análisis de estancamiento completado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error analyzing stagnation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/periodization/history/:userId
 * Obtener historial de análisis de periodización
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 10;

    console.log('📊 [API] Getting periodization history for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const history = await periodizationService.getAnalysisHistory(userId, limit);

    res.json({
      success: true,
      history,
      message: 'Historial de análisis obtenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting periodization history:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔄 GET /api/periodization/recommendations/:userId
 * Obtener recomendaciones activas
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('🔄 [API] Getting active recommendations for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const recommendations = await periodizationService.getActiveRecommendations(userId);

    res.json({
      success: true,
      recommendations,
      message: 'Recomendaciones activas obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting active recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ PUT /api/periodization/decision/:analysisId
 * Actualizar decisión del usuario sobre recomendación
 */
router.put('/decision/:analysisId', async (req, res) => {
  try {
    const analysisId = parseInt(req.params.analysisId);
    const { decision, feedback } = req.body;

    console.log('✅ [API] Updating user decision:', { analysisId, decision });

    if (isNaN(analysisId)) {
      return res.status(400).json({
        success: false,
        message: 'analysisId debe ser un número válido'
      });
    }

    if (!decision || !['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision debe ser "accepted" o "rejected"'
      });
    }

    await periodizationService.updateUserDecision(analysisId, decision, feedback);

    res.json({
      success: true,
      message: 'Decisión del usuario actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error updating user decision:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📈 GET /api/periodization/status/:userId
 * Obtener estado actual de periodización
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('📈 [API] Getting periodization status for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    // Obtener último análisis y recomendaciones activas
    const [history, recommendations] = await Promise.all([
      periodizationService.getAnalysisHistory(userId, 1),
      periodizationService.getActiveRecommendations(userId)
    ]);

    const currentAnalysis = history[0] || null;
    const status = {
      currentPhase: currentAnalysis?.current_phase || 'hypertrophy',
      weeksInPhase: currentAnalysis?.weeks_in_phase || 0,
      lastAnalysisDate: currentAnalysis?.analysis_date || null,
      hasActiveRecommendations: !!recommendations,
      stagnationDetected: currentAnalysis?.stagnation_detected || false,
      progressTrend: currentAnalysis?.progress_trend || 'stable',
      confidenceScore: currentAnalysis?.confidence_score || 0
    };

    res.json({
      success: true,
      status,
      currentAnalysis,
      activeRecommendations: recommendations,
      message: 'Estado de periodización obtenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting periodization status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔄 POST /api/periodization/force-analysis/:userId
 * Forzar análisis inmediato (para testing)
 */
router.post('/force-analysis/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('🔄 [API] Forcing immediate analysis for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    // Ejecutar análisis inmediato
    const analysis = await periodizationService.analyzeStagnation(userId);

    // Obtener estado actualizado
    const [history, recommendations] = await Promise.all([
      periodizationService.getAnalysisHistory(userId, 1),
      periodizationService.getActiveRecommendations(userId)
    ]);

    res.json({
      success: true,
      analysis,
      updatedStatus: {
        currentAnalysis: history[0],
        activeRecommendations: recommendations
      },
      message: 'Análisis forzado completado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error forcing analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/periodization/insights/:userId
 * Obtener insights de periodización para dashboard
 */
router.get('/insights/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('📊 [API] Getting periodization insights for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const [history, recommendations] = await Promise.all([
      periodizationService.getAnalysisHistory(userId, 5),
      periodizationService.getActiveRecommendations(userId)
    ]);

    // Calcular insights
    const insights = {
      totalAnalyses: history.length,
      stagnationDetections: history.filter(h => h.stagnation_detected).length,
      averageConfidence: history.length > 0 
        ? history.reduce((sum, h) => sum + (h.confidence_score || 0), 0) / history.length 
        : 0,
      mostCommonPhase: this.getMostCommonPhase(history),
      phaseHistory: history.map(h => ({
        date: h.analysis_date,
        phase: h.current_phase,
        weeksInPhase: h.weeks_in_phase,
        stagnationDetected: h.stagnation_detected
      })),
      hasActiveRecommendations: !!recommendations,
      lastRecommendation: recommendations
    };

    res.json({
      success: true,
      insights,
      message: 'Insights de periodización obtenidos exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting periodization insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧠 GET /api/periodization/suggestions/:userId
 * Obtener sugerencias inteligentes contextuales
 */
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('🧠 [API] Getting intelligent suggestions for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const suggestions = await periodizationService.generateIntelligentSuggestions(userId);

    res.json({
      success: true,
      suggestions,
      message: 'Sugerencias inteligentes obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting intelligent suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📈 POST /api/periodization/transition-plan
 * Generar plan de transición personalizado
 */
router.post('/transition-plan', async (req, res) => {
  try {
    const { userId, fromPhase, toPhase } = req.body;

    console.log('📈 [API] Generating transition plan:', { userId, fromPhase, toPhase });

    if (!userId || !fromPhase || !toPhase) {
      return res.status(400).json({
        success: false,
        message: 'userId, fromPhase y toPhase son requeridos'
      });
    }

    const validPhases = ['strength', 'hypertrophy', 'definition', 'recovery'];
    if (!validPhases.includes(fromPhase) || !validPhases.includes(toPhase)) {
      return res.status(400).json({
        success: false,
        message: 'Fases válidas: strength, hypertrophy, definition, recovery'
      });
    }

    const transitionPlan = await periodizationService.generateTransitionPlan(userId, fromPhase, toPhase);

    res.json({
      success: true,
      transitionPlan,
      message: 'Plan de transición generado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error generating transition plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function
function getMostCommonPhase(history: any[]): string {
  if (!history.length) return 'hypertrophy';

  const phaseCounts = history.reduce((acc, h) => {
    acc[h.current_phase] = (acc[h.current_phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(phaseCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'hypertrophy';
}

export default router;
