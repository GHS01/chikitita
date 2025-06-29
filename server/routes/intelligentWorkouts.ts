import express from 'express';
import { z } from 'zod';
import { storage as supabaseStorage } from '../storageNew';
import { geminiService } from '../geminiService';
import { intelligentFeedbackService } from '../services/intelligentFeedbackService';
import { authenticateToken } from '../middleware/auth';
// 🕐 SISTEMA CENTRALIZADO - FIX TIMEZONE
import { getCurrentDate } from '../utils/timeSystem';
import { insertUserWorkoutPreferencesSchema, insertDailyWorkoutPlanSchema } from '../../shared/schema';
import { supabase } from '../supabase';
import bcrypt from 'bcrypt';
// 🛌 NUEVAS IMPORTACIONES PARA DÍAS DE DESCANSO
import { scientificWorkoutService } from '../services/scientificWorkoutService';
import { splitAssignmentService } from '../services/splitAssignmentService';

const router = express.Router();

// 🛌 FUNCIONES AUXILIARES PARA DÍAS DE DESCANSO
function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

async function getNextWorkoutDay(userId: number, currentDay: string): Promise<string | null> {
  try {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentIndex = days.indexOf(currentDay);

    // Buscar el próximo día con asignación de split
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (currentIndex + i) % 7;
      const nextDay = days[nextIndex];

      const assignment = await splitAssignmentService.getSplitForDay(userId, nextDay);
      if (assignment) {
        return nextDay;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ [getNextWorkoutDay] Error:', error);
    return null;
  }
}

// 🎯 NUEVA FUNCIÓN: Calcular fecha y día correctos para rutina
async function getWorkoutDateAndDay(userId: number): Promise<{
  workoutDate: string;
  dayOfWeek: string;
  isToday: boolean;
  message?: string;
}> {
  try {
    const today = new Date();
    const todayString = getCurrentDate();
    const todayDayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    console.log('📅 [getWorkoutDateAndDay] Checking workout date for user:', userId);
    console.log('📅 [getWorkoutDateAndDay] Today is:', todayDayOfWeek, '(', todayString, ')');

    // Verificar si hoy es día de entrenamiento
    const todayAssignment = await splitAssignmentService.getSplitForDay(userId, todayDayOfWeek);

    if (todayAssignment) {
      // Hoy es día de entrenamiento - usar fecha actual
      console.log('✅ [getWorkoutDateAndDay] Today is training day, using current date');
      return {
        workoutDate: todayString,
        dayOfWeek: todayDayOfWeek,
        isToday: true,
        message: 'Rutina generada para hoy'
      };
    } else {
      // Hoy es día de descanso - buscar próximo día de entrenamiento
      console.log('🛌 [getWorkoutDateAndDay] Today is rest day, finding next training day');
      const nextWorkoutDay = await getNextWorkoutDay(userId, todayDayOfWeek);

      if (nextWorkoutDay) {
        const nextWorkoutDate = getDateForDay(nextWorkoutDay);
        console.log('✅ [getWorkoutDateAndDay] Next training day found:', nextWorkoutDay, '(', nextWorkoutDate, ')');
        return {
          workoutDate: nextWorkoutDate,
          dayOfWeek: nextWorkoutDay,
          isToday: false,
          message: `Rutina generada para ${nextWorkoutDay} (${nextWorkoutDate})`
        };
      } else {
        // Fallback: usar fecha actual si no hay días de entrenamiento configurados
        console.log('⚠️ [getWorkoutDateAndDay] No training days found, using current date as fallback');
        return {
          workoutDate: todayString,
          dayOfWeek: todayDayOfWeek,
          isToday: true,
          message: 'No hay días de entrenamiento configurados, usando fecha actual'
        };
      }
    }
  } catch (error) {
    console.error('❌ [getWorkoutDateAndDay] Error:', error);
    // Fallback en caso de error
    const todayString = getCurrentDate();
    const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return {
      workoutDate: todayString,
      dayOfWeek: todayDayOfWeek,
      isToday: true,
      message: 'Error calculando fecha, usando fecha actual'
    };
  }
}

// 🎯 NUEVA FUNCIÓN: Calcular fecha para un día específico
function getDateForDay(dayName: string): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  const currentDayIndex = today.getDay();
  const targetDayIndex = days.indexOf(dayName.toLowerCase());

  // Validación: si el día no existe, usar fecha actual
  if (targetDayIndex === -1) {
    console.error('❌ [getDateForDay] Invalid day name:', dayName, 'using current date');
    return getCurrentDate();
  }

  let daysToAdd = targetDayIndex - currentDayIndex;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Próxima semana
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd);

  // Retornar en formato YYYY-MM-DD
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Schema para feedback de rutina
const workoutFeedbackSchema = z.object({
  satisfactionRating: z.number().min(1).max(5).optional(), // Opcional para modo científico
  dislikeReasons: z.array(z.string()).optional(),
  todayMusclePreference: z.array(z.string()).optional(),
  preferredExercises: z.string().optional(),
  avoidedExercises: z.string().optional(),
  energyLevel: z.string(),
  availableTime: z.union([z.string(), z.number()]), // Aceptar string o number
  userFeedback: z.string().optional(),
  previousRoutineId: z.number().optional(),
  // Campos para modo científico
  isScientificMode: z.boolean().optional(),
  scientificSplit: z.any().optional(),
  selectedSplitId: z.number().optional(),
  personalizedPreferences: z.object({
    intensityPreference: z.string().optional(),
    preferredExercises: z.string().optional(),
    avoidedExercises: z.string().optional(),
  }).optional(),
  splitData: z.object({
    id: z.number(),
    split_name: z.string(),
    split_type: z.string(),
    muscle_groups: z.array(z.string()),
    recovery_time_hours: z.number(),
    scientific_rationale: z.string(),
    difficulty_level: z.string(),
  }).optional(),
});

// 🚀 NUEVO: Schema para First-Day Feedback (usuarios nuevos)
const firstDayFeedbackSchema = z.object({
  // 🎯 PREGUNTA PRINCIPAL (OBLIGATORIO)
  muscleGroupsSelected: z.array(z.string()).min(1, "Debes seleccionar al menos un grupo muscular"),

  // ⚡ ESTADO ACTUAL (OBLIGATORIO)
  energyLevel: z.enum(['low', 'medium', 'high']),
  availableTime: z.enum(['15-20', '30-40', '45-60', '60+']),

  // 💪 PREFERENCIAS OPCIONALES
  preferredIntensity: z.enum(['light', 'moderate', 'intense']).optional(),
  specificGoalToday: z.string().optional(), // "Quiero sentirme energizado"

  // 🚫 LIMITACIONES DEL DÍA
  todayLimitations: z.array(z.string()).optional(), // ["back_pain_today", "low_energy"]

  // 📝 CONTEXTO ADICIONAL
  userNotes: z.string().optional(), // Comentarios adicionales del usuario

  // 🔍 METADATOS (se calculan automáticamente en el servidor)
  isFirstTime: z.boolean().default(true),
});

/**
 * 🚀 POST /api/intelligent-workouts/first-day-feedback
 * Procesa feedback de usuarios nuevos y genera rutina personalizada desde el primer día
 */
router.post('/first-day-feedback', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 [FirstDayFeedback] Processing first-day feedback and generating personalized routine...');

    const userId = req.user!.id;
    const feedbackData = firstDayFeedbackSchema.parse(req.body);

    // 1. Obtener datos del usuario
    const [userProfile, userPreferences] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Calcular metadatos de contexto
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const timeOfDay = getTimeOfDay();
    const currentDate = getCurrentDate();

    console.log('🎯 [FirstDayFeedback] User selected muscle groups:', feedbackData.muscleGroupsSelected);
    console.log('🎯 [FirstDayFeedback] Energy level:', feedbackData.energyLevel);
    console.log('🎯 [FirstDayFeedback] Available time:', feedbackData.availableTime);

    // 3. Guardar preferencias del primer día
    const firstDayPreference = {
      workoutDate: currentDate,
      dayOfWeek,
      timeOfDay,
      muscleGroupsSelected: feedbackData.muscleGroupsSelected,
      energyLevel: feedbackData.energyLevel,
      availableTime: feedbackData.availableTime,
      preferredIntensity: feedbackData.preferredIntensity,
      specificGoalToday: feedbackData.specificGoalToday,
      todayLimitations: feedbackData.todayLimitations || [],
      isFirstTime: feedbackData.isFirstTime,
      userNotes: feedbackData.userNotes,
    };

    // 4. Convertir datos para el sistema de generación de rutinas
    const adaptedFeedbackData = {
      todayMusclePreference: feedbackData.muscleGroupsSelected,
      energyLevel: feedbackData.energyLevel,
      availableTime: feedbackData.availableTime,
      preferredIntensity: feedbackData.preferredIntensity || 'moderate',
      userFeedback: feedbackData.userNotes,
      specificGoalToday: feedbackData.specificGoalToday,
      todayLimitations: feedbackData.todayLimitations || []
    };

    console.log('🧠 [FirstDayFeedback] Generating personalized workout plan...');

    // 5. Generar rutina personalizada con IA
    const workoutPlan = await geminiService.generateDailyWorkoutPlan({
      userProfile,
      userPreferences,
      feedbackData: adaptedFeedbackData,
      learningData: null, // No hay datos de aprendizaje para usuarios nuevos
      currentDate,
      dayOfWeek
    });

    // 6. Guardar rutina diaria
    const dailyPlan = {
      workoutDate: currentDate,
      exercises: workoutPlan.exercises,
      estimatedDuration: workoutPlan.duration,
      targetMuscleGroups: workoutPlan.targetMuscleGroups || [],
      generatedBasedOn: {
        ...workoutPlan.generatedBasedOn,
        firstDayFeedback: true,
        selectedMuscleGroups: feedbackData.muscleGroupsSelected,
        userEnergyLevel: feedbackData.energyLevel
      },
      aiConfidenceScore: workoutPlan.aiConfidence || 0.8, // Mayor confianza con datos específicos
    };

    const savedPlan = await supabaseStorage.createDailyWorkoutPlan({ ...dailyPlan, userId });

    // 7. Actualizar first day preference con el ID de la rutina generada
    firstDayPreference.generatedRoutineId = savedPlan.id;

    // 8. Guardar preferencias del primer día en la base de datos
    await supabaseStorage.createFirstDayPreference({ ...firstDayPreference, userId });

    // 9. Crear descripción personalizada
    const routineDescription = generateFirstDayRoutineDescription(
      userProfile,
      userPreferences,
      feedbackData,
      workoutPlan
    );

    console.log('✅ [FirstDayFeedback] First-day routine generated successfully with AI confidence:', workoutPlan.aiConfidence);

    res.json({
      success: true,
      message: 'First-day routine generated successfully',
      workoutPlan: {
        ...workoutPlan,
        id: savedPlan.id,
        description: routineDescription,
        personalizedInsights: {
          basedOnFirstDayFeedback: true,
          basedOnPreferences: !!userPreferences,
          basedOnLearning: false,
          aiConfidence: workoutPlan.aiConfidence,
          dayOfWeek,
          energyLevel: feedbackData.energyLevel,
          selectedMuscleGroups: feedbackData.muscleGroupsSelected,
          isFirstTime: feedbackData.isFirstTime
        }
      }
    });

  } catch (error) {
    console.error('❌ [FirstDayFeedback] Error processing first-day feedback:', error);
    res.status(500).json({
      error: 'Failed to process first-day feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/intelligent-workouts/feedback
 * Guarda feedback del usuario y genera nueva rutina personalizada
 * 🚨 REQUIERE: Configuración completa, día válido Y mesociclo activo
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    console.log('🧠 [IntelligentWorkouts] Processing feedback and generating routine...');

    const userId = req.user!.id;

    // 🔍 PASO 1: Verificar si existe mesociclo activo
    const { data: activeMesocycle, error: mesocycleError } = await supabase
      .from('workout_mesocycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (mesocycleError && mesocycleError.code !== 'PGRST116') {
      console.error('❌ [IntelligentWorkouts] Error checking mesocycle:', mesocycleError);
      return res.status(500).json({ error: 'Error checking mesocycle status' });
    }

    if (!activeMesocycle) {
      console.log('❌ [IntelligentWorkouts] No active mesocycle found');
      return res.status(400).json({
        error: 'No active mesocycle found',
        message: 'Please create a mesocycle first to generate workouts',
        action: 'create_mesocycle'
      });
    }

    // 🗓️ PASO 2: Verificar si hoy es día de entrenamiento
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const { data: splitAssignment, error: assignmentError } = await supabase
      .from('user_split_assignments')
      .select(`
        *,
        scientific_splits (
          id,
          split_name,
          split_type,
          muscle_groups,
          scientific_rationale,
          recovery_time_hours,
          difficulty_level
        )
      `)
      .eq('user_id', userId)
      .eq('day_name', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') {
      console.error('❌ [IntelligentWorkouts] Error checking split assignment:', assignmentError);
      return res.status(500).json({ error: 'Error checking workout schedule' });
    }

    // 🛌 PASO 3: Si no hay asignación, es día de descanso
    if (!splitAssignment) {
      console.log('🛌 [IntelligentWorkouts] Today is a rest day:', dayOfWeek);
      return res.status(200).json({
        success: true,
        isRestDay: true,
        message: '¡Hoy es tu día de descanso! 🛌',
        motivationalMessage: 'El descanso es tan importante como el entrenamiento. Tu cuerpo se está recuperando y creciendo. ¡Relájate y vuelve mañana recargado! 💪',
        dayOfWeek,
        mesocycle: {
          name: activeMesocycle.mesocycle_name,
          splitType: activeMesocycle.split_type,
          weekRemaining: Math.ceil((new Date(activeMesocycle.end_date).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000))
        },
        nextWorkoutDay: await getNextWorkoutDay(userId, dayOfWeek)
      });
    }

    console.log('💪 [IntelligentWorkouts] Training day confirmed:', dayOfWeek, 'Split:', splitAssignment.scientific_splits.split_name);

    // 🧬 NUEVO: Detectar si está en modo científico
    const isScientificMode = req.body.isScientificMode || false;
    const scientificSplit = req.body.scientificSplit || null;

    if (isScientificMode) {
      console.log('🧬 [ScientificMode] Processing scientific workout generation...');
      console.log('🧬 [ScientificMode] Split data:', scientificSplit);
    }

    const feedbackData = workoutFeedbackSchema.parse(req.body);

    // 1. Obtener datos del usuario
    const [userProfile, userPreferences] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Obtener aprendizaje acumulado (preferencias históricas + rutinas rechazadas)
    const [learningData, rejectedPlans] = await Promise.all([
      getLearningData(userId),
      supabaseStorage.getRejectedWorkoutPlans(userId)
    ]);

    // 3. Obtener rutina anterior que se está rechazando
    let previousWorkoutPlan = null;
    if (feedbackData.previousRoutineId) {
      try {
        // Obtener datos completos de la rutina anterior
        previousWorkoutPlan = await supabaseStorage.getDailyWorkoutPlan(userId, new Date().toISOString().split('T')[0]);
        if (!previousWorkoutPlan && feedbackData.previousRoutineId) {
          // Si no encontramos la rutina del día, buscar por ID en workoutPlans
          console.log('🔍 [IntelligentWorkouts] Searching for previous workout plan by ID:', feedbackData.previousRoutineId);
        }
      } catch (error) {
        console.error('❌ [IntelligentWorkouts] Error getting previous workout plan:', error);
      }
    }

    // 4. 🧠 NUEVO: Guardar feedback usando el sistema inteligente
    // Variables ya declaradas arriba en la verificación de días de descanso

    // Guardar feedback raw para análisis inteligente
    await intelligentFeedbackService.saveFeedbackRaw(
      userId,
      'workout_feedback',
      feedbackData,
      {
        dayOfWeek,
        timeOfDay: getTimeOfDay(),
        previousRoutineId: feedbackData.previousRoutineId,
        workoutDate: getCurrentDate()
      }
    );

    // Mantener compatibilidad con sistema anterior
    const feedbackEntry = {
      previousRoutineId: feedbackData.previousRoutineId,
      satisfactionRating: feedbackData.satisfactionRating || 4, // Default para modo científico
      dislikeReasons: feedbackData.dislikeReasons || [],
      preferredMuscleGroups: { [dayOfWeek]: feedbackData.todayMusclePreference || [] },
      preferredExercises: feedbackData.preferredExercises ? [feedbackData.preferredExercises] : [],
      avoidedExercises: feedbackData.avoidedExercises ? [feedbackData.avoidedExercises] : [],
      preferredIntensity: mapEnergyToIntensity(feedbackData.energyLevel),
      preferredDuration: parseDuration(feedbackData.availableTime),
      userFeedback: feedbackData.userFeedback,
      dayOfWeek,
      timeOfDay: getTimeOfDay(),
      energyLevel: feedbackData.energyLevel,
      availableTime: parseDuration(feedbackData.availableTime),
    };

    await supabaseStorage.createUserWorkoutPreferences({ ...feedbackEntry, userId });

    // 5. Si la satisfacción es baja (≤2), guardar como rutina rechazada
    if (feedbackData.satisfactionRating && feedbackData.satisfactionRating <= 2 && previousWorkoutPlan) {
      const rejectedPlan = {
        originalPlanId: feedbackData.previousRoutineId,
        originalPlanData: previousWorkoutPlan,
        rejectionReasons: feedbackData.dislikeReasons || [],
        specificDislikes: {
          exercises: feedbackData.avoidedExercises ? [feedbackData.avoidedExercises] : [],
          duration: feedbackData.dislikeReasons?.includes('too_long') || feedbackData.dislikeReasons?.includes('too_short'),
          intensity: feedbackData.dislikeReasons?.includes('too_intense') || feedbackData.dislikeReasons?.includes('too_easy'),
          muscleGroups: feedbackData.dislikeReasons?.includes('wrong_muscle_groups') ? [] : undefined,
        },
        userFeedback: feedbackData.userFeedback,
        dayOfWeek,
        timeOfDay: getTimeOfDay(),
        userEnergyLevel: feedbackData.energyLevel,
      };

      await supabaseStorage.createRejectedWorkoutPlan({ ...rejectedPlan, userId });
      console.log('📝 [IntelligentWorkouts] Saved rejected workout plan for learning');
    }

    // 🚀 NUEVO: Obtener historial de grupos musculares para evitar repeticiones
    const muscleGroupHistory = await getMuscleGroupHistory(userId);
    console.log('💪 [IntelligentWorkouts] Muscle group history:', muscleGroupHistory);

    // 6. Generar rutina ultra-personalizada con datos de rechazo
    const enhancedLearningData = {
      ...learningData,
      rejectedPlans: rejectedPlans || [],
      rejectedExercises: extractRejectedExercises(rejectedPlans || []),
      rejectedPatterns: extractRejectedPatterns(rejectedPlans || []),
      muscleGroupHistory, // 🚀 NUEVO: Historial de grupos musculares
    };

    // 🔧 TIMEZONE DEBUG
    const todayDate = getCurrentDate();
    const utcDate = today.toISOString().split('T')[0];
    console.log('🕐 [Workout Debug] 🔧 FIXED - Local date:', todayDate);
    console.log('🕐 [Workout Debug] ❌ OLD - UTC date:', utcDate);
    console.log('🕐 [Workout Debug] 🎯 Date comparison:', todayDate === utcDate ? 'SAME' : 'DIFFERENT - TIMEZONE FIX WORKING!');

    // 🧠 NUEVO: Obtener perfil consolidado de feedback inteligente
    let consolidatedProfile = null;
    try {
      consolidatedProfile = await intelligentFeedbackService.getUserConsolidatedProfile(userId);
      console.log(`🧠 [IntelligentWorkouts] Perfil consolidado obtenido para usuario ${userId}:`,
        consolidatedProfile ? `Confianza: ${consolidatedProfile.confidenceScore}` : 'No disponible');
    } catch (error) {
      console.log(`ℹ️ [IntelligentWorkouts] Perfil consolidado no disponible para usuario ${userId}:`, error.message);
    }

    // 🧬 FUSIÓN: Generar rutina científica + IA personalizada
    let workoutPlan;
    if (isScientificMode && scientificSplit) {
      console.log('🧬 [ScientificMode] Generating scientific + AI hybrid routine...');

      // Actualizar recuperación muscular
      const { scientificWorkoutService } = await import('../services/scientificWorkoutService');
      await scientificWorkoutService.updateMuscleRecovery(
        userId,
        scientificSplit.muscle_groups,
        scientificSplit.recovery_time_hours
      );

      // Generar rutina fusionando split científico con personalización IA
      workoutPlan = await geminiService.generateDailyWorkoutPlan({
        userProfile,
        userPreferences,
        feedbackData: {
          ...feedbackData,
          // Forzar grupos musculares del split científico
          todayMusclePreference: scientificSplit.muscle_groups,
          // Incluir explicación científica
          scientificRationale: scientificSplit.scientific_rationale
        },
        learningData: enhancedLearningData,
        currentDate: getCurrentDate(),
        dayOfWeek,
        consolidatedProfile: consolidatedProfile?.consolidatedPreferences,
        // 🧬 NUEVO: Contexto científico
        scientificContext: {
          splitName: scientificSplit.split_name,
          muscleGroups: scientificSplit.muscle_groups,
          recoveryTime: scientificSplit.recovery_time_hours,
          rationale: scientificSplit.scientific_rationale,
          difficultyLevel: scientificSplit.difficulty_level
        }
      });

      // Agregar metadatos científicos
      workoutPlan.scientificMetadata = {
        splitUsed: scientificSplit.split_name,
        scientificRationale: scientificSplit.scientific_rationale,
        muscleGroups: scientificSplit.muscle_groups,
        recoveryTime: scientificSplit.recovery_time_hours,
        isScientificMode: true
      };

    } else {
      // Modo tradicional
      workoutPlan = await geminiService.generateDailyWorkoutPlan({
        userProfile,
        userPreferences,
        feedbackData,
        learningData: enhancedLearningData,
        currentDate: getCurrentDate(),
        dayOfWeek,
        consolidatedProfile: consolidatedProfile?.consolidatedPreferences
      });
    }

    // 5. Guardar rutina diaria en base de datos
    const dailyPlan = {
      workoutDate: getCurrentDate(), // 🔧 FIX: Usar fecha local
      exercises: workoutPlan.exercises,
      estimatedDuration: workoutPlan.duration,
      targetMuscleGroups: workoutPlan.targetMuscleGroups || [],
      generatedBasedOn: workoutPlan.generatedBasedOn || {},
      aiConfidenceScore: workoutPlan.aiConfidence || 0.5,
      mesocycleId: activeMesocycle.id, // 🔗 NUEVO: Conectar con mesociclo activo
    };

    const savedPlan = await supabaseStorage.createDailyWorkoutPlan({ ...dailyPlan, userId });

    // 6. Crear descripción detallada de por qué se generó esta rutina
    const routineDescription = generateRoutineDescription(userProfile, userPreferences, feedbackData, learningData, workoutPlan);

    console.log('✅ [IntelligentWorkouts] Routine generated successfully with AI confidence:', workoutPlan.aiConfidence);

    res.json({
      success: true,
      workoutPlan: {
        ...workoutPlan,
        id: savedPlan.id,
        description: routineDescription,
        personalizedInsights: {
          basedOnFeedback: !!feedbackData,
          basedOnPreferences: !!userPreferences,
          basedOnLearning: !!learningData,
          basedOnConsolidatedProfile: !!consolidatedProfile,
          // 🧬 NUEVO: Información científica
          basedOnScientificSplit: isScientificMode,
          aiConfidence: workoutPlan.aiConfidence,
          dayOfWeek,
          energyLevel: feedbackData.energyLevel,
          // 🧠 NUEVO: Información del perfil consolidado
          consolidatedProfileInfo: consolidatedProfile ? {
            confidenceScore: consolidatedProfile.confidenceScore,
            totalFeedbackCount: consolidatedProfile.totalFeedbackCount,
            lastUpdated: consolidatedProfile.lastUpdated,
            dataSources: consolidatedProfile.dataSources,
            isReliable: consolidatedProfile.confidenceScore >= 0.7,
            preferredMuscleGroups: consolidatedProfile.consolidatedPreferences?.muscleGroupPreferences?.[dayOfWeek] || []
          } : null,
          // 🧬 NUEVO: Información científica
          scientificInfo: isScientificMode && workoutPlan.scientificMetadata ? {
            splitUsed: workoutPlan.scientificMetadata.splitUsed,
            scientificRationale: workoutPlan.scientificMetadata.scientificRationale,
            muscleGroups: workoutPlan.scientificMetadata.muscleGroups,
            recoveryTime: workoutPlan.scientificMetadata.recoveryTime,
            systemType: 'Híbrido: Ciencia + IA Personalizada'
          } : null
        }
      }
    });

  } catch (error) {
    console.error('❌ [IntelligentWorkouts] Error processing feedback:', error);
    res.status(500).json({
      error: 'Failed to process feedback and generate routine',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/intelligent-workouts/generate-simple
 * Genera rutina sin feedback (para usuarios nuevos)
 * 🚨 REQUIERE: Configuración completa, día válido Y mesociclo activo
 */
router.post('/generate-simple', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 [IntelligentWorkouts] Generating simple routine...');

    const userId = req.user!.id;

    // 🔍 PASO 1: Verificar si existe mesociclo activo
    const { data: activeMesocycle, error: mesocycleError } = await supabase
      .from('workout_mesocycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (mesocycleError && mesocycleError.code !== 'PGRST116') {
      console.error('❌ [IntelligentWorkouts] Error checking mesocycle:', mesocycleError);
      return res.status(500).json({ error: 'Error checking mesocycle status' });
    }

    if (!activeMesocycle) {
      console.log('❌ [IntelligentWorkouts] No active mesocycle found');
      return res.status(400).json({
        error: 'No active mesocycle found',
        message: 'Please create a mesocycle first to generate workouts',
        action: 'create_mesocycle'
      });
    }

    // Obtener datos básicos del usuario
    const [userProfile, userPreferences] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // 🗓️ PASO 2: Verificar si hoy es día de entrenamiento
    const { data: splitAssignment, error: assignmentError } = await supabase
      .from('user_split_assignments')
      .select(`
        *,
        scientific_splits (
          id,
          split_name,
          split_type,
          muscle_groups,
          scientific_rationale,
          recovery_time_hours,
          difficulty_level
        )
      `)
      .eq('user_id', userId)
      .eq('day_name', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') {
      console.error('❌ [IntelligentWorkouts] Error checking split assignment:', assignmentError);
      return res.status(500).json({ error: 'Error checking workout schedule' });
    }

    // 🛌 PASO 3: Si no hay asignación, es día de descanso
    if (!splitAssignment) {
      console.log('🛌 [IntelligentWorkouts] Today is a rest day:', dayOfWeek);
      return res.status(200).json({
        success: true,
        isRestDay: true,
        message: '¡Hoy es tu día de descanso! 🛌',
        motivationalMessage: 'El descanso es tan importante como el entrenamiento. Tu cuerpo se está recuperando y creciendo. ¡Relájate y vuelve mañana recargado! 💪',
        dayOfWeek,
        mesocycle: {
          name: activeMesocycle.mesocycle_name,
          splitType: activeMesocycle.split_type,
          weekRemaining: Math.ceil((new Date(activeMesocycle.end_date).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000))
        },
        nextWorkoutDay: await getNextWorkoutDay(userId, dayOfWeek)
      });
    }

    console.log('💪 [IntelligentWorkouts] Training day confirmed:', dayOfWeek, 'Split:', splitAssignment.scientific_splits.split_name);

    // Generar rutina básica personalizada
    const workoutPlan = await geminiService.generateDailyWorkoutPlan({
      userProfile,
      userPreferences,
      feedbackData: null,
      learningData: null,
      currentDate: getCurrentDate(), // 🔧 FIX: Usar fecha local
      dayOfWeek
    });

    // Guardar rutina diaria
    const dailyPlan = {
      workoutDate: getCurrentDate(), // 🔧 FIX: Usar fecha local
      exercises: workoutPlan.exercises,
      estimatedDuration: workoutPlan.duration,
      targetMuscleGroups: workoutPlan.targetMuscleGroups || [],
      generatedBasedOn: workoutPlan.generatedBasedOn || {},
      aiConfidenceScore: workoutPlan.aiConfidence || 0.5,
      mesocycleId: activeMesocycle.id, // 🔗 NUEVO: Conectar con mesociclo activo
    };

    const savedPlan = await supabaseStorage.createDailyWorkoutPlan({ ...dailyPlan, userId });

    // Descripción básica
    const routineDescription = `Rutina personalizada para ${dayOfWeek} basada en tu perfil: ${userProfile.fitnessLevel} nivel, objetivo ${userProfile.fitnessGoal}. Duración estimada: ${workoutPlan.duration} minutos.`;

    res.json({
      success: true,
      workoutPlan: {
        ...workoutPlan,
        id: savedPlan.id,
        description: routineDescription,
        personalizedInsights: {
          basedOnFeedback: false,
          basedOnPreferences: !!userPreferences,
          basedOnLearning: false,
          aiConfidence: workoutPlan.aiConfidence,
          dayOfWeek
        }
      }
    });

  } catch (error) {
    console.error('❌ [IntelligentWorkouts] Error generating simple routine:', error);
    res.status(500).json({
      error: 'Failed to generate routine',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/intelligent-workouts/today
 * Obtiene la rutina del día actual o verifica si es día de descanso
 */
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const todayString = getCurrentDate(); // 🔧 FIX: Usar fecha local
    const today = new Date(); // 🔧 FIX: Crear objeto Date para métodos de fecha

    console.log('🛌 [IntelligentWorkouts] Checking today status for user:', userId, 'date:', todayString);

    // 🛌 PASO 1: Verificar si hay mesociclo activo
    const activeMesocycle = await scientificWorkoutService.getActiveMesocycle(userId);

    if (!activeMesocycle) {
      console.log('❌ [IntelligentWorkouts] No active mesocycle found');
      return res.status(404).json({ error: 'No active mesocycle found' });
    }

    console.log('✅ [IntelligentWorkouts] Active mesocycle found:', activeMesocycle.mesocycle_name);

    // 🛌 PASO 2: Verificar si hoy tiene asignación de split
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log('🗓️ [IntelligentWorkouts] Date debug:', {
      currentDate: today.toISOString(),
      dayOfWeek,
      getDay: today.getDay(),
      localString: today.toLocaleDateString('en-US', { weekday: 'long' })
    });
    console.log('🗓️ [IntelligentWorkouts] Today is:', dayOfWeek);

    const splitAssignment = await splitAssignmentService.getSplitForDay(userId, dayOfWeek);

    // 🛌 PASO 3: Si no hay asignación, es día de descanso
    if (!splitAssignment) {
      console.log('🛌 [IntelligentWorkouts] Today is a rest day:', dayOfWeek);
      return res.status(200).json({
        success: true,
        isRestDay: true,
        message: '¡Hoy es tu día de descanso! 🛌',
        motivationalMessage: 'El descanso es tan importante como el entrenamiento. Tu cuerpo se está recuperando y creciendo. ¡Relájate y vuelve mañana recargado! 💪',
        dayOfWeek,
        mesocycle: {
          name: activeMesocycle.mesocycle_name,
          splitType: activeMesocycle.split_type,
          weekRemaining: Math.ceil((new Date(activeMesocycle.end_date).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000))
        },
        nextWorkoutDay: await getNextWorkoutDay(userId, dayOfWeek)
      });
    }

    // 🛌 PASO 4: Si hay asignación, buscar plan diario
    console.log('💪 [IntelligentWorkouts] Today has workout assignment:', splitAssignment.split_name);
    const todayPlan = await supabaseStorage.getDailyWorkoutPlan(userId, today);

    if (!todayPlan) {
      console.log('⚠️ [IntelligentWorkouts] No daily plan found, but split is assigned');
      return res.status(404).json({ error: 'No workout plan found for today, but workout is scheduled' });
    }

    console.log('✅ [IntelligentWorkouts] Daily plan found:', todayPlan.id);

    // 🔧 FIX: Devolver estructura consistente para días de entrenamiento
    res.json({
      success: true,
      isRestDay: false,
      workoutPlan: todayPlan,
      splitAssignment: {
        splitName: splitAssignment.split_name,
        splitType: splitAssignment.scientific_splits?.split_type,
        muscleGroups: splitAssignment.scientific_splits?.muscle_groups
      },
      mesocycle: {
        name: activeMesocycle.mesocycle_name,
        splitType: activeMesocycle.split_type,
        weekRemaining: Math.ceil((new Date(activeMesocycle.end_date).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000))
      },
      dayOfWeek
    });
  } catch (error) {
    console.error('❌ [IntelligentWorkouts] Error getting today plan:', error);
    res.status(500).json({ error: 'Failed to get today workout plan' });
  }
});

/**
 * 🧠 GET /api/intelligent-workouts/feedback-profile
 * Obtiene el perfil consolidado de feedback del usuario
 */
router.get('/feedback-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const profile = await intelligentFeedbackService.getUserConsolidatedProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'No feedback profile found',
        message: 'User needs to provide feedback to build profile'
      });
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        // Agregar información adicional para el frontend
        isReliable: profile.confidenceScore >= 0.7,
        needsMoreData: profile.totalFeedbackCount < 5,
        lastActivity: profile.lastFeedbackDate
      }
    });
  } catch (error) {
    console.error('❌ [IntelligentWorkouts] Error getting feedback profile:', error);
    res.status(500).json({
      error: 'Failed to get feedback profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Funciones auxiliares
async function getLearningData(userId: number) {
  try {
    // Obtener preferencias históricas del usuario
    const preferences = await supabaseStorage.getUserWorkoutPreferencesHistory(userId);

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
      averageRating
    };
  } catch (error) {
    console.error('Error getting learning data:', error);
    return null;
  }
}

function extractFavoriteExercises(preferences: any[]): string[] {
  const exercises = preferences
    .filter(p => p.satisfactionRating >= 4)
    .flatMap(p => p.preferredExercises || []);

  return [...new Set(exercises)];
}

function extractAvoidedExercises(preferences: any[]): string[] {
  const exercises = preferences
    .filter(p => p.satisfactionRating <= 2)
    .flatMap(p => p.avoidedExercises || []);

  return [...new Set(exercises)];
}

function extractWeeklyPattern(preferences: any[]): Record<string, string[]> {
  const pattern: Record<string, string[]> = {};

  preferences.forEach(p => {
    if (p.dayOfWeek && p.preferredMuscleGroups) {
      const muscles = Object.values(p.preferredMuscleGroups).flat() as string[];
      pattern[p.dayOfWeek] = muscles;
    }
  });

  return pattern;
}

function calculateAverageRating(preferences: any[]): number {
  const ratings = preferences.map(p => p.satisfactionRating).filter(r => r > 0);
  return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
}

function mapEnergyToIntensity(energyLevel: string): string {
  switch (energyLevel) {
    case 'high': return 'high';
    case 'moderate': return 'moderate';
    case 'low': return 'low';
    case 'minimal': return 'low';
    default: return 'moderate';
  }
}

function parseDuration(timeInput: string | number): number {
  // Si es un número, devolverlo directamente
  if (typeof timeInput === 'number') return timeInput;

  // Si es string, parsear como antes
  const timeString = timeInput.toString();
  if (timeString.includes('15-20')) return 20;
  if (timeString.includes('30-40')) return 35;
  if (timeString.includes('45-60')) return 50;
  if (timeString.includes('60+')) return 70;

  // Intentar parsear como número directo
  const numericValue = parseInt(timeString);
  if (!isNaN(numericValue)) return numericValue;

  return 35; // Default
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// Funciones para análisis de rutinas rechazadas
function extractRejectedExercises(rejectedPlans: any[]): string[] {
  const rejectedExercises = new Set<string>();

  rejectedPlans.forEach(plan => {
    if (plan.specificDislikes?.exercises) {
      plan.specificDislikes.exercises.forEach((exercise: string) => rejectedExercises.add(exercise));
    }

    // Extraer ejercicios de la rutina original rechazada
    if (plan.originalPlanData?.exercises) {
      plan.originalPlanData.exercises.forEach((exercise: any) => {
        if (plan.rejectionReasons?.includes('boring_exercises') || plan.rejectionReasons?.includes('disliked_exercises')) {
          rejectedExercises.add(exercise.name || exercise.exerciseName);
        }
      });
    }
  });

  return Array.from(rejectedExercises);
}

function extractRejectedPatterns(rejectedPlans: any[]): any {
  const patterns = {
    rejectedDurations: [] as number[],
    rejectedIntensities: [] as string[],
    rejectedMuscleGroups: [] as string[],
    commonRejectionReasons: {} as Record<string, number>,
    rejectedTimeSlots: [] as string[],
  };

  rejectedPlans.forEach(plan => {
    // Duraciones rechazadas
    if (plan.originalPlanData?.estimatedDuration) {
      patterns.rejectedDurations.push(plan.originalPlanData.estimatedDuration);
    }

    // Intensidades rechazadas
    if (plan.specificDislikes?.intensity && plan.originalPlanData?.intensity) {
      patterns.rejectedIntensities.push(plan.originalPlanData.intensity);
    }

    // Grupos musculares rechazados
    if (plan.specificDislikes?.muscleGroups) {
      patterns.rejectedMuscleGroups.push(...plan.specificDislikes.muscleGroups);
    }

    // Razones comunes de rechazo
    plan.rejectionReasons?.forEach((reason: string) => {
      patterns.commonRejectionReasons[reason] = (patterns.commonRejectionReasons[reason] || 0) + 1;
    });

    // Horarios rechazados
    if (plan.timeOfDay) {
      patterns.rejectedTimeSlots.push(plan.timeOfDay);
    }
  });

  return patterns;
}

function generateRoutineDescription(userProfile: any, userPreferences: any, feedbackData: any, learningData: any, workoutPlan: any): string {
  const parts = [];

  parts.push(`🎯 **Rutina Ultra-Personalizada para Ti**`);
  parts.push(`\n**Basada en:**`);

  if (userProfile) {
    parts.push(`• Tu perfil: ${userProfile.fitnessLevel} nivel, objetivo ${userProfile.fitnessGoal}`);
  }

  if (feedbackData?.todayMusclePreference?.length > 0) {
    parts.push(`• Músculos que querías trabajar HOY: ${feedbackData.todayMusclePreference.join(', ')}`);
  }

  if (feedbackData?.energyLevel) {
    parts.push(`• Tu nivel de energía actual: ${feedbackData.energyLevel}`);
  }

  if (feedbackData?.availableTime) {
    parts.push(`• Tiempo disponible: ${feedbackData.availableTime}`);
  }

  if (userPreferences?.equipment?.length > 0) {
    parts.push(`• Equipamiento disponible: ${userPreferences.equipment.join(', ')}`);
  }

  if (learningData?.favoriteExercises?.length > 0) {
    parts.push(`• Ejercicios que históricamente te encantan: ${learningData.favoriteExercises.slice(0, 3).join(', ')}`);
  }

  if (learningData?.rejectedExercises?.length > 0) {
    parts.push(`• Ejercicios que evité porque no te gustaron: ${learningData.rejectedExercises.slice(0, 3).join(', ')}`);
  }

  if (learningData?.averageRating > 0) {
    parts.push(`• Rating promedio de tus rutinas anteriores: ${learningData.averageRating.toFixed(1)}/5`);
  }

  if (learningData?.rejectedPlans?.length > 0) {
    parts.push(`• Aprendí de ${learningData.rejectedPlans.length} rutinas que no te gustaron`);
  }

  parts.push(`\n**Resultado:** ${workoutPlan.exercises?.length || 0} ejercicios personalizados en ${workoutPlan.duration} minutos`);
  parts.push(`**Confianza de IA:** ${Math.round((workoutPlan.aiConfidence || 0.5) * 100)}%`);

  return parts.join('\n');
}

/**
 * 🧪 GET /api/intelligent-workouts/learning-data/:userId
 * Endpoint de prueba para verificar datos de aprendizaje
 */
router.get('/learning-data/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('🧪 [TEST] Getting learning data for user:', userId);

    // Obtener datos de aprendizaje
    const [learningData, rejectedPlans, preferences] = await Promise.all([
      getLearningData(userId),
      supabaseStorage.getRejectedWorkoutPlans(userId),
      supabaseStorage.getUserWorkoutPreferencesHistory(userId)
    ]);

    const response = {
      learningData,
      rejectedPlans: rejectedPlans?.length || 0,
      totalPreferences: preferences?.length || 0,
      rawPreferences: preferences?.slice(0, 3), // Últimas 3 para debug
      weeklyPattern: learningData?.weeklyPattern || {},
      favoriteExercises: learningData?.favoriteExercises || [],
      avoidedExercises: learningData?.avoidedExercises || [],
      averageRating: learningData?.averageRating || 0
    };

    console.log('🧪 [TEST] Learning data response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('❌ [TEST] Error getting learning data:', error);
    res.status(500).json({
      error: 'Failed to get learning data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 GET /api/intelligent-workouts/test-prompt/:userId
 * Endpoint para ver el prompt que se envía a la IA
 */
router.get('/test-prompt/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 TEST ENDPOINT HIT - Starting prompt generation test');
    const userId = parseInt(req.params.userId);
    console.log('🔍 Testing prompt generation for user:', userId);

    // Obtener datos del usuario
    const [userProfile, userPreferences, learningData] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId),
      getLearningData(userId)
    ]);

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Simular datos de feedback
    const mockFeedbackData = {
      todayMusclePreference: ['chest', 'arms'],
      energyLevel: 'high',
      availableTime: '45-60'
    };

    // 🚨 DEBUG: Verificar limitaciones específicamente
    console.log('🚨 [DEBUG] User Preferences:', JSON.stringify(userPreferences, null, 2));
    console.log('🚨 [DEBUG] Limitations specifically:', userPreferences?.limitations);
    console.log('🚨 [DEBUG] Limitations type:', typeof userPreferences?.limitations);
    console.log('🚨 [DEBUG] Limitations length:', userPreferences?.limitations?.length);

    // Construir el prompt que se enviaría a la IA
    const weeklyFrequency = userPreferences?.weeklyFrequency || 3;
    const splitType = 'Upper/Lower'; // Simplificado para test
    const todayMuscleGroups = ['chest', 'back', 'shoulders', 'arms'];

    const prompt = `
Eres un entrenador personal EXPERTO hispanohablante que combina los métodos de Vince Gironda con ciencia moderna del entrenamiento.
IMPORTANTE: Responde ÚNICAMENTE en español. Todos los nombres de ejercicios, instrucciones y descripciones deben estar en español.

🏋️ SISTEMA DE SPLIT CIENTÍFICO:
- Split Type: ${splitType}
- Frecuencia Semanal: ${weeklyFrequency} días
- Músculos para HOY (${dayOfWeek}): ${todayMuscleGroups.join(', ')}
- PRINCIPIO CLAVE: Cada grupo muscular necesita 48-72h de recuperación

👤 PERFIL DEL USUARIO:
- Nivel: ${userProfile?.fitnessLevel || 'intermediate'} | Objetivo: ${userProfile?.fitnessGoal || 'muscle_gain'}
- Edad: ${userProfile?.age || 'No especificada'} | Peso: ${userProfile?.currentWeight || 'No especificado'}kg
- Altura: ${userProfile?.height || 'No especificada'}cm

⚙️ CONFIGURACIÓN:
- Equipamiento: ${userPreferences?.equipment?.join(', ') || 'bodyweight'}
- Limitaciones: ${userPreferences?.limitations?.join(', ') || 'Ninguna'}
- Tiempo disponible: ${mockFeedbackData?.availableTime || '30-40 min'}
- Nivel de energía: ${mockFeedbackData?.energyLevel || 'moderate'}

🚨 LIMITACIONES FÍSICAS CRÍTICAS - OBLIGATORIO RESPETAR:
${userPreferences?.limitations?.length > 0 ?
  userPreferences.limitations.map(limitation => {
    switch(limitation) {
      case 'knee_issues': return '- RODILLAS DAÑADAS: NO incluir sentadillas, prensa de piernas, extensiones de piernas, estocadas, o cualquier ejercicio que flexione las rodillas';
      case 'back_problems': return '- PROBLEMAS DE ESPALDA: NO incluir peso muerto, sentadillas con barra, remo con barra, o ejercicios que carguen la columna';
      case 'shoulder_issues': return '- PROBLEMAS DE HOMBROS: NO incluir press militar, elevaciones laterales pesadas, o movimientos por encima de la cabeza';
      case 'heart_condition': return '- CONDICIÓN CARDÍACA: Mantener intensidad moderada, descansos largos, evitar ejercicios explosivos';
      case 'asthma': return '- ASMA: Evitar ejercicios de alta intensidad, permitir descansos extra';
      case 'pregnancy': return '- EMBARAZO: Solo ejercicios seguros para embarazadas, evitar posición supina, ejercicios de core intensos';
      default: return `- ${limitation.toUpperCase()}: Adaptar ejercicios según esta limitación`;
    }
  }).join('\n')
  : '- Sin limitaciones físicas reportadas'
}

🧠 INTELIGENCIA ADAPTATIVA:
- Ejercicios favoritos: ${learningData?.favoriteExercises?.join(', ') || 'Aprendiendo...'}
- Ejercicios a evitar: ${learningData?.avoidedExercises?.join(', ') || 'Ninguno'}
- Patrón ${dayOfWeek}: ${learningData?.weeklyPattern?.[dayOfWeek] || 'Primer entrenamiento'}

🎯 PRINCIPIOS DE VINCE GIRONDA A APLICAR:
1. ENFOQUE EN ESTÉTICA: Ejercicios que mejoren simetría y definición
2. PRECISIÓN SOBRE PESO: Forma perfecta y contracción muscular completa
3. INTENSIDAD CONTROLADA: Series y repeticiones que maximicen el pump
4. EJERCICIOS ESPECÍFICOS: Movimientos que aíslen y esculpan cada músculo
5. TIEMPO EFICIENTE: Rutinas de 30-45 minutos máximo

🚨 REGLAS ESTRICTAS:
- SOLO entrena músculos asignados para hoy: ${todayMuscleGroups.join(', ')}
- NO incluyas otros grupos musculares principales
- RESPETA el tiempo de recuperación muscular
- USA ejercicios que promuevan la estética y simetría

RESPONDE SOLO con JSON válido EN ESPAÑOL:
{
  "name": "Rutina personalizada para ${dayOfWeek}",
  "description": "Descripción motivacional específica en español",
  "difficulty": "${userProfile?.fitnessLevel || 'intermediate'}",
  "duration": número_en_minutos_según_tiempo_disponible,
  "targetMuscleGroups": ["piernas", "glúteos", "pantorrillas"],
  "exercises": [
    {
      "name": "Nombre del ejercicio EN ESPAÑOL (ej: Prensa de Piernas, Sentadillas Búlgaras, Curl de Bíceps)",
      "sets": número,
      "reps": número,
      "weight": número_opcional,
      "duration": número_opcional_en_segundos,
      "rest": número_en_segundos,
      "instructions": "Instrucciones específicas en español",
      "muscleGroup": "grupo_muscular_en_español (ej: piernas, pecho, espalda, hombros, brazos)"
    }
  ],
  "aiConfidence": número_0_a_1,
  "personalizedFor": "${dayOfWeek}_${mockFeedbackData?.energyLevel || 'moderate'}_energy"
}

EJEMPLOS DE NOMBRES EN ESPAÑOL:
- Leg Press → Prensa de Piernas
- Glute Bridge → Puente de Glúteos
- Hamstring Curl → Curl de Isquiotibiales
- Standing Calf Raises → Elevaciones de Pantorrillas de Pie
- Seated Leg Extension → Extensión de Piernas Sentado

GENERA rutina que lo haga FELIZ y MOTIVADO. Incluye 4-8 ejercicios según tiempo disponible.
TODOS los nombres de ejercicios y grupos musculares DEBEN estar en español.
`;

    res.json({
      prompt,
      context: {
        userProfile,
        userPreferences,
        learningData,
        dayOfWeek,
        mockFeedbackData
      },
      debug: {
        limitationsFound: userPreferences?.limitations || [],
        limitationsCount: userPreferences?.limitations?.length || 0,
        limitationsType: typeof userPreferences?.limitations,
        hasKneeIssues: userPreferences?.limitations?.includes('knee_issues') || false
      }
    });

  } catch (error) {
    console.error('❌ [TEST] Error building test prompt:', error);
    res.status(500).json({
      error: 'Failed to build test prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🚀 NUEVA FUNCIÓN: Obtener historial de grupos musculares
 * Analiza las últimas rutinas para evitar repetir grupos musculares
 */
async function getMuscleGroupHistory(userId: number) {
  try {
    const today = getCurrentDate();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    console.log('💪 [MuscleHistory] Analyzing muscle groups from', threeDaysAgoStr, 'to', today);

    // Obtener rutinas de los últimos 3 días
    const recentPlans = await supabaseStorage.getRecentDailyWorkoutPlans(userId, threeDaysAgoStr, today);
    console.log('💪 [MuscleHistory] Found', recentPlans.length, 'recent plans');

    const muscleGroupsByDay: Record<string, string[]> = {};
    const trainedMuscleGroups = new Set<string>();
    const availableMuscleGroups = new Set<string>();

    // Analizar cada rutina
    recentPlans.forEach(plan => {
      const dayKey = plan.workoutDate;
      const muscleGroups = plan.targetMuscleGroups || [];

      muscleGroupsByDay[dayKey] = muscleGroups;
      muscleGroups.forEach(muscle => trainedMuscleGroups.add(muscle));

      console.log(`💪 [MuscleHistory] ${dayKey}: ${muscleGroups.join(', ')}`);
    });

    // Determinar músculos disponibles (que no se han entrenado en 48-72h)
    const allMuscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'calves', 'core'];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    // Músculos entrenados ayer (necesitan 48h de recuperación)
    const yesterdayMuscles = muscleGroupsByDay[yesterdayStr] || [];
    const twoDaysAgoMuscles = muscleGroupsByDay[twoDaysAgoStr] || [];

    allMuscleGroups.forEach(muscle => {
      const trainedYesterday = yesterdayMuscles.includes(muscle);
      const trainedTwoDaysAgo = twoDaysAgoMuscles.includes(muscle);

      // Disponible si no se entrenó ayer ni hace 2 días (48h+ de recuperación)
      if (!trainedYesterday && !trainedTwoDaysAgo) {
        availableMuscleGroups.add(muscle);
      }
    });

    const result = {
      muscleGroupsByDay,
      trainedMuscleGroups: Array.from(trainedMuscleGroups),
      availableMuscleGroups: Array.from(availableMuscleGroups),
      yesterdayMuscles,
      twoDaysAgoMuscles,
      recoveryStatus: {
        needsRecovery: [...yesterdayMuscles, ...twoDaysAgoMuscles],
        readyToTrain: Array.from(availableMuscleGroups)
      }
    };

    console.log('💪 [MuscleHistory] Analysis result:', result);
    return result;

  } catch (error) {
    console.error('❌ [MuscleHistory] Error getting muscle group history:', error);
    return {
      muscleGroupsByDay: {},
      trainedMuscleGroups: [],
      availableMuscleGroups: ['chest', 'back', 'shoulders', 'arms'], // Fallback seguro
      yesterdayMuscles: [],
      twoDaysAgoMuscles: [],
      recoveryStatus: {
        needsRecovery: [],
        readyToTrain: ['chest', 'back', 'shoulders', 'arms']
      }
    };
  }
}

/**
 * 🧪 GET /api/intelligent-workouts/debug-prompt/:userId
 * Endpoint temporal SIN autenticación para debug
 */
router.get('/debug-prompt/:userId', async (req, res) => {
  try {
    console.log('🚀 DEBUG ENDPOINT HIT - Starting prompt generation test (NO AUTH)');
    const userId = parseInt(req.params.userId);
    console.log('🔍 Testing prompt generation for user:', userId);

    // Obtener datos del usuario
    const [userProfile, userPreferences, learningData] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId),
      getLearningData(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📊 User Profile:', {
      id: userProfile.id,
      username: userProfile.username,
      age: userProfile.age,
      gender: userProfile.gender,
      fitnessLevel: userProfile.fitnessLevel
    });

    console.log('⚙️ User Preferences:', userPreferences ? {
      goals: userPreferences.goals,
      workoutFrequency: userPreferences.workoutFrequency,
      preferredWorkoutTypes: userPreferences.preferredWorkoutTypes
    } : 'No preferences found');

    console.log('🧠 Learning Data:', learningData ? {
      completedWorkouts: learningData.completedWorkouts?.length || 0,
      averageRating: learningData.averageRating,
      preferredExercises: learningData.preferredExercises?.length || 0
    } : 'No learning data found');

    // Simular datos de feedback para generar el prompt
    const mockFeedbackData = {
      energyLevel: 'medium',
      availableTime: 45,
      targetMuscleGroups: ['chest', 'triceps'],
      preferredIntensity: 'moderate'
    };

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Generar el prompt que se enviaría a la IA
    const promptData = {
      userProfile,
      userPreferences,
      feedbackData: mockFeedbackData,
      learningData,
      currentDate: getCurrentDate(),
      dayOfWeek
    };

    console.log('🎯 Generated prompt data structure:', {
      hasUserProfile: !!promptData.userProfile,
      hasUserPreferences: !!promptData.userPreferences,
      hasFeedbackData: !!promptData.feedbackData,
      hasLearningData: !!promptData.learningData,
      currentDate: promptData.currentDate,
      dayOfWeek: promptData.dayOfWeek
    });

    res.json({
      success: true,
      message: 'Prompt generation test completed successfully',
      data: {
        userProfile: {
          id: userProfile.id,
          username: userProfile.username,
          age: userProfile.age,
          gender: userProfile.gender,
          fitnessLevel: userProfile.fitnessLevel,
          height: userProfile.height,
          weight: userProfile.weight
        },
        userPreferences,
        learningData,
        mockFeedbackData,
        promptMetadata: {
          currentDate: promptData.currentDate,
          dayOfWeek: promptData.dayOfWeek,
          dataCompleteness: {
            profile: !!userProfile,
            preferences: !!userPreferences,
            learning: !!learningData
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error in prompt generation test:', error);
    res.status(500).json({
      error: 'Failed to test prompt generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 GET /api/intelligent-workouts/debug-users
 * Endpoint temporal para ver usuarios disponibles
 */
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🚀 DEBUG USERS ENDPOINT HIT');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Response headers before:', res.getHeaders());

    // Intentar obtener el usuario específico
    const user1 = await supabaseStorage.getUser(1);
    const user2 = await supabaseStorage.getUser(2);
    const user3 = await supabaseStorage.getUser(3);

    const users = [user1, user2, user3].filter(Boolean);
    console.log('👥 Found users:', users.length);

    console.log('🔍 About to send JSON response');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        userCount: users.length,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error getting users:', error);
    res.status(500).json({
      error: 'Failed to get users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 GET /api/intelligent-workouts/ping
 * Endpoint simple para verificar conectividad
 */
router.get('/ping', (req, res) => {
  console.log('🏓 PING ENDPOINT HIT!');
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

/**
 * 🧪 GET /api/intelligent-workouts/create-test-user
 * Endpoint temporal para crear usuario de prueba usando SQL directo
 */
router.get('/create-test-user', async (req, res) => {
  try {
    console.log('👤 Creating test user with direct SQL...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const userData = {
      username: 'testuser2',
      email: 'test2@example.com',
      password_hash: hashedPassword,
      full_name: 'Test User',
      age: 25,
      gender: 'male',
      fitness_level: 'intermediate',
      fitness_goal: 'gain_muscle',
      height: 175,
      current_weight: 70,
      target_weight: 75
    };

    console.log('📊 User data to insert:', userData);

    // Insertar usuario directamente con SQL
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({
        error: 'Failed to create test user',
        details: error.message
      });
    }

    console.log('✅ Test user created:', data.id);

    res.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: data.id,
        username: data.username,
        email: data.email
      }
    });

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    res.status(500).json({
      error: 'Failed to create test user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 POST /api/intelligent-workouts/test-generate-routine/:userId
 * Endpoint temporal SIN autenticación para probar generación completa de rutinas
 */
router.post('/test-generate-routine/:userId', async (req, res) => {
  try {
    console.log('🚀 TEST GENERATE ROUTINE - Starting full routine generation test (NO AUTH)');
    const userId = parseInt(req.params.userId);
    console.log('🔍 Generating routine for user:', userId);

    // Obtener datos del usuario
    const [userProfile, userPreferences, learningData] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId),
      getLearningData(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 User profile:', {
      id: userProfile.id,
      username: userProfile.username,
      fitnessLevel: userProfile.fitnessLevel,
      limitations: userPreferences?.limitations
    });

    // Usar datos del body o datos por defecto
    const feedbackData = req.body.feedbackData || {
      energyLevel: 'medium',
      availableTime: 45,
      targetMuscleGroups: ['chest', 'triceps'],
      preferredIntensity: 'moderate'
    };

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    console.log('🧠 Generating workout plan with Gemini...');

    // Generar rutina con IA
    const workoutPlan = await geminiService.generateDailyWorkoutPlan({
      userProfile,
      userPreferences,
      feedbackData,
      learningData,
      currentDate: getCurrentDate(),
      dayOfWeek
    });

    console.log('✅ Workout plan generated:', {
      name: workoutPlan.name,
      duration: workoutPlan.duration,
      exerciseCount: workoutPlan.exercises?.length,
      targetMuscleGroups: workoutPlan.targetMuscleGroups
    });

    // Guardar rutina diaria
    const dailyPlan = {
      workoutDate: getCurrentDate(),
      exercises: workoutPlan.exercises,
      estimatedDuration: workoutPlan.duration,
      targetMuscleGroups: workoutPlan.targetMuscleGroups || [],
      generatedBasedOn: workoutPlan.generatedBasedOn || {},
      aiConfidenceScore: workoutPlan.aiConfidence || 0.5,
    };

    const savedPlan = await supabaseStorage.createDailyWorkoutPlan({ ...dailyPlan, userId });

    console.log('💾 Routine saved with ID:', savedPlan.id);

    res.json({
      success: true,
      message: 'Test routine generated successfully',
      workoutPlan: {
        ...workoutPlan,
        id: savedPlan.id,
        personalizedInsights: {
          basedOnFeedback: !!feedbackData,
          basedOnPreferences: !!userPreferences,
          basedOnLearning: !!learningData,
          aiConfidence: workoutPlan.aiConfidence,
          dayOfWeek,
          energyLevel: feedbackData.energyLevel,
          userLimitations: userPreferences?.limitations || []
        }
      },
      debug: {
        userId,
        userProfile: {
          id: userProfile.id,
          username: userProfile.username,
          fitnessLevel: userProfile.fitnessLevel
        },
        userPreferences: userPreferences ? {
          limitations: userPreferences.limitations,
          exerciseTypes: userPreferences.exerciseTypes,
          weeklyFrequency: userPreferences.weeklyFrequency
        } : null,
        feedbackData,
        dayOfWeek,
        currentDate: getCurrentDate()
      }
    });

  } catch (error) {
    console.error('❌ [TEST] Error generating routine:', error);
    res.status(500).json({
      error: 'Failed to generate test routine',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🚀 NUEVA FUNCIÓN: Generar descripción para rutinas del primer día
function generateFirstDayRoutineDescription(
  userProfile: any,
  userPreferences: any,
  feedbackData: any,
  workoutPlan: any
): string {
  const userName = userProfile.fullName?.split(' ')[0] || 'Usuario';
  const selectedGroups = feedbackData.muscleGroupsSelected.join(', ');
  const energyText = {
    'low': 'con energía moderada',
    'medium': 'con buena energía',
    'high': 'con mucha energía'
  }[feedbackData.energyLevel] || 'con energía';

  const timeText = {
    '15-20': '20 minutos',
    '30-40': '35 minutos',
    '45-60': '50 minutos',
    '60+': '60+ minutos'
  }[feedbackData.availableTime] || feedbackData.availableTime;

  let description = `¡Hola ${userName}! 🎯 Esta es tu primera rutina personalizada enfocada en ${selectedGroups}. `;
  description += `Diseñada especialmente para hoy que te sientes ${energyText} y tienes ${timeText} disponibles. `;

  if (feedbackData.specificGoalToday) {
    description += `Tu objetivo de hoy: "${feedbackData.specificGoalToday}". `;
  }

  if (feedbackData.todayLimitations && feedbackData.todayLimitations.length > 0) {
    description += `Hemos considerado tus limitaciones del día para mantenerte seguro. `;
  }

  description += `¡Empecemos a construir tu historial de entrenamientos! 💪`;

  return description;
}



export default router;
