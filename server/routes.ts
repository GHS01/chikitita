import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storageNew";
import { geminiService } from "./geminiService";
import { supabase } from "./supabase";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import { z } from "zod";
import {
  loginSchema, registerSchema, insertMealSchema, insertProgressEntrySchema,
  insertWorkoutSessionSchema, insertWorkoutPlanSchema, insertExerciseLogSchema,
  insertUserPreferencesSchema, insertProfilePhotoSchema, insertNotificationSchema,
  type User
} from "@shared/schema";
import path from 'path';
import fs from 'fs/promises';
import trainerRoutes from "./routes/trainer";
import weeklyHistoryRoutes from "./routes/weeklyHistory";
import weightProgressRoutes from "./routes/weightProgress";
// 🔧 FIX TIMEZONE: Importar sistema centralizado
import { getCurrentDate } from './utils/timeSystem';
import nutritionRoutes from "./routes/nutrition";
import intelligentWorkoutsRoutes from "./routes/intelligentWorkouts";
import scientificWorkoutsRoutes from "./routes/scientificWorkouts";
import { supabaseStorageService } from "./services/supabaseStorageService";
import workoutFeedbackRoutes from "./routes/workoutFeedback";
import analyticsRoutes from "./routes/analytics";
import periodizationRoutes from "./routes/periodization";
import schedulerRoutes from "./routes/scheduler";
import weightSuggestionsRoutes from "./routes/weightSuggestions";
import { workoutCronService } from "./services/workoutCronService";
import { profileCompletenessService } from "./services/profileCompletenessService";
import { profileSyncService } from "./services/profileSyncService";
import { scientificWorkoutService } from "./services/scientificWorkoutService";
import { frequencyChangeMiddleware } from "./middleware/frequencyChangeMiddleware";
import { frequencyChangeService } from "./services/frequencyChangeService";
import { mesocycleAutoMigrationMiddleware } from "./middleware/autoMigrationMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const upload = multer({ storage: multer.memoryStorage() });

// 🔧 HELPER: Calcular semana correcta basada en mesociclo
async function calculateCorrectWeekNumber(userId: number): Promise<number> {
  try {
    // Buscar el mesociclo activo del usuario usando el servicio correcto
    const mesocycle = await scientificWorkoutService.getActiveMesocycle(userId);

    if (!mesocycle) {
      console.log('🔍 [WeekCalc] No active mesocycle found, defaulting to week 1');
      return 1;
    }

    const startDate = new Date(mesocycle.start_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.min(Math.ceil(diffDays / 7), mesocycle.duration_weeks || 6);

    console.log('✅ [WeekCalc] Mesocycle found:', {
      startDate: startDate.toISOString(),
      today: today.toISOString(),
      diffDays,
      currentWeek,
      maxWeeks: mesocycle.duration_weeks
    });

    return currentWeek;
  } catch (error) {
    console.error('❌ [WeekCalc] Error calculating week number:', error);
    return 1;
  }
}

// Real AI service for workout generation using Gemini
const generateWorkoutPlan = async (userId: number, fitnessLevel: string, goal: string, userProfile?: any) => {
  try {
    // Obtener datos adicionales del usuario si están disponibles
    const user = await storage.getUser(userId);

    const profile = {
      fitnessLevel,
      fitnessGoal: goal,
      age: user?.age,
      weight: user?.currentWeight,
      height: user?.height
    };

    // Usar Gemini para generar el plan
    const aiPlan = await geminiService.generateWorkoutPlan(profile);

    return {
      ...aiPlan,
      userId,
      isActive: true
    };
  } catch (error) {
    console.error('Error generating AI workout plan:', error);

    // Fallback a plan básico si falla la IA
    const exercises = {
      beginner: [
        { name: "Push-ups", sets: 3, reps: 10, rest: 60, instructions: "Mantén el cuerpo recto" },
        { name: "Squats", sets: 3, reps: 15, rest: 60, instructions: "Baja hasta 90 grados" },
        { name: "Plank", sets: 3, duration: 30, rest: 60, instructions: "Mantén el core activo" }
      ],
      intermediate: [
        { name: "Bench Press", sets: 4, reps: 8, weight: 60, rest: 90, instructions: "Control en la bajada" },
        { name: "Deadlifts", sets: 4, reps: 6, weight: 80, rest: 120, instructions: "Espalda recta siempre" },
        { name: "Pull-ups", sets: 3, reps: 8, rest: 90, instructions: "Rango completo de movimiento" }
      ],
      advanced: [
        { name: "Heavy Squats", sets: 5, reps: 5, weight: 100, rest: 180, instructions: "Profundidad completa" },
        { name: "Military Press", sets: 4, reps: 6, weight: 50, rest: 120, instructions: "Core estable" },
        { name: "Barbell Rows", sets: 4, reps: 8, weight: 70, rest: 90, instructions: "Aprieta escápulas" }
      ]
    };

    return {
      name: `${goal} Training - Week 1`,
      description: `Plan de entrenamiento ${fitnessLevel} para ${goal}`,
      difficulty: fitnessLevel,
      duration: 45,
      exercises: exercises[fitnessLevel as keyof typeof exercises] || exercises.beginner,
      weekNumber: 1,
      isActive: true,
      userId
    };
  }
};

// Real nutrition analysis using Gemini AI
const analyzeFoodImage = async (imageBuffer: Buffer): Promise<any> => {
  try {
    // Usar Gemini para analizar la imagen de comida
    const analysis = await geminiService.analyzeFoodImage(imageBuffer);

    return {
      name: analysis.name || "Comida Analizada",
      description: analysis.description || "Análisis nutricional generado por IA",
      calories: analysis.calories || 300,
      protein: analysis.protein || 20,
      carbs: analysis.carbs || 40,
      fat: analysis.fat || 15,
      fiber: analysis.fiber || 5
    };
  } catch (error) {
    console.error('Error analyzing food with AI:', error);

    // Fallback a análisis básico si falla la IA
    return {
      name: "Comida Analizada",
      description: "Análisis nutricional básico",
      calories: Math.floor(Math.random() * 400) + 200,
      protein: Math.floor(Math.random() * 30) + 15,
      carbs: Math.floor(Math.random() * 50) + 20,
      fat: Math.floor(Math.random() * 20) + 10,
      fiber: Math.floor(Math.random() * 10) + 3
    };
  }
};

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const { confirmPassword, firstName, lastName, ...userToCreate } = userData;
      const user = await storage.createUser({
        ...userToCreate,
        firstName,
        lastName,
        password: hashedPassword
      });

      // 🚫 REMOVED: No longer generate initial workout plan automatically
      // Users should complete their profile first and then manually generate their first workout plan
      // This ensures the AI has complete data to create personalized routines

      console.log('✅ [Register] User registered successfully. Workout plan generation will be manual after profile completion.');

      // Generate token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);

      res.status(201).json({
        token,
        user: { ...user, passwordHash: undefined }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("🔍 Login attempt:", req.body);
      const { username, password } = loginSchema.parse(req.body);
      console.log("✅ Schema validation passed");

      const user = await storage.getUserByUsername(username);
      console.log("👤 User found:", user ? `ID: ${user.id}, Username: ${user.username}` : "No user found");

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("🔐 Comparing passwords...");
      console.log("Password from request:", password);
      console.log("Password hash from DB:", user.passwordHash);

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      console.log("🔑 Password validation result:", validPassword);

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
      console.log("🎫 Token generated successfully");

      res.json({
        token,
        user: { ...user, passwordHash: undefined }
      });
    } catch (error) {
      console.error("❌ Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, passwordHash: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const updatedUser = await storage.updateUser(req.user.userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...updatedUser, passwordHash: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User preferences routes
  app.get("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user.userId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/user/preferences", authenticateToken, ...frequencyChangeMiddleware, async (req: any, res) => {
    try {
      console.log('🔧 [PreferencesAPI] PUT /api/user/preferences called');
      console.log('🔧 [PreferencesAPI] User ID:', req.user.userId);
      console.log('🔧 [PreferencesAPI] Request body:', JSON.stringify(req.body, null, 2));

      // Validate the request body
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      console.log('🔧 [PreferencesAPI] Validated data:', JSON.stringify(validatedData, null, 2));

      const preferences = await storage.updateUserPreferences(req.user.userId, validatedData);
      console.log('🔧 [PreferencesAPI] Updated preferences:', JSON.stringify(preferences, null, 2));

      res.json(preferences);
    } catch (error) {
      console.error('🔧 [PreferencesAPI] Error updating preferences:', error);
      if (error instanceof z.ZodError) {
        console.error('🔧 [PreferencesAPI] Validation errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
          field: error.errors[0]?.path.join('.'),
          details: error.errors[0]?.message
        });
      }
      res.status(500).json({ message: "Failed to update preferences", error: error.message });
    }
  });

  // 🔄 Mesocycle Migration Routes

  // Detectar mesociclos incompatibles
  app.get("/api/mesocycles/migration/detect", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔍 [MigrationAPI] Detecting incompatible mesocycles for user:', req.user.userId);

      const { mesocycleMigrationService } = await import('./services/mesocycleMigrationService');
      const migrations = await mesocycleMigrationService.detectIncompatibleMesocycles(req.user.userId);

      console.log('✅ [MigrationAPI] Found migrations needed:', migrations.length);
      res.json({
        success: true,
        migrationsNeeded: migrations.length,
        migrations
      });

    } catch (error) {
      console.error('❌ [MigrationAPI] Error detecting migrations:', error);
      res.status(500).json({ message: "Failed to detect migrations" });
    }
  });

  // Ejecutar migración automática
  app.post("/api/mesocycles/migration/execute", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔄 [MigrationAPI] Executing automatic migration for user:', req.user.userId);

      const { mesocycleMigrationService } = await import('./services/mesocycleMigrationService');
      const result = await mesocycleMigrationService.migrateAllIncompatible(req.user.userId);

      console.log('✅ [MigrationAPI] Migration completed:', result);
      res.json({
        success: true,
        message: `Migración completada: ${result.totalMigrated}/${result.totalDetected} mesociclos actualizados`,
        ...result
      });

    } catch (error) {
      console.error('❌ [MigrationAPI] Error executing migration:', error);
      res.status(500).json({ message: "Failed to execute migration" });
    }
  });

  // Obtener estadísticas de migración
  app.get("/api/mesocycles/migration/stats", authenticateToken, async (req: any, res) => {
    try {
      console.log('📊 [MigrationAPI] Getting migration stats for user:', req.user.userId);

      const { mesocycleMigrationService } = await import('./services/mesocycleMigrationService');
      const stats = await mesocycleMigrationService.getMigrationStats(req.user.userId);

      console.log('✅ [MigrationAPI] Migration stats:', stats);
      res.json(stats);

    } catch (error) {
      console.error('❌ [MigrationAPI] Error getting migration stats:', error);
      res.status(500).json({ message: "Failed to get migration stats" });
    }
  });

  // 🧠 Intelligent Split Assignment Routes

  // Generar asignación inteligente
  app.post("/api/splits/intelligent-assignment", authenticateToken, async (req: any, res) => {
    try {
      console.log('🧠 [IntelligentSplits] Generating intelligent assignment for user:', req.user.userId);

      const { weeklyFrequency, availableDays } = req.body;

      if (!weeklyFrequency || weeklyFrequency < 1 || weeklyFrequency > 7) {
        return res.status(400).json({
          success: false,
          message: "weeklyFrequency must be between 1 and 7"
        });
      }

      const { intelligentSplitAssignmentService } = await import('./services/intelligentSplitAssignmentService');
      const result = await intelligentSplitAssignmentService.generateIntelligentAssignment(
        req.user.userId,
        weeklyFrequency,
        availableDays
      );

      console.log('✅ [IntelligentSplits] Assignment generated:', result);
      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('❌ [IntelligentSplits] Error generating assignment:', error);
      res.status(500).json({ message: "Failed to generate intelligent assignment" });
    }
  });

  // Aplicar asignación inteligente
  app.post("/api/splits/apply-assignment", authenticateToken, async (req: any, res) => {
    try {
      console.log('💾 [IntelligentSplits] Applying assignment for user:', req.user.userId);

      const { assignments } = req.body;

      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({
          success: false,
          message: "assignments array is required"
        });
      }

      const { intelligentSplitAssignmentService } = await import('./services/intelligentSplitAssignmentService');
      const result = await intelligentSplitAssignmentService.applyIntelligentAssignment(
        req.user.userId,
        assignments
      );

      console.log('✅ [IntelligentSplits] Assignment applied:', result);
      res.json(result);

    } catch (error) {
      console.error('❌ [IntelligentSplits] Error applying assignment:', error);
      res.status(500).json({ message: "Failed to apply assignment" });
    }
  });

  // Validar asignación manual
  app.post("/api/splits/validate-assignment", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔍 [IntelligentSplits] Validating assignment for user:', req.user.userId);

      const { assignments } = req.body;

      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({
          success: false,
          message: "assignments array is required"
        });
      }

      const { intelligentSplitAssignmentService } = await import('./services/intelligentSplitAssignmentService');
      const validation = await intelligentSplitAssignmentService.validateUserAssignment(assignments);

      console.log('✅ [IntelligentSplits] Validation completed:', validation);
      res.json({
        success: true,
        ...validation
      });

    } catch (error) {
      console.error('❌ [IntelligentSplits] Error validating assignment:', error);
      res.status(500).json({ message: "Failed to validate assignment" });
    }
  });

  // 🔄 Frequency Change Management Routes

  // Obtener cambios pendientes
  app.get("/api/user/frequency-changes/pending", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔍 [FrequencyAPI] Getting pending changes for user:', req.user.userId);

      const pendingChanges = await frequencyChangeService.getPendingChanges(req.user.userId);

      console.log('✅ [FrequencyAPI] Found pending changes:', pendingChanges.length);
      res.json(pendingChanges);

    } catch (error) {
      console.error('❌ [FrequencyAPI] Error fetching pending changes:', error);
      res.status(500).json({ message: "Failed to fetch pending changes" });
    }
  });

  // Procesar decisión del usuario
  app.post("/api/user/frequency-changes/decision", authenticateToken, async (req: any, res) => {
    try {
      console.log('✅ [FrequencyAPI] Processing user decision:', req.body);

      const { changeId, decision, reason } = req.body;

      if (!changeId || !decision || !['keep_current', 'create_new'].includes(decision)) {
        return res.status(400).json({
          message: "Invalid request. Required: changeId, decision (keep_current|create_new)"
        });
      }

      const result = await frequencyChangeService.processUserDecision({
        changeId: parseInt(changeId),
        decision,
        reason
      });

      console.log('✅ [FrequencyAPI] Decision processed successfully:', result);
      res.json(result);

    } catch (error) {
      console.error('❌ [FrequencyAPI] Error processing decision:', error);
      res.status(500).json({ message: "Failed to process decision" });
    }
  });

  // 📊 Profile completeness endpoint
  app.get("/api/user/profile-completeness", authenticateToken, async (req: any, res) => {
    try {
      console.log('📊 [ProfileCompleteness] Calculating for user:', req.user.userId);

      const completeness = await profileCompletenessService.calculateProfileCompleteness(req.user.userId);

      console.log('📊 [ProfileCompleteness] Result:', {
        userId: req.user.userId,
        percentage: completeness.completionPercentage,
        isReady: completeness.isReadyForWorkouts
      });

      res.json(completeness);
    } catch (error) {
      console.error('❌ [ProfileCompleteness] Error calculating completeness:', error);
      res.status(500).json({ message: "Failed to calculate profile completeness" });
    }
  });

  // 🔍 DEBUG: Profile completeness debug endpoint
  app.get("/api/debug/profile-completeness", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔍 [DEBUG] Profile completeness debug for user:', req.user.userId);

      const completeness = await profileCompletenessService.calculateProfileCompleteness(req.user.userId);

      res.json({
        ...completeness,
        debug: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] Error in profile completeness debug:', error);
      res.status(500).json({ message: "Debug failed", error: error.message });
    }
  });

  // 🔄 NUEVO: Perfil unificado - Obtener perfil completo
  app.get("/api/user/complete-profile", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔄 [ProfileSync] Getting complete profile for user:', req.user.userId);

      const completeProfile = await profileSyncService.getCompleteProfile(req.user.userId);

      if (!completeProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(completeProfile);
    } catch (error) {
      console.error('❌ [ProfileSync] Error getting complete profile:', error);
      res.status(500).json({ message: "Failed to get complete profile" });
    }
  });

  // 🔄 NUEVO: Perfil unificado - Actualizar perfil completo
  app.put("/api/user/complete-profile", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔄 [ProfileSync] Updating complete profile for user:', req.user.userId);
      console.log('📝 [ProfileSync] Update data:', req.body);

      const updatedProfile = await profileSyncService.updateCompleteProfile(req.user.userId, req.body);

      res.json(updatedProfile);
    } catch (error) {
      console.error('❌ [ProfileSync] Error updating complete profile:', error);
      res.status(500).json({ message: "Failed to update complete profile", error: error.message });
    }
  });

  // 📊 NUEVO: Completitud real del perfil unificado
  app.get("/api/user/real-completeness", authenticateToken, async (req: any, res) => {
    try {
      console.log('📊 [ProfileSync] Calculating real completeness for user:', req.user.userId);

      const completeness = await profileSyncService.calculateRealCompleteness(req.user.userId);

      res.json(completeness);
    } catch (error) {
      console.error('❌ [ProfileSync] Error calculating real completeness:', error);
      res.status(500).json({ message: "Failed to calculate real completeness" });
    }
  });

  // Workout routes
  app.get("/api/workouts", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔍 [Routes] Fetching workouts for user:', req.user.userId);

      // 🔄 NUEVA LÓGICA: Priorizar daily_workout_plans sobre workout_plans tradicionales
      const today = getCurrentDate();
      const recentDays = 7; // Obtener últimos 7 días
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - recentDays);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1); // Incluir mañana

      // Obtener rutinas diarias recientes (fuente principal)
      const dailyWorkouts = await storage.getRecentDailyWorkoutPlans(
        req.user.userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      console.log('🔍 [Routes] Daily workouts found:', dailyWorkouts.length);

      // Si hay rutinas diarias, convertirlas al formato esperado por el frontend
      if (dailyWorkouts.length > 0) {
        const formattedWorkouts = await Promise.all(dailyWorkouts.map(async (daily) => ({
          id: daily.id,
          userId: daily.userId,
          name: `${daily.generatedBasedOn?.split_name || 'Rutina'} - ${daily.workoutDate}`,
          description: daily.generatedBasedOn?.generation_metadata?.scientificRationale || 'Rutina personalizada',
          difficulty: 'intermediate',
          duration: daily.estimatedDuration || 45,
          exercises: daily.exercises,
          weekNumber: await calculateCorrectWeekNumber(daily.userId), // 🔧 FIXED: Usar cálculo correcto
          isActive: daily.isActive,
          createdAt: daily.createdAt,
          workoutDate: daily.workoutDate,
          isDailyPlan: true
        })));

        console.log('✅ [Routes] Returning daily workout plans:', formattedWorkouts.length);
        return res.json(formattedWorkouts);
      }

      // Fallback: Buscar en workout_plans tradicionales si no hay daily_workout_plans
      console.log('🔍 [Routes] No daily workouts found, checking traditional workout plans...');
      const workoutPlans = await storage.getWorkoutPlans(req.user.userId);

      console.log('🔍 [Routes] Traditional workout plans found:', workoutPlans.length);
      res.json(workoutPlans);

    } catch (error) {
      console.error('❌ [Routes] Error fetching workouts:', error);
      res.status(500).json({ message: "Failed to fetch workout plans" });
    }
  });

  app.get("/api/workouts/active", authenticateToken, async (req: any, res) => {
    try {
      console.log('🔍 [Routes] Fetching active workout for user:', req.user.userId);
      console.log('🚨 [CACHE BUSTER] Request timestamp:', new Date().toISOString());
      console.log('🔧 [WEEK FIX] Testing new weekNumber calculation...');

      // Buscar rutina diaria de hoy (nueva lógica)
      const today = getCurrentDate(); // 🔧 FIX: Usar fecha local
      console.log('🕐 [Routes Debug] 🔧 FIXED - Local date:', today);
      console.log('🕐 [Routes Debug] ❌ OLD - UTC date:', new Date().toISOString().split('T')[0]);

      console.log('🚨 [ACTIVE WORKOUT DEBUG] Requesting daily workout plan:', {
        userId: req.user.userId,
        username: req.user.username,
        date: today,
        timestamp: new Date().toISOString()
      });

      const todayPlan = await storage.getDailyWorkoutPlan(req.user.userId, today);

      console.log('🚨 [ACTIVE WORKOUT DEBUG] Daily workout plan result:', {
        userId: req.user.userId,
        date: today,
        planFound: !!todayPlan,
        planId: todayPlan?.id,
        planUserId: todayPlan?.userId
      });

      if (todayPlan) {
        console.log('✅ [Routes] Found daily workout plan for today:', todayPlan.id);
        // 🔧 FIXED: Calcular weekNumber correctamente basado en mesociclo
        const correctWeekNumber = await calculateCorrectWeekNumber(todayPlan.userId);

        console.log('✅ [WEEK FIXED] Calculated correct week number:', correctWeekNumber);

        // 🎯 OBTENER INFORMACIÓN DEL SPLIT ACTUAL PARA TÍTULO INTELIGENTE
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        let splitInfo = null;

        try {
          console.log('🔍 [Routes] Looking for split assignment:', { userId: todayPlan.userId, dayOfWeek });

          const { data: splitAssignment, error: splitError } = await supabase
            .from('user_split_assignments')
            .select(`
              *,
              scientific_splits (
                split_name,
                split_type
              )
            `)
            .eq('user_id', todayPlan.userId)
            .eq('day_name', dayOfWeek)
            .eq('is_active', true)
            .single();

          if (splitError) {
            console.log('❌ [Routes] Split query error:', splitError);
          } else {
            console.log('✅ [Routes] Split assignment found:', splitAssignment);
            splitInfo = splitAssignment?.scientific_splits;
          }
        } catch (error) {
          console.log('❌ [Routes] Exception finding split assignment:', error);
        }

        // 🏷️ GENERAR TÍTULO INTELIGENTE BASADO EN EL SPLIT
        const generateSmartTitle = () => {
          if (splitInfo?.split_name) {
            return `Hoy toca entrenar ${splitInfo.split_name}`;
          }

          // Fallback con fecha si no hay split
          return `Rutina del ${today}`;
        };

        // Convertir formato de daily_workout_plans a workout_plans para compatibilidad
        const activeWorkout = {
          id: todayPlan.id,
          name: generateSmartTitle(),
          description: todayPlan.generatedBasedOn?.description || 'Rutina personalizada generada por IA',
          duration: todayPlan.estimatedDuration || 45,
          exercises: todayPlan.exercises,
          weekNumber: correctWeekNumber, // 🔧 FIXED: Usar cálculo correcto
          isActive: true,
          difficulty: 'intermediate',
          userId: todayPlan.userId,
          createdAt: todayPlan.createdAt
        };
        return res.json(activeWorkout);
      }

      // 🔄 TRANSFERENCIA AUTOMÁTICA: Intentar transferir desde cache a daily_workout_plans
      console.log('🔄 [Routes] No daily plan found, attempting cache transfer...');

      try {
        // Intentar transferir rutina desde cache
        const transferredPlan = await storage.transferPreGeneratedToDaily(req.user.userId, today);

        if (transferredPlan) {
          console.log('✅ [Routes] Successfully transferred workout from cache:', transferredPlan.id);

          // Convertir formato para compatibilidad con frontend
          const activeWorkout = {
            id: transferredPlan.id,
            name: `${transferredPlan.generatedBasedOn?.split_name || 'Rutina'} - ${today}`,
            description: transferredPlan.generatedBasedOn?.generation_metadata?.scientificRationale || 'Rutina personalizada generada por IA',
            duration: transferredPlan.estimatedDuration || 45,
            exercises: transferredPlan.exercises,
            weekNumber: await calculateCorrectWeekNumber(transferredPlan.userId), // 🔧 FIXED: Usar cálculo correcto
            isActive: true,
            difficulty: 'intermediate',
            userId: transferredPlan.userId,
            createdAt: transferredPlan.createdAt,
            autoGenerated: true,
            transferredFromCache: true
          };

          return res.json(activeWorkout);
        }
      } catch (transferError) {
        console.error('❌ [Routes] Cache transfer failed:', transferError);
        // Continuar con fallback de generación automática
      }

      // 🤖 FALLBACK: AUTO-GENERATION si no hay cache disponible
      console.log('🤖 [Routes] No cache available, attempting auto-generation...');

      try {
        // Importar servicios necesarios
        const { workoutCacheService } = await import('./services/workoutCacheService');

        // Intentar obtener rutina del cache o generar automáticamente
        const autoWorkout = await workoutCacheService.getOrGenerateWorkout(req.user.userId, today);

        if (autoWorkout) {
          console.log('✅ [Routes] Auto-generated workout found:', autoWorkout.split_name);

          // 🔄 IMPORTANTE: Transferir inmediatamente a daily_workout_plans
          try {
            const transferredFromAutoGen = await storage.transferPreGeneratedToDaily(req.user.userId, today);
            if (transferredFromAutoGen) {
              console.log('✅ [Routes] Auto-generated workout transferred to daily plans:', transferredFromAutoGen.id);

              const activeWorkout = {
                id: transferredFromAutoGen.id,
                name: `${transferredFromAutoGen.generatedBasedOn?.split_name || autoWorkout.split_name} - ${today}`,
                description: transferredFromAutoGen.generatedBasedOn?.generation_metadata?.scientificRationale || 'Rutina generada automáticamente',
                duration: transferredFromAutoGen.estimatedDuration || 45,
                exercises: transferredFromAutoGen.exercises,
                weekNumber: await calculateCorrectWeekNumber(req.user.userId), // 🔧 FIXED: Usar cálculo correcto
                isActive: true,
                difficulty: 'intermediate',
                userId: req.user.userId,
                createdAt: transferredFromAutoGen.createdAt,
                autoGenerated: true,
                transferredFromCache: true
              };

              return res.json(activeWorkout);
            }
          } catch (transferAutoGenError) {
            console.error('❌ [Routes] Failed to transfer auto-generated workout:', transferAutoGenError);
          }

          // Fallback: Convertir formato para compatibilidad (sin transferir)
          const activeWorkout = {
            id: autoWorkout.id || Date.now(), // Usar timestamp como ID temporal
            name: `${autoWorkout.split_name} - ${today}`,
            description: autoWorkout.generation_metadata?.scientificRationale || 'Rutina generada automáticamente',
            duration: autoWorkout.estimated_duration || 45,
            exercises: autoWorkout.exercises || [],
            weekNumber: await calculateCorrectWeekNumber(req.user.userId), // 🔧 FIXED: Usar cálculo correcto
            isActive: true,
            difficulty: 'intermediate',
            userId: req.user.userId,
            createdAt: new Date().toISOString(),
            autoGenerated: true,
            cacheOnly: true // Indicar que no se transfirió
          };

          return res.json(activeWorkout);
        }
      } catch (autoGenError) {
        console.error('❌ [Routes] Auto-generation failed:', autoGenError);
        // Continuar con fallback tradicional
      }

      // Fallback: buscar en workout_plans tradicionales
      console.log('🔍 [Routes] No auto-generation possible, checking traditional workout plans...');
      const activeWorkout = await storage.getActiveWorkoutPlan(req.user.userId);

      if (activeWorkout) {
        console.log('✅ [Routes] Found traditional active workout:', activeWorkout.id);
      } else {
        console.log('❌ [Routes] No active workout found - user needs to configure mesocycle');
      }

      // 🚨 FORCE: No cache headers to see debug logs
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(activeWorkout);
    } catch (error) {
      console.error('❌ [Routes] Error fetching active workout:', error);
      res.status(500).json({ message: "Failed to fetch active workout" });
    }
  });

  app.post("/api/workouts/generate", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.fitnessLevel || !user.fitnessGoal) {
        return res.status(400).json({ message: "User fitness profile incomplete" });
      }

      // Deactivate current plans
      const currentPlans = await storage.getWorkoutPlans(req.user.userId);
      for (const plan of currentPlans) {
        await storage.updateWorkoutPlan(plan.id, { isActive: false });
      }

      // Generate new plan using AI
      const workoutPlan = await generateWorkoutPlan(user.id, user.fitnessLevel, user.fitnessGoal);
      const newPlan = await storage.createWorkoutPlan({ ...workoutPlan, userId: user.id });

      res.json(newPlan);
    } catch (error) {
      console.error('Error generating workout plan:', error);
      res.status(500).json({ message: "Failed to generate workout plan" });
    }
  });

  app.post("/api/workouts/sessions", authenticateToken, async (req: any, res) => {
    try {
      console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
      console.log("👤 User ID:", req.user.userId);

      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      console.log("✅ Parsed session data:", JSON.stringify(sessionData, null, 2));

      const session = await storage.createWorkoutSession({
        ...sessionData,
        userId: req.user.userId
      });
      res.status(201).json(session);
    } catch (error) {
      console.error("❌ Error creating workout session:", error);
      if (error instanceof z.ZodError) {
        console.error("🔍 Zod validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join('.'),
          allErrors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create workout session" });
    }
  });

  app.get("/api/workouts/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = await storage.getWorkoutSessions(req.user.userId, 10);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  app.patch("/api/workouts/sessions/:id", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;

      const session = await storage.updateWorkoutSession(sessionId, updates);
      if (!session) {
        return res.status(404).json({ message: "Workout session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workout session" });
    }
  });

  // Exercise logs routes
  app.get("/api/workouts/sessions/:id/logs", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const logs = await storage.getExerciseLogs(sessionId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise logs" });
    }
  });

  app.post("/api/workouts/sessions/:id/logs", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const logData = insertExerciseLogSchema.parse({
        ...req.body,
        sessionId
      });

      const log = await storage.createExerciseLog(logData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create exercise log" });
    }
  });

  // Nutrition routes
  app.get("/api/nutrition/meals", authenticateToken, async (req: any, res) => {
    try {
      const { date } = req.query;
      const meals = await storage.getMeals(req.user.userId, date as string);
      res.json(meals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.post("/api/nutrition/meals", authenticateToken, async (req: any, res) => {
    try {
      const mealData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal({
        ...mealData,
        userId: req.user.userId
      });
      res.status(201).json(meal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to log meal" });
    }
  });

  app.post("/api/nutrition/analyze", authenticateToken, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file required" });
      }

      const analysis = await analyzeFoodImage(req.file.buffer);
      const { mealType = 'snack' } = req.body;

      // Create meal entry with AI analysis
      const meal = await storage.createMeal({
        ...analysis,
        mealType,
        userId: req.user.userId
      });

      res.json(meal);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze food image" });
    }
  });

  app.delete("/api/nutrition/meals/:id", authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteMeal(parseInt(req.params.id), req.user.userId);
      if (!success) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json({ message: "Meal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // Progress routes
  app.get("/api/progress", authenticateToken, async (req: any, res) => {
    try {
      const entries = await storage.getProgressEntries(req.user.userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress entries" });
    }
  });

  app.post("/api/progress", authenticateToken, async (req: any, res) => {
    try {
      const entryData = insertProgressEntrySchema.parse(req.body);
      const entry = await storage.createProgressEntry({
        ...entryData,
        userId: req.user.userId
      });
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", authenticateToken, async (req: any, res) => {
    try {
      const achievements = await storage.getAchievements(req.user.userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Dashboard stats route with AI insights
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    console.log('🎯 Dashboard stats endpoint called for user:', req.user.userId);
    try {
      const user = await storage.getUser(req.user.userId);
      const todaysMeals = await storage.getMeals(req.user.userId, getCurrentDate()); // 🔧 FIX: Usar fecha local
      const recentSessions = await storage.getWorkoutSessions(req.user.userId, 7);
      const progressEntries = await storage.getProgressEntries(req.user.userId);

      console.log('📊 Raw data fetched:', {
        userExists: !!user,
        mealsCount: todaysMeals.length,
        sessionsCount: recentSessions.length,
        progressCount: progressEntries.length
      });

      // Calculate stats
      const todayCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
      const todayProtein = todaysMeals.reduce((sum, meal) => sum + meal.protein, 0);
      const todayCarbs = todaysMeals.reduce((sum, meal) => sum + meal.carbs, 0);
      const todayFat = todaysMeals.reduce((sum, meal) => sum + meal.fat, 0);

      const weeklyWorkouts = recentSessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const isWithinWeek = sessionDate > weekAgo;
        // ✅ CORRECCIÓN: Validación mejorada para sesiones completadas
        const isCompleted = (
          session.status === 'completed' ||
          session.status === 'finished' ||
          (session.completedAt !== null && session.completedAt !== undefined)
        );

        // Safe date logging
        const dateStr = isNaN(sessionDate.getTime()) ? 'Invalid Date' : sessionDate.toISOString();
        console.log(`📊 Session ${session.id}: date=${dateStr}, status=${session.status}, withinWeek=${isWithinWeek}, completed=${isCompleted}`);

        return isWithinWeek && isCompleted && !isNaN(sessionDate.getTime());
      }).length;

      console.log(`📈 Dashboard stats: recentSessions=${recentSessions.length}, weeklyWorkouts=${weeklyWorkouts}`);

      const currentWeight = progressEntries[0]?.weight || user?.currentWeight || 0;
      const streak = recentSessions.length; // Simplified streak calculation

      const targetCalories = 2200;
      const targetProtein = 150;
      const targetCarbs = 200;
      const targetFat = 85;

      // Generate AI insights for nutrition
      let nutritionInsights: string[] = [];
      try {
        nutritionInsights = await geminiService.generateNutritionInsights({
          todayCalories,
          targetCalories,
          protein: todayProtein,
          carbs: todayCarbs,
          fat: todayFat
        });
      } catch (error) {
        console.error('Error generating nutrition insights:', error);
        nutritionInsights = [
          "Mantén un balance entre proteínas, carbos y grasas",
          "Hidrátate bien durante todo el día"
        ];
      }

      res.json({
        currentWeight,
        weeklyWorkouts,
        todayCalories,
        streak,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        todayProtein,
        todayCarbs,
        todayFat,
        nutritionInsights
      });
    } catch (error) {
      console.error('❌ Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
    }
  });

  // AI Trainer routes
  app.use("/api/trainer", trainerRoutes);

  // Weekly History routes
  app.use("/api/weekly-history", weeklyHistoryRoutes);

  // Weight Progress routes
  weightProgressRoutes(app);

  // Nutrition routes
  nutritionRoutes(app);

  // Intelligent Workouts routes
  app.use("/api/intelligent-workouts", intelligentWorkoutsRoutes);

  // Scientific Workouts routes
  app.use("/api/scientific-workouts", scientificWorkoutsRoutes);

  // Workout Feedback routes
  app.use("/api/workout-feedback", workoutFeedbackRoutes);

  // Analytics routes
  app.use("/api/analytics", analyticsRoutes);

  // Periodization routes
  app.use("/api/periodization", periodizationRoutes);

  // Scheduler routes
  app.use("/api/scheduler", schedulerRoutes);

  // Weight Suggestions routes
  app.use("/api/weight-suggestions", weightSuggestionsRoutes);

  // 📸 Profile Photo routes - MIGRADO A SUPABASE STORAGE
  // Inicializar bucket al arrancar servidor
  supabaseStorageService.initializeBucket().catch(console.error);

  const profileUpload = multer({
    storage: multer.memoryStorage(), // Cambiar a memoria para Supabase Storage
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
      }
    }
  });

  app.get("/api/profile/photo", authenticateToken, async (req: any, res) => {
    try {
      const photo = await storage.getProfilePhoto(req.user.userId);
      res.json(photo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile photo" });
    }
  });

  app.post("/api/profile/photo", authenticateToken, profileUpload.single('photo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Photo file required" });
      }

      console.log(`📸 [API] Uploading photo for user ${req.user.userId}`);

      // Eliminar foto anterior si existe
      const existingPhoto = await storage.getProfilePhoto(req.user.userId);
      if (existingPhoto && existingPhoto.fileName) {
        // Si es URL de Supabase Storage, eliminar de Supabase
        if (supabaseStorageService.isSupabaseStorageUrl(existingPhoto.photoUrl)) {
          const fileName = supabaseStorageService.extractFileNameFromUrl(existingPhoto.photoUrl);
          if (fileName) {
            await supabaseStorageService.deleteProfilePhoto(fileName);
          }
        } else {
          // Si es archivo local, eliminar del disco
          try {
            await fs.unlink(path.join(process.cwd(), 'uploads', 'profiles', existingPhoto.fileName));
          } catch (error) {
            console.warn('Failed to delete old local photo:', error);
          }
        }
      }

      // Subir nueva foto a Supabase Storage
      const uploadResult = await supabaseStorageService.uploadProfilePhoto(
        req.user.userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Guardar información en base de datos
      const photoData = {
        photoUrl: uploadResult.publicUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
      };

      const photo = await storage.createOrUpdateProfilePhoto(req.user.userId, photoData);

      console.log(`✅ [API] Photo uploaded successfully for user ${req.user.userId}`);
      res.json(photo);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  app.delete("/api/profile/photo", authenticateToken, async (req: any, res) => {
    try {
      console.log(`🗑️ [API] Deleting photo for user ${req.user.userId}`);

      const existingPhoto = await storage.getProfilePhoto(req.user.userId);
      if (existingPhoto && existingPhoto.fileName) {
        // Si es URL de Supabase Storage, eliminar de Supabase
        if (supabaseStorageService.isSupabaseStorageUrl(existingPhoto.photoUrl)) {
          const fileName = supabaseStorageService.extractFileNameFromUrl(existingPhoto.photoUrl);
          if (fileName) {
            await supabaseStorageService.deleteProfilePhoto(fileName);
          }
        } else {
          // Si es archivo local, eliminar del disco
          try {
            await fs.unlink(path.join(process.cwd(), 'uploads', 'profiles', existingPhoto.fileName));
          } catch (error) {
            console.warn('Failed to delete local photo file:', error);
          }
        }
      }

      const success = await storage.deleteProfilePhoto(req.user.userId);
      if (!success) {
        return res.status(404).json({ message: "Profile photo not found" });
      }

      console.log(`✅ [API] Photo deleted successfully for user ${req.user.userId}`);
      res.json({ message: "Profile photo deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete profile photo" });
    }
  });

  // 🔔 Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const { limit = 20, includeRead = 'true' } = req.query;
      const notifications = await storage.getNotifications(
        req.user.userId,
        parseInt(limit),
        includeRead === 'true'
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        userId: req.user.userId
      });
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.markAllNotificationsAsRead(req.user.userId);
      res.json({ message: "All notifications marked as read", success });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", authenticateToken, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.deleteNotification(notificationId);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    next();
  });

  // 🧪 ENDPOINTS DE PRUEBA PARA CRON JOBS (SOLO DESARROLLO)
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-cron', async (req, res) => {
      try {
        console.log('🧪 [Test] Manual cron job execution triggered...');
        await workoutCronService.nightlyWorkoutGeneration();
        res.json({ success: true, message: 'Cron job executed successfully' });
      } catch (error) {
        console.error('❌ [Test] Error in manual cron execution:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/test-daily-report', async (req, res) => {
      try {
        console.log('🧪 [Test] Manual daily report triggered...');
        await workoutCronService.dailyReport();
        res.json({ success: true, message: 'Daily report executed successfully' });
      } catch (error) {
        console.error('❌ [Test] Error in daily report:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
