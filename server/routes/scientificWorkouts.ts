/**
 * 🧬 Scientific Workouts API Routes
 * Endpoints para el sistema de rutinas científicas
 */

import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { scientificWorkoutService } from '../services/scientificWorkoutService';
import { splitAssignmentService } from '../services/splitAssignmentService';
import { workoutCacheService } from '../services/workoutCacheService';
import { autoWorkoutService } from '../services/autoWorkoutService';
import { aiLearningService } from '../services/aiLearningService';
import { supabaseStorage } from '../supabaseStorage';
import { supabase } from '../supabase';
import { geminiService } from '../geminiService';
import { getCurrentDate } from '../utils/timeSystem';
import { mesocycleAutoMigrationMiddleware } from '../middleware/autoMigrationMiddleware';

const router = express.Router();

// 🎯 FUNCIONES HELPER PARA FECHAS DE RUTINAS
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

// Schema para generación de rutina científica
const scientificWorkoutGenerationSchema = z.object({
  selectedSplitId: z.number(),
  energyLevel: z.string(),
  availableTime: z.string(),
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
  }),
});

/**
 * GET /api/scientific-workouts/splits
 * Obtener todos los splits científicos disponibles
 */
router.get('/splits', authenticateToken, async (req, res) => {
  try {
    console.log('🔬 [ScientificWorkouts] Fetching scientific splits...');
    
    const splits = await scientificWorkoutService.getScientificSplits();
    
    res.json({
      success: true,
      splits,
      message: `${splits.length} splits científicos disponibles`
    });
  } catch (error) {
    console.error('Error fetching scientific splits:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch scientific splits' 
    });
  }
});

/**
 * POST /api/scientific-workouts/recommend-split
 * Recomendar split óptimo basado en perfil del usuario
 * 🚨 REQUIERE: Configuración completa del usuario (NO requiere mesociclo activo)
 */
router.post('/recommend-split', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 [ScientificWorkouts] Recommending optimal split...');

    const userId = req.user!.id;
    const { consentDecision } = req.body; // 🏥 NUEVO: Recibir decisión de consentimiento

    // Obtener preferencias del usuario
    const userPreferences = await supabaseStorage.getUserPreferences(userId);
    const weeklyFrequency = userPreferences?.weeklyFrequency || 3;

    console.log(`👤 User ${userId} - Weekly frequency: ${weeklyFrequency} days`);
    console.log(`🚨 [DEBUG] User limitations:`, userPreferences?.limitations);
    console.log(`🏥 [DEBUG] Consent decision:`, consentDecision);

    // 🏥 Si el usuario acepta riesgos, guardar decisión y ignorar limitaciones
    if (consentDecision === 'accept_risks') {
      // TODO: Reactivar cuando Supabase actualice el caché de esquema
      // await supabaseStorage.updateConsentDecision(userId, 'accept_risks');
      console.log('🏥 [ConsentSystem] User accepted risks - ignoring limitations');
    } else if (consentDecision === 'use_alternatives') {
      // TODO: Reactivar cuando Supabase actualice el caché de esquema
      // await supabaseStorage.updateConsentDecision(userId, 'use_alternatives');
      console.log('🏥 [ConsentSystem] User chose alternatives - using safe splits');
    }

    // 🏥 DETERMINAR SI IGNORAR LIMITACIONES
    console.log(`🏥 [ENDPOINT] Consent decision: "${consentDecision}" (type: ${typeof consentDecision})`);
    const ignoreUserLimitations = consentDecision === 'accept_risks';
    console.log(`🏥 [ENDPOINT] Comparison result: ${consentDecision} === 'accept_risks' = ${ignoreUserLimitations}`);
    console.log(`🏥 [ENDPOINT] Ignore limitations: ${ignoreUserLimitations}`);

    // Obtener recomendación científica con decisión de consentimiento
    const recommendation = await scientificWorkoutService.recommendOptimalSplit(
      userId,
      weeklyFrequency,
      ignoreUserLimitations // 🏥 Ignorar limitaciones si acepta riesgos
    );

    res.json({
      success: true,
      recommendation: {
        splits: recommendation.recommendedSplit,
        rationale: recommendation.rationale,
        weeklySchedule: recommendation.weeklySchedule,
        userFrequency: weeklyFrequency
      },
      debug: {
        userLimitations: userPreferences?.limitations || [],
        totalSplitsRecommended: recommendation.recommendedSplit.length,
        splitNames: recommendation.recommendedSplit.map(s => s.split_name)
      },
      message: 'Split óptimo recomendado basado en ciencia'
    });
  } catch (error) {
    console.error('Error recommending split:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recommend optimal split'
    });
  }
});

/**
 * POST /api/scientific-workouts/create-mesocycle
 * Crear nuevo mesociclo para el usuario
 * 🚨 REQUIERE: Configuración completa y NO tener mesociclo activo
 */
router.post('/create-mesocycle', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [ScientificWorkouts] Creating new mesocycle...');

    const userId = req.user!.id;
    const { splitType, durationWeeks = 6 } = req.body;

    // 🚨 VALIDACIÓN YA REALIZADA: El middleware validateUniqueMesocycle garantiza que no hay mesociclo activo
    // Por lo tanto, podemos crear directamente el nuevo mesociclo

    console.log('✅ [CreateMesocycle] No active mesocycle found, creating new one...');

    // Crear nuevo mesociclo
    const newMesocycle = await scientificWorkoutService.createMesocycle(userId, splitType, durationWeeks);
    
    res.json({
      success: true,
      mesocycle: newMesocycle,
      message: `Nuevo mesociclo de ${durationWeeks} semanas creado`
    });
  } catch (error) {
    console.error('Error creating mesocycle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create mesocycle' 
    });
  }
});

/**
 * POST /api/scientific-workouts/generate-workout
 * Generar rutina científica personalizada
 * 🚨 REQUIERE: Configuración completa, día válido Y mesociclo activo
 */
router.post('/generate-workout', authenticateToken, async (req, res) => {
  try {
    console.log('🧬 [ScientificWorkouts] Generating scientific workout...');

    const userId = req.user!.id;
    const workoutData = scientificWorkoutGenerationSchema.parse(req.body);

    // Obtener datos del usuario
    const [userProfile, userPreferences] = await Promise.all([
      supabaseStorage.getUser(userId),
      supabaseStorage.getUserPreferences(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Actualizar recuperación muscular
    await scientificWorkoutService.updateMuscleRecovery(
      userId,
      workoutData.splitData.muscle_groups,
      workoutData.splitData.recovery_time_hours
    );

    // 🚨 CRÍTICO: Verificar si el split es seguro para las limitaciones del usuario
    const userLimitations = userPreferences?.limitations || [];
    const splitMuscleGroups = workoutData.splitData.muscle_groups;

    console.log('🚨 [ScientificWorkout] Validating split before generation:', {
      splitName: workoutData.splitData.split_name,
      muscleGroups: splitMuscleGroups,
      userLimitations
    });

    // Verificar si hay conflicto entre limitaciones y grupos musculares del split
    const hasConflict = geminiService.checkLimitationsConflict(userLimitations, splitMuscleGroups);

    if (hasConflict.hasConflict) {
      console.log('🚨 [ScientificWorkout] BLOCKING workout generation due to safety conflict:', hasConflict);

      return res.status(400).json({
        success: false,
        error: 'SAFETY_CONFLICT',
        message: `⚠️ No se puede generar esta rutina por seguridad. El split "${workoutData.splitData.split_name}" incluye grupos musculares que están en conflicto con tus limitaciones físicas.`,
        details: {
          conflictingLimitations: hasConflict.conflictingLimitations,
          affectedMuscleGroups: hasConflict.affectedMuscleGroups,
          suggestion: 'Por favor, selecciona un split diferente que no incluya estos grupos musculares.'
        }
      });
    }

    if (hasConflict.hasConflict) {
      return res.status(400).json({
        error: 'LIMITACIÓN_FÍSICA_DETECTADA',
        message: `No se puede generar rutina de ${workoutData.splitData.split_name} debido a limitaciones físicas`,
        details: {
          limitations: hasConflict.conflictingLimitations,
          affectedMuscleGroups: hasConflict.affectedMuscleGroups,
          recommendation: 'Selecciona un split diferente que no involucre los grupos musculares afectados'
        },
        suggestedAlternatives: hasConflict.safeAlternatives
      });
    }

    // Generar rutina fusionando split científico con personalización IA
    const workoutPlan = await geminiService.generateDailyWorkoutPlan({
      userProfile,
      userPreferences,
      feedbackData: {
        energyLevel: workoutData.energyLevel,
        availableTime: workoutData.availableTime,
        todayMusclePreference: workoutData.splitData.muscle_groups,
        preferredExercises: workoutData.personalizedPreferences?.preferredExercises,
        avoidedExercises: workoutData.personalizedPreferences?.avoidedExercises,
        scientificRationale: workoutData.splitData.scientific_rationale
      },
      learningData: null,
      currentDate: getCurrentDate(),
      dayOfWeek,
      consolidatedProfile: null,
      scientificContext: {
        splitName: workoutData.splitData.split_name,
        muscleGroups: workoutData.splitData.muscle_groups,
        recoveryTime: workoutData.splitData.recovery_time_hours,
        rationale: workoutData.splitData.scientific_rationale,
        difficultyLevel: workoutData.splitData.difficulty_level
      }
    });

    // Agregar metadatos científicos
    workoutPlan.scientificMetadata = {
      splitUsed: workoutData.splitData.split_name,
      scientificRationale: workoutData.splitData.scientific_rationale,
      muscleGroups: workoutData.splitData.muscle_groups,
      recoveryTime: workoutData.splitData.recovery_time_hours,
      isScientificMode: true
    };

    // 🎯 NUEVA LÓGICA: Calcular fecha correcta para rutina (respeta días de descanso)
    const workoutDateInfo = await getWorkoutDateAndDay(userId);
    console.log('📅 [ScientificWorkouts]', workoutDateInfo.message);

    // Guardar rutina diaria en base de datos
    const dailyPlan = {
      workoutDate: workoutDateInfo.workoutDate,
      exercises: workoutPlan.exercises,
      estimatedDuration: workoutPlan.duration,
      targetMuscleGroups: workoutPlan.targetMuscleGroups || [],
      generatedBasedOn: {
        ...workoutPlan.generatedBasedOn,
        scientificSplit: workoutData.splitData.split_name,
        isScientificMode: true,
        scheduledFor: workoutDateInfo.isToday ? 'today' : 'next_training_day',
        originalRequestDate: getCurrentDate()
      },
      aiConfidenceScore: workoutPlan.aiConfidence || 0.8,
    };

    const savedPlan = await supabaseStorage.createDailyWorkoutPlan({ ...dailyPlan, userId });

    res.json({
      success: true,
      workoutPlan: {
        ...workoutPlan,
        id: savedPlan.id,
        scientificMetadata: workoutPlan.scientificMetadata,
        scheduledDate: workoutDateInfo.workoutDate,
        scheduledDay: workoutDateInfo.dayOfWeek,
        isScheduledForToday: workoutDateInfo.isToday
      },
      message: workoutDateInfo.isToday
        ? 'Rutina científica generada para hoy'
        : `Rutina científica generada para ${workoutDateInfo.dayOfWeek} (${workoutDateInfo.workoutDate})`,
      schedulingInfo: {
        originalRequestDate: getCurrentDate(),
        scheduledDate: workoutDateInfo.workoutDate,
        reason: workoutDateInfo.isToday ? 'Hoy es día de entrenamiento' : 'Hoy es día de descanso, rutina programada para próximo día de entrenamiento'
      }
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error generating scientific workout:', error);
    res.status(500).json({
      error: 'Failed to generate scientific workout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/scientific-workouts/edit-mesocycle
 * Editar mesociclo activo del usuario (cambiar días de entrenamiento)
 * 🚨 REQUIERE: Configuración completa Y tener mesociclo activo
 */
router.put('/edit-mesocycle', authenticateToken, async (req, res) => {
  try {
    console.log('✏️ [ScientificWorkouts] Editing active mesocycle...');

    const userId = req.user!.id;
    const { weeklySchedule, weeklyFrequency } = req.body;

    if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'weeklySchedule is required'
      });
    }

    // Obtener mesociclo activo (ya validado por middleware)
    const activeMesocycle = await scientificWorkoutService.getActiveMesocycle(userId);

    // Guardar nuevas asignaciones de splits
    await splitAssignmentService.saveSplitAssignments(userId, weeklySchedule, weeklyFrequency);

    console.log('✅ [EditMesocycle] Split assignments updated for mesocycle:', activeMesocycle.id);

    res.json({
      success: true,
      mesocycle: activeMesocycle,
      updatedSchedule: weeklySchedule,
      message: 'Mesociclo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error editing mesocycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit mesocycle'
    });
  }
});

/**
 * GET /api/scientific-workouts/mesocycle-status
 * Obtener estado del mesociclo del usuario (activo, puede crear, debe editar)
 * 🚨 REQUIERE: Configuración completa del usuario
 */
router.get('/mesocycle-status', authenticateToken, mesocycleAutoMigrationMiddleware, async (req, res) => {
  try {
    console.log('🔍 [ScientificWorkouts] Getting mesocycle status...');

    const userId = req.user!.id;

    // Obtener mesociclo activo directamente
    const activeMesocycle = await scientificWorkoutService.getActiveMesocycle(userId);

    const status = {
      hasActiveMesocycle: !!activeMesocycle,
      hasWorkoutHistory: false, // TODO: Implementar verificación de historial
      canCreateNew: !activeMesocycle,
      mustEdit: !!activeMesocycle,
      activeMesocycle: activeMesocycle // 🔧 FIX: Incluir datos del mesociclo activo
    };

    res.json({
      success: true,
      status,
      message: status.hasActiveMesocycle ? 'Usuario tiene mesociclo activo' : 'Usuario puede crear nuevo mesociclo'
    });
  } catch (error) {
    console.error('Error getting mesocycle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mesocycle status'
    });
  }
});

/**
 * GET /api/scientific-workouts/active-mesocycle
 * Obtener mesociclo activo del usuario
 */
router.get('/active-mesocycle', authenticateToken, mesocycleAutoMigrationMiddleware, async (req, res) => {
  try {
    console.log('📊 [ScientificWorkouts] Fetching active mesocycle...');

    const userId = req.user!.id;
    console.log('🔍 [DEBUG] User ID:', userId);

    const activeMesocycle = await scientificWorkoutService.getActiveMesocycle(userId);
    console.log('🔍 [DEBUG] Active mesocycle:', JSON.stringify(activeMesocycle, null, 2));
    
    if (!activeMesocycle) {
      return res.json({
        success: true,
        mesocycle: null,
        message: 'No hay mesociclo activo'
      });
    }
    
    // Calcular progreso inteligente del mesociclo
    const startDate = new Date(activeMesocycle.start_date);
    const endDate = new Date(activeMesocycle.end_date);
    const today = new Date();

    console.log('🔍 [DEBUG] Dates:', {
      startDate: activeMesocycle.start_date,
      endDate: activeMesocycle.end_date,
      today: today.toISOString().split('T')[0],
      startDateObj: startDate,
      endDateObj: endDate,
      todayObj: today
    });

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    // 🔧 FIX: Corregir cálculo de semana actual
    // Si han pasado 0-6 días = Semana 1, 7-13 días = Semana 2, etc.
    const currentWeek = Math.max(1, Math.ceil(elapsedDays / 7));

    console.log('🔍 [DEBUG] Time calculations:', {
      totalDays,
      elapsedDays,
      remainingDays,
      currentWeek
    });

    // 🧠 CÁLCULO INTELIGENTE: Combinar progreso temporal + progreso real
    const intelligentProgress = await calculateIntelligentProgress(
      userId,
      activeMesocycle,
      elapsedDays,
      totalDays,
      currentWeek
    );

    console.log('🔍 [DEBUG] Intelligent progress result:', JSON.stringify(intelligentProgress, null, 2));

    const progressPercentage = intelligentProgress.progressPercentage;
    
    res.json({
      success: true,
      mesocycle: {
        ...activeMesocycle,
        progress: {
          currentWeek,
          totalWeeks: activeMesocycle.duration_weeks,
          elapsedDays,
          remainingDays,
          progressPercentage,
          // 🧠 Detalles del progreso inteligente
          intelligentProgress: {
            temporalProgress: intelligentProgress.temporalProgress,
            workoutProgress: intelligentProgress.workoutProgress,
            consistencyFactor: intelligentProgress.consistencyFactor,
            details: intelligentProgress.details
          }
        }
      },
      message: 'Mesociclo activo obtenido con progreso inteligente'
    });
  } catch (error) {
    console.error('Error fetching active mesocycle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch active mesocycle' 
    });
  }
});

/**
 * POST /api/scientific-workouts/check-recovery
 * Verificar estado de recuperación muscular
 */
router.post('/check-recovery', authenticateToken, async (req, res) => {
  try {
    console.log('💪 [ScientificWorkouts] Checking muscle recovery...');
    
    const userId = req.user!.id;
    const { muscleGroups } = req.body;
    
    if (!muscleGroups || !Array.isArray(muscleGroups)) {
      return res.status(400).json({
        success: false,
        error: 'muscleGroups array is required'
      });
    }
    
    const recoveryStatus = await scientificWorkoutService.checkMuscleRecovery(userId, muscleGroups);
    
    res.json({
      success: true,
      recovery: recoveryStatus,
      message: recoveryStatus.ready ? 'Músculos listos para entrenar' : 'Algunos músculos aún en recuperación'
    });
  } catch (error) {
    console.error('Error checking muscle recovery:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check muscle recovery' 
    });
  }
});

/**
 * POST /api/scientific-workouts/update-recovery
 * Actualizar estado de recuperación después del entrenamiento
 */
router.post('/update-recovery', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [ScientificWorkouts] Updating muscle recovery...');
    
    const userId = req.user!.id;
    const { muscleGroups, recoveryHours = 48 } = req.body;
    
    if (!muscleGroups || !Array.isArray(muscleGroups)) {
      return res.status(400).json({
        success: false,
        error: 'muscleGroups array is required'
      });
    }
    
    await scientificWorkoutService.updateMuscleRecovery(userId, muscleGroups, recoveryHours);
    
    res.json({
      success: true,
      message: `Recuperación actualizada para ${muscleGroups.length} grupos musculares`
    });
  } catch (error) {
    console.error('Error updating muscle recovery:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update muscle recovery' 
    });
  }
});

/**
 * GET /api/scientific-workouts/today-recommendation
 * Obtener recomendación científica para hoy
 */
router.get('/today-recommendation', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 [ScientificWorkouts] Getting today\'s recommendation...');
    
    const userId = req.user!.id;
    
    // Obtener mesociclo activo
    const activeMesocycle = await scientificWorkoutService.getActiveMesocycle(userId);
    
    if (!activeMesocycle) {
      return res.json({
        success: true,
        recommendation: null,
        message: 'No hay mesociclo activo. Crea uno primero.'
      });
    }
    
    // Obtener recomendación basada en el split del mesociclo
    const userPreferences = await supabaseStorage.getUserPreferences(userId);
    const weeklyFrequency = userPreferences?.weeklyFrequency || 3;
    
    const recommendation = await scientificWorkoutService.recommendOptimalSplit(userId, weeklyFrequency);
    
    // Determinar qué split entrenar hoy basado en el día de la semana
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];
    
    const todayWorkout = recommendation.weeklySchedule[todayName];
    
    res.json({
      success: true,
      recommendation: {
        mesocycle: activeMesocycle,
        todayWorkout,
        weeklySchedule: recommendation.weeklySchedule,
        rationale: recommendation.rationale
      },
      message: todayWorkout?.rest ? 'Día de descanso recomendado' : 'Entrenamiento recomendado para hoy'
    });
  } catch (error) {
    console.error('Error getting today\'s recommendation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get today\'s recommendation' 
    });
  }
});

/**
 * GET /api/scientific-workouts/check-progression
 * Verificar si el mesociclo debe cambiar automáticamente
 */
router.get('/check-progression', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [ScientificWorkouts] Checking mesocycle progression...');

    const userId = req.user!.id;
    const progressCheck = await scientificWorkoutService.checkMesocycleProgression(userId);

    res.json({
      success: true,
      progression: progressCheck,
      message: progressCheck.shouldChange ? 'Mesociclo listo para cambiar' : 'Mesociclo en progreso'
    });
  } catch (error) {
    console.error('Error checking mesocycle progression:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check mesocycle progression'
    });
  }
});

/**
 * POST /api/scientific-workouts/auto-progress
 * Cambiar automáticamente al siguiente mesociclo
 */
router.post('/auto-progress', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 [ScientificWorkouts] Auto-progressing mesocycle...');

    const userId = req.user!.id;
    const result = await scientificWorkoutService.autoProgressMesocycle(userId);

    res.json({
      success: result.success,
      newMesocycle: result.newMesocycle,
      message: result.message
    });
  } catch (error) {
    console.error('Error auto-progressing mesocycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-progress mesocycle'
    });
  }
});

/**
 * GET /api/scientific-workouts/debug-assignments
 * Diagnosticar asignaciones de splits del usuario
 */
router.get('/debug-assignments', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [ScientificWorkouts] Debugging user split assignments...');

    const userId = req.user!.id;

    // 1. Obtener asignaciones del usuario
    const { assignments } = await splitAssignmentService.getUserSplitAssignments(userId);

    // 2. Obtener rutinas en cache
    const { data: cachedWorkouts, error: cacheError } = await supabase
      .from('pre_generated_workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('workout_date', new Date().toISOString().split('T')[0])
      .order('workout_date');

    if (cacheError) {
      console.error('❌ Error getting cached workouts:', cacheError);
    }

    // 3. Mapear días de la semana
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weeklySchedule = {};

    daysOfWeek.forEach(day => {
      const assignment = assignments.find(a => a.day_name === day);
      weeklySchedule[day] = assignment ? {
        hasAssignment: true,
        splitName: assignment.scientific_splits?.split_name,
        splitType: assignment.scientific_splits?.split_type,
        muscleGroups: assignment.scientific_splits?.muscle_groups,
        isActive: assignment.is_active
      } : {
        hasAssignment: false,
        isRestDay: true
      };
    });

    // 4. Verificar cache para hoy
    const today = new Date().toISOString().split('T')[0];
    const todayCache = cachedWorkouts?.find(w => w.workout_date === today);

    res.json({
      success: true,
      debug: {
        userId,
        today,
        todayDayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        weeklySchedule,
        totalAssignments: assignments.length,
        cachedWorkouts: cachedWorkouts?.length || 0,
        todayCache: todayCache ? {
          splitName: todayCache.split_name,
          targetMuscleGroups: todayCache.target_muscle_groups,
          isConsumed: todayCache.is_consumed
        } : null,
        recommendations: [
          assignments.length === 0 ? "❌ No tienes asignaciones de splits configuradas" : "✅ Asignaciones encontradas",
          todayCache ? "✅ Rutina en cache para hoy" : "⚠️ No hay rutina en cache para hoy",
          "🔧 Si los datos son incorrectos, necesitas limpiar cache y reconfigurar splits"
        ]
      }
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error in debug-assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to debug assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scientific-workouts/fix-corrupted-data
 * Limpiar datos corruptos y regenerar cache
 */
router.post('/fix-corrupted-data', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 [ScientificWorkouts] Fixing corrupted data...');

    const userId = req.user!.id;
    const { clearCache = true, regenerateCache = true } = req.body;

    const results = {
      cacheCleared: false,
      cacheRegenerated: false,
      errors: []
    };

    // 1. Limpiar cache corrupto
    if (clearCache) {
      try {
        const { error: clearError } = await supabase
          .from('pre_generated_workouts')
          .delete()
          .eq('user_id', userId);

        if (clearError) {
          results.errors.push(`Error clearing cache: ${clearError.message}`);
        } else {
          results.cacheCleared = true;
          console.log('✅ [ScientificWorkouts] Cache cleared successfully');
        }
      } catch (error) {
        results.errors.push(`Exception clearing cache: ${error.message}`);
      }
    }

    // 2. Regenerar cache basado en asignaciones correctas
    if (regenerateCache && results.cacheCleared) {
      try {
        await workoutCacheService.generateCacheForUser(userId, 7);
        results.cacheRegenerated = true;
        console.log('✅ [ScientificWorkouts] Cache regenerated successfully');
      } catch (error) {
        results.errors.push(`Error regenerating cache: ${error.message}`);
      }
    }

    res.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 ?
        'Datos corruptos corregidos exitosamente' :
        'Corrección completada con algunos errores',
      results,
      nextSteps: [
        "1. Verifica tus asignaciones de splits en la configuración",
        "2. Asegúrate de que los días de descanso no tengan asignaciones",
        "3. Prueba generar una nueva rutina",
        "4. Si persisten problemas, contacta soporte"
      ]
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error fixing corrupted data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix corrupted data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scientific-workouts/fix-timezone-bug
 * Corregir bug de timezone que causa rutinas en días incorrectos
 */
router.post('/fix-timezone-bug', authenticateToken, async (req, res) => {
  try {
    console.log('🕐 [ScientificWorkouts] Fixing timezone bug...');

    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Eliminar rutina incorrecta de hoy si existe
    const { error: deleteError } = await supabase
      .from('pre_generated_workouts')
      .delete()
      .eq('user_id', userId)
      .eq('workout_date', today);

    if (deleteError) {
      console.error('❌ Error deleting corrupted workout:', deleteError);
    } else {
      console.log('✅ Deleted corrupted workout for today');
    }

    // 2. Eliminar plan diario corrupto si existe
    const { error: deleteDailyError } = await supabase
      .from('daily_workout_plans')
      .delete()
      .eq('user_id', userId)
      .eq('workout_date', today);

    if (deleteDailyError) {
      console.error('❌ Error deleting corrupted daily plan:', deleteDailyError);
    } else {
      console.log('✅ Deleted corrupted daily plan for today');
    }

    // 3. Verificar día actual correctamente
    const todayDate = new Date(today + 'T12:00:00'); // Fix timezone
    const dayIndex = todayDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const correctDayName = dayNames[dayIndex];

    // 4. Verificar si hay asignación para hoy
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_split_assignments')
      .select(`
        *,
        scientific_splits (
          id,
          split_name,
          split_type,
          muscle_groups
        )
      `)
      .eq('user_id', userId)
      .eq('day_name', correctDayName)
      .eq('is_active', true)
      .single();

    const isRestDay = !assignment || assignmentError;

    res.json({
      success: true,
      message: 'Timezone bug corregido exitosamente',
      debug: {
        today,
        dayIndex,
        correctDayName,
        isRestDay,
        hasAssignment: !!assignment,
        assignmentDetails: assignment ? {
          splitName: assignment.scientific_splits?.split_name,
          muscleGroups: assignment.scientific_splits?.muscle_groups
        } : null
      },
      recommendation: isRestDay ?
        '✅ Hoy es día de descanso - no se generará rutina' :
        '⚠️ Hoy tienes entrenamiento - se puede generar rutina'
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error fixing timezone bug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix timezone bug',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/scientific-workouts/progression-stats
 * Obtener estadísticas de progresión del usuario
 */
router.get('/progression-stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 [ScientificWorkouts] Fetching progression stats...');

    const userId = req.user!.id;
    const stats = await scientificWorkoutService.getUserProgressionStats(userId);

    res.json({
      success: true,
      stats,
      message: 'Estadísticas de progresión obtenidas'
    });
  } catch (error) {
    console.error('Error fetching progression stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progression stats'
    });
  }
});

/**
 * POST /api/scientific-workouts/plan-week
 * Planificar semana completa con recuperación muscular automática
 */
router.post('/plan-week', authenticateToken, async (req, res) => {
  try {
    console.log('📅 [ScientificWorkouts] Planning optimal week...');

    const userId = req.user!.id;
    const { weekStartDate, preferredDays = [] } = req.body;

    // Obtener recomendación de split
    const userPreferences = await supabaseStorage.getUserPreferences(userId);
    const weeklyFrequency = userPreferences?.weeklyFrequency || 3;

    const recommendation = await scientificWorkoutService.recommendOptimalSplit(userId, weeklyFrequency);

    // Verificar recuperación muscular para cada día
    const weekPlan = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
      const daySchedule = recommendation.weeklySchedule[day];

      if (daySchedule && !daySchedule.rest) {
        // Verificar si los músculos están listos
        const muscleGroups = recommendation.recommendedSplit.find(s => s.id === daySchedule.split_id)?.muscle_groups || [];
        const recoveryCheck = await scientificWorkoutService.checkMuscleRecovery(userId, muscleGroups);

        weekPlan[day] = {
          ...daySchedule,
          muscleGroups,
          recoveryStatus: recoveryCheck.ready ? 'ready' : 'recovering',
          recoveryRecommendation: recoveryCheck.recommendation
        };
      } else {
        weekPlan[day] = daySchedule;
      }
    }

    res.json({
      success: true,
      weekPlan,
      recommendation: recommendation.rationale,
      message: 'Semana planificada con recuperación muscular optimizada'
    });
  } catch (error) {
    console.error('Error planning week:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to plan week'
    });
  }
});

/**
 * POST /api/scientific-workouts/update-recovery-status
 * Actualizar estado de recuperación después de completar entrenamiento
 */
router.post('/update-recovery-status', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [ScientificWorkouts] Updating recovery status after workout...');

    const userId = req.user!.id;
    const { muscleGroups, workoutIntensity = 'moderate', workoutDuration = 45 } = req.body;

    if (!muscleGroups || !Array.isArray(muscleGroups)) {
      return res.status(400).json({
        success: false,
        error: 'muscleGroups array is required'
      });
    }

    // Calcular tiempo de recuperación basado en intensidad y duración
    let recoveryHours = 48; // Base

    if (workoutIntensity === 'high' || workoutDuration > 60) {
      recoveryHours = 72;
    } else if (workoutIntensity === 'low' || workoutDuration < 30) {
      recoveryHours = 36;
    }

    // Actualizar recuperación muscular
    await scientificWorkoutService.updateMuscleRecovery(userId, muscleGroups, recoveryHours);

    // Obtener estado actualizado
    const updatedStatus = await scientificWorkoutService.checkMuscleRecovery(userId, muscleGroups);

    res.json({
      success: true,
      recoveryHours,
      updatedStatus,
      message: `Recuperación actualizada: ${recoveryHours}h para ${muscleGroups.length} grupos musculares`
    });
  } catch (error) {
    console.error('Error updating recovery status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update recovery status'
    });
  }
});

/**
 * GET /api/scientific-workouts/recovery-dashboard
 * Dashboard completo de recuperación muscular
 */
router.get('/recovery-dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('📊 [ScientificWorkouts] Fetching recovery dashboard...');

    const userId = req.user!.id;

    // Obtener estado de todos los grupos musculares principales
    const mainMuscleGroups = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];

    const recoveryStatus = {};
    for (const muscle of mainMuscleGroups) {
      const status = await scientificWorkoutService.checkMuscleRecovery(userId, [muscle]);
      recoveryStatus[muscle] = status.recoveryStatus[muscle] || {
        muscle_group: muscle,
        recovery_status: 'ready',
        next_available_date: new Date().toISOString().split('T')[0]
      };
    }

    // Calcular estadísticas
    const totalMuscles = Object.keys(recoveryStatus).length;
    const readyMuscles = Object.values(recoveryStatus).filter((status: any) => status.recovery_status === 'ready').length;
    const recoveringMuscles = totalMuscles - readyMuscles;

    // Obtener recomendaciones para hoy
    const todayRecommendation = await scientificWorkoutService.recommendOptimalSplit(userId, 3);

    res.json({
      success: true,
      dashboard: {
        recoveryStatus,
        statistics: {
          totalMuscles,
          readyMuscles,
          recoveringMuscles,
          readyPercentage: Math.round((readyMuscles / totalMuscles) * 100)
        },
        todayRecommendation: todayRecommendation.rationale,
        optimalWorkout: todayRecommendation.recommendedSplit[0] || null
      },
      message: 'Dashboard de recuperación obtenido'
    });
  } catch (error) {
    console.error('Error fetching recovery dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recovery dashboard'
    });
  }
});

/**
 * 🧠 Calcular progreso inteligente del mesociclo
 * Combina progreso temporal + progreso real de entrenamientos
 */
async function calculateIntelligentProgress(
  userId: number,
  mesocycle: any,
  elapsedDays: number,
  totalDays: number,
  currentWeek: number
): Promise<{
  progressPercentage: number;
  temporalProgress: number;
  workoutProgress: number;
  consistencyFactor: number;
  details: {
    completedWorkouts: number;
    expectedWorkouts: number;
    weeklyConsistency: number;
    participationRate: number;
  };
}> {
  try {
    // 📅 Progreso temporal (días transcurridos)
    const temporalProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    // 🏋️ Obtener entrenamientos completados desde el inicio del mesociclo
    const { data: completedSessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select('id, completed_at, status')
      .eq('user_id', userId)
      .in('status', ['completed', 'finished'])
      .not('completed_at', 'is', null)
      .gte('completed_at', mesocycle.start_date)
      .lte('completed_at', new Date().toISOString());

    if (sessionsError) {
      console.error('Error fetching completed sessions:', sessionsError);
      // Fallback al progreso temporal si hay error
      return {
        progressPercentage: temporalProgress,
        temporalProgress,
        workoutProgress: 0,
        consistencyFactor: 0,
        details: {
          completedWorkouts: 0,
          expectedWorkouts: 0,
          weeklyConsistency: 0,
          participationRate: 0
        }
      };
    }

    const completedWorkouts = completedSessions?.length || 0;

    // 📊 Calcular entrenamientos esperados (asumiendo 4-5 entrenamientos por semana)
    const expectedWorkoutsPerWeek = 4; // Promedio conservador
    const expectedWorkouts = Math.max(1, currentWeek * expectedWorkoutsPerWeek);

    // 💪 Progreso de entrenamientos (% de entrenamientos completados vs esperados)
    const workoutProgress = Math.min(100, Math.round((completedWorkouts / expectedWorkouts) * 100));

    // 🎯 Factor de consistencia (qué tan consistente ha sido el usuario)
    const participationRate = completedWorkouts / Math.max(1, expectedWorkouts);
    const consistencyFactor = Math.min(1, participationRate);

    // 📈 Consistencia semanal (entrenamientos por semana)
    const weeklyConsistency = currentWeek > 0 ? completedWorkouts / currentWeek : 0;

    // 🧠 FÓRMULA INTELIGENTE: Combinar progreso temporal y real
    // Si el usuario no ha hecho entrenamientos, el progreso es muy bajo
    // Si ha sido consistente, el progreso puede superar el temporal
    let intelligentProgressPercentage: number;

    if (completedWorkouts === 0) {
      // Sin entrenamientos = máximo 5% de progreso sin importar el tiempo
      intelligentProgressPercentage = Math.min(5, temporalProgress);
    } else if (participationRate >= 0.8) {
      // Usuario muy consistente = progreso puede superar el temporal
      intelligentProgressPercentage = Math.min(100, Math.max(temporalProgress, workoutProgress));
    } else if (participationRate >= 0.5) {
      // Usuario moderadamente consistente = promedio ponderado
      intelligentProgressPercentage = Math.round((temporalProgress * 0.4) + (workoutProgress * 0.6));
    } else {
      // Usuario poco consistente = penalizar progreso
      intelligentProgressPercentage = Math.round((temporalProgress * 0.2) + (workoutProgress * 0.8));
    }

    return {
      progressPercentage: Math.min(100, Math.max(0, intelligentProgressPercentage)),
      temporalProgress,
      workoutProgress,
      consistencyFactor,
      details: {
        completedWorkouts,
        expectedWorkouts,
        weeklyConsistency: Math.round(weeklyConsistency * 10) / 10,
        participationRate: Math.round(participationRate * 100)
      }
    };

  } catch (error) {
    console.error('Error calculating intelligent progress:', error);
    // Fallback al progreso temporal en caso de error
    const fallbackProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    return {
      progressPercentage: fallbackProgress,
      temporalProgress: fallbackProgress,
      workoutProgress: 0,
      consistencyFactor: 0,
      details: {
        completedWorkouts: 0,
        expectedWorkouts: 0,
        weeklyConsistency: 0,
        participationRate: 0
      }
    };
  }
}

/**
 * GET /api/scientific-workouts/auto-workout
 * Obtener rutina automática para una fecha específica
 */
router.get('/auto-workout', authenticateToken, async (req, res) => {
  try {
    console.log('🤖 [ScientificWorkouts] Getting auto-generated workout...');

    const userId = req.user!.id;
    const { date, debug } = req.query;
    const workoutDate = (date as string) || getCurrentDate();

    console.log(`🤖 [ScientificWorkouts] Fetching auto workout for user ${userId}, date: ${workoutDate}`);

    // 🔍 DEBUG MODE: Mostrar información detallada
    if (debug === 'true') {
      const dayOfWeek = new Date(workoutDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const splitAssignment = await splitAssignmentService.getSplitForDay(userId, dayOfWeek);

      return res.json({
        success: true,
        debug: true,
        debugInfo: {
          userId,
          workoutDate,
          dayOfWeek,
          splitAssignment: splitAssignment ? {
            splitName: splitAssignment.split_name,
            splitType: splitAssignment.split_type,
            muscleGroups: splitAssignment.muscle_groups,
            scientificRationale: splitAssignment.scientific_rationale
          } : null,
          message: splitAssignment ?
            `✅ Split encontrado: ${splitAssignment.split_name} - Músculos: ${splitAssignment.muscle_groups?.join(', ')}` :
            `❌ No hay split asignado para ${dayOfWeek}`
        }
      });
    }

    // Obtener rutina del cache o generar si no existe
    const workout = await workoutCacheService.getOrGenerateWorkout(userId, workoutDate);

    if (!workout) {
      return res.json({
        success: true,
        workout: null,
        message: 'No hay entrenamiento programado para esta fecha',
        isRestDay: true
      });
    }

    // Marcar como usada si es para hoy
    if (workoutDate === getCurrentDate() && workout.id) {
      await autoWorkoutService.markWorkoutAsUsed(workout.id);
    }

    res.json({
      success: true,
      workout: {
        id: workout.id,
        splitName: workout.split_name,
        exercises: workout.exercises,
        estimatedDuration: workout.estimated_duration,
        targetMuscleGroups: workout.target_muscle_groups,
        aiConfidenceScore: workout.ai_confidence_score,
        generationMetadata: workout.generation_metadata,
        isAutoGenerated: true
      },
      message: `Rutina automática: ${workout.split_name}`
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error getting auto workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto workout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scientific-workouts/regenerate-cache
 * Regenerar cache de rutinas para el usuario
 */
router.post('/regenerate-cache', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [ScientificWorkouts] Regenerating workout cache...');

    const userId = req.user!.id;
    const { daysAhead = 7 } = req.body;

    // Regenerar cache
    await workoutCacheService.regenerateUserCache(userId);

    // Generar cache adicional si se especifica
    if (daysAhead > 7) {
      await workoutCacheService.generateCacheForUser(userId, daysAhead);
    }

    // Obtener estado del cache
    const cacheStatus = await workoutCacheService.getCacheStatus(userId);

    res.json({
      success: true,
      message: 'Cache de rutinas regenerado exitosamente',
      cacheStatus
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error regenerating cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/scientific-workouts/cache-status
 * Obtener estado del cache de rutinas
 */
router.get('/cache-status', authenticateToken, async (req, res) => {
  try {
    console.log('📊 [ScientificWorkouts] Getting cache status...');

    const userId = req.user!.id;
    const cacheStatus = await workoutCacheService.getCacheStatus(userId);

    res.json({
      success: true,
      cacheStatus,
      message: `Cache status: ${cacheStatus.totalCached} rutinas en cache`
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error getting cache status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scientific-workouts/save-split-assignments
 * Guardar asignación de splits a días específicos
 */
router.post('/save-split-assignments', authenticateToken, async (req, res) => {
  try {
    console.log('🗓️ [ScientificWorkouts] Saving split assignments...');

    const userId = req.user!.id;
    const { weeklySchedule, weeklyFrequency } = req.body;

    if (!weeklySchedule || !weeklyFrequency) {
      return res.status(400).json({
        success: false,
        error: 'weeklySchedule and weeklyFrequency are required'
      });
    }

    // Obtener días disponibles del usuario (todos los días excepto domingo por defecto)
    const userAvailableDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Validar asignaciones
    const validation = splitAssignmentService.validateAssignments(weeklySchedule, userAvailableDays);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Las asignaciones no son válidas',
        details: validation.errors
      });
    }

    // Guardar asignaciones
    await splitAssignmentService.saveSplitAssignments(userId, weeklySchedule, weeklyFrequency);

    // 🤖 Regenerar cache automáticamente cuando cambian las asignaciones
    console.log('🤖 [ScientificWorkouts] Regenerating cache due to assignment change...');
    await workoutCacheService.updateCacheOnAssignmentChange(userId);

    res.json({
      success: true,
      message: 'Asignaciones guardadas y cache regenerado exitosamente',
      assignedDays: Object.keys(weeklySchedule).length
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error saving split assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save split assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/scientific-workouts/ai-insights
 * Obtener insights de IA basados en patrones del usuario
 */
router.get('/ai-insights', authenticateToken, async (req, res) => {
  try {
    console.log('🧠 [ScientificWorkouts] Getting AI insights...');

    const userId = req.user!.id;
    const insights = await aiLearningService.generateAIInsights(userId);

    res.json({
      success: true,
      insights,
      message: 'Insights de IA generados exitosamente'
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error getting AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/scientific-workouts/optimize-workouts
 * Optimizar rutinas futuras basado en aprendizaje de IA
 */
router.post('/optimize-workouts', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [ScientificWorkouts] Optimizing workouts with AI...');

    const userId = req.user!.id;
    await aiLearningService.optimizeFutureWorkouts(userId);

    res.json({
      success: true,
      message: 'Rutinas optimizadas con IA exitosamente'
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error optimizing workouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize workouts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/scientific-workouts/split-assignments
 * Obtener asignaciones de splits del usuario
 */
router.get('/split-assignments', authenticateToken, async (req, res) => {
  try {
    console.log('🗓️ [ScientificWorkouts] Getting split assignments...');

    const userId = req.user!.id;
    const result = await splitAssignmentService.getUserSplitAssignments(userId);

    res.json({
      success: true,
      assignments: result.assignments,
      weeklySchedule: result.weeklySchedule,
      message: `${result.assignments.length} asignaciones encontradas`
    });

  } catch (error) {
    console.error('❌ [ScientificWorkouts] Error getting split assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get split assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
