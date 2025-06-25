import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, varchar, decimal, unique, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  currentWeight: real("current_weight"),
  targetWeight: real("target_weight"),
  height: real("height"),
  age: integer("age"),
  fitnessLevel: text("fitness_level"),
  fitnessGoal: text("fitness_goal"),
  gender: varchar("gender", { length: 10 }), // 'male', 'female', 'other'
  isActive: boolean("is_active").default(true), // 🚀 COLUMNA AGREGADA PARA SCHEDULER
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(),
  duration: integer("duration"), // in minutes
  exercises: jsonb("exercises").notNull(), // array of exercise objects
  weekNumber: integer("week_number").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  workoutPlanId: integer("workout_plan_id"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  status: text("status").default("in_progress"), // 'in_progress', 'completed', 'skipped'
  exercises: jsonb("exercises"), // completed exercise data with reps, sets, weights
  notes: text("notes"),
});

export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseName: varchar("exercise_name", { length: 100 }).notNull(),
  setNumber: integer("set_number").notNull(),
  repsCompleted: integer("reps_completed"),
  weightUsed: decimal("weight_used", { precision: 5, scale: 2 }),
  restTimeSeconds: integer("rest_time_seconds"),
  completedAt: timestamp("completed_at").defaultNow(),
  notes: text("notes"),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mealType: text("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
  name: text("name").notNull(),
  description: text("description"),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  imageUrl: text("image_url"),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weight: real("weight"),
  bodyMeasurements: jsonb("body_measurements"), // waist, chest, arms, etc.
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'streak', 'weight_loss', 'pr', 'consistency'
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  exerciseTypes: jsonb("exercise_types").default('[]'), // ['functional', 'weights', 'cardio', 'hiit', 'yoga', 'calisthenics']
  weeklyFrequency: integer("weekly_frequency").default(3), // días por semana
  preferredTime: text("preferred_time").default('morning'), // 'morning', 'afternoon', 'evening'
  location: text("location").default('gym'), // 'home', 'gym', 'park', 'mixed'
  equipment: jsonb("equipment").default('[]'), // ['dumbbells', 'barbell', 'resistance_bands', 'bodyweight']
  limitations: jsonb("limitations").default('[]'), // ['back_problems', 'knee_issues', 'asthma']
  // ✅ RESTAURADO: Sistema original sin días disponibles separados
  // 🏥 Sistema de consentimiento informado
  consentDecision: text("consent_decision"), // 'accept_risks' | 'use_alternatives' | null
  consentDate: timestamp("consent_date"), // Cuándo se tomó la decisión
  // 🆕 NUEVOS CAMPOS PARA PERFIL UNIFICADO
  experienceLevel: text("experience_level"), // 'novice', 'beginner', 'intermediate', 'advanced'
  sessionDuration: integer("preferred_workout_duration"), // minutos preferidos por sesión
  timePreferences: text("time_preferences"), // horarios específicos preferidos
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Workout Preferences - AI Learning System
export const userWorkoutPreferences = pgTable("user_workout_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Feedback de rutina anterior
  previousRoutineId: integer("previous_routine_id"),
  satisfactionRating: integer("satisfaction_rating"), // 1-5 estrellas

  // Razones de insatisfacción
  dislikeReasons: jsonb("dislike_reasons").default('[]'), // ["too_intense", "boring_exercises", "wrong_muscle_groups"]

  // Preferencias específicas
  preferredMuscleGroups: jsonb("preferred_muscle_groups").default('{}'), // {"monday": ["legs", "glutes"], "wednesday": ["chest", "arms"]}
  preferredExercises: jsonb("preferred_exercises").default('[]'), // ["squats", "deadlifts", "push_ups"]
  avoidedExercises: jsonb("avoided_exercises").default('[]'), // ["burpees", "mountain_climbers"]

  // Preferencias de intensidad
  preferredIntensity: text("preferred_intensity"), // "low", "moderate", "high"
  preferredDuration: integer("preferred_duration"), // minutos preferidos

  // Comentarios libres del usuario
  userFeedback: text("user_feedback"),
  improvementSuggestions: text("improvement_suggestions"),

  // Contexto temporal
  dayOfWeek: text("day_of_week"), // "monday", "tuesday", etc.
  timeOfDay: text("time_of_day"), // "morning", "afternoon", "evening"
  energyLevel: text("energy_level"), // "high", "moderate", "low"
  availableTime: integer("available_time"), // minutos disponibles

  createdAt: timestamp("created_at").defaultNow(),
});

// 🚀 NUEVO: First Day Preferences - Sistema de Feedback para Usuarios Nuevos
export const firstDayPreferences = pgTable("first_day_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Datos de la sesión
  workoutDate: date("workout_date").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // "monday", "tuesday", etc.
  timeOfDay: text("time_of_day").notNull(), // "morning", "afternoon", "evening"

  // 🎯 PREFERENCIAS DEL DÍA (CORE DEL SISTEMA)
  muscleGroupsSelected: jsonb("muscle_groups_selected").notNull(), // ["chest", "shoulders", "arms"]
  energyLevel: text("energy_level").notNull(), // "low", "medium", "high"
  availableTime: text("available_time").notNull(), // "15-20", "30-40", "45-60", "60+"

  // Preferencias opcionales
  preferredIntensity: text("preferred_intensity"), // "light", "moderate", "intense"
  specificGoalToday: text("specific_goal_today"), // "Quiero sentirme energizado"

  // 🚫 LIMITACIONES DEL DÍA
  todayLimitations: jsonb("today_limitations").default('[]'), // ["back_pain_today", "low_energy"]

  // 📝 CONTEXTO Y METADATOS
  isFirstTime: boolean("is_first_time").default(true),
  generatedRoutineId: integer("generated_routine_id"), // Link a la rutina generada
  userNotes: text("user_notes"), // Comentarios adicionales del usuario

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Workout Plans - Rutinas diarias con expiración
export const dailyWorkoutPlans = pgTable("daily_workout_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Datos de la rutina
  workoutDate: text("workout_date").notNull(), // YYYY-MM-DD format
  exercises: jsonb("exercises").notNull(),
  estimatedDuration: integer("estimated_duration"),
  targetMuscleGroups: jsonb("target_muscle_groups").default('[]'),

  // Contexto de generación
  generatedBasedOn: jsonb("generated_based_on").default('{}'), // qué datos usó la IA
  aiConfidenceScore: real("ai_confidence_score").default(0.5), // qué tan segura está la IA

  // Estado
  isActive: boolean("is_active").default(true),
  isCompleted: boolean("is_completed").default(false),
  userRating: integer("user_rating"), // feedback post-workout

  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").defaultNow(), // se elimina después de 7 días
}, (table) => ({
  // Unique constraint: one plan per user per date
  userDateUnique: unique().on(table.userId, table.workoutDate),
}));

// Rejected Workout Plans - Sistema de aprendizaje de IA
export const rejectedWorkoutPlans = pgTable("rejected_workout_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Rutina que fue rechazada
  originalPlanId: integer("original_plan_id"), // ID de la rutina que no le gustó
  originalPlanData: jsonb("original_plan_data"), // Datos completos de la rutina rechazada

  // Razones del rechazo
  rejectionReasons: jsonb("rejection_reasons").default('[]'), // ["too_intense", "boring_exercises", "wrong_muscle_groups"]

  // Detalles específicos de lo que no le gustó
  specificDislikes: jsonb("specific_dislikes").default('{}'), // {exercises: ["burpees"], duration: true, intensity: true, muscleGroups: ["abs"]}

  // Feedback del usuario
  userFeedback: text("user_feedback"), // Comentario libre del usuario

  // Contexto del rechazo
  rejectedAt: timestamp("rejected_at").defaultNow(),
  dayOfWeek: text("day_of_week"), // Día en que rechazó la rutina
  timeOfDay: text("time_of_day"), // Momento del día
  userEnergyLevel: text("user_energy_level"), // Nivel de energía cuando rechazó

  // Rutina de reemplazo
  replacementPlanId: integer("replacement_plan_id"), // ID de la nueva rutina que se generó
});

// 🧠 NUEVO: Sistema de Feedback Inteligente Consolidado
// Tabla para almacenar todos los tipos de feedback raw
export const feedbackRawData = pgTable("feedback_raw_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Tipo de feedback
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // 'workout_feedback', 'first_day', 'rejection', 'completion'

  // Datos raw del feedback
  rawData: jsonb("raw_data").notNull(), // Todos los datos originales del formulario

  // Contexto del feedback
  context: jsonb("context").default('{}'), // {dayOfWeek, timeOfDay, energyLevel, workoutId, etc.}

  // Metadatos de procesamiento
  processed: boolean("processed").default(false),
  processingErrors: jsonb("processing_errors").default('[]'),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),

  // Retención inteligente (mínimo 8 semanas para análisis de IA)
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '8 weeks'`),
});

// Tabla de perfil consolidado de feedback del usuario
export const userFeedbackProfile = pgTable("user_feedback_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),

  // Perfil consolidado (resultado del procesamiento inteligente)
  consolidatedPreferences: jsonb("consolidated_preferences").notNull(),

  // Metadatos de consolidación
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataSources: jsonb("data_sources").default('[]'), // Qué fuentes se usaron para consolidar
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).default('0.50'), // Qué tan confiable es este perfil (0.00-1.00)

  // Estadísticas del perfil
  totalFeedbackCount: integer("total_feedback_count").default(0),
  lastFeedbackDate: timestamp("last_feedback_date"),

  // Versionado para tracking de cambios
  version: integer("version").default(1),
  previousVersionId: integer("previous_version_id").references(() => userFeedbackProfile.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla de decisiones y adaptaciones de la IA
export const aiDecisions = pgTable("ai_decisions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Tipo de decisión
  decisionType: varchar("decision_type", { length: 50 }).notNull(), // 'routine_change', 'adaptation', 'progression', 'mesocycle_change'

  // Datos de la decisión
  decisionData: jsonb("decision_data").notNull(), // Detalles específicos de la decisión
  reasoning: jsonb("reasoning").notNull(), // Por qué la IA tomó esta decisión

  // Contexto de la decisión
  triggerData: jsonb("trigger_data").default('{}'), // Qué datos causaron esta decisión
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }).default('0.50'), // Qué tan segura está la IA

  // Resultados
  implementedAt: timestamp("implemented_at").defaultNow(),
  userResponse: jsonb("user_response"), // Cómo respondió el usuario a esta decisión
  effectiveness: decimal("effectiveness", { precision: 3, scale: 2 }), // Qué tan efectiva fue la decisión (medida después)

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Trainer Configuration
export const trainerConfig = pgTable("trainer_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  trainerName: varchar("trainer_name", { length: 50 }).notNull(),
  trainerGender: varchar("trainer_gender", { length: 10 }).notNull(), // 'male', 'female'
  interactionTone: varchar("interaction_tone", { length: 20 }).notNull(), // 'motivational', 'friendly', 'strict', 'loving', 'partner'
  trainerAvatar: text("trainer_avatar"), // Base64 image or URL
  personalityType: varchar("personality_type", { length: 20 }).default('default'), // 'default', 'motivator', 'sensei', 'warrior', 'empathetic', 'strategist', 'custom'
  customPersonality: text("custom_personality"), // Custom personality description
  isConfigured: boolean("is_configured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  isFromAI: boolean("is_from_ai").notNull(),
  messageType: varchar("message_type", { length: 20 }).default('general'), // 'greeting', 'question', 'response', 'update'
  contextData: jsonb("context_data"), // metadata de la conversación
  createdAt: timestamp("created_at").defaultNow(),
});

// Emotional Diary
export const emotionalDiary = pgTable("emotional_diary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: varchar("mood", { length: 20 }), // 'motivated', 'tired', 'excited', 'stressed', 'happy'
  energyLevel: integer("energy_level"), // 1-10 scale
  motivationLevel: integer("motivation_level"), // 1-10 scale
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Fitness Tests
export const fitnessTests = pgTable("fitness_tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testType: varchar("test_type", { length: 30 }).notNull(), // 'pushups', 'squats', 'plank_time', 'running_time'
  resultValue: real("result_value").notNull(),
  resultUnit: varchar("result_unit", { length: 10 }).notNull(), // 'reps', 'seconds', 'minutes'
  testDate: timestamp("test_date").defaultNow(),
});

// Nutrition Preferences Extended
export const nutritionPreferences = pgTable("nutrition_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  // Diet preferences
  dietType: text("diet_type"), // 'omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'
  customDietTypes: jsonb("custom_diet_types").default('[]'), // Custom diet types added by user
  foodHabitsRating: integer("food_habits_rating").default(3), // 1-5 scale
  customFoodHabits: jsonb("custom_food_habits").default('[]'), // Custom food habits
  favoriteFoods: jsonb("favorite_foods").default('[]'), // User's favorite foods
  // Restrictions and allergies
  allergies: jsonb("allergies").default('[]'), // ['nuts', 'seafood', 'dairy', 'gluten', 'eggs', 'soy']
  customAllergies: jsonb("custom_allergies").default('[]'), // Custom allergies
  medicalRestrictions: jsonb("medical_restrictions").default('[]'), // ['diabetes', 'hypertension', 'high_cholesterol']
  customMedicalRestrictions: jsonb("custom_medical_restrictions").default('[]'), // Custom medical restrictions
  // Caloric and hydration goals
  dailyCalorieGoal: integer("daily_calorie_goal"),
  macroDistribution: jsonb("macro_distribution"), // {protein: 25, carbs: 45, fat: 30}
  dailyWaterGoal: integer("daily_water_goal_ml").default(2000), // ml
  mealFrequency: integer("meal_frequency").default(3), // comidas por día
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Water Intake Tracking
export const waterIntake = pgTable("water_intake", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amountLiters: real("amount_liters").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Daily Meal Plans
export const dailyMealPlans = pgTable("daily_meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planDate: text("plan_date").notNull(), // YYYY-MM-DD format
  totalCalories: integer("total_calories").notNull(),
  meals: jsonb("meals").notNull(), // Array of meal objects with detailed ingredients
  macroBreakdown: jsonb("macro_breakdown"), // {protein: X, carbs: Y, fat: Z}
  generatedAt: timestamp("generated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one plan per user per date
  userDateUnique: unique().on(table.userId, table.planDate),
}));

// Weekly Workout History
export const weeklyWorkoutHistory = pgTable("weekly_workout_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(), // YYYY-MM-DD format (Monday)
  workoutDate: text("workout_date").notNull(), // YYYY-MM-DD format
  exerciseName: varchar("exercise_name", { length: 255 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  exerciseType: varchar("exercise_type", { length: 100 }), // 'weights', 'cardio', etc.
  workoutPlanId: integer("workout_plan_id"),
  sessionId: integer("session_id"),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Weekly Summaries
export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(), // YYYY-MM-DD format (Monday)
  totalWorkouts: integer("total_workouts").default(0),
  totalDurationMinutes: integer("total_duration_minutes").default(0),
  uniqueExercises: jsonb("unique_exercises").default('[]'), // Array of unique exercise names
  workoutDays: jsonb("workout_days").default('[]'), // Array of day names ['monday', 'wednesday']
  exerciseTypes: jsonb("exercise_types").default('[]'), // Array of exercise types used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weight Goals
export const weightGoals = pgTable("weight_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startWeight: real("start_weight").notNull(),
  targetWeight: real("target_weight").notNull(),
  goalType: varchar("goal_type", { length: 20 }).notNull(), // 'gain_weight', 'lose_weight', 'maintain'
  targetDate: timestamp("target_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Progress Entries
export const enhancedProgressEntries = pgTable("enhanced_progress_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weight: real("weight"),
  bodyMeasurements: jsonb("body_measurements"), // { waist: 85, chest: 100, arms: 35, thighs: 60, neck: 38, hips: 95 }
  weekNumber: integer("week_number"), // Week of the year (1-52)
  progressType: varchar("progress_type", { length: 20 }).default('weekly'), // 'weekly', 'monthly', 'milestone'
  goalType: varchar("goal_type", { length: 20 }), // 'gain_weight', 'lose_weight', 'maintain'
  feelingRating: integer("feeling_rating"), // 1-5 scale (1=struggling, 5=great)
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlans).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
}).extend({
  startedAt: z.string().transform((str) => new Date(str)), // Accept ISO string and convert to Date
});

export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({
  id: true,
  completedAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  loggedAt: true,
});

export const insertProgressEntrySchema = createInsertSchema(progressEntries).omit({
  id: true,
  recordedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  updatedAt: true,
});

export const insertUserWorkoutPreferencesSchema = createInsertSchema(userWorkoutPreferences).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  createdAt: true,
});

// 🚀 NUEVO: First Day Preferences schema
export const insertFirstDayPreferencesSchema = createInsertSchema(firstDayPreferences).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  createdAt: true,
  updatedAt: true,
});

export const insertDailyWorkoutPlanSchema = createInsertSchema(dailyWorkoutPlans).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  createdAt: true,
  expiresAt: true, // calculated by server
});

export const insertRejectedWorkoutPlanSchema = createInsertSchema(rejectedWorkoutPlans).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  rejectedAt: true,
});

// 🧠 NUEVO: Schemas para Sistema de Feedback Inteligente
export const insertFeedbackRawDataSchema = createInsertSchema(feedbackRawData).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  createdAt: true,
  expiresAt: true, // calculated by server
});

export const insertUserFeedbackProfileSchema = createInsertSchema(userFeedbackProfile).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiDecisionSchema = createInsertSchema(aiDecisions).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  implementedAt: true,
  createdAt: true,
});

// AI Trainer schemas
export const insertTrainerConfigSchema = createInsertSchema(trainerConfig).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertEmotionalDiarySchema = createInsertSchema(emotionalDiary).omit({
  id: true,
  recordedAt: true,
});

export const insertFitnessTestSchema = createInsertSchema(fitnessTests).omit({
  id: true,
  testDate: true,
});

export const insertNutritionPreferencesSchema = createInsertSchema(nutritionPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertWaterIntakeSchema = createInsertSchema(waterIntake).omit({
  id: true,
  recordedAt: true,
});

export const insertDailyMealPlanSchema = createInsertSchema(dailyMealPlans).omit({
  id: true,
  generatedAt: true,
  updatedAt: true,
});

export const insertWeeklyWorkoutHistorySchema = createInsertSchema(weeklyWorkoutHistory).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  weekStartDate: true, // weekStartDate is calculated by the server from workoutDate
  completedAt: true,
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({
  id: true,
  userId: true, // userId is added by the server from the auth token
  createdAt: true,
  updatedAt: true,
});

// Weight Goals schemas
export const insertWeightGoalSchema = createInsertSchema(weightGoals).omit({
  id: true,
  createdAt: true,
}).extend({
  targetDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

// Enhanced Progress Entries schemas
export const insertEnhancedProgressEntrySchema = createInsertSchema(enhancedProgressEntries).omit({
  id: true,
  recordedAt: true,
});

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).omit({
  fullName: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserWorkoutPreferences = typeof userWorkoutPreferences.$inferSelect;
export type InsertUserWorkoutPreferences = z.infer<typeof insertUserWorkoutPreferencesSchema>;
// 🚀 NUEVO: First Day Preferences types
export type FirstDayPreferences = typeof firstDayPreferences.$inferSelect;
export type InsertFirstDayPreferences = z.infer<typeof insertFirstDayPreferencesSchema>;
export type DailyWorkoutPlan = typeof dailyWorkoutPlans.$inferSelect;
export type InsertDailyWorkoutPlan = z.infer<typeof insertDailyWorkoutPlanSchema>;
export type RejectedWorkoutPlan = typeof rejectedWorkoutPlans.$inferSelect;
export type InsertRejectedWorkoutPlan = z.infer<typeof insertRejectedWorkoutPlanSchema>;

// 🧠 NUEVO: Tipos para Sistema de Feedback Inteligente
export type FeedbackRawData = typeof feedbackRawData.$inferSelect;
export type InsertFeedbackRawData = z.infer<typeof insertFeedbackRawDataSchema>;
export type UserFeedbackProfile = typeof userFeedbackProfile.$inferSelect;
export type InsertUserFeedbackProfile = z.infer<typeof insertUserFeedbackProfileSchema>;
export type AiDecision = typeof aiDecisions.$inferSelect;
export type InsertAiDecision = z.infer<typeof insertAiDecisionSchema>;

// AI Trainer types
export type TrainerConfig = typeof trainerConfig.$inferSelect;
export type InsertTrainerConfig = z.infer<typeof insertTrainerConfigSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type EmotionalDiary = typeof emotionalDiary.$inferSelect;
export type InsertEmotionalDiary = z.infer<typeof insertEmotionalDiarySchema>;
export type FitnessTest = typeof fitnessTests.$inferSelect;
export type InsertFitnessTest = z.infer<typeof insertFitnessTestSchema>;
export type NutritionPreferences = typeof nutritionPreferences.$inferSelect;
export type InsertNutritionPreferences = z.infer<typeof insertNutritionPreferencesSchema>;
export type WaterIntake = typeof waterIntake.$inferSelect;
export type InsertWaterIntake = z.infer<typeof insertWaterIntakeSchema>;
export type DailyMealPlan = typeof dailyMealPlans.$inferSelect;
export type InsertDailyMealPlan = z.infer<typeof insertDailyMealPlanSchema>;

// Weekly Workout History types
export type WeeklyWorkoutHistory = typeof weeklyWorkoutHistory.$inferSelect;
export type InsertWeeklyWorkoutHistory = z.infer<typeof insertWeeklyWorkoutHistorySchema>;
export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;

// Weight Goals types
export type WeightGoal = typeof weightGoals.$inferSelect;
export type InsertWeightGoal = z.infer<typeof insertWeightGoalSchema>;

// Enhanced Progress Entries types
export type EnhancedProgressEntry = typeof enhancedProgressEntries.$inferSelect;
export type InsertEnhancedProgressEntry = z.infer<typeof insertEnhancedProgressEntrySchema>;

// 📸 Profile Photos Table
export const profilePhotos = pgTable("profile_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  photoUrl: text("photo_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 🔔 Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'workout', 'nutrition', 'progress', 'ai_trainer', 'system'
  category: text("category").notNull(), // 'reminder', 'achievement', 'update', 'alert'
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon"), // emoji or icon name
  actionUrl: text("action_url"), // optional deep link
  actionLabel: text("action_label"), // optional action button text
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  metadata: jsonb("metadata"), // additional data for the notification
  expiresAt: timestamp("expires_at"), // optional expiration
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Profile Photos schemas
export const insertProfilePhotoSchema = createInsertSchema(profilePhotos).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

// Notifications schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Profile Photos types
export type ProfilePhoto = typeof profilePhotos.$inferSelect;
export type InsertProfilePhoto = z.infer<typeof insertProfilePhotoSchema>;

// Notifications types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// 🏋️‍♂️ NUEVO: Tipos para Sistema de Captura de Peso
export interface ExerciseWeightHistory {
  id: number;
  userId: number;
  exerciseName: string;
  suggestedWeight?: number;
  actualWeight?: number;
  weightFeedback?: 'too_light' | 'perfect' | 'too_heavy';
  rpeAchieved?: number;
  repsCompleted?: number;
  setsCompleted?: number;
  sessionId?: number;
  workoutDate: string;
  progressionPercentage?: number;
  aiConfidenceScore: number;
  userOverride: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsertExerciseWeightHistory {
  userId: number;
  exerciseName: string;
  suggestedWeight?: number;
  actualWeight?: number;
  weightFeedback?: 'too_light' | 'perfect' | 'too_heavy';
  rpeAchieved?: number;
  repsCompleted?: number;
  setsCompleted?: number;
  sessionId?: number;
  workoutDate?: string;
  progressionPercentage?: number;
  aiConfidenceScore?: number;
  userOverride?: boolean;
}

// 🎯 NUEVO: Tipos para Feedback por Set (ya existe pero extendemos)
export interface ExerciseSetFeedbackExtended {
  id: number;
  exerciseLogId: number;
  setRpe?: number;
  weightFeeling?: 'too_light' | 'perfect' | 'too_heavy';
  completedAsPlanned: boolean;
  notes?: string;
  createdAt: string;
}

export interface InsertExerciseSetFeedbackExtended {
  exerciseLogId: number;
  setRpe?: number;
  weightFeeling?: 'too_light' | 'perfect' | 'too_heavy';
  completedAsPlanned?: boolean;
  notes?: string;
}

// ⏱️ NUEVO: Tipos para Patrones de Descanso
export interface RestTimePattern {
  id: number;
  userId: number;
  exerciseName: string;
  muscleGroup?: string;
  recommendedRestSeconds?: number;
  actualRestSeconds?: number;
  nextSetPerformance?: number;
  fatigueLevel?: number;
  sessionId?: number;
  setNumber?: number;
  workoutDate: string;
  createdAt: string;
}

export interface InsertRestTimePattern {
  userId: number;
  exerciseName: string;
  muscleGroup?: string;
  recommendedRestSeconds?: number;
  actualRestSeconds?: number;
  nextSetPerformance?: number;
  fatigueLevel?: number;
  sessionId?: number;
  setNumber?: number;
  workoutDate?: string;
}

// 🤖 NUEVO: Tipos para Sugerencias de IA
export interface AiWeightSuggestion {
  id: number;
  userId: number;
  exerciseName: string;
  suggestedWeight: number;
  confidenceScore: number;
  basedOnSessions: number;
  lastUsedWeight?: number;
  progressionTrend?: 'increasing' | 'stable' | 'decreasing';
  targetRpeRange: string;
  muscleGroup?: string;
  exerciseType?: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsertAiWeightSuggestion {
  userId: number;
  exerciseName: string;
  suggestedWeight: number;
  confidenceScore?: number;
  basedOnSessions?: number;
  lastUsedWeight?: number;
  progressionTrend?: 'increasing' | 'stable' | 'decreasing';
  targetRpeRange?: string;
  muscleGroup?: string;
  exerciseType?: string;
  validUntil?: string;
}
