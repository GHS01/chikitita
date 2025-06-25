import { supabase } from './supabase';
import {
  type User, type InsertUser, type WorkoutPlan, type InsertWorkoutPlan,
  type WorkoutSession, type InsertWorkoutSession, type ExerciseLog, type InsertExerciseLog,
  type Meal, type InsertMeal, type ProgressEntry, type InsertProgressEntry,
  type Achievement, type InsertAchievement, type UserPreferences, type InsertUserPreferences,
  type TrainerConfig, type InsertTrainerConfig, type ChatMessage, type InsertChatMessage,
  type EmotionalDiary, type InsertEmotionalDiary, type FitnessTest, type InsertFitnessTest,
  type NutritionPreferences, type InsertNutritionPreferences, type WaterIntake, type InsertWaterIntake,
  type DailyMealPlan, type InsertDailyMealPlan,
  type UserWorkoutPreferences, type InsertUserWorkoutPreferences,
  type FirstDayPreferences, type InsertFirstDayPreferences,
  type DailyWorkoutPlan, type InsertDailyWorkoutPlan,
  type RejectedWorkoutPlan, type InsertRejectedWorkoutPlan,
  type WeeklyWorkoutHistory, type InsertWeeklyWorkoutHistory, type WeeklySummary, type InsertWeeklySummary,
  type WeightGoal, type InsertWeightGoal, type EnhancedProgressEntry, type InsertEnhancedProgressEntry,
  type ProfilePhoto, type InsertProfilePhoto,
  type Notification, type InsertNotification,
  // 🧠 NUEVO: Tipos para Sistema de Feedback Inteligente
  type FeedbackRawData, type InsertFeedbackRawData,
  type UserFeedbackProfile, type InsertUserFeedbackProfile,
  type AiDecision, type InsertAiDecision,
  // 🏋️‍♂️ NUEVO: Tipos para Sistema de Captura de Peso
  type ExerciseWeightHistory, type InsertExerciseWeightHistory,
  type ExerciseSetFeedbackExtended, type InsertExerciseSetFeedbackExtended,
  type RestTimePattern, type InsertRestTimePattern,
  type AiWeightSuggestion, type InsertAiWeightSuggestion
} from "@shared/schema";

export class SupabaseStorage {

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        passwordHash: data.password_hash,
        fullName: data.full_name,
        currentWeight: data.current_weight,
        targetWeight: data.target_weight,
        height: data.height,
        age: data.age,
        fitnessLevel: data.fitness_level,
        fitnessGoal: data.fitness_goal,
        gender: data.gender,
        createdAt: data.created_at,
      };

      return mappedUser;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        console.error('Error fetching user by username:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        passwordHash: data.password_hash, // 🔑 KEY FIX: Map snake_case to camelCase
        fullName: data.full_name,
        currentWeight: data.current_weight,
        targetWeight: data.target_weight,
        height: data.height,
        age: data.age,
        fitnessLevel: data.fitness_level,
        fitnessGoal: data.fitness_goal,
        createdAt: data.created_at,
      };

      return mappedUser;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        console.error('Error fetching user by email:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        passwordHash: data.password_hash,
        fullName: data.full_name,
        currentWeight: data.current_weight,
        targetWeight: data.target_weight,
        height: data.height,
        age: data.age,
        fitnessLevel: data.fitness_level,
        fitnessGoal: data.fitness_goal,
        createdAt: data.created_at,
      };

      return mappedUser;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser & { firstName: string; lastName: string; password: string }): Promise<User> {
    try {
      // Transform the data to match Supabase schema
      const userData = {
        username: insertUser.username,
        email: insertUser.email,
        password_hash: insertUser.password, // Will be hashed by caller
        full_name: `${insertUser.firstName} ${insertUser.lastName}`,
        current_weight: insertUser.currentWeight,
        target_weight: insertUser.targetWeight,
        height: insertUser.height,
        age: insertUser.age,
        fitness_level: insertUser.fitnessLevel,
        fitness_goal: insertUser.fitnessGoal,
      };

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        passwordHash: data.password_hash,
        fullName: data.full_name,
        currentWeight: data.current_weight,
        targetWeight: data.target_weight,
        height: data.height,
        age: data.age,
        fitnessLevel: data.fitness_level,
        fitnessGoal: data.fitness_goal,
        createdAt: data.created_at,
      };

      return mappedUser;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return undefined;
      }

      return data as User;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return undefined;
    }
  }

  // Workout Plan operations
  async getWorkoutPlans(userId: number): Promise<WorkoutPlan[]> {
    try {
      console.log('🚨 [STORAGE DEBUG] Fetching workout plans for userId:', userId);

      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [STORAGE DEBUG] Error fetching workout plans:', error);
        return [];
      }

      console.log('🚨 [STORAGE DEBUG] Raw data from Supabase:', {
        userId: userId,
        dataCount: data?.length || 0,
        data: data?.map(d => ({ id: d.id, user_id: d.user_id, name: d.name }))
      });

      // 🔧 FIX: Map snake_case to camelCase manually
      const mappedWorkoutPlans: WorkoutPlan[] = data.map(plan => ({
        id: plan.id,
        userId: plan.user_id,  // 🔑 KEY FIX: Map user_id to userId
        name: plan.name,
        description: plan.description,
        difficulty: plan.difficulty,
        duration: plan.duration,
        exercises: plan.exercises,
        weekNumber: plan.week_number,
        isActive: plan.is_active,
        createdAt: plan.created_at,
      }));

      console.log('🚨 [STORAGE DEBUG] Mapped workout plans:', {
        userId: userId,
        planCount: mappedWorkoutPlans.length,
        planUserIds: mappedWorkoutPlans.map(p => p.userId),
        allSameUser: mappedWorkoutPlans.every(p => p.userId === userId)
      });

      return mappedWorkoutPlans;
    } catch (error) {
      console.error('❌ [STORAGE DEBUG] Error in getWorkoutPlans:', error);
      return [];
    }
  }

  async getActiveWorkoutPlan(userId: number): Promise<WorkoutPlan | undefined> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        console.error('Error fetching active workout plan:', error);
        return undefined;
      }

      // 🔧 FIX: Map snake_case to camelCase manually
      const mappedWorkoutPlan: WorkoutPlan = {
        id: data.id,
        userId: data.user_id,  // 🔑 KEY FIX: Map user_id to userId
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        exercises: data.exercises,
        weekNumber: data.week_number,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      return mappedWorkoutPlan;
    } catch (error) {
      console.error('Error in getActiveWorkoutPlan:', error);
      return undefined;
    }
  }

  async createWorkoutPlan(insertPlan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    try {
      const planData = {
        user_id: insertPlan.userId,
        name: insertPlan.name,
        description: insertPlan.description,
        difficulty: insertPlan.difficulty,
        duration: insertPlan.duration,
        exercises: insertPlan.exercises,
        week_number: insertPlan.weekNumber,
        is_active: insertPlan.isActive ?? false,
      };

      const { data, error } = await supabase
        .from('workout_plans')
        .insert(planData)
        .select()
        .single();

      if (error) {
        console.error('Error creating workout plan:', error);
        throw new Error(`Failed to create workout plan: ${error.message}`);
      }

      // 🔧 FIX: Map snake_case to camelCase manually
      const mappedWorkoutPlan: WorkoutPlan = {
        id: data.id,
        userId: data.user_id,  // 🔑 KEY FIX: Map user_id to userId
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        exercises: data.exercises,
        weekNumber: data.week_number,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      return mappedWorkoutPlan;
    } catch (error) {
      console.error('Error in createWorkoutPlan:', error);
      throw error;
    }
  }

  async updateWorkoutPlan(id: number, updates: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan | undefined> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating workout plan:', error);
        return undefined;
      }

      // 🔧 FIX: Map snake_case to camelCase manually
      const mappedWorkoutPlan: WorkoutPlan = {
        id: data.id,
        userId: data.user_id,  // 🔑 KEY FIX: Map user_id to userId
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        exercises: data.exercises,
        weekNumber: data.week_number,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      return mappedWorkoutPlan;
    } catch (error) {
      console.error('Error in updateWorkoutPlan:', error);
      return undefined;
    }
  }

  // Workout Session operations
  async getWorkoutSessions(userId: number, limit: number = 10): Promise<WorkoutSession[]> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching workout sessions:', error);
        return [];
      }

      // Map snake_case to camelCase
      const mappedSessions: WorkoutSession[] = data.map(session => ({
        id: session.id,
        userId: session.user_id,
        workoutPlanId: session.workout_plan_id,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        status: session.status,
        exercises: session.exercises,
        notes: session.notes,
      }));

      return mappedSessions;
    } catch (error) {
      console.error('Error in getWorkoutSessions:', error);
      return [];
    }
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    try {
      // Check if workoutPlanId exists in workout_plans table
      let validWorkoutPlanId = null;
      if (insertSession.workoutPlanId) {
        const { data: planExists } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('id', insertSession.workoutPlanId)
          .single();

        if (planExists) {
          validWorkoutPlanId = insertSession.workoutPlanId;
        } else {
          console.log(`🔧 [WorkoutSession] Plan ID ${insertSession.workoutPlanId} not found in workout_plans, setting to null`);
        }
      }

      const sessionData = {
        user_id: insertSession.userId,
        workout_plan_id: validWorkoutPlanId,
        started_at: insertSession.startedAt,
        completed_at: insertSession.completedAt,
        status: insertSession.status,
        exercises: insertSession.exercises,
      };

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating workout session:', error);
        throw new Error(`Failed to create workout session: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedSession: WorkoutSession = {
        id: data.id,
        userId: data.user_id,
        workoutPlanId: data.workout_plan_id,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        status: data.status,
        exercises: data.exercises,
        notes: data.notes,
      };

      return mappedSession;
    } catch (error) {
      console.error('Error in createWorkoutSession:', error);
      throw error;
    }
  }

  async updateWorkoutSession(sessionId: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | null> {
    try {
      const updateData: any = {};

      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.exercises !== undefined) updateData.exercises = updates.exercises;

      const { data, error } = await supabase
        .from('workout_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating workout session:', error);
        return null;
      }

      // Map snake_case to camelCase
      const mappedSession: WorkoutSession = {
        id: data.id,
        userId: data.user_id,
        workoutPlanId: data.workout_plan_id,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        status: data.status,
        exercises: data.exercises,
        notes: data.notes,
      };

      return mappedSession;
    } catch (error) {
      console.error('Error in updateWorkoutSession:', error);
      return null;
    }
  }

  // Exercise Log operations
  async getExerciseLogs(sessionId: number): Promise<ExerciseLog[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('completed_at', { ascending: true });

      if (error) {
        console.error('Error fetching exercise logs:', error);
        return [];
      }

      return data as ExerciseLog[];
    } catch (error) {
      console.error('Error in getExerciseLogs:', error);
      return [];
    }
  }

  async createExerciseLog(insertLog: InsertExerciseLog): Promise<ExerciseLog> {
    try {
      const logData = {
        session_id: insertLog.sessionId,
        exercise_name: insertLog.exerciseName,
        set_number: insertLog.setNumber,
        reps_completed: insertLog.repsCompleted,
        weight_used: insertLog.weightUsed,
        rest_time_seconds: insertLog.restTimeSeconds,
        notes: insertLog.notes,
      };

      const { data, error } = await supabase
        .from('exercise_logs')
        .insert(logData)
        .select()
        .single();

      if (error) {
        console.error('Error creating exercise log:', error);
        throw new Error(`Failed to create exercise log: ${error.message}`);
      }

      return data as ExerciseLog;
    } catch (error) {
      console.error('Error in createExerciseLog:', error);
      throw error;
    }
  }

  // Meal operations
  async getMeals(userId: number, date?: string): Promise<Meal[]> {
    try {
      let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId);

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        query = query
          .gte('logged_at', startDate.toISOString())
          .lt('logged_at', endDate.toISOString());
      }

      const { data, error } = await query.order('logged_at', { ascending: false });

      if (error) {
        console.error('Error fetching meals:', error);
        return [];
      }

      return data as Meal[];
    } catch (error) {
      console.error('Error in getMeals:', error);
      return [];
    }
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    try {
      const mealData = {
        user_id: insertMeal.userId,
        meal_type: insertMeal.mealType,
        name: insertMeal.name,
        description: insertMeal.description,
        calories: insertMeal.calories,
        protein: insertMeal.protein,
        carbs: insertMeal.carbs,
        fat: insertMeal.fat,
        fiber: insertMeal.fiber,
        image_url: insertMeal.imageUrl,
      };

      const { data, error } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single();

      if (error) {
        console.error('Error creating meal:', error);
        throw new Error(`Failed to create meal: ${error.message}`);
      }

      return data as Meal;
    } catch (error) {
      console.error('Error in createMeal:', error);
      throw error;
    }
  }

  async deleteMeal(id: number, userId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting meal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteMeal:', error);
      return false;
    }
  }

  // Progress Entry operations
  async getProgressEntries(userId: number): Promise<ProgressEntry[]> {
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error fetching progress entries:', error);
        return [];
      }

      return data as ProgressEntry[];
    } catch (error) {
      console.error('Error in getProgressEntries:', error);
      return [];
    }
  }

  async createProgressEntry(insertEntry: InsertProgressEntry): Promise<ProgressEntry> {
    try {
      const entryData = {
        user_id: insertEntry.userId,
        weight: insertEntry.weight,
        body_measurements: insertEntry.bodyMeasurements,
        notes: insertEntry.notes,
      };

      const { data, error } = await supabase
        .from('progress_entries')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating progress entry:', error);
        throw new Error(`Failed to create progress entry: ${error.message}`);
      }

      return data as ProgressEntry;
    } catch (error) {
      console.error('Error in createProgressEntry:', error);
      throw error;
    }
  }

  // Achievement operations
  async getAchievements(userId: number): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('Error fetching achievements:', error);
        return [];
      }

      return data as Achievement[];
    } catch (error) {
      console.error('Error in getAchievements:', error);
      return [];
    }
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    try {
      const achievementData = {
        user_id: insertAchievement.userId,
        type: insertAchievement.type,
        title: insertAchievement.title,
        description: insertAchievement.description,
        icon: insertAchievement.icon,
      };

      const { data, error } = await supabase
        .from('achievements')
        .insert(achievementData)
        .select()
        .single();

      if (error) {
        console.error('Error creating achievement:', error);
        throw new Error(`Failed to create achievement: ${error.message}`);
      }

      return data as Achievement;
    } catch (error) {
      console.error('Error in createAchievement:', error);
      throw error;
    }
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return default
          return {
            id: 0,
            userId,
            exerciseTypes: [],
            weeklyFrequency: 3,
            preferredTime: 'morning',
            location: 'gym',
            equipment: [],
            limitations: [],
            // 🆕 NUEVOS CAMPOS CON VALORES POR DEFECTO
            experienceLevel: undefined,
            sessionDuration: undefined,
            timePreferences: undefined,
            updatedAt: new Date(),
          };
        }
        console.error('Error fetching user preferences:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedPreferences: UserPreferences = {
        id: data.id,
        userId: data.user_id,
        exerciseTypes: data.exercise_types || [],
        weeklyFrequency: data.weekly_frequency || 3,
        preferredTime: data.preferred_time || 'morning',
        location: data.location || 'gym',
        equipment: data.equipment || [],
        limitations: data.limitations || [],
        updatedAt: data.updated_at,
        // 🆕 NUEVOS CAMPOS AGREGADOS
        experienceLevel: data.experience_level,
        sessionDuration: data.preferred_workout_duration,
        timePreferences: data.time_preferences,
      };

      return mappedPreferences;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return undefined;
    }
  }

  async updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    try {
      // Transform camelCase to snake_case
      const preferencesData = {
        user_id: userId,
        exercise_types: updates.exerciseTypes,
        weekly_frequency: updates.weeklyFrequency,
        preferred_time: updates.preferredTime,
        location: updates.location,
        equipment: updates.equipment,
        limitations: updates.limitations,
        consent_decision: updates.consentDecision,
        consent_date: updates.consentDate,
        // 🆕 NUEVOS CAMPOS AGREGADOS
        experience_level: updates.experienceLevel,
        preferred_workout_duration: updates.sessionDuration,
        time_preferences: updates.timePreferences,
      };

      // Remove undefined values
      Object.keys(preferencesData).forEach(key =>
        preferencesData[key] === undefined && delete preferencesData[key]
      );

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferencesData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedPreferences: UserPreferences = {
        id: data.id,
        userId: data.user_id,
        exerciseTypes: data.exercise_types || [],
        weeklyFrequency: data.weekly_frequency || 3,
        preferredTime: data.preferred_time || 'morning',
        location: data.location || 'gym',
        equipment: data.equipment || [],
        limitations: data.limitations || [],
        // ✅ RESTAURADO: Sistema original sin días disponibles separados
        consentDecision: data.consent_decision,
        consentDate: data.consent_date,
        updatedAt: data.updated_at,
        // 🆕 NUEVOS CAMPOS AGREGADOS
        experienceLevel: data.experience_level,
        sessionDuration: data.preferred_workout_duration,
        timePreferences: data.time_preferences,
      };

      return mappedPreferences;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      throw error;
    }
  }

  // 🏥 Actualizar decisión de consentimiento informado
  async updateConsentDecision(userId: number, decision: 'accept_risks' | 'use_alternatives'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          consent_decision: decision,
          consent_date: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating consent decision:', error);
        throw error;
      }

      console.log(`🏥 [ConsentSystem] Updated consent decision for user ${userId}: ${decision}`);
    } catch (error) {
      console.error('Error in updateConsentDecision:', error);
      throw error;
    }
  }

  // AI Trainer operations
  async getTrainerConfig(userId: number): Promise<TrainerConfig | undefined> {
    try {
      const { data, error } = await supabase
        .from('trainer_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined; // No config found
        }
        console.error('Error fetching trainer config:', error);
        return undefined;
      }

      const mappedConfig: TrainerConfig = {
        id: data.id,
        userId: data.user_id,
        trainerName: data.trainer_name,
        trainerGender: data.trainer_gender,
        interactionTone: data.interaction_tone,
        trainerAvatar: data.trainer_avatar,
        personalityType: data.personality_type,
        customPersonality: data.custom_personality,
        isConfigured: data.is_configured,
        createdAt: data.created_at,
      };

      return mappedConfig;
    } catch (error) {
      console.error('Error in getTrainerConfig:', error);
      return undefined;
    }
  }

  async createTrainerConfig(insertConfig: InsertTrainerConfig): Promise<TrainerConfig> {
    try {
      const configData = {
        user_id: insertConfig.userId,
        trainer_name: insertConfig.trainerName,
        trainer_gender: insertConfig.trainerGender,
        interaction_tone: insertConfig.interactionTone,
        trainer_avatar: insertConfig.trainerAvatar,
        personality_type: insertConfig.personalityType,
        custom_personality: insertConfig.customPersonality,
        is_configured: true,
      };

      const { data, error } = await supabase
        .from('trainer_config')
        .insert(configData)
        .select()
        .single();

      if (error) {
        console.error('Error creating trainer config:', error);
        throw new Error(`Failed to create trainer config: ${error.message}`);
      }

      const mappedConfig: TrainerConfig = {
        id: data.id,
        userId: data.user_id,
        trainerName: data.trainer_name,
        trainerGender: data.trainer_gender,
        interactionTone: data.interaction_tone,
        trainerAvatar: data.trainer_avatar,
        personalityType: data.personality_type,
        customPersonality: data.custom_personality,
        isConfigured: data.is_configured,
        createdAt: data.created_at,
      };

      return mappedConfig;
    } catch (error) {
      console.error('Error in createTrainerConfig:', error);
      throw error;
    }
  }

  async getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
      }

      // 🕐 SISTEMA HORARIO CENTRALIZADO - JavaScript automáticamente convierte UTC a local
      return data.map(msg => {
        return {
          id: msg.id,
          userId: msg.user_id,
          message: msg.message,
          isFromAI: msg.is_from_ai,
          messageType: msg.message_type,
          contextData: msg.context_data,
          createdAt: msg.created_at, // 🕐 USAR TIMESTAMP DIRECTO (ya es local)
        };
      });
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return [];
    }
  }

  // 🧠 NUEVO: Obtener mensajes recientes para contexto conversacional
  async getRecentChatMessages(userId: number, limit: number = 10): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent chat messages:', error);
        return [];
      }

      // Reverse to get chronological order (oldest first) for context analysis
      const messages = data.map(msg => ({
        id: msg.id,
        userId: msg.user_id,
        message: msg.message,
        isFromAI: msg.is_from_ai,
        messageType: msg.message_type,
        contextData: msg.context_data,
        createdAt: msg.created_at,
      }));

      return messages.reverse();
    } catch (error) {
      console.error('Error in getRecentChatMessages:', error);
      return [];
    }
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    try {
      // 🕐 SISTEMA HORARIO CENTRALIZADO - Dejar que Supabase maneje UTC automáticamente
      const messageData = {
        user_id: insertMessage.userId,
        message: insertMessage.message,
        is_from_ai: insertMessage.isFromAI,
        message_type: insertMessage.messageType || 'general',
        context_data: insertMessage.contextData,
        // No especificar created_at - Supabase usa NOW() automáticamente
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error creating chat message:', error);
        throw new Error(`Failed to create chat message: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        message: data.message,
        isFromAI: data.is_from_ai,
        messageType: data.message_type,
        contextData: data.context_data,
        createdAt: data.created_at, // 🕐 USAR TIMESTAMP DIRECTO DE SUPABASE
      };
    } catch (error) {
      console.error('Error in createChatMessage:', error);
      throw error;
    }
  }

  async createEmotionalEntry(insertEntry: InsertEmotionalDiary): Promise<EmotionalDiary> {
    try {
      const entryData = {
        user_id: insertEntry.userId,
        mood: insertEntry.mood,
        energy_level: insertEntry.energyLevel,
        motivation_level: insertEntry.motivationLevel,
        notes: insertEntry.notes,
      };

      const { data, error } = await supabase
        .from('emotional_diary')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating emotional entry:', error);
        throw new Error(`Failed to create emotional entry: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        mood: data.mood,
        energyLevel: data.energy_level,
        motivationLevel: data.motivation_level,
        notes: data.notes,
        recordedAt: data.recorded_at,
      };
    } catch (error) {
      console.error('Error in createEmotionalEntry:', error);
      throw error;
    }
  }

  async createFitnessTest(insertTest: InsertFitnessTest): Promise<FitnessTest> {
    try {
      const testData = {
        user_id: insertTest.userId,
        test_type: insertTest.testType,
        result_value: insertTest.resultValue,
        result_unit: insertTest.resultUnit,
      };

      const { data, error } = await supabase
        .from('fitness_tests')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('Error creating fitness test:', error);
        throw new Error(`Failed to create fitness test: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        testType: data.test_type,
        resultValue: data.result_value,
        resultUnit: data.result_unit,
        testDate: data.test_date,
      };
    } catch (error) {
      console.error('Error in createFitnessTest:', error);
      throw error;
    }
  }

  async updateUserGender(userId: number, gender: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ gender })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user gender:', error);
        throw new Error(`Failed to update user gender: ${error.message}`);
      }

      const mappedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        passwordHash: data.password_hash,
        fullName: data.full_name,
        currentWeight: data.current_weight,
        targetWeight: data.target_weight,
        height: data.height,
        age: data.age,
        fitnessLevel: data.fitness_level,
        fitnessGoal: data.fitness_goal,
        gender: data.gender,
        createdAt: data.created_at,
      };

      return mappedUser;
    } catch (error) {
      console.error('Error in updateUserGender:', error);
      throw error;
    }
  }

  // Weekly Workout History operations
  async createWorkoutHistoryEntry(insertEntry: InsertWeeklyWorkoutHistory & { userId: number }): Promise<WeeklyWorkoutHistory> {
    try {
      const entryData = {
        user_id: insertEntry.userId,
        week_start_date: insertEntry.weekStartDate,
        workout_date: insertEntry.workoutDate,
        exercise_name: insertEntry.exerciseName,
        duration_minutes: insertEntry.durationMinutes,
        exercise_type: insertEntry.exerciseType,
        workout_plan_id: insertEntry.workoutPlanId,
        session_id: insertEntry.sessionId,
      };

      const { data, error } = await supabase
        .from('weekly_workout_history')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating workout history entry:', error);
        throw new Error(`Failed to create workout history entry: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        weekStartDate: data.week_start_date,
        workoutDate: data.workout_date,
        exerciseName: data.exercise_name,
        durationMinutes: data.duration_minutes,
        exerciseType: data.exercise_type,
        workoutPlanId: data.workout_plan_id,
        sessionId: data.session_id,
        completedAt: data.completed_at,
      };
    } catch (error) {
      console.error('Error in createWorkoutHistoryEntry:', error);
      throw error;
    }
  }

  async getWeeklyWorkoutHistory(userId: number, weekStartDate: string): Promise<WeeklyWorkoutHistory[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_workout_history')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .order('workout_date', { ascending: true });

      if (error) {
        console.error('Error fetching weekly workout history:', error);
        return [];
      }

      return data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        weekStartDate: entry.week_start_date,
        workoutDate: entry.workout_date,
        exerciseName: entry.exercise_name,
        durationMinutes: entry.duration_minutes,
        exerciseType: entry.exercise_type,
        workoutPlanId: entry.workout_plan_id,
        sessionId: entry.session_id,
        completedAt: entry.completed_at,
      }));
    } catch (error) {
      console.error('Error in getWeeklyWorkoutHistory:', error);
      return [];
    }
  }

  async createOrUpdateWeeklySummary(insertSummary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary> {
    try {
      const summaryData = {
        user_id: insertSummary.userId,
        week_start_date: insertSummary.weekStartDate,
        total_workouts: insertSummary.totalWorkouts,
        total_duration_minutes: insertSummary.totalDurationMinutes,
        unique_exercises: insertSummary.uniqueExercises,
        workout_days: insertSummary.workoutDays,
        exercise_types: insertSummary.exerciseTypes,
      };

      const { data, error } = await supabase
        .from('weekly_summaries')
        .upsert(summaryData, {
          onConflict: 'user_id,week_start_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating weekly summary:', error);
        throw new Error(`Failed to create/update weekly summary: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        weekStartDate: data.week_start_date,
        totalWorkouts: data.total_workouts,
        totalDurationMinutes: data.total_duration_minutes,
        uniqueExercises: data.unique_exercises,
        workoutDays: data.workout_days,
        exerciseTypes: data.exercise_types,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in createOrUpdateWeeklySummary:', error);
      throw error;
    }
  }

  async getWeeklySummaries(userId: number, limit: number = 4): Promise<WeeklySummary[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching weekly summaries:', error);
        return [];
      }

      return data.map(summary => ({
        id: summary.id,
        userId: summary.user_id,
        weekStartDate: summary.week_start_date,
        totalWorkouts: summary.total_workouts,
        totalDurationMinutes: summary.total_duration_minutes,
        uniqueExercises: summary.unique_exercises,
        workoutDays: summary.workout_days,
        exerciseTypes: summary.exercise_types,
        createdAt: summary.created_at,
        updatedAt: summary.updated_at,
      }));
    } catch (error) {
      console.error('Error in getWeeklySummaries:', error);
      return [];
    }
  }

  async cleanOldWeeklyData(userId: number, weeksToKeep: number = 4): Promise<void> {
    try {
      // Calculate the cutoff date (keep only last N weeks)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (weeksToKeep * 7));
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      // Delete old workout history
      const { error: historyError } = await supabase
        .from('weekly_workout_history')
        .delete()
        .eq('user_id', userId)
        .lt('week_start_date', cutoffDateStr);

      if (historyError) {
        console.error('Error cleaning old workout history:', historyError);
      }

      // Delete old summaries
      const { error: summaryError } = await supabase
        .from('weekly_summaries')
        .delete()
        .eq('user_id', userId)
        .lt('week_start_date', cutoffDateStr);

      if (summaryError) {
        console.error('Error cleaning old weekly summaries:', summaryError);
      }

      console.log(`Cleaned old weekly data for user ${userId}, keeping last ${weeksToKeep} weeks`);
    } catch (error) {
      console.error('Error in cleanOldWeeklyData:', error);
    }
  }

  // Weight Goals operations
  async getActiveWeightGoal(userId: number): Promise<WeightGoal | undefined> {
    try {
      const { data, error } = await supabase
        .from('weight_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        console.error('Error fetching active weight goal:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedGoal: WeightGoal = {
        id: data.id,
        userId: data.user_id,
        startWeight: data.start_weight,
        targetWeight: data.target_weight,
        goalType: data.goal_type,
        targetDate: data.target_date,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      return mappedGoal;
    } catch (error) {
      console.error('Error in getActiveWeightGoal:', error);
      return undefined;
    }
  }

  async createWeightGoal(insertGoal: InsertWeightGoal): Promise<WeightGoal> {
    try {
      // Deactivate any existing active goals
      await supabase
        .from('weight_goals')
        .update({ is_active: false })
        .eq('user_id', insertGoal.userId)
        .eq('is_active', true);

      const goalData = {
        user_id: insertGoal.userId,
        start_weight: insertGoal.startWeight,
        target_weight: insertGoal.targetWeight,
        goal_type: insertGoal.goalType,
        target_date: insertGoal.targetDate,
        is_active: insertGoal.isActive ?? true,
      };

      const { data, error } = await supabase
        .from('weight_goals')
        .insert(goalData)
        .select()
        .single();

      if (error) {
        console.error('Error creating weight goal:', error);
        throw new Error(`Failed to create weight goal: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedGoal: WeightGoal = {
        id: data.id,
        userId: data.user_id,
        startWeight: data.start_weight,
        targetWeight: data.target_weight,
        goalType: data.goal_type,
        targetDate: data.target_date,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      return mappedGoal;
    } catch (error) {
      console.error('Error in createWeightGoal:', error);
      throw error;
    }
  }

  async updateWeightGoal(goalId: number, updates: Partial<InsertWeightGoal>): Promise<WeightGoal | undefined> {
    try {
      const updateData: any = {};

      if (updates.startWeight !== undefined) updateData.start_weight = updates.startWeight;
      if (updates.targetWeight !== undefined) updateData.target_weight = updates.targetWeight;
      if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
      if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('weight_goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        console.error('Error updating weight goal:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedGoal: WeightGoal = {
        id: data.id,
        userId: data.user_id,
        startWeight: data.start_weight,
        targetWeight: data.target_weight,
        goalType: data.goal_type,
        targetDate: data.target_date,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      return mappedGoal;
    } catch (error) {
      console.error('Error in updateWeightGoal:', error);
      return undefined;
    }
  }

  // User Workout Preferences operations
  async createUserWorkoutPreferences(insertPreferences: InsertUserWorkoutPreferences & { userId: number }): Promise<UserWorkoutPreferences> {
    try {
      const preferencesData = {
        user_id: insertPreferences.userId,
        previous_routine_id: insertPreferences.previousRoutineId,
        satisfaction_rating: insertPreferences.satisfactionRating,
        dislike_reasons: insertPreferences.dislikeReasons,
        preferred_muscle_groups: insertPreferences.preferredMuscleGroups,
        preferred_exercises: insertPreferences.preferredExercises,
        avoided_exercises: insertPreferences.avoidedExercises,
        preferred_intensity: insertPreferences.preferredIntensity,
        preferred_duration: insertPreferences.preferredDuration,
        user_feedback: insertPreferences.userFeedback,
        improvement_suggestions: insertPreferences.improvementSuggestions,
        day_of_week: insertPreferences.dayOfWeek,
        time_of_day: insertPreferences.timeOfDay,
        energy_level: insertPreferences.energyLevel,
        available_time: insertPreferences.availableTime,
      };

      const { data, error } = await supabase
        .from('user_workout_preferences')
        .insert(preferencesData)
        .select()
        .single();

      if (error) throw error;

      return this.mapUserWorkoutPreferences(data);
    } catch (error) {
      console.error('Error in createUserWorkoutPreferences:', error);
      throw error;
    }
  }

  async getUserWorkoutPreferencesHistory(userId: number): Promise<UserWorkoutPreferences[]> {
    try {
      const { data, error } = await supabase
        .from('user_workout_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapUserWorkoutPreferences) || [];
    } catch (error) {
      console.error('Error in getUserWorkoutPreferencesHistory:', error);
      throw error;
    }
  }

  // Daily Workout Plans operations
  async createDailyWorkoutPlan(insertPlan: InsertDailyWorkoutPlan & { userId: number }): Promise<DailyWorkoutPlan> {
    try {
      const planData = {
        user_id: insertPlan.userId,
        workout_date: typeof insertPlan.workoutDate === 'string'
          ? insertPlan.workoutDate
          : insertPlan.workoutDate.toISOString().split('T')[0], // Asegurar formato string
        exercises: insertPlan.exercises,
        estimated_duration: insertPlan.estimatedDuration,
        target_muscle_groups: insertPlan.targetMuscleGroups,
        generated_based_on: insertPlan.generatedBasedOn,
        ai_confidence_score: insertPlan.aiConfidenceScore,
        mesocycle_id: (insertPlan as any).mesocycleId, // 🔗 NUEVO: Conectar con mesociclo
        is_active: insertPlan.isActive ?? true,
        is_completed: insertPlan.isCompleted ?? false,
        user_rating: insertPlan.userRating,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      // ESTRATEGIA: DELETE + INSERT para reemplazar rutina existente
      console.log('🔄 [SupabaseStorage] Attempting to replace existing plan for user:', planData.user_id, 'date:', planData.workout_date);

      // 1. Eliminar rutina existente del mismo día (si existe)
      await supabase
        .from('daily_workout_plans')
        .delete()
        .eq('user_id', planData.user_id)
        .eq('workout_date', planData.workout_date);

      // 2. Insertar nueva rutina
      const { data, error } = await supabase
        .from('daily_workout_plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [SupabaseStorage] Daily workout plan upserted successfully for user:', insertPlan.userId);
      return this.mapDailyWorkoutPlan(data);
    } catch (error) {
      console.error('Error in createDailyWorkoutPlan:', error);
      throw error;
    }
  }

  async getDailyWorkoutPlan(userId: number, date: string): Promise<DailyWorkoutPlan | null> {
    try {
      console.log('🚨 [DAILY WORKOUT DEBUG] Fetching daily workout plan:', {
        userId: userId,
        date: date,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from('daily_workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_date', date)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('🔍 [DAILY WORKOUT DEBUG] No daily workout plan found for user:', userId, 'date:', date);
          return null; // No rows found
        }
        console.error('❌ [DAILY WORKOUT DEBUG] Error fetching daily workout plan:', error);
        throw error;
      }

      console.log('🚨 [DAILY WORKOUT DEBUG] Raw daily workout data from Supabase:', {
        userId: userId,
        requestedDate: date,
        foundData: {
          id: data.id,
          user_id: data.user_id,
          workout_date: data.workout_date,
          is_active: data.is_active
        }
      });

      const mappedPlan = this.mapDailyWorkoutPlan(data);

      console.log('🚨 [DAILY WORKOUT DEBUG] Mapped daily workout plan:', {
        userId: userId,
        mappedUserId: mappedPlan.userId,
        userIdMatch: mappedPlan.userId === userId,
        planId: mappedPlan.id
      });

      return mappedPlan;
    } catch (error) {
      console.error('❌ [DAILY WORKOUT DEBUG] Error in getDailyWorkoutPlan:', error);
      throw error;
    }
  }

  // 🚀 NUEVA FUNCIÓN: Obtener rutinas recientes para análisis de grupos musculares
  async getRecentDailyWorkoutPlans(userId: number, startDate: string, endDate: string): Promise<DailyWorkoutPlan[]> {
    try {
      const { data, error } = await supabase
        .from('daily_workout_plans')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', startDate)
        .lte('workout_date', endDate)
        .eq('is_active', true)
        .order('workout_date', { ascending: false });

      if (error) {
        console.error('Error fetching recent daily workout plans:', error);
        return [];
      }

      return data.map(plan => this.mapDailyWorkoutPlan(plan));
    } catch (error) {
      console.error('Error in getRecentDailyWorkoutPlans:', error);
      return [];
    }
  }

  // 🔄 NUEVA FUNCIÓN CRÍTICA: Transferir rutina de cache a daily_workout_plans
  async transferPreGeneratedToDaily(userId: number, workoutDate: string): Promise<DailyWorkoutPlan | null> {
    try {
      console.log('🔄 [SupabaseStorage] Starting transfer from cache to daily plans:', { userId, workoutDate });

      // 🛡️ VALIDACIONES DE ENTRADA
      if (!userId || userId <= 0) {
        throw new Error('Invalid userId provided for transfer');
      }

      if (!workoutDate || !/^\d{4}-\d{2}-\d{2}$/.test(workoutDate)) {
        throw new Error('Invalid workoutDate format. Expected YYYY-MM-DD');
      }

      // 🛡️ VALIDACIÓN DE FECHA: No transferir rutinas muy antiguas
      const workoutDateObj = new Date(workoutDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - workoutDateObj.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 7) {
        console.log('⚠️ [SupabaseStorage] Workout date is too old for transfer:', workoutDate);
        return null;
      }

      if (daysDiff < -1) {
        console.log('⚠️ [SupabaseStorage] Workout date is too far in the future:', workoutDate);
        return null;
      }

      // 🔍 PASO 1: Verificar si ya existe rutina diaria para evitar duplicados
      const existingDaily = await this.getDailyWorkoutPlan(userId, workoutDate);
      if (existingDaily) {
        console.log('✅ [SupabaseStorage] Daily plan already exists, skipping transfer:', existingDaily.id);
        return existingDaily;
      }

      // 🔍 PASO 2: Buscar rutina en cache
      const { data: preGenerated, error: fetchError } = await supabase
        .from('pre_generated_workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_date', workoutDate)
        .eq('is_consumed', false)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('🔍 [SupabaseStorage] No pre-generated workout found for transfer');
          return null;
        }
        console.error('❌ [SupabaseStorage] Error fetching pre-generated workout:', fetchError);
        throw new Error(`Failed to fetch pre-generated workout: ${fetchError.message}`);
      }

      console.log('✅ [SupabaseStorage] Found pre-generated workout for transfer:', preGenerated.id);

      // 🛡️ VALIDACIONES DE DATOS DE CACHE
      if (!preGenerated.exercises || !Array.isArray(preGenerated.exercises) || preGenerated.exercises.length === 0) {
        throw new Error('Invalid exercises data in pre-generated workout');
      }

      if (!preGenerated.split_name || typeof preGenerated.split_name !== 'string') {
        throw new Error('Invalid split_name in pre-generated workout');
      }

      // 🔄 PASO 3: Mapear datos de pre_generated_workouts a daily_workout_plans
      const dailyPlanData = {
        user_id: userId,
        workout_date: workoutDate,
        exercises: preGenerated.exercises,
        estimated_duration: preGenerated.estimated_duration || 45,
        target_muscle_groups: preGenerated.target_muscle_groups || [],
        generated_based_on: {
          source: 'pre_generated_cache',
          split_type: preGenerated.split_type,
          split_name: preGenerated.split_name,
          split_id: preGenerated.split_id,
          day_name: preGenerated.day_name,
          generation_metadata: preGenerated.generation_metadata,
          transferred_at: new Date().toISOString(),
          original_cache_id: preGenerated.id,
          transfer_version: '1.0'
        },
        ai_confidence_score: preGenerated.ai_confidence_score || 0.5,
        is_active: true,
        is_completed: false,
        expires_at: preGenerated.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        mesocycle_id: null // Se puede conectar después si es necesario
      };

      // 🔄 PASO 4: Transacción atómica - Insertar en daily_workout_plans
      const { data: dailyPlan, error: insertError } = await supabase
        .from('daily_workout_plans')
        .insert(dailyPlanData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ [SupabaseStorage] Error inserting daily workout plan:', insertError);
        throw new Error(`Failed to insert daily workout plan: ${insertError.message}`);
      }

      console.log('✅ [SupabaseStorage] Daily workout plan created:', dailyPlan.id);

      // 🔄 PASO 5: Marcar rutina cache como consumida con validación
      try {
        const { error: updateError } = await supabase
          .from('pre_generated_workouts')
          .update({
            is_consumed: true,
            consumed_at: new Date().toISOString(),
            user_feedback: {
              transferred_to_daily: true,
              daily_plan_id: dailyPlan.id,
              transfer_timestamp: new Date().toISOString(),
              transfer_success: true
            }
          })
          .eq('id', preGenerated.id)
          .eq('user_id', userId); // Validación adicional de seguridad

        if (updateError) {
          console.error('❌ [SupabaseStorage] Error marking cache as consumed:', updateError);
          // Log pero no fallar - la transferencia principal ya se completó
          console.log('⚠️ [SupabaseStorage] Transfer completed but cache marking failed');
        } else {
          console.log('✅ [SupabaseStorage] Cache workout marked as consumed:', preGenerated.id);
        }
      } catch (markingError) {
        console.error('❌ [SupabaseStorage] Exception during cache marking:', markingError);
        // Continuar - la transferencia principal es más importante
      }

      // 🔄 PASO 6: Mapear y retornar resultado con validación final
      const mappedPlan = this.mapDailyWorkoutPlan(dailyPlan);

      // 🛡️ VALIDACIÓN FINAL: Verificar que el mapeo fue exitoso
      if (!mappedPlan || !mappedPlan.id || !mappedPlan.exercises) {
        throw new Error('Failed to map daily workout plan after transfer');
      }

      // 📊 LOG DE AUDITORÍA
      console.log('🎯 [SupabaseStorage] Transfer completed successfully:', {
        cacheId: preGenerated.id,
        dailyPlanId: dailyPlan.id,
        userId,
        workoutDate,
        exerciseCount: mappedPlan.exercises.length,
        estimatedDuration: mappedPlan.estimatedDuration,
        splitName: mappedPlan.generatedBasedOn?.split_name,
        transferTimestamp: new Date().toISOString()
      });

      return mappedPlan;

    } catch (error) {
      console.error('❌ [SupabaseStorage] Error in transferPreGeneratedToDaily:', error);

      // 🛡️ MANEJO DE ERRORES ESPECÍFICOS
      if (error.message?.includes('duplicate key')) {
        console.log('🔄 [SupabaseStorage] Duplicate detected, attempting to fetch existing plan...');
        try {
          return await this.getDailyWorkoutPlan(userId, workoutDate);
        } catch (fetchError) {
          console.error('❌ [SupabaseStorage] Failed to fetch existing plan after duplicate error:', fetchError);
        }
      }

      // Re-lanzar error con contexto adicional
      throw new Error(`Transfer failed for user ${userId} on ${workoutDate}: ${error.message}`);
    }
  }

  async updateDailyWorkoutPlanRating(planId: number, rating: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('daily_workout_plans')
        .update({ user_rating: rating })
        .eq('id', planId);

      if (error) throw error;
    } catch (error) {
      console.error('Error in updateDailyWorkoutPlanRating:', error);
      throw error;
    }
  }

  // Mappers for new tables
  private mapUserWorkoutPreferences(data: any): UserWorkoutPreferences {
    return {
      id: data.id,
      userId: data.user_id,
      previousRoutineId: data.previous_routine_id,
      satisfactionRating: data.satisfaction_rating,
      dislikeReasons: data.dislike_reasons || [],
      preferredMuscleGroups: data.preferred_muscle_groups || {},
      preferredExercises: data.preferred_exercises || [],
      avoidedExercises: data.avoided_exercises || [],
      preferredIntensity: data.preferred_intensity,
      preferredDuration: data.preferred_duration,
      userFeedback: data.user_feedback,
      improvementSuggestions: data.improvement_suggestions,
      dayOfWeek: data.day_of_week,
      timeOfDay: data.time_of_day,
      energyLevel: data.energy_level,
      availableTime: data.available_time,
      createdAt: data.created_at,
    };
  }

  private mapDailyWorkoutPlan(data: any): DailyWorkoutPlan {
    return {
      id: data.id,
      userId: data.user_id,
      workoutDate: data.workout_date,
      exercises: data.exercises,
      estimatedDuration: data.estimated_duration,
      targetMuscleGroups: data.target_muscle_groups || [],
      generatedBasedOn: data.generated_based_on || {},
      aiConfidenceScore: data.ai_confidence_score || 0.5,
      mesocycleId: data.mesocycle_id, // 🔗 NUEVO: Incluir mesocycle_id
      isActive: data.is_active,
      isCompleted: data.is_completed,
      userRating: data.user_rating,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    };
  }

  // Rejected Workout Plans operations
  async createRejectedWorkoutPlan(insertRejected: InsertRejectedWorkoutPlan & { userId: number }): Promise<RejectedWorkoutPlan> {
    try {
      const rejectedData = {
        user_id: insertRejected.userId,
        original_plan_id: insertRejected.originalPlanId,
        original_plan_data: insertRejected.originalPlanData,
        rejection_reasons: insertRejected.rejectionReasons,
        specific_dislikes: insertRejected.specificDislikes,
        user_feedback: insertRejected.userFeedback,
        day_of_week: insertRejected.dayOfWeek,
        time_of_day: insertRejected.timeOfDay,
        user_energy_level: insertRejected.userEnergyLevel,
        replacement_plan_id: insertRejected.replacementPlanId,
      };

      const { data, error } = await supabase
        .from('rejected_workout_plans')
        .insert(rejectedData)
        .select()
        .single();

      if (error) throw error;

      return this.mapRejectedWorkoutPlan(data);
    } catch (error) {
      console.error('Error in createRejectedWorkoutPlan:', error);
      throw error;
    }
  }

  async getRejectedWorkoutPlans(userId: number): Promise<RejectedWorkoutPlan[]> {
    try {
      const { data, error } = await supabase
        .from('rejected_workout_plans')
        .select('*')
        .eq('user_id', userId)
        .order('rejected_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapRejectedWorkoutPlan) || [];
    } catch (error) {
      console.error('Error in getRejectedWorkoutPlans:', error);
      throw error;
    }
  }

  async updateRejectedWorkoutPlanWithReplacement(rejectedId: number, replacementPlanId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('rejected_workout_plans')
        .update({ replacement_plan_id: replacementPlanId })
        .eq('id', rejectedId);

      if (error) throw error;
    } catch (error) {
      console.error('Error in updateRejectedWorkoutPlanWithReplacement:', error);
      throw error;
    }
  }

  // Mapper for rejected workout plans
  private mapRejectedWorkoutPlan(data: any): RejectedWorkoutPlan {
    return {
      id: data.id,
      userId: data.user_id,
      originalPlanId: data.original_plan_id,
      originalPlanData: data.original_plan_data || {},
      rejectionReasons: data.rejection_reasons || [],
      specificDislikes: data.specific_dislikes || {},
      userFeedback: data.user_feedback,
      rejectedAt: data.rejected_at,
      dayOfWeek: data.day_of_week,
      timeOfDay: data.time_of_day,
      userEnergyLevel: data.user_energy_level,
      replacementPlanId: data.replacement_plan_id,
    };
  }

  // Enhanced Progress Entries operations
  async getEnhancedProgressEntries(userId: number, limit: number = 10): Promise<EnhancedProgressEntry[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_progress_entries')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching enhanced progress entries:', error);
        return [];
      }

      // Map snake_case to camelCase
      const mappedEntries: EnhancedProgressEntry[] = data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        weight: entry.weight,
        bodyMeasurements: entry.body_measurements,
        weekNumber: entry.week_number,
        progressType: entry.progress_type,
        goalType: entry.goal_type,
        feelingRating: entry.feeling_rating,
        notes: entry.notes,
        recordedAt: entry.recorded_at,
      }));

      return mappedEntries;
    } catch (error) {
      console.error('Error in getEnhancedProgressEntries:', error);
      return [];
    }
  }

  async createEnhancedProgressEntry(insertEntry: InsertEnhancedProgressEntry): Promise<EnhancedProgressEntry> {
    try {
      // Calculate week number if not provided
      const weekNumber = insertEntry.weekNumber || this.getWeekNumber(new Date());

      const entryData = {
        user_id: insertEntry.userId,
        weight: insertEntry.weight,
        body_measurements: insertEntry.bodyMeasurements,
        week_number: weekNumber,
        progress_type: insertEntry.progressType || 'weekly',
        goal_type: insertEntry.goalType,
        feeling_rating: insertEntry.feelingRating,
        notes: insertEntry.notes,
      };

      const { data, error } = await supabase
        .from('enhanced_progress_entries')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating enhanced progress entry:', error);
        throw new Error(`Failed to create enhanced progress entry: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedEntry: EnhancedProgressEntry = {
        id: data.id,
        userId: data.user_id,
        weight: data.weight,
        bodyMeasurements: data.body_measurements,
        weekNumber: data.week_number,
        progressType: data.progress_type,
        goalType: data.goal_type,
        feelingRating: data.feeling_rating,
        notes: data.notes,
        recordedAt: data.recorded_at,
      };

      return mappedEntry;
    } catch (error) {
      console.error('Error in createEnhancedProgressEntry:', error);
      throw error;
    }
  }

  async getLatestProgressEntry(userId: number): Promise<EnhancedProgressEntry | undefined> {
    try {
      const { data, error } = await supabase
        .from('enhanced_progress_entries')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        console.error('Error fetching latest progress entry:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedEntry: EnhancedProgressEntry = {
        id: data.id,
        userId: data.user_id,
        weight: data.weight,
        bodyMeasurements: data.body_measurements,
        weekNumber: data.week_number,
        progressType: data.progress_type,
        goalType: data.goal_type,
        feelingRating: data.feeling_rating,
        notes: data.notes,
        recordedAt: data.recorded_at,
      };

      return mappedEntry;
    } catch (error) {
      console.error('Error in getLatestProgressEntry:', error);
      return undefined;
    }
  }

  async getCurrentWeekProgressEntry(userId: number): Promise<EnhancedProgressEntry | undefined> {
    try {
      const currentWeekNumber = this.getWeekNumber(new Date());

      const { data, error } = await supabase
        .from('enhanced_progress_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('week_number', currentWeekNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        console.error('Error fetching current week progress entry:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedEntry: EnhancedProgressEntry = {
        id: data.id,
        userId: data.user_id,
        weight: data.weight,
        bodyMeasurements: data.body_measurements,
        weekNumber: data.week_number,
        progressType: data.progress_type,
        goalType: data.goal_type,
        feelingRating: data.feeling_rating,
        notes: data.notes,
        recordedAt: data.recorded_at,
      };

      return mappedEntry;
    } catch (error) {
      console.error('Error in getCurrentWeekProgressEntry:', error);
      return undefined;
    }
  }

  // 🆕 NUEVA FUNCIÓN PARA ANÁLISIS INTELIGENTE DE NUTRICIÓN
  async getRecentProgressEntries(userId: number, weeksCount: number = 3): Promise<EnhancedProgressEntry[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_progress_entries')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(weeksCount);

      if (error) {
        console.error('Error fetching recent progress entries:', error);
        return [];
      }

      // Map snake_case to camelCase
      const mappedEntries: EnhancedProgressEntry[] = data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        weight: entry.weight,
        bodyMeasurements: entry.body_measurements,
        weekNumber: entry.week_number,
        progressType: entry.progress_type,
        goalType: entry.goal_type,
        feelingRating: entry.feeling_rating,
        notes: entry.notes,
        recordedAt: entry.recorded_at,
      }));

      return mappedEntries;
    } catch (error) {
      console.error('Error in getRecentProgressEntries:', error);
      return [];
    }
  }

  async updateEnhancedProgressEntry(entryId: number, updates: Partial<InsertEnhancedProgressEntry>): Promise<EnhancedProgressEntry> {
    try {
      const updateData: any = {};

      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.bodyMeasurements !== undefined) updateData.body_measurements = updates.bodyMeasurements;
      if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
      if (updates.feelingRating !== undefined) updateData.feeling_rating = updates.feelingRating;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from('enhanced_progress_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating enhanced progress entry:', error);
        throw new Error(`Failed to update enhanced progress entry: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedEntry: EnhancedProgressEntry = {
        id: data.id,
        userId: data.user_id,
        weight: data.weight,
        bodyMeasurements: data.body_measurements,
        weekNumber: data.week_number,
        progressType: data.progress_type,
        goalType: data.goal_type,
        feelingRating: data.feeling_rating,
        notes: data.notes,
        recordedAt: data.recorded_at,
      };

      return mappedEntry;
    } catch (error) {
      console.error('Error in updateEnhancedProgressEntry:', error);
      throw error;
    }
  }

  async getProgressTrends(userId: number): Promise<any> {
    try {
      const entries = await this.getEnhancedProgressEntries(userId, 8); // Last 8 weeks

      if (entries.length < 2) {
        return {
          weight: { trend: 'stable', change: 0, direction: 'none' },
          measurements: {}
        };
      }

      const latest = entries[0];
      const previous = entries[1];

      // Calculate weight trend
      const weightChange = latest.weight && previous.weight ? latest.weight - previous.weight : 0;
      const weightTrend = Math.abs(weightChange) < 0.5 ? 'stable' : (weightChange > 0 ? 'increasing' : 'decreasing');

      // Calculate measurement trends
      const measurementTrends: any = {};
      if (latest.bodyMeasurements && previous.bodyMeasurements) {
        const latestMeasurements = latest.bodyMeasurements as any;
        const previousMeasurements = previous.bodyMeasurements as any;

        for (const [key, value] of Object.entries(latestMeasurements)) {
          if (typeof value === 'number' && previousMeasurements[key]) {
            const change = value - previousMeasurements[key];
            measurementTrends[key] = {
              change,
              trend: Math.abs(change) < 1 ? 'stable' : (change > 0 ? 'increasing' : 'decreasing')
            };
          }
        }
      }

      return {
        weight: {
          trend: weightTrend,
          change: weightChange,
          direction: weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable'
        },
        measurements: measurementTrends
      };
    } catch (error) {
      console.error('Error in getProgressTrends:', error);
      return {
        weight: { trend: 'stable', change: 0, direction: 'none' },
        measurements: {}
      };
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Nutrition Preferences operations
  async getNutritionPreferences(userId: number): Promise<NutritionPreferences | undefined> {
    try {
      const { data, error } = await supabase
        .from('nutrition_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No preferences found
        console.error('Error fetching nutrition preferences:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedPreferences: NutritionPreferences = {
        id: data.id,
        userId: data.user_id,
        dietType: data.diet_type,
        customDietTypes: data.custom_diet_types || [],
        foodHabitsRating: data.food_habits_rating || 3,
        customFoodHabits: data.custom_food_habits || [],
        favoriteFoods: data.favorite_foods || [],
        allergies: data.allergies || [],
        customAllergies: data.custom_allergies || [],
        medicalRestrictions: data.medical_restrictions || [],
        customMedicalRestrictions: data.custom_medical_restrictions || [],
        dailyCalorieGoal: data.daily_calorie_goal,
        macroDistribution: data.macro_distribution,
        dailyWaterGoal: data.daily_water_goal_ml || 2000,
        mealFrequency: data.meal_frequency || 3,
        updatedAt: data.updated_at,
      };

      return mappedPreferences;
    } catch (error) {
      console.error('Error in getNutritionPreferences:', error);
      return undefined;
    }
  }

  async createOrUpdateNutritionPreferences(userId: number, preferences: Partial<InsertNutritionPreferences>): Promise<NutritionPreferences> {
    try {
      const preferencesData = {
        user_id: userId,
        diet_type: preferences.dietType,
        custom_diet_types: preferences.customDietTypes,
        food_habits_rating: preferences.foodHabitsRating,
        custom_food_habits: preferences.customFoodHabits,
        favorite_foods: preferences.favoriteFoods,
        allergies: preferences.allergies,
        custom_allergies: preferences.customAllergies,
        medical_restrictions: preferences.medicalRestrictions,
        custom_medical_restrictions: preferences.customMedicalRestrictions,
        daily_calorie_goal: preferences.dailyCalorieGoal,
        macro_distribution: preferences.macroDistribution,
        daily_water_goal_ml: preferences.dailyWaterGoal,
        meal_frequency: preferences.mealFrequency,
      };

      // Remove undefined values
      Object.keys(preferencesData).forEach(key =>
        preferencesData[key] === undefined && delete preferencesData[key]
      );

      const { data, error } = await supabase
        .from('nutrition_preferences')
        .upsert(preferencesData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating nutrition preferences:', error);
        throw new Error(`Failed to save nutrition preferences: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedPreferences: NutritionPreferences = {
        id: data.id,
        userId: data.user_id,
        dietType: data.diet_type,
        customDietTypes: data.custom_diet_types || [],
        foodHabitsRating: data.food_habits_rating || 3,
        customFoodHabits: data.custom_food_habits || [],
        favoriteFoods: data.favorite_foods || [],
        allergies: data.allergies || [],
        customAllergies: data.custom_allergies || [],
        medicalRestrictions: data.medical_restrictions || [],
        customMedicalRestrictions: data.custom_medical_restrictions || [],
        dailyCalorieGoal: data.daily_calorie_goal,
        macroDistribution: data.macro_distribution,
        dailyWaterGoal: data.daily_water_goal_ml || 2000,
        mealFrequency: data.meal_frequency || 3,
        updatedAt: data.updated_at,
      };

      return mappedPreferences;
    } catch (error) {
      console.error('Error in createOrUpdateNutritionPreferences:', error);
      throw error;
    }
  }

  // Daily Meal Plans operations
  async getDailyMealPlan(userId: number, planDate: string): Promise<DailyMealPlan | undefined> {
    try {
      const { data, error } = await supabase
        .from('daily_meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_date', planDate)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No plan found
        console.error('Error fetching daily meal plan:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedPlan: DailyMealPlan = {
        id: data.id,
        userId: data.user_id,
        planDate: data.plan_date,
        totalCalories: data.total_calories,
        meals: data.meals,
        macroBreakdown: data.macro_breakdown,
        generatedAt: data.generated_at,
        updatedAt: data.updated_at,
      };

      return mappedPlan;
    } catch (error) {
      console.error('Error in getDailyMealPlan:', error);
      return undefined;
    }
  }

  async createOrUpdateDailyMealPlan(userId: number, planData: Partial<InsertDailyMealPlan>): Promise<DailyMealPlan> {
    try {
      const mealPlanData = {
        user_id: userId,
        plan_date: planData.planDate,
        total_calories: planData.totalCalories,
        meals: planData.meals,
        macro_breakdown: planData.macroBreakdown,
      };

      const { data, error } = await supabase
        .from('daily_meal_plans')
        .upsert(mealPlanData, { onConflict: 'user_id,plan_date' })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating daily meal plan:', error);
        throw new Error(`Failed to save daily meal plan: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedPlan: DailyMealPlan = {
        id: data.id,
        userId: data.user_id,
        planDate: data.plan_date,
        totalCalories: data.total_calories,
        meals: data.meals,
        macroBreakdown: data.macro_breakdown,
        generatedAt: data.generated_at,
        updatedAt: data.updated_at,
      };

      return mappedPlan;
    } catch (error) {
      console.error('Error in createOrUpdateDailyMealPlan:', error);
      throw error;
    }
  }

  // 📸 Profile Photos operations
  async getProfilePhoto(userId: number): Promise<ProfilePhoto | undefined> {
    try {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // No photo found
        console.error('Error fetching profile photo:', error);
        return undefined;
      }

      // Map snake_case to camelCase
      const mappedPhoto: ProfilePhoto = {
        id: data.id,
        userId: data.user_id,
        photoUrl: data.photo_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        uploadedAt: data.uploaded_at,
        updatedAt: data.updated_at,
      };

      return mappedPhoto;
    } catch (error) {
      console.error('Error in getProfilePhoto:', error);
      return undefined;
    }
  }

  async createOrUpdateProfilePhoto(userId: number, photoData: Partial<InsertProfilePhoto>): Promise<ProfilePhoto> {
    try {
      const profilePhotoData = {
        user_id: userId,
        photo_url: photoData.photoUrl,
        file_name: photoData.fileName,
        file_size: photoData.fileSize,
        mime_type: photoData.mimeType,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profile_photos')
        .upsert(profilePhotoData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating profile photo:', error);
        throw new Error(`Failed to save profile photo: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedPhoto: ProfilePhoto = {
        id: data.id,
        userId: data.user_id,
        photoUrl: data.photo_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        uploadedAt: data.uploaded_at,
        updatedAt: data.updated_at,
      };

      return mappedPhoto;
    } catch (error) {
      console.error('Error in createOrUpdateProfilePhoto:', error);
      throw error;
    }
  }

  async deleteProfilePhoto(userId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting profile photo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProfilePhoto:', error);
      return false;
    }
  }

  // 🔔 Notifications operations
  async getNotifications(userId: number, limit: number = 20, includeRead: boolean = true): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includeRead) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      // Map snake_case to camelCase
      const mappedNotifications: Notification[] = data.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        actionUrl: notification.action_url,
        actionLabel: notification.action_label,
        priority: notification.priority,
        isRead: notification.is_read,
        isArchived: notification.is_archived,
        metadata: notification.metadata,
        expiresAt: notification.expires_at,
        createdAt: notification.created_at,
        readAt: notification.read_at,
      }));

      return mappedNotifications;
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      const notificationInsertData = {
        user_id: notificationData.userId,
        type: notificationData.type,
        category: notificationData.category,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon,
        action_url: notificationData.actionUrl,
        action_label: notificationData.actionLabel,
        priority: notificationData.priority,
        metadata: notificationData.metadata,
        expires_at: notificationData.expiresAt,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationInsertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedNotification: Notification = {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        icon: data.icon,
        actionUrl: data.action_url,
        actionLabel: data.action_label,
        priority: data.priority,
        isRead: data.is_read,
        isArchived: data.is_archived,
        metadata: data.metadata,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        readAt: data.read_at,
      };

      return mappedNotification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error);
      return false;
    }
  }

  // Scientific Workouts operations
  async updateMesocycleStatus(mesocycleId: number, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workout_mesocycles')
        .update({ status })
        .eq('id', mesocycleId);

      if (error) {
        console.error('Error updating mesocycle status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMesocycleStatus:', error);
      return false;
    }
  }

  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread notification count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadNotificationCount:', error);
      return 0;
    }
  }

  // 🚀 NUEVO: First Day Preferences operations
  async createFirstDayPreference(preferenceData: InsertFirstDayPreferences & { userId: number }): Promise<FirstDayPreferences> {
    try {
      const firstDayData = {
        user_id: preferenceData.userId,
        workout_date: preferenceData.workoutDate,
        day_of_week: preferenceData.dayOfWeek,
        time_of_day: preferenceData.timeOfDay,
        muscle_groups_selected: preferenceData.muscleGroupsSelected,
        energy_level: preferenceData.energyLevel,
        available_time: preferenceData.availableTime,
        preferred_intensity: preferenceData.preferredIntensity,
        specific_goal_today: preferenceData.specificGoalToday,
        today_limitations: preferenceData.todayLimitations || [],
        is_first_time: preferenceData.isFirstTime,
        generated_routine_id: preferenceData.generatedRoutineId,
        user_notes: preferenceData.userNotes,
      };

      console.log('🎯 [Storage] Creating first day preference:', firstDayData);

      const { data, error } = await supabase
        .from('first_day_preferences')
        .insert(firstDayData)
        .select()
        .single();

      if (error) {
        console.error('Error creating first day preference:', error);
        throw new Error(`Failed to create first day preference: ${error.message}`);
      }

      // Map snake_case to camelCase
      const mappedPreference: FirstDayPreferences = {
        id: data.id,
        userId: data.user_id,
        workoutDate: data.workout_date,
        dayOfWeek: data.day_of_week,
        timeOfDay: data.time_of_day,
        muscleGroupsSelected: data.muscle_groups_selected,
        energyLevel: data.energy_level,
        availableTime: data.available_time,
        preferredIntensity: data.preferred_intensity,
        specificGoalToday: data.specific_goal_today,
        todayLimitations: data.today_limitations,
        isFirstTime: data.is_first_time,
        generatedRoutineId: data.generated_routine_id,
        userNotes: data.user_notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log('✅ [Storage] First day preference created successfully:', mappedPreference.id);
      return mappedPreference;
    } catch (error) {
      console.error('Error in createFirstDayPreference:', error);
      throw error;
    }
  }

  async getFirstDayPreferences(userId: number, limit: number = 10): Promise<FirstDayPreferences[]> {
    try {
      const { data, error } = await supabase
        .from('first_day_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching first day preferences:', error);
        return [];
      }

      // Map snake_case to camelCase
      const mappedPreferences: FirstDayPreferences[] = data.map(pref => ({
        id: pref.id,
        userId: pref.user_id,
        workoutDate: pref.workout_date,
        dayOfWeek: pref.day_of_week,
        timeOfDay: pref.time_of_day,
        muscleGroupsSelected: pref.muscle_groups_selected,
        energyLevel: pref.energy_level,
        availableTime: pref.available_time,
        preferredIntensity: pref.preferred_intensity,
        specificGoalToday: pref.specific_goal_today,
        todayLimitations: pref.today_limitations,
        isFirstTime: pref.is_first_time,
        generatedRoutineId: pref.generated_routine_id,
        userNotes: pref.user_notes,
        createdAt: pref.created_at,
        updatedAt: pref.updated_at,
      }));

      return mappedPreferences;
    } catch (error) {
      console.error('Error in getFirstDayPreferences:', error);
      return [];
    }
  }

  async getFirstDayPreferencesByDay(userId: number, dayOfWeek: string): Promise<FirstDayPreferences[]> {
    try {
      const { data, error } = await supabase
        .from('first_day_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching first day preferences by day:', error);
        return [];
      }

      // Map snake_case to camelCase
      const mappedPreferences: FirstDayPreferences[] = data.map(pref => ({
        id: pref.id,
        userId: pref.user_id,
        workoutDate: pref.workout_date,
        dayOfWeek: pref.day_of_week,
        timeOfDay: pref.time_of_day,
        muscleGroupsSelected: pref.muscle_groups_selected,
        energyLevel: pref.energy_level,
        availableTime: pref.available_time,
        preferredIntensity: pref.preferred_intensity,
        specificGoalToday: pref.specific_goal_today,
        todayLimitations: pref.today_limitations,
        isFirstTime: pref.is_first_time,
        generatedRoutineId: pref.generated_routine_id,
        userNotes: pref.user_notes,
        createdAt: pref.created_at,
        updatedAt: pref.updated_at,
      }));

      return mappedPreferences;
    } catch (error) {
      console.error('Error in getFirstDayPreferencesByDay:', error);
      return [];
    }
  }

  async hasFirstDayPreferenceForDate(userId: number, workoutDate: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('first_day_preferences')
        .select('id')
        .eq('user_id', userId)
        .eq('workout_date', workoutDate)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return false; // No rows found
        console.error('Error checking first day preference for date:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasFirstDayPreferenceForDate:', error);
      return false;
    }
  }

  // 🧠 NUEVO: Sistema de Feedback Inteligente Consolidado

  /**
   * Guarda feedback raw del usuario
   */
  async saveFeedbackRaw(userId: number, insertFeedback: InsertFeedbackRawData): Promise<FeedbackRawData> {
    try {
      const feedbackData = {
        user_id: userId,
        feedback_type: insertFeedback.feedbackType,
        raw_data: insertFeedback.rawData,
        context: insertFeedback.context || {},
        processed: insertFeedback.processed || false,
        processing_errors: insertFeedback.processingErrors || [],
      };

      const { data, error } = await supabase
        .from('feedback_raw_data')
        .insert(feedbackData)
        .select()
        .single();

      if (error) {
        console.error('Error saving feedback raw data:', error);
        throw new Error(`Failed to save feedback raw data: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        feedbackType: data.feedback_type,
        rawData: data.raw_data,
        context: data.context,
        processed: data.processed,
        processingErrors: data.processing_errors,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('Error in saveFeedbackRaw:', error);
      throw error;
    }
  }

  /**
   * Obtiene feedback raw del usuario por tipo
   */
  async getFeedbackRawData(userId: number, feedbackType?: string, limit: number = 50): Promise<FeedbackRawData[]> {
    try {
      let query = supabase
        .from('feedback_raw_data')
        .select('*')
        .eq('user_id', userId);

      if (feedbackType) {
        query = query.eq('feedback_type', feedbackType);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching feedback raw data:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        feedbackType: item.feedback_type,
        rawData: item.raw_data,
        context: item.context,
        processed: item.processed,
        processingErrors: item.processing_errors,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
      }));
    } catch (error) {
      console.error('Error in getFeedbackRawData:', error);
      return [];
    }
  }

  /**
   * Guarda o actualiza el perfil consolidado del usuario
   */
  async saveUserFeedbackProfile(userId: number, insertProfile: InsertUserFeedbackProfile): Promise<UserFeedbackProfile> {
    try {
      const profileData = {
        user_id: userId,
        consolidated_preferences: insertProfile.consolidatedPreferences,
        data_sources: insertProfile.dataSources || [],
        confidence_score: insertProfile.confidenceScore || 0.5,
        total_feedback_count: insertProfile.totalFeedbackCount || 0,
        last_feedback_date: insertProfile.lastFeedbackDate,
        version: insertProfile.version || 1,
        previous_version_id: insertProfile.previousVersionId,
      };

      const { data, error } = await supabase
        .from('user_feedback_profile')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving user feedback profile:', error);
        throw new Error(`Failed to save user feedback profile: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        consolidatedPreferences: data.consolidated_preferences,
        lastUpdated: data.last_updated,
        dataSources: data.data_sources,
        confidenceScore: data.confidence_score,
        totalFeedbackCount: data.total_feedback_count,
        lastFeedbackDate: data.last_feedback_date,
        version: data.version,
        previousVersionId: data.previous_version_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in saveUserFeedbackProfile:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil consolidado del usuario
   */
  async getUserFeedbackProfile(userId: number): Promise<UserFeedbackProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_feedback_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        console.error('Error fetching user feedback profile:', error);
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        consolidatedPreferences: data.consolidated_preferences,
        lastUpdated: data.last_updated,
        dataSources: data.data_sources,
        confidenceScore: data.confidence_score,
        totalFeedbackCount: data.total_feedback_count,
        lastFeedbackDate: data.last_feedback_date,
        version: data.version,
        previousVersionId: data.previous_version_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in getUserFeedbackProfile:', error);
      throw error;
    }
  }

  /**
   * Registra una decisión de la IA
   */
  async saveAiDecision(userId: number, insertDecision: InsertAiDecision): Promise<AiDecision> {
    try {
      const decisionData = {
        user_id: userId,
        decision_type: insertDecision.decisionType,
        decision_data: insertDecision.decisionData,
        reasoning: insertDecision.reasoning,
        trigger_data: insertDecision.triggerData || {},
        confidence_level: insertDecision.confidenceLevel || 0.5,
        user_response: insertDecision.userResponse,
        effectiveness: insertDecision.effectiveness,
      };

      const { data, error } = await supabase
        .from('ai_decisions')
        .insert(decisionData)
        .select()
        .single();

      if (error) {
        console.error('Error saving AI decision:', error);
        throw new Error(`Failed to save AI decision: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        decisionType: data.decision_type,
        decisionData: data.decision_data,
        reasoning: data.reasoning,
        triggerData: data.trigger_data,
        confidenceLevel: data.confidence_level,
        implementedAt: data.implemented_at,
        userResponse: data.user_response,
        effectiveness: data.effectiveness,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error in saveAiDecision:', error);
      throw error;
    }
  }

  /**
   * Obtiene decisiones de la IA para un usuario
   */
  async getAiDecisions(userId: number, decisionType?: string, limit: number = 20): Promise<AiDecision[]> {
    try {
      let query = supabase
        .from('ai_decisions')
        .select('*')
        .eq('user_id', userId);

      if (decisionType) {
        query = query.eq('decision_type', decisionType);
      }

      const { data, error } = await query
        .order('implemented_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching AI decisions:', error);
        return [];
      }

      return data.map(decision => ({
        id: decision.id,
        userId: decision.user_id,
        decisionType: decision.decision_type,
        decisionData: decision.decision_data,
        reasoning: decision.reasoning,
        triggerData: decision.trigger_data,
        confidenceLevel: decision.confidence_level,
        implementedAt: decision.implemented_at,
        userResponse: decision.user_response,
        effectiveness: decision.effectiveness,
        createdAt: decision.created_at,
      }));
    } catch (error) {
      console.error('Error in getAiDecisions:', error);
      return [];
    }
  }

  /**
   * Obtiene sesiones de entrenamiento recientes para análisis
   */
  async getRecentWorkoutSessions(userId: number, limit: number = 20): Promise<WorkoutSession[]> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['completed', 'finished'])
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent workout sessions:', error);
        return [];
      }

      return data.map(session => ({
        id: session.id,
        userId: session.user_id,
        workoutPlanId: session.workout_plan_id,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        status: session.status,
        exercises: session.exercises,
        notes: session.notes,
      }));
    } catch (error) {
      console.error('Error in getRecentWorkoutSessions:', error);
      return [];
    }
  }


  // 🏋️‍♂️ NUEVO: Métodos para Sistema de Captura de Peso

  /**
   * Obtiene sugerencia de peso de IA para un ejercicio
   */
  async getAiWeightSuggestion(userId: number, exerciseName: string): Promise<AiWeightSuggestion | null> {
    try {
      const { data, error } = await supabase
        .from('ai_weight_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .gt('valid_until', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No suggestion found
        console.error('Error fetching AI weight suggestion:', error);
        return null;
      }

      return this.mapAiWeightSuggestion(data);
    } catch (error) {
      console.error('Error in getAiWeightSuggestion:', error);
      return null;
    }
  }

  /**
   * Guarda o actualiza sugerencia de peso de IA
   */
  async saveAiWeightSuggestion(userId: number, suggestion: InsertAiWeightSuggestion): Promise<AiWeightSuggestion> {
    try {
      const suggestionData = {
        user_id: userId,
        exercise_name: suggestion.exerciseName,
        suggested_weight: suggestion.suggestedWeight,
        confidence_score: suggestion.confidenceScore || 0.5,
        based_on_sessions: suggestion.basedOnSessions || 0,
        last_used_weight: suggestion.lastUsedWeight,
        progression_trend: suggestion.progressionTrend || 'stable',
        target_rpe_range: suggestion.targetRpeRange || '6-8',
        muscle_group: suggestion.muscleGroup,
        exercise_type: suggestion.exerciseType,
        valid_until: suggestion.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('ai_weight_suggestions')
        .upsert(suggestionData, { onConflict: 'user_id,exercise_name' })
        .select()
        .single();

      if (error) throw error;

      return this.mapAiWeightSuggestion(data);
    } catch (error) {
      console.error('Error in saveAiWeightSuggestion:', error);
      throw error;
    }
  }

  /**
   * Registra historial de peso usado por el usuario
   */
  async saveExerciseWeightHistory(userId: number, weightHistory: InsertExerciseWeightHistory): Promise<ExerciseWeightHistory> {
    try {
      const historyData = {
        user_id: userId,
        exercise_name: weightHistory.exerciseName,
        suggested_weight: weightHistory.suggestedWeight,
        actual_weight: weightHistory.actualWeight,
        weight_feedback: weightHistory.weightFeedback,
        rpe_achieved: weightHistory.rpeAchieved,
        reps_completed: weightHistory.repsCompleted,
        sets_completed: weightHistory.setsCompleted,
        session_id: weightHistory.sessionId,
        workout_date: weightHistory.workoutDate || new Date().toISOString().split('T')[0],
        progression_percentage: weightHistory.progressionPercentage,
        ai_confidence_score: weightHistory.aiConfidenceScore || 0.5,
        user_override: weightHistory.userOverride || false
      };

      const { data, error } = await supabase
        .from('exercise_weight_history')
        .insert(historyData)
        .select()
        .single();

      if (error) throw error;

      return this.mapExerciseWeightHistory(data);
    } catch (error) {
      console.error('Error in saveExerciseWeightHistory:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de peso para un ejercicio específico
   */
  async getExerciseWeightHistory(userId: number, exerciseName: string, limit: number = 10): Promise<ExerciseWeightHistory[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_weight_history')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .order('workout_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching exercise weight history:', error);
        return [];
      }

      return data.map(this.mapExerciseWeightHistory);
    } catch (error) {
      console.error('Error in getExerciseWeightHistory:', error);
      return [];
    }
  }

  /**
   * Guarda feedback extendido por set (UPSERT para evitar duplicados)
   */
  async saveExerciseSetFeedback(userId: number, feedback: InsertExerciseSetFeedbackExtended): Promise<ExerciseSetFeedbackExtended> {
    try {
      const feedbackData = {
        exercise_log_id: feedback.exerciseLogId,
        set_rpe: feedback.setRpe,
        weight_feeling: feedback.weightFeeling,
        completed_as_planned: feedback.completedAsPlanned !== false,
        notes: feedback.notes
      };

      // Usar UPSERT para evitar violación de constraint único
      const { data, error } = await supabase
        .from('exercise_set_feedback')
        .upsert(feedbackData, {
          onConflict: 'exercise_log_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapExerciseSetFeedback(data);
    } catch (error) {
      console.error('Error in saveExerciseSetFeedback:', error);
      throw error;
    }
  }

  /**
   * Guarda patrón de tiempo de descanso
   */
  async saveRestTimePattern(userId: number, pattern: InsertRestTimePattern): Promise<RestTimePattern> {
    try {
      const patternData = {
        user_id: userId,
        exercise_name: pattern.exerciseName,
        muscle_group: pattern.muscleGroup,
        recommended_rest_seconds: pattern.recommendedRestSeconds,
        actual_rest_seconds: pattern.actualRestSeconds,
        next_set_performance: typeof pattern.nextSetPerformance === 'number' ? pattern.nextSetPerformance : null,
        fatigue_level: typeof pattern.fatigueLevel === 'number' ? pattern.fatigueLevel : null,
        session_id: pattern.sessionId,
        set_number: pattern.setNumber,
        workout_date: pattern.workoutDate || new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('rest_time_patterns')
        .insert(patternData)
        .select()
        .single();

      if (error) throw error;

      return this.mapRestTimePattern(data);
    } catch (error) {
      console.error('Error in saveRestTimePattern:', error);
      throw error;
    }
  }

  // 🏋️‍♂️ Mappers para las nuevas tablas
  private mapAiWeightSuggestion(data: any): AiWeightSuggestion {
    return {
      id: data.id,
      userId: data.user_id,
      exerciseName: data.exercise_name,
      suggestedWeight: data.suggested_weight,
      confidenceScore: data.confidence_score,
      basedOnSessions: data.based_on_sessions,
      lastUsedWeight: data.last_used_weight,
      progressionTrend: data.progression_trend,
      targetRpeRange: data.target_rpe_range,
      muscleGroup: data.muscle_group,
      exerciseType: data.exercise_type,
      validUntil: data.valid_until,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapExerciseWeightHistory(data: any): ExerciseWeightHistory {
    return {
      id: data.id,
      userId: data.user_id,
      exerciseName: data.exercise_name,
      suggestedWeight: data.suggested_weight,
      actualWeight: data.actual_weight,
      weightFeedback: data.weight_feedback,
      rpeAchieved: data.rpe_achieved,
      repsCompleted: data.reps_completed,
      setsCompleted: data.sets_completed,
      sessionId: data.session_id,
      workoutDate: data.workout_date,
      progressionPercentage: data.progression_percentage,
      aiConfidenceScore: data.ai_confidence_score,
      userOverride: data.user_override,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapExerciseSetFeedback(data: any): ExerciseSetFeedbackExtended {
    return {
      id: data.id,
      exerciseLogId: data.exercise_log_id,
      setRpe: data.set_rpe,
      weightFeeling: data.weight_feeling,
      completedAsPlanned: data.completed_as_planned,
      notes: data.notes,
      createdAt: data.created_at
    };
  }

  private mapRestTimePattern(data: any): RestTimePattern {
    return {
      id: data.id,
      userId: data.user_id,
      exerciseName: data.exercise_name,
      muscleGroup: data.muscle_group,
      recommendedRestSeconds: data.recommended_rest_seconds,
      actualRestSeconds: data.actual_rest_seconds,
      nextSetPerformance: data.next_set_performance,
      fatigueLevel: data.fatigue_level,
      sessionId: data.session_id,
      setNumber: data.set_number,
      workoutDate: data.workout_date,
      createdAt: data.created_at
    };
  }
}

// Create and export the storage instance
export const supabaseStorage = new SupabaseStorage();
