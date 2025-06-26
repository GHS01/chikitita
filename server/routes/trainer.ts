import express from 'express';
import { z } from 'zod';
import { storage } from '../storageNew';
import { authenticateToken } from '../middleware/auth';
import { insertTrainerConfigSchema, insertChatMessageSchema } from '@shared/schema';
// 🕐 SISTEMA HORARIO CENTRALIZADO (SERVER)
import { now, createDBTimestamp, getCurrentHour, getCurrentDate } from '../utils/timeSystem';
import { supabase } from '../supabase';

// 🎯 FUNCIÓN SIMPLE DE FORMATEO PARA BACKEND
const formatChatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const router = express.Router();

// Get trainer configuration
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    console.log('🔍 [TrainerAPI] GET /config - userId:', userId);

    const config = await storage.getTrainerConfig(userId);
    console.log('🔍 [TrainerAPI] Retrieved config from storage:', config);

    if (!config) {
      console.log('🔍 [TrainerAPI] No config found, returning isConfigured: false');
      return res.json({ isConfigured: false });
    }

    console.log('🔍 [TrainerAPI] Returning config:', config);
    res.json(config);
  } catch (error) {
    console.error('❌ [TrainerAPI] Error fetching trainer config:', error);
    res.status(500).json({ error: 'Failed to fetch trainer configuration' });
  }
});

// Create trainer configuration
router.post('/configure', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    console.log('🔧 [TrainerAPI] POST /configure - userId:', userId, 'body:', req.body);

    // Validate input
    const configData = insertTrainerConfigSchema.parse({
      ...req.body,
      userId
    });
    console.log('🔧 [TrainerAPI] Validated config data:', configData);

    // Update user gender if provided
    if (req.body.userGender) {
      console.log('🔧 [TrainerAPI] Updating user gender to:', req.body.userGender);
      await storage.updateUserGender(userId, req.body.userGender);
    }

    const config = await storage.createTrainerConfig(configData);
    console.log('🔧 [TrainerAPI] Created trainer config:', config);
    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [TrainerAPI] Validation error:', error.errors);
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('❌ [TrainerAPI] Error creating trainer config:', error);
    res.status(500).json({ error: 'Failed to create trainer configuration' });
  }
});

// Get chat messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await storage.getChatMessages(userId, limit);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send message to AI trainer
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validate input
    const messageData = insertChatMessageSchema.parse({
      ...req.body,
      userId,
      isFromAI: false
    });

    // Save user message
    const userMessage = await storage.createChatMessage(messageData);

    // Get trainer configuration
    const trainerConfig = await storage.getTrainerConfig(userId);
    if (!trainerConfig) {
      return res.status(400).json({ error: 'Trainer not configured' });
    }

    // Get user context for AI
    const userContext = await buildUserContext(userId);

    // Generate AI response
    const aiResponse = await generateAIResponse(userContext, trainerConfig, req.body.message);

    // Save AI message
    const aiMessage = await storage.createChatMessage({
      userId,
      message: aiResponse.message,
      isFromAI: true,
      messageType: 'response',
      contextData: aiResponse.contextData
    });

    // Process any data updates from AI
    if (aiResponse.dataUpdates) {
      await processAIDataUpdates(userId, aiResponse.dataUpdates);
    }

    res.json({
      userMessage,
      aiMessage,
      suggestions: aiResponse.suggestions || [],
      dataUpdates: aiResponse.dataUpdates || {}
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get complete user context for AI
router.get('/context', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const context = await buildUserContext(userId);
    res.json(context);
  } catch (error) {
    console.error('Error building user context:', error);
    res.status(500).json({ error: 'Failed to build user context' });
  }
});

// Helper function to build complete user context
async function buildUserContext(userId: number) {
  try {
    // 🔧 FIX: Usar fecha local consistente con el sistema de rutinas
    const today = getCurrentDate();
    console.log('🔍 [AI Trainer] Searching for workout plan on date:', today);

    const [
      user,
      preferences,
      progressEntries,
      workoutSessions,
      achievements,
      meals,
      trainerConfig,
      weightGoal,
      latestWeightEntry,
      weightTrends,
      // 🚀 NUEVOS DATOS CRÍTICOS PARA AI TRAINER
      dailyWorkoutPlan,
      dailyMealPlan,
      nutritionPreferences,
      activeWorkoutPlan,
      // 🧠 HISTORIAL CONVERSACIONAL PARA CONTEXTO
      recentMessages,
      // 🏋️‍♂️ MESOCICLOS Y PERIODIZACIÓN CIENTÍFICA
      activeMesocycle,
      userSplitAssignments,
      todaySplitAssignment,
      // 📊 FEEDBACK Y RPE DETALLADO
      recentWorkoutFeedback,
      exerciseFeedbackHistory,
      userFeedbackProfile,
      // 📈 MÉTRICAS DEL DASHBOARD Y ANALYTICS
      dashboardMetrics,
      recoveryStatus,
      adherenceMetrics,
      // 🧠 LEARNING DATA E INSIGHTS DE IA
      learningData,
      aiInsights,
      rejectedWorkoutPlans,
      // 💪 DATOS DE FUERZA Y PROGRESO AVANZADO
      exerciseLogs,
      weightSuggestions,
      muscleGroupProgress
    ] = await Promise.all([
      storage.getUser(userId),
      storage.getUserPreferences(userId),
      storage.getProgressEntries(userId),
      storage.getWorkoutSessions(userId),
      storage.getAchievements(userId),
      storage.getMeals(userId),
      storage.getTrainerConfig(userId),
      storage.getActiveWeightGoal(userId),
      storage.getLatestProgressEntry(userId),
      storage.getProgressTrends(userId),
      // 🏋️ Rutina del día actual
      storage.getDailyWorkoutPlan(userId, today),
      // 🥗 Plan alimenticio del día
      storage.getDailyMealPlan(userId, today),
      // 🍎 Preferencias nutricionales
      storage.getNutritionPreferences(userId),
      // 📋 Plan de entrenamiento tradicional activo
      storage.getActiveWorkoutPlan(userId),
      // 🧠 Últimos 10 mensajes para contexto conversacional
      storage.getRecentChatMessages(userId, 10),
      // 🏋️‍♂️ MESOCICLOS Y PERIODIZACIÓN CIENTÍFICA
      getActiveMesocycle(userId),
      getUserSplitAssignments(userId),
      getTodaySplitAssignment(userId),
      // 📊 FEEDBACK Y RPE DETALLADO
      getRecentWorkoutFeedback(userId),
      getExerciseFeedbackHistory(userId),
      getUserFeedbackProfile(userId),
      // 📈 MÉTRICAS DEL DASHBOARD Y ANALYTICS
      getDashboardMetrics(userId),
      getRecoveryStatus(userId),
      getAdherenceMetrics(userId),
      // 🧠 LEARNING DATA E INSIGHTS DE IA
      getLearningData(userId),
      getAIInsights(userId),
      storage.getRejectedWorkoutPlans(userId),
      // 💪 DATOS DE FUERZA Y PROGRESO AVANZADO
      getExerciseLogs(userId),
      getWeightSuggestions(userId),
      getMuscleGroupProgress(userId)
    ]);

    // 🔍 DEBUG: Verificar datos obtenidos
    console.log('🔍 [AI Trainer] Daily workout plan found:', !!dailyWorkoutPlan);
    console.log('🔍 [AI Trainer] Active workout plan found:', !!activeWorkoutPlan);
    if (dailyWorkoutPlan) {
      console.log('🔍 [AI Trainer] Daily plan date:', dailyWorkoutPlan.workoutDate);
      console.log('🔍 [AI Trainer] Daily plan exercises:', dailyWorkoutPlan.exercises?.length || 0);
    }

    // Calculate recent stats
    const recentWorkouts = workoutSessions.filter(session => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(session.startedAt) > weekAgo;
    });

    const recentMeals = meals.filter(meal => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return new Date(meal.loggedAt) > threeDaysAgo;
    });

    // Calculate weight progress if goal exists
    const weightProgress = weightGoal && latestWeightEntry?.weight ? {
      startWeight: weightGoal.startWeight,
      currentWeight: latestWeightEntry.weight,
      targetWeight: weightGoal.targetWeight,
      goalType: weightGoal.goalType,
      totalChange: latestWeightEntry.weight - weightGoal.startWeight,
      remainingChange: weightGoal.targetWeight - latestWeightEntry.weight,
      progressPercentage: Math.min(Math.abs(latestWeightEntry.weight - weightGoal.startWeight) / Math.abs(weightGoal.targetWeight - weightGoal.startWeight) * 100, 100),
      weeklyTrend: weightTrends?.weight || { trend: 'stable', change: 0, direction: 'stable' },
      bodyMeasurements: latestWeightEntry.bodyMeasurements || {},
      lastRecorded: latestWeightEntry.recordedAt,
      feelingRating: latestWeightEntry.feelingRating,
      notes: latestWeightEntry.notes
    } : null;

    // 🧠 DETECCIÓN INTELIGENTE DEL ESTADO DEL USUARIO
    const userStatus = {
      hasActiveWorkout: !!dailyWorkoutPlan || !!activeWorkoutPlan,
      hasNutritionPlan: !!dailyMealPlan,
      hasNutritionPreferences: !!nutritionPreferences,
      completedWorkoutsThisWeek: recentWorkouts.length,
      needsGuidance: {
        workout: !dailyWorkoutPlan && !activeWorkoutPlan,
        nutrition: !dailyMealPlan,
        nutritionSetup: !nutritionPreferences
      }
    };

    return {
      personal: {
        name: user?.fullName || 'Usuario',
        age: user?.age || 0,
        gender: user?.gender || 'not_specified',
        weight: user?.currentWeight || 0,
        height: user?.height || 0,
        fitnessLevel: user?.fitnessLevel || 'beginner',
        fitnessGoal: user?.fitnessGoal || 'general_fitness'
      },
      progress: {
        recentWorkouts,
        weightHistory: progressEntries.slice(0, 10),
        achievements,
        currentStreak: calculateWorkoutStreak(workoutSessions),
        weightProgress
      },
      preferences: {
        exerciseTypes: preferences?.exerciseTypes || [],
        weeklyFrequency: preferences?.weeklyFrequency || 3,
        equipment: preferences?.equipment || [],
        limitations: preferences?.limitations || [],
        location: preferences?.location || 'gym'
      },
      nutrition: {
        recentMeals,
        mealFrequency: 3, // Default
        preferences: nutritionPreferences,
        dailyPlan: dailyMealPlan
      },
      // 🏋️ RUTINAS Y PLANES ACTIVOS
      workouts: {
        dailyPlan: dailyWorkoutPlan,
        activePlan: activeWorkoutPlan,
        hasActiveRoutine: userStatus.hasActiveWorkout,
        // 🏋️‍♂️ MESOCICLOS Y PERIODIZACIÓN
        activeMesocycle,
        splitAssignments: userSplitAssignments,
        todaySplit: todaySplitAssignment,
        rejectedPlans: rejectedWorkoutPlans
      },
      // 📊 FEEDBACK Y ANÁLISIS DETALLADO
      feedback: {
        recentFeedback: recentWorkoutFeedback,
        exerciseHistory: exerciseFeedbackHistory,
        userProfile: userFeedbackProfile,
        exerciseLogs,
        weightSuggestions
      },
      // 📈 MÉTRICAS Y ANALYTICS COMPLETAS
      analytics: {
        dashboard: dashboardMetrics,
        recovery: recoveryStatus,
        adherence: adherenceMetrics,
        muscleProgress: muscleGroupProgress
      },
      // 🧠 INTELIGENCIA ARTIFICIAL Y APRENDIZAJE
      intelligence: {
        learningData,
        aiInsights,
        patterns: extractUserPatterns(exerciseFeedbackHistory, workoutSessions),
        preferences: extractAdvancedPreferences(recentWorkoutFeedback, exerciseFeedbackHistory)
      },
      // 🎯 ESTADO INTELIGENTE DEL USUARIO
      status: userStatus,
      // 🧠 CONTEXTO CONVERSACIONAL
      conversation: {
        recentMessages,
        lastTopic: extractLastTopic(recentMessages),
        pendingQuestions: extractPendingQuestions(recentMessages),
        conversationFlow: analyzeConversationFlow(recentMessages)
      },
      trainer: {
        name: trainerConfig?.trainerName || 'Entrenador',
        gender: trainerConfig?.trainerGender || 'male',
        tone: trainerConfig?.interactionTone || 'friendly',
        avatar: trainerConfig?.trainerAvatar || '',
        personalityType: trainerConfig?.personalityType || 'default',
        customPersonality: trainerConfig?.customPersonality || ''
      }
    };
  } catch (error) {
    console.error('Error building user context:', error);
    throw error;
  }
}

// Helper function to calculate workout streak
function calculateWorkoutStreak(workoutSessions: any[]): number {
  if (!workoutSessions.length) return 0;

  const sortedSessions = workoutSessions
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.startedAt);
    sessionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
}

// 🧠 FUNCIONES DE ANÁLISIS CONVERSACIONAL

// Extraer el último tema de conversación
function extractLastTopic(messages: any[]): string {
  if (!messages || messages.length === 0) return 'general';

  const lastAIMessage = messages.filter(m => m.isFromAI).pop();
  if (!lastAIMessage) return 'general';

  const message = lastAIMessage.message.toLowerCase();

  if (message.includes('rutina') || message.includes('entrenamiento') || message.includes('ejercicio')) {
    return 'workout';
  }
  if (message.includes('alimenticio') || message.includes('comida') || message.includes('nutrición') || message.includes('comer')) {
    return 'nutrition';
  }
  if (message.includes('salud') || message.includes('síntomas') || message.includes('diarrea') || message.includes('vómitos')) {
    return 'health';
  }
  if (message.includes('progreso') || message.includes('peso') || message.includes('medidas')) {
    return 'progress';
  }

  return 'general';
}

// Extraer preguntas pendientes del AI
function extractPendingQuestions(messages: any[]): string[] {
  if (!messages || messages.length === 0) return [];

  const lastAIMessage = messages.filter(m => m.isFromAI).pop();
  if (!lastAIMessage) return [];

  const message = lastAIMessage.message;
  const questions = [];

  if (message.includes('?')) {
    const questionParts = message.split('?').filter(part => part.trim().length > 0);
    questions.push(...questionParts.map(q => q.trim() + '?'));
  }

  return questions;
}

// Analizar el flujo conversacional
function analyzeConversationFlow(messages: any[]): any {
  if (!messages || messages.length < 2) {
    return { type: 'initial', context: 'new_conversation' };
  }

  const lastUserMessage = messages.filter(m => !m.isFromAI).pop();
  const lastAIMessage = messages.filter(m => m.isFromAI).pop();

  if (!lastUserMessage || !lastAIMessage) {
    return { type: 'initial', context: 'incomplete_conversation' };
  }

  const userMsg = lastUserMessage.message.toLowerCase().trim();
  const aiMsg = lastAIMessage.message.toLowerCase();

  // Detectar patrones de respuesta
  if (['esta bien', 'ok', 'si', 'perfecto', 'entendido', 'vale'].includes(userMsg)) {
    return {
      type: 'confirmation',
      context: 'user_agrees',
      lastAITopic: extractTopicFromMessage(aiMsg),
      suggestedAction: 'proceed_with_topic'
    };
  }

  if (userMsg.includes('que me recomiendas') || userMsg.includes('que puedo') || userMsg.includes('que debo')) {
    return {
      type: 'specific_question',
      context: 'seeking_recommendations',
      lastAITopic: extractTopicFromMessage(aiMsg),
      suggestedAction: 'provide_specific_advice'
    };
  }

  if (userMsg.includes('me referia a') || userMsg.includes('quise decir') || userMsg.includes('no, yo')) {
    return {
      type: 'clarification',
      context: 'user_correcting_misunderstanding',
      suggestedAction: 'acknowledge_and_redirect'
    };
  }

  if (userMsg.includes('entonces') || userMsg.includes('y si') || userMsg.includes('pero')) {
    return {
      type: 'continuation',
      context: 'following_up_on_topic',
      lastAITopic: extractTopicFromMessage(aiMsg),
      suggestedAction: 'continue_same_topic'
    };
  }

  return {
    type: 'new_topic',
    context: 'changing_subject',
    suggestedAction: 'address_new_topic'
  };
}

// Extraer tema de un mensaje específico
function extractTopicFromMessage(message: string): string {
  if (message.includes('rutina') || message.includes('entrenamiento')) return 'workout';
  if (message.includes('alimenticio') || message.includes('comida') || message.includes('nutrición')) return 'nutrition';
  if (message.includes('salud') || message.includes('síntomas')) return 'health';
  if (message.includes('progreso') || message.includes('peso')) return 'progress';
  return 'general';
}

// AI Response generation with Gemini
async function generateAIResponse(userContext: any, trainerConfig: any, userMessage: string) {
  try {
    const { geminiService } = await import('../geminiService');

    // 🧠 Build comprehensive prompt with conversational context
    const prompt = buildContextualTrainerPrompt(userContext, trainerConfig, userMessage);

    // Get AI response
    const aiResponse = await geminiService.generateTrainerResponse(prompt);

    // Try to parse structured response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      // Use only the message part, ignore the JSON structure for display
      return {
        message: parsedResponse.message || aiResponse,
        contextData: {
          userMessage,
          timestamp: createDBTimestamp(), // 🕐 SISTEMA CENTRALIZADO
          trainerTone: trainerConfig.interactionTone
        },
        suggestions: parsedResponse.suggestions || [],
        dataUpdates: parsedResponse.dataUpdates || {}
      };
    } catch {
      // Fallback if AI doesn't return JSON - clean the response
      const cleanMessage = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^\{.*?"message":\s*"([^"]*)".*\}$/s, '$1')
        .trim();

      return {
        message: cleanMessage || aiResponse,
        contextData: {
          userMessage,
          timestamp: createDBTimestamp(), // 🕐 SISTEMA CENTRALIZADO
          trainerTone: trainerConfig.interactionTone
        },
        suggestions: [],
        dataUpdates: {}
      };
    }
  } catch (error) {
    console.error('Error generating AI response:', error);

    // Fallback response
    return {
      message: `Hola ${userContext.personal.name}! Soy ${trainerConfig.trainerName}, tu entrenador personal. He recibido tu mensaje: "${userMessage}". Estoy aquí para ayudarte con tu entrenamiento.`,
      contextData: { userMessage, timestamp: createDBTimestamp() }, // 🕐 SISTEMA CENTRALIZADO
      suggestions: ['Hacer ejercicio hoy', 'Revisar tu progreso'],
      dataUpdates: {}
    };
  }
}

// 🧠 Build contextual prompt with conversation analysis
function buildContextualTrainerPrompt(userContext: any, trainerConfig: any, userMessage: string): string {
  const conversationFlow = userContext.conversation.conversationFlow;
  const lastTopic = userContext.conversation.lastTopic;
  const recentMessages = userContext.conversation.recentMessages;

  // Analizar intención del usuario basado en contexto
  const intentAnalysis = analyzeUserIntent(userMessage, conversationFlow, lastTopic, recentMessages);

  return buildTrainerPromptWithIntent(userContext, trainerConfig, userMessage, intentAnalysis);
}

// Analizar intención del usuario con contexto conversacional
function analyzeUserIntent(userMessage: string, conversationFlow: any, lastTopic: string, recentMessages: any[]): any {
  const userMsg = userMessage.toLowerCase().trim();

  // Obtener último mensaje del AI para contexto
  const lastAIMessage = recentMessages.filter(m => m.isFromAI).pop();
  const lastAIText = lastAIMessage ? lastAIMessage.message.toLowerCase() : '';

  // Análisis basado en el flujo conversacional
  switch (conversationFlow.type) {
    case 'confirmation':
      return {
        type: 'confirmation',
        implicitMeaning: `Usuario acepta la sugerencia sobre ${lastTopic}`,
        suggestedResponse: `Proceder con ${lastTopic} según lo sugerido`,
        context: `Último AI mensaje sobre: ${lastTopic}`,
        avoidRepetition: ['estado de salud', 'información personal ya mencionada']
      };

    case 'specific_question':
      if (lastTopic === 'nutrition' && lastAIText.includes('suspende') && userMsg.includes('que me recomiendas')) {
        return {
          type: 'specific_nutrition_request',
          implicitMeaning: 'Usuario quiere alternativas alimenticias específicas para su condición',
          suggestedResponse: 'Dar recomendaciones específicas de alimentos para su situación de salud',
          context: 'Usuario tiene problemas digestivos, necesita alimentos suaves',
          avoidRepetition: ['repetir diagnóstico', 'mencionar síntomas nuevamente']
        };
      }
      return {
        type: 'specific_question',
        implicitMeaning: `Usuario busca consejos específicos sobre ${lastTopic}`,
        suggestedResponse: `Dar consejos específicos sobre ${lastTopic}`,
        context: `Continuar tema: ${lastTopic}`
      };

    case 'clarification':
      return {
        type: 'clarification',
        implicitMeaning: 'Usuario está corrigiendo una malinterpretación',
        suggestedResponse: 'Reconocer el malentendido y redirigir correctamente',
        context: 'Usuario necesita aclarar su intención anterior'
      };

    case 'continuation':
      return {
        type: 'continuation',
        implicitMeaning: `Usuario continúa la conversación sobre ${lastTopic}`,
        suggestedResponse: `Continuar desarrollando el tema ${lastTopic}`,
        context: `Mantener hilo conversacional sobre ${lastTopic}`,
        avoidRepetition: ['información ya discutida', 'repetir contexto']
      };

    default:
      return {
        type: 'new_topic',
        implicitMeaning: 'Usuario introduce un nuevo tema',
        suggestedResponse: 'Abordar el nuevo tema manteniendo personalización',
        context: 'Nuevo tema de conversación'
      };
  }
}

// 🧠 Build prompt with intent analysis and conversation context
function buildTrainerPromptWithIntent(userContext: any, trainerConfig: any, userMessage: string, intentAnalysis: any): string {
  const toneDescriptions = {
    motivational: "Eres muy motivacional y energético. Usas frases como '¡Vamos a romperla!', '¡Tú puedes!', '¡Dale con todo!'. Siempre animas y empujas al usuario a dar su máximo.",
    friendly: "Eres amigable y cercano como un mejor amigo. Usas un tono casual, empático y comprensivo. Celebras los logros y apoyas en los momentos difíciles.",
    strict: "Eres disciplinado y directo. Te enfocas en resultados y consistencia. Usas frases como 'Sin excusas', 'La disciplina es clave', 'Los resultados requieren esfuerzo'.",
    loving: "Eres cariñoso y comprensivo. Ofreces apoyo incondicional y usas un tono suave pero alentador. Te preocupas genuinamente por el bienestar del usuario.",
    partner: "Eres como una pareja de entrenamiento íntima y cercana. Usas un tono personal, cálido y motivador. Creas una conexión emocional fuerte."
  };

  const personalityDescriptions = {
    default: 'Profesional y equilibrado, motivador enfocado en resultados',
    motivator: 'ENERGÍA PURA: Entusiasta extremo, nunca se rinde, usa frases como "¡VAMOS QUE PODEMOS!", "¡TÚ ERES IMPARABLE!", "¡ROMPE TUS LÍMITES!"',
    sensei: 'SABIDURÍA ZEN: Paciente, filosófico, usa frases como "La constancia es la clave", "Cada paso cuenta", "El cuerpo sigue a la mente"',
    warrior: 'DISCIPLINA ESPARTANA: Exigente, determinado, usa frases como "¡Sin excusas!", "La disciplina es libertad", "¡Forja tu destino!"',
    empathetic: 'APOYO EMOCIONAL: Comprensivo, empático, usa frases como "Estoy aquí para apoyarte", "Cada progreso es valioso", "Cree en ti mismo"',
    strategist: 'PRECISIÓN MILITAR: Estratégico, planificador, usa frases como "Ejecutemos el plan", "Precisión en cada movimiento", "Misión cumplida"'
  };

  // 🎭 FUNCIÓN MEJORADA: Lógica condicional para personalidades
  function getPersonalityDescription(trainerConfig: any): string {
    // 🎯 PERSONALIDAD CUSTOM: Combina estilo base + descripción personalizada
    if (trainerConfig.personalityType === 'custom' && trainerConfig.customPersonality) {
      const baseTone = toneDescriptions[trainerConfig.interactionTone] || toneDescriptions.friendly;
      return `ESTILO BASE: ${baseTone}\n\nPERSONALIDAD PERSONALIZADA: ${trainerConfig.customPersonality}`;
    }

    // 🎪 PERSONALIDADES PREDEFINIDAS: Solo usar la descripción específica (sin estilo adicional)
    if (trainerConfig.personalityType && trainerConfig.personalityType !== 'default') {
      const personalityDesc = personalityDescriptions[trainerConfig.personalityType];
      return personalityDesc ? `PERSONALIDAD: ${personalityDesc}` : `PERSONALIDAD: ${personalityDescriptions.default}`;
    }

    // 🎯 PERSONALIDAD DEFAULT: Usar solo el estilo de interacción
    const baseTone = toneDescriptions[trainerConfig.interactionTone] || toneDescriptions.friendly;
    return `PERSONALIDAD: ${baseTone}`;
  }

  // Obtener historial conversacional reciente para contexto
  const recentMessages = userContext.conversation.recentMessages.slice(-6);
  const conversationHistory = recentMessages.map((msg, i) =>
    `${msg.isFromAI ? 'TÚ' : 'USUARIO'}: "${msg.message}"`
  ).join('\n');

  // Detectar si es mensaje inicial
  const isInitialMessage = userMessage === "iniciar_conversacion";

  // Mensaje inicial especial con detección inteligente
  if (isInitialMessage) {
    const setupStatus = [];
    if (userContext.status.needsGuidance.workout) setupStatus.push('rutina');
    if (userContext.status.needsGuidance.nutritionSetup) setupStatus.push('configuración nutricional');
    if (userContext.status.needsGuidance.nutrition) setupStatus.push('plan alimenticio');

    return `
IDENTIDAD: Eres ${trainerConfig.trainerName}, ${trainerConfig.trainerGender === 'male' ? 'entrenador personal masculino' : 'entrenadora personal femenina'} con personalidad ${trainerConfig.interactionTone}.

PERSONALIDAD: ${getPersonalityDescription(trainerConfig)}

USUARIO: ${userContext.personal.name}, ${userContext.personal.age} años, objetivo: ${userContext.personal.fitnessGoal}, nivel: ${userContext.personal.fitnessLevel}

ESTADO DEL USUARIO:
${userContext.status.hasActiveWorkout ? '✅ Tiene rutina activa' : '❌ Sin rutina'}
${userContext.status.hasNutritionPlan ? '✅ Tiene plan alimenticio' : '❌ Sin plan alimenticio'}
${userContext.status.hasNutritionPreferences ? '✅ Nutrición configurada' : '❌ Nutrición sin configurar'}

INSTRUCCIÓN:
${setupStatus.length > 0
  ? `Saluda brevemente y menciona que necesita configurar: ${setupStatus.join(', ')}. Ofrece ayuda para empezar. Máximo 40 palabras.`
  : `Saluda a ${userContext.personal.name} y menciona que ya tiene todo configurado. Pregunta cómo se siente hoy. Máximo 30 palabras.`
}

RESPUESTA:`;
  }

  // 🧠 ANÁLISIS INTELIGENTE DEL ESTADO DEL USUARIO
  const workoutStatus = userContext.workouts.dailyPlan
    ? `RUTINA ACTIVA: "${userContext.workouts.dailyPlan.exercises?.[0]?.name || 'Rutina del día'}" (${userContext.workouts.dailyPlan.estimatedDuration || 30} min, ${userContext.workouts.dailyPlan.exercises?.length || 0} ejercicios)`
    : userContext.workouts.activePlan
    ? `PLAN TRADICIONAL: "${userContext.workouts.activePlan.name}" (${userContext.workouts.activePlan.difficulty})`
    : '❌ SIN RUTINA - NECESITA CREAR UNA';

  const nutritionStatus = userContext.nutrition.dailyPlan
    ? `PLAN ALIMENTICIO: "${userContext.nutrition.dailyPlan.totalCalories || 0} cal" (${userContext.nutrition.dailyPlan.meals?.length || 0} comidas)`
    : userContext.nutrition.preferences
    ? '⚠️ CONFIGURADO PERO SIN PLAN DIARIO - NECESITA GENERAR'
    : '❌ SIN CONFIGURACIÓN NUTRICIONAL - NECESITA CONFIGURAR';

  const guidanceNeeded = [];
  if (userContext.status.needsGuidance.workout) guidanceNeeded.push('CREAR RUTINA');
  if (userContext.status.needsGuidance.nutrition) guidanceNeeded.push('GENERAR PLAN ALIMENTICIO');
  if (userContext.status.needsGuidance.nutritionSetup) guidanceNeeded.push('CONFIGURAR NUTRICIÓN');

  // Weight progress summary for AI
  const weightProgressSummary = userContext.progress.weightProgress ? `
PROGRESO DE PESO:
- Objetivo: ${userContext.progress.weightProgress.goalType === 'gain_weight' ? 'Ganar peso' : userContext.progress.weightProgress.goalType === 'lose_weight' ? 'Perder peso' : 'Mantener peso'}
- Peso inicial: ${userContext.progress.weightProgress.startWeight}kg
- Peso actual: ${userContext.progress.weightProgress.currentWeight}kg
- Peso objetivo: ${userContext.progress.weightProgress.targetWeight}kg
- Cambio total: ${userContext.progress.weightProgress.totalChange > 0 ? '+' : ''}${userContext.progress.weightProgress.totalChange.toFixed(1)}kg
- Progreso: ${userContext.progress.weightProgress.progressPercentage.toFixed(0)}% completado
- Tendencia semanal: ${userContext.progress.weightProgress.weeklyTrend.change > 0 ? '+' : ''}${userContext.progress.weightProgress.weeklyTrend.change.toFixed(1)}kg (${userContext.progress.weightProgress.weeklyTrend.trend})
- Estado emocional: ${userContext.progress.weightProgress.feelingRating ? `${userContext.progress.weightProgress.feelingRating}/5` : 'No registrado'}
- Última medición: ${userContext.progress.weightProgress.lastRecorded ? formatChatTime(new Date(userContext.progress.weightProgress.lastRecorded)) : 'No registrada'}
${userContext.progress.weightProgress.notes ? `- Notas: ${userContext.progress.weightProgress.notes}` : ''}` : 'PROGRESO DE PESO: No configurado';

  return `
IDENTIDAD: Eres ${trainerConfig.trainerName}, ${trainerConfig.trainerGender === 'male' ? 'entrenador personal masculino' : 'entrenadora personal femenina'} con personalidad ${trainerConfig.interactionTone}.

PERSONALIDAD: ${getPersonalityDescription(trainerConfig)}

🧠 CONTEXTO CONVERSACIONAL INMEDIATO:
${conversationHistory}

🎯 ANÁLISIS DE INTENCIÓN:
- Tipo: ${intentAnalysis.type}
- Significado implícito: ${intentAnalysis.implicitMeaning}
- Respuesta sugerida: ${intentAnalysis.suggestedResponse}
- Contexto: ${intentAnalysis.context}
${intentAnalysis.avoidRepetition ? `- EVITAR repetir: ${intentAnalysis.avoidRepetition.join(', ')}` : ''}

DATOS DEL USUARIO:
- Nombre: ${userContext.personal.name}
- Edad: ${userContext.personal.age} años, Peso: ${userContext.personal.weight}kg, Altura: ${userContext.personal.height}cm
- Nivel: ${userContext.personal.fitnessLevel}, Objetivo: ${userContext.personal.fitnessGoal}
- Entrenamientos esta semana: ${userContext.progress.recentWorkouts.length}, Racha: ${userContext.progress.currentStreak} días
- Equipamiento: ${userContext.preferences.equipment.join(', ') || 'No especificado'}
- Limitaciones: ${userContext.preferences.limitations.join(', ') || 'Ninguna'}
- Frecuencia deseada: ${userContext.preferences.weeklyFrequency} días/semana

🏋️ ESTADO DE RUTINAS: ${workoutStatus}
🥗 ESTADO NUTRICIONAL: ${nutritionStatus}

${userContext.nutrition.preferences ? `
🍎 PREFERENCIAS NUTRICIONALES DETALLADAS:
- Tipo de dieta: ${userContext.nutrition.preferences.dietType || 'No especificada'}
- Tipos personalizados: ${userContext.nutrition.preferences.customDietTypes?.join(', ') || 'Ninguno'}
- Alergias: ${[...(userContext.nutrition.preferences.allergies || []), ...(userContext.nutrition.preferences.customAllergies || [])].join(', ') || 'Ninguna'}
- Restricciones médicas: ${[...(userContext.nutrition.preferences.medicalRestrictions || []), ...(userContext.nutrition.preferences.customMedicalRestrictions || [])].join(', ') || 'Ninguna'}
- Comidas favoritas: ${userContext.nutrition.preferences.favoriteFoods?.join(', ') || 'No especificadas'}
- Hábitos personalizados: ${userContext.nutrition.preferences.customFoodHabits?.join(', ') || 'Ninguno'}
- Calidad hábitos: ${userContext.nutrition.preferences.foodHabitsRating || 3}/5
- Meta calórica: ${userContext.nutrition.preferences.dailyCalorieGoal || 'No establecida'} cal/día
` : ''}

${guidanceNeeded.length > 0 ? `⚠️ NECESITA GUÍA PARA: ${guidanceNeeded.join(', ')}` : '✅ TODO CONFIGURADO'}

${weightProgressSummary}

MENSAJE DEL USUARIO: "${userMessage}"

🧠 INSTRUCCIONES CONTEXTUALES INTELIGENTES:

${intentAnalysis.type === 'confirmation' ? `
✅ USUARIO CONFIRMÓ/ACEPTÓ - NO REPITAS INFORMACIÓN:
- Usuario acepta tu sugerencia sobre ${intentAnalysis.context}
- PROCEDE DIRECTAMENTE con la acción sugerida
- NO repitas su estado de salud o información ya mencionada
- SÉ ESPECÍFICO y da el siguiente paso
` : ''}

${intentAnalysis.type === 'specific_nutrition_request' ? `
🍎 USUARIO PIDE RECOMENDACIONES ALIMENTICIAS ESPECÍFICAS:
- Ya sabe que debe suspender su plan actual
- QUIERE alternativas concretas de alimentos
- DA lista específica de alimentos recomendados para su condición
- NO repitas el diagnóstico o síntomas
- ENFÓCATE en soluciones alimenticias prácticas
` : ''}

${intentAnalysis.type === 'continuation' ? `
🔄 USUARIO CONTINÚA EL TEMA:
- Mantén el hilo conversacional sobre ${intentAnalysis.context}
- NO cambies de tema ni repitas información ya discutida
- DESARROLLA más el tema actual
- SÉ ESPECÍFICO en tu respuesta
` : ''}

${intentAnalysis.type === 'clarification' ? `
🔄 USUARIO ESTÁ ACLARANDO:
- Reconoce que hubo un malentendido
- AJUSTA tu respuesta según su aclaración
- NO repitas información incorrecta
- ENFÓCATE en lo que realmente quiere
` : ''}

REGLAS GENERALES:
1. SÉ DIRECTO Y ESPECÍFICO - NO des vueltas al asunto
2. NUNCA generes rutinas o planes - SOLO lee y comenta los existentes
3. Si no tiene configuración, DIRIGE a la sección correcta
4. Si tiene todo configurado, da coaching basado en datos reales
5. EVITA frases como "podríamos", "qué te parece si" - SÉ DECISIVO
6. Celebra logros específicos con datos reales
7. MANTÉN la continuidad conversacional
8. NO repitas información ya mencionada en mensajes anteriores

RESPUESTA (50-100 palabras, directo, específico y contextual):`;
}

// Build comprehensive prompt for AI trainer
function buildTrainerPrompt(userContext: any, trainerConfig: any, userMessage: string): string {
  const toneDescriptions = {
    motivational: "Eres muy motivacional y energético. Usas frases como '¡Vamos a romperla!', '¡Tú puedes!', '¡Dale con todo!'. Siempre animas y empujas al usuario a dar su máximo.",
    friendly: "Eres amigable y cercano como un mejor amigo. Usas un tono casual, empático y comprensivo. Celebras los logros y apoyas en los momentos difíciles.",
    strict: "Eres disciplinado y directo. Te enfocas en resultados y consistencia. Usas frases como 'Sin excusas', 'La disciplina es clave', 'Los resultados requieren esfuerzo'.",
    loving: "Eres cariñoso y comprensivo. Ofreces apoyo incondicional y usas un tono suave pero alentador. Te preocupas genuinamente por el bienestar del usuario.",
    partner: "Eres como una pareja de entrenamiento íntima y cercana. Usas un tono personal, cálido y motivador. Creas una conexión emocional fuerte."
  };

  const personalityDescriptions = {
    default: 'Profesional y equilibrado, motivador enfocado en resultados',
    motivator: 'ENERGÍA PURA: Entusiasta extremo, nunca se rinde, usa frases como "¡VAMOS QUE PODEMOS!", "¡TÚ ERES IMPARABLE!", "¡ROMPE TUS LÍMITES!"',
    sensei: 'SABIDURÍA ZEN: Paciente, filosófico, usa frases como "La constancia es la clave", "Cada paso cuenta", "El cuerpo sigue a la mente"',
    warrior: 'DISCIPLINA ESPARTANA: Exigente, determinado, usa frases como "¡Sin excusas!", "La disciplina es libertad", "¡Forja tu destino!"',
    empathetic: 'APOYO EMOCIONAL: Comprensivo, empático, usa frases como "Estoy aquí para apoyarte", "Cada progreso es valioso", "Cree en ti mismo"',
    strategist: 'PRECISIÓN MILITAR: Estratégico, planificador, usa frases como "Ejecutemos el plan", "Precisión en cada movimiento", "Misión cumplida"'
  };

  // 🎭 FUNCIÓN MEJORADA: Lógica condicional para personalidades (Duplicada - Mantener consistencia)
  function getPersonalityDescription(trainerConfig: any): string {
    // 🎯 PERSONALIDAD CUSTOM: Combina estilo base + descripción personalizada
    if (trainerConfig.personalityType === 'custom' && trainerConfig.customPersonality) {
      const baseTone = toneDescriptions[trainerConfig.interactionTone] || toneDescriptions.friendly;
      return `ESTILO BASE: ${baseTone}\n\nPERSONALIDAD PERSONALIZADA: ${trainerConfig.customPersonality}`;
    }

    // 🎪 PERSONALIDADES PREDEFINIDAS: Solo usar la descripción específica (sin estilo adicional)
    if (trainerConfig.personalityType && trainerConfig.personalityType !== 'default') {
      const personalityDesc = personalityDescriptions[trainerConfig.personalityType];
      return personalityDesc ? `PERSONALIDAD: ${personalityDesc}` : `PERSONALIDAD: ${personalityDescriptions.default}`;
    }

    // 🎯 PERSONALIDAD DEFAULT: Usar solo el estilo de interacción
    const baseTone = toneDescriptions[trainerConfig.interactionTone] || toneDescriptions.friendly;
    return `PERSONALIDAD: ${baseTone}`;
  }

  const currentStats = {
    workoutsThisWeek: userContext.progress.recentWorkouts.length,
    currentWeight: userContext.personal.weight,
    streak: userContext.progress.currentStreak,
    recentMeals: userContext.nutrition.recentMeals.length
  };

  // Weight progress summary for AI
  const weightProgressSummary = userContext.progress.weightProgress ? `
PROGRESO DE PESO:
- Objetivo: ${userContext.progress.weightProgress.goalType === 'gain_weight' ? 'Ganar peso' : userContext.progress.weightProgress.goalType === 'lose_weight' ? 'Perder peso' : 'Mantener peso'}
- Peso inicial: ${userContext.progress.weightProgress.startWeight}kg
- Peso actual: ${userContext.progress.weightProgress.currentWeight}kg
- Peso objetivo: ${userContext.progress.weightProgress.targetWeight}kg
- Cambio total: ${userContext.progress.weightProgress.totalChange > 0 ? '+' : ''}${userContext.progress.weightProgress.totalChange.toFixed(1)}kg
- Progreso: ${userContext.progress.weightProgress.progressPercentage.toFixed(0)}% completado
- Tendencia semanal: ${userContext.progress.weightProgress.weeklyTrend.change > 0 ? '+' : ''}${userContext.progress.weightProgress.weeklyTrend.change.toFixed(1)}kg (${userContext.progress.weightProgress.weeklyTrend.trend})
- Estado emocional: ${userContext.progress.weightProgress.feelingRating ? `${userContext.progress.weightProgress.feelingRating}/5` : 'No registrado'}
- Última medición: ${userContext.progress.weightProgress.lastRecorded ? formatChatTime(new Date(userContext.progress.weightProgress.lastRecorded)) : 'No registrada'}
${userContext.progress.weightProgress.notes ? `- Notas: ${userContext.progress.weightProgress.notes}` : ''}` : 'PROGRESO DE PESO: No configurado';

  // Detectar si es mensaje inicial
  const isInitialMessage = userMessage === "iniciar_conversacion";

  // Mensaje inicial especial con detección inteligente
  if (isInitialMessage) {
    const setupStatus = [];
    if (userContext.status.needsGuidance.workout) setupStatus.push('rutina');
    if (userContext.status.needsGuidance.nutritionSetup) setupStatus.push('configuración nutricional');
    if (userContext.status.needsGuidance.nutrition) setupStatus.push('plan alimenticio');

    return `
IDENTIDAD: Eres ${trainerConfig.trainerName}, ${trainerConfig.trainerGender === 'male' ? 'entrenador personal masculino' : 'entrenadora personal femenina'} con personalidad ${trainerConfig.interactionTone}.

PERSONALIDAD: ${getPersonalityDescription(trainerConfig)}

USUARIO: ${userContext.personal.name}, ${userContext.personal.age} años, objetivo: ${userContext.personal.fitnessGoal}, nivel: ${userContext.personal.fitnessLevel}

ESTADO DEL USUARIO:
${userContext.status.hasActiveWorkout ? '✅ Tiene rutina activa' : '❌ Sin rutina'}
${userContext.status.hasNutritionPlan ? '✅ Tiene plan alimenticio' : '❌ Sin plan alimenticio'}
${userContext.status.hasNutritionPreferences ? '✅ Nutrición configurada' : '❌ Nutrición sin configurar'}

INSTRUCCIÓN:
${setupStatus.length > 0
  ? `Saluda brevemente y menciona que necesita configurar: ${setupStatus.join(', ')}. Ofrece ayuda para empezar. Máximo 40 palabras.`
  : `Saluda a ${userContext.personal.name} y menciona que ya tiene todo configurado. Pregunta cómo se siente hoy. Máximo 30 palabras.`
}

RESPUESTA:`;
  }

  // 🧠 ANÁLISIS INTELIGENTE DEL ESTADO DEL USUARIO
  const workoutStatus = userContext.workouts.dailyPlan
    ? `RUTINA ACTIVA: "${userContext.workouts.dailyPlan.exercises?.[0]?.name || 'Rutina del día'}" (${userContext.workouts.dailyPlan.estimatedDuration || 30} min, ${userContext.workouts.dailyPlan.exercises?.length || 0} ejercicios)`
    : userContext.workouts.activePlan
    ? `PLAN TRADICIONAL: "${userContext.workouts.activePlan.name}" (${userContext.workouts.activePlan.difficulty})`
    : '❌ SIN RUTINA - NECESITA CREAR UNA';

  const nutritionStatus = userContext.nutrition.dailyPlan
    ? `PLAN ALIMENTICIO: "${userContext.nutrition.dailyPlan.totalCalories || 0} cal" (${userContext.nutrition.dailyPlan.meals?.length || 0} comidas)`
    : userContext.nutrition.preferences
    ? '⚠️ CONFIGURADO PERO SIN PLAN DIARIO - NECESITA GENERAR'
    : '❌ SIN CONFIGURACIÓN NUTRICIONAL - NECESITA CONFIGURAR';

  const guidanceNeeded = [];
  if (userContext.status.needsGuidance.workout) guidanceNeeded.push('CREAR RUTINA');
  if (userContext.status.needsGuidance.nutrition) guidanceNeeded.push('GENERAR PLAN ALIMENTICIO');
  if (userContext.status.needsGuidance.nutritionSetup) guidanceNeeded.push('CONFIGURAR NUTRICIÓN');

  return `
IDENTIDAD: Eres ${trainerConfig.trainerName}, ${trainerConfig.trainerGender === 'male' ? 'entrenador personal masculino' : 'entrenadora personal femenina'} con personalidad ${trainerConfig.interactionTone}.

PERSONALIDAD: ${getPersonalityDescription(trainerConfig)}

DATOS DEL USUARIO:
- Nombre: ${userContext.personal.name}
- Edad: ${userContext.personal.age} años, Peso: ${userContext.personal.weight}kg, Altura: ${userContext.personal.height}cm
- Nivel: ${userContext.personal.fitnessLevel}, Objetivo: ${userContext.personal.fitnessGoal}
- Entrenamientos esta semana: ${currentStats.workoutsThisWeek}, Racha: ${currentStats.streak} días
- Equipamiento: ${userContext.preferences.equipment.join(', ') || 'No especificado'}
- Limitaciones: ${userContext.preferences.limitations.join(', ') || 'Ninguna'}
- Frecuencia deseada: ${userContext.preferences.weeklyFrequency} días/semana

🏋️ ESTADO DE RUTINAS: ${workoutStatus}
🥗 ESTADO NUTRICIONAL: ${nutritionStatus}

${userContext.nutrition.preferences ? `
🍎 PREFERENCIAS NUTRICIONALES DETALLADAS:
- Tipo de dieta: ${userContext.nutrition.preferences.dietType || 'No especificada'}
- Tipos personalizados: ${userContext.nutrition.preferences.customDietTypes?.join(', ') || 'Ninguno'}
- Alergias: ${[...(userContext.nutrition.preferences.allergies || []), ...(userContext.nutrition.preferences.customAllergies || [])].join(', ') || 'Ninguna'}
- Restricciones médicas: ${[...(userContext.nutrition.preferences.medicalRestrictions || []), ...(userContext.nutrition.preferences.customMedicalRestrictions || [])].join(', ') || 'Ninguna'}
- Comidas favoritas: ${userContext.nutrition.preferences.favoriteFoods?.join(', ') || 'No especificadas'}
- Hábitos personalizados: ${userContext.nutrition.preferences.customFoodHabits?.join(', ') || 'Ninguno'}
- Calidad hábitos: ${userContext.nutrition.preferences.foodHabitsRating || 3}/5
- Meta calórica: ${userContext.nutrition.preferences.dailyCalorieGoal || 'No establecida'} cal/día
` : ''}

${guidanceNeeded.length > 0 ? `⚠️ NECESITA GUÍA PARA: ${guidanceNeeded.join(', ')}` : '✅ TODO CONFIGURADO'}

${weightProgressSummary}

MENSAJE DEL USUARIO: "${userMessage}"

INSTRUCCIONES CRÍTICAS BASADAS EN ESTADO:

${guidanceNeeded.length > 0 ? `
🚨 PRIORIDAD ALTA - USUARIO NECESITA GUÍA:
${userContext.status.needsGuidance.workout ? '• DEBE dirigir al usuario a crear su rutina en la sección "Workouts" antes de dar consejos de entrenamiento' : ''}
${userContext.status.needsGuidance.nutritionSetup ? '• DEBE dirigir al usuario a configurar sus preferencias nutricionales en "Nutrition > Configuración" antes de hablar de alimentación' : ''}
${userContext.status.needsGuidance.nutrition ? '• DEBE dirigir al usuario a generar su plan alimenticio diario en "Nutrition > Generar Plan" antes de dar consejos nutricionales' : ''}

MENSAJE REQUERIDO: "Veo que aún no tienes [rutina/plan alimenticio]. Para darte el mejor coaching, necesitas [crear tu rutina/configurar tu nutrición] primero. Ve a [sección específica] y cuando esté listo, regresa para que te ayude paso a paso."
` : `
✅ USUARIO COMPLETAMENTE CONFIGURADO - COACHING AVANZADO DISPONIBLE:
• Puede dar consejos específicos sobre su rutina actual
• Puede analizar su plan alimenticio y sugerir mejoras
• Puede hacer coaching basado en su progreso real
• Puede celebrar logros específicos y dar feedback detallado
`}

REGLAS GENERALES:
1. SÉ DIRECTO Y ESPECÍFICO - NO des vueltas al asunto
2. NUNCA generes rutinas o planes - SOLO lee y comenta los existentes
3. Si no tiene configuración, DIRIGE a la sección correcta
4. Si tiene todo configurado, da coaching basado en datos reales
5. EVITA frases como "podríamos", "qué te parece si" - SÉ DECISIVO
6. Celebra logros específicos con datos reales

RESPUESTA (50-100 palabras, directo y específico):`;
}

// Process AI data updates (placeholder)
async function processAIDataUpdates(userId: number, dataUpdates: any) {
  try {
    if (dataUpdates.emotional) {
      await storage.createEmotionalEntry({
        userId,
        ...dataUpdates.emotional
      });
    }

    if (dataUpdates.fitness) {
      await storage.createFitnessTest({
        userId,
        ...dataUpdates.fitness
      });
    }
  } catch (error) {
    console.error('Error processing AI data updates:', error);
  }
}

// 🏋️‍♂️ FUNCIONES AUXILIARES PARA MESOCICLOS Y SPLITS
async function getActiveMesocycle(userId: number) {
  try {
    const { data, error } = await supabase
      .from('workout_mesocycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active mesocycle:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getActiveMesocycle:', error);
    return null;
  }
}

async function getUserSplitAssignments(userId: number) {
  try {
    const { data, error } = await supabase
      .from('user_split_assignments')
      .select(`
        *,
        scientific_splits (
          id, split_name, split_type, muscle_groups,
          scientific_rationale, recovery_time_hours, difficulty_level
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('day_name');

    if (error) {
      console.error('Error fetching split assignments:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getUserSplitAssignments:', error);
    return [];
  }
}

async function getTodaySplitAssignment(userId: number) {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const { data, error } = await supabase
      .from('user_split_assignments')
      .select(`
        *,
        scientific_splits (
          id, split_name, split_type, muscle_groups,
          scientific_rationale, recovery_time_hours, difficulty_level
        )
      `)
      .eq('user_id', userId)
      .eq('day_name', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today split assignment:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getTodaySplitAssignment:', error);
    return null;
  }
}

// 📊 FUNCIONES AUXILIARES PARA FEEDBACK Y RPE
async function getRecentWorkoutFeedback(userId: number) {
  try {
    const { data, error } = await supabase
      .from('workout_feedback_sessions')
      .select(`
        *,
        workout_sessions (
          id, started_at, completed_at, status, exercises
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching workout feedback:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getRecentWorkoutFeedback:', error);
    return [];
  }
}

async function getExerciseFeedbackHistory(userId: number) {
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select(`
        *,
        workout_sessions!inner(user_id, started_at, status)
      `)
      .eq('workout_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching exercise feedback history:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getExerciseFeedbackHistory:', error);
    return [];
  }
}

async function getUserFeedbackProfile(userId: number) {
  try {
    const { data, error } = await supabase
      .from('user_feedback_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user feedback profile:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getUserFeedbackProfile:', error);
    return null;
  }
}

// 📈 FUNCIONES AUXILIARES PARA MÉTRICAS DEL DASHBOARD
async function getDashboardMetrics(userId: number) {
  try {
    // Importar el servicio de analytics
    const { analyticsService } = await import('../services/analyticsService');

    const [progressMetrics, adherenceMetrics, effectivenessMetrics] = await Promise.all([
      analyticsService.calculateProgressMetrics(userId, 30),
      analyticsService.calculateAdherenceMetrics(userId, 30),
      analyticsService.calculateEffectivenessMetrics(userId, 30)
    ]);

    return {
      progress: progressMetrics,
      adherence: adherenceMetrics,
      effectiveness: effectivenessMetrics
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return null;
  }
}

async function getRecoveryStatus(userId: number) {
  try {
    // Importar el servicio científico
    const { scientificWorkoutService } = await import('../services/scientificWorkoutService');

    const recoveryStatus = await scientificWorkoutService.getMuscleRecoveryStatus(userId);
    return recoveryStatus;
  } catch (error) {
    console.error('Error fetching recovery status:', error);
    return null;
  }
}

async function getAdherenceMetrics(userId: number) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id, status, started_at, completed_at')
      .eq('user_id', userId)
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching adherence metrics:', error);
      return null;
    }

    const totalSessions = data?.length || 0;
    const completedSessions = data?.filter(s => s.status === 'completed').length || 0;
    const adherenceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      completedSessions,
      adherenceRate: Math.round(adherenceRate)
    };
  } catch (error) {
    console.error('Error in getAdherenceMetrics:', error);
    return null;
  }
}

// 🧠 FUNCIONES AUXILIARES PARA LEARNING DATA E IA
async function getLearningData(userId: number) {
  try {
    const preferences = await storage.getUserWorkoutPreferencesHistory(userId);

    if (!preferences || preferences.length === 0) {
      return null;
    }

    // Analizar patrones
    const favoriteExercises = extractFavoriteExercises(preferences);
    const avoidedExercises = extractAvoidedExercises(preferences);
    const weeklyPattern = extractWeeklyPattern(preferences);
    const averageRating = calculateAverageRating(preferences);

    return {
      favoriteExercises,
      avoidedExercises,
      weeklyPattern,
      averageRating,
      totalFeedback: preferences.length
    };
  } catch (error) {
    console.error('Error getting learning data:', error);
    return null;
  }
}

async function getAIInsights(userId: number) {
  try {
    // Importar el servicio de AI Learning
    const { AILearningService } = await import('../services/aiLearningService');
    const aiLearningService = new AILearningService();

    const insights = await aiLearningService.generateAIInsights(userId);
    return insights;
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return null;
  }
}

async function getExerciseLogs(userId: number) {
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select(`
        *,
        workout_sessions!inner(user_id, started_at, status)
      `)
      .eq('workout_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching exercise logs:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getExerciseLogs:', error);
    return [];
  }
}

async function getWeightSuggestions(userId: number) {
  try {
    const { data, error } = await supabase
      .from('weight_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching weight suggestions:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getWeightSuggestions:', error);
    return [];
  }
}

async function getMuscleGroupProgress(userId: number) {
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select(`
        exercise_name,
        weight_used,
        reps_completed,
        created_at,
        workout_sessions!inner(user_id, started_at)
      `)
      .eq('workout_sessions.user_id', userId)
      .gte('workout_sessions.started_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching muscle group progress:', error);
      return [];
    }

    // Agrupar por ejercicio y calcular progreso
    const exerciseProgress = {};
    data?.forEach(log => {
      const exerciseName = log.exercise_name;
      if (!exerciseProgress[exerciseName]) {
        exerciseProgress[exerciseName] = [];
      }
      exerciseProgress[exerciseName].push({
        weight: log.weight_used,
        reps: log.reps_completed,
        date: log.workout_sessions.started_at
      });
    });

    return exerciseProgress;
  } catch (error) {
    console.error('Error in getMuscleGroupProgress:', error);
    return {};
  }
}

// 🔍 FUNCIONES AUXILIARES PARA ANÁLISIS DE PATRONES
function extractFavoriteExercises(preferences: any[]): string[] {
  const exerciseRatings = {};
  preferences.forEach(pref => {
    if (pref.exercise_name && pref.rating >= 4) {
      exerciseRatings[pref.exercise_name] = (exerciseRatings[pref.exercise_name] || 0) + 1;
    }
  });

  return Object.entries(exerciseRatings)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([exercise]) => exercise);
}

function extractAvoidedExercises(preferences: any[]): string[] {
  const exerciseRatings = {};
  preferences.forEach(pref => {
    if (pref.exercise_name && pref.rating <= 2) {
      exerciseRatings[pref.exercise_name] = (exerciseRatings[pref.exercise_name] || 0) + 1;
    }
  });

  return Object.entries(exerciseRatings)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([exercise]) => exercise);
}

function extractWeeklyPattern(preferences: any[]): any {
  const dayPattern = {};
  preferences.forEach(pref => {
    if (pref.workout_date) {
      const day = new Date(pref.workout_date).getDay();
      dayPattern[day] = (dayPattern[day] || 0) + 1;
    }
  });

  return dayPattern;
}

function calculateAverageRating(preferences: any[]): number {
  if (!preferences.length) return 0;
  const totalRating = preferences.reduce((sum, pref) => sum + (pref.rating || 0), 0);
  return Math.round((totalRating / preferences.length) * 10) / 10;
}

function extractUserPatterns(exerciseHistory: any[], workoutSessions: any[]): any {
  return {
    preferredTimeOfDay: extractPreferredWorkoutTime(workoutSessions),
    averageWorkoutDuration: calculateAverageWorkoutDuration(workoutSessions),
    mostUsedEquipment: extractMostUsedEquipment(exerciseHistory),
    strengthProgression: calculateStrengthProgression(exerciseHistory)
  };
}

function extractAdvancedPreferences(recentFeedback: any[], exerciseHistory: any[]): any {
  return {
    preferredIntensity: calculatePreferredIntensity(recentFeedback),
    recoveryNeeds: calculateRecoveryNeeds(recentFeedback),
    motivationFactors: extractMotivationFactors(recentFeedback)
  };
}

function extractPreferredWorkoutTime(sessions: any[]): string {
  const timeSlots = { morning: 0, afternoon: 0, evening: 0 };

  sessions.forEach(session => {
    if (session.startedAt) {
      const hour = new Date(session.startedAt).getHours();
      if (hour < 12) timeSlots.morning++;
      else if (hour < 18) timeSlots.afternoon++;
      else timeSlots.evening++;
    }
  });

  return Object.entries(timeSlots).reduce((a, b) => timeSlots[a[0]] > timeSlots[b[0]] ? a : b)[0];
}

function calculateAverageWorkoutDuration(sessions: any[]): number {
  const completedSessions = sessions.filter(s => s.completedAt && s.startedAt);
  if (!completedSessions.length) return 0;

  const totalDuration = completedSessions.reduce((sum, session) => {
    const duration = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
    return sum + (duration / (1000 * 60)); // Convert to minutes
  }, 0);

  return Math.round(totalDuration / completedSessions.length);
}

function extractMostUsedEquipment(exerciseHistory: any[]): string[] {
  // Esta función necesitaría mapear ejercicios a equipamiento
  // Por ahora retornamos un array vacío
  return [];
}

function calculateStrengthProgression(exerciseHistory: any[]): any {
  const progressionData = {};

  exerciseHistory.forEach(log => {
    const exercise = log.exercise_name;
    if (!progressionData[exercise]) {
      progressionData[exercise] = [];
    }
    progressionData[exercise].push({
      weight: log.weight_used,
      reps: log.reps_completed,
      date: log.workout_sessions?.started_at
    });
  });

  // Calcular progresión para cada ejercicio
  Object.keys(progressionData).forEach(exercise => {
    const data = progressionData[exercise].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (data.length >= 2) {
      const first = data[0];
      const last = data[data.length - 1];
      progressionData[exercise] = {
        initialWeight: first.weight,
        currentWeight: last.weight,
        improvement: last.weight - first.weight,
        sessions: data.length
      };
    }
  });

  return progressionData;
}

function calculatePreferredIntensity(feedback: any[]): string {
  if (!feedback.length) return 'moderate';

  const avgRPE = feedback.reduce((sum, f) => sum + (f.post_rpe || 5), 0) / feedback.length;

  if (avgRPE >= 8) return 'high';
  if (avgRPE >= 6) return 'moderate';
  return 'low';
}

function calculateRecoveryNeeds(feedback: any[]): string {
  if (!feedback.length) return 'normal';

  const avgFatigue = feedback.reduce((sum, f) => sum + (f.post_fatigue || 3), 0) / feedback.length;

  if (avgFatigue >= 4) return 'high';
  if (avgFatigue >= 2.5) return 'normal';
  return 'low';
}

function extractMotivationFactors(feedback: any[]): string[] {
  const factors = [];

  feedback.forEach(f => {
    if (f.post_satisfaction >= 4) {
      if (f.preferred_exercises?.length) {
        factors.push('variety_in_exercises');
      }
      if (f.post_progress_feeling >= 4) {
        factors.push('visible_progress');
      }
    }
  });

  return [...new Set(factors)];
}

export default router;
