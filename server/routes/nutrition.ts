import type { Express } from "express";
import { storage } from "../storageNew";
import { geminiService } from "../geminiService";
import { z } from "zod";
import { insertNutritionPreferencesSchema, insertDailyMealPlanSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
// 🕐 SISTEMA HORARIO CENTRALIZADO (SERVER)
import { now, getCurrentDate, getCurrentHour } from "../utils/timeSystem";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedRequest extends Request {
  user?: { userId: number };
}

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  console.log('🔐 [NutritionAuth] Authenticating request to:', req.path);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 [NutritionAuth] Auth header exists:', !!authHeader);
  console.log('🔐 [NutritionAuth] Token exists:', !!token);
  console.log('🔐 [NutritionAuth] Token preview:', token ? `${token.substring(0, 20)}...` : 'null');

  if (!token) {
    console.log('❌ [NutritionAuth] No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('❌ [NutritionAuth] Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }

    console.log('✅ [NutritionAuth] Token verified successfully for user:', user.userId);
    req.user = user;
    next();
  });
};

export default function nutritionRoutes(app: Express) {
  // Get nutrition preferences
  app.get("/api/nutrition/preferences", authenticateToken, async (req: any, res) => {
    try {
      console.log('🥗 [Nutrition] Getting preferences for user:', req.user.userId);

      const preferences = await storage.getNutritionPreferences(req.user.userId);

      if (!preferences) {
        // Return default preferences if none exist
        return res.json({
          id: 0,
          userId: req.user.userId,
          dietType: null,
          customDietTypes: [],
          foodHabitsRating: 3,
          customFoodHabits: [],
          favoriteFoods: [],
          allergies: [],
          customAllergies: [],
          medicalRestrictions: [],
          customMedicalRestrictions: [],
          dailyCalorieGoal: null,
          macroDistribution: null,
          dailyWaterGoal: 2000,
          mealFrequency: 3,
          updatedAt: now(), // 🕐 SISTEMA CENTRALIZADO
        });
      }

      console.log('🥗 [Nutrition] Preferences found:', preferences);
      res.json(preferences);
    } catch (error) {
      console.error('❌ [Nutrition] Error fetching preferences:', error);
      res.status(500).json({ message: "Failed to fetch nutrition preferences" });
    }
  });

  // Create or update nutrition preferences
  app.post("/api/nutrition/preferences", authenticateToken, async (req: any, res) => {
    try {
      console.log('🥗 [Nutrition] POST /api/nutrition/preferences called');
      console.log('🥗 [Nutrition] User from token:', req.user);
      console.log('🥗 [Nutrition] Request body:', JSON.stringify(req.body, null, 2));

      const preferencesData = insertNutritionPreferencesSchema.parse({
        ...req.body,
        userId: req.user.userId
      });

      console.log('🥗 [Nutrition] Validated preferences data:', JSON.stringify(preferencesData, null, 2));

      const preferences = await storage.createOrUpdateNutritionPreferences(req.user.userId, preferencesData);
      console.log('🥗 [Nutrition] Preferences saved successfully:', preferences);

      res.status(201).json(preferences);
    } catch (error) {
      console.error('❌ [Nutrition] Error saving preferences:', error);
      if (error instanceof z.ZodError) {
        console.error('❌ [Nutrition] Validation errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join('.'),
          allErrors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to save nutrition preferences" });
    }
  });

  // Generate daily meal plan
  app.post("/api/nutrition/generate-plan", authenticateToken, async (req: any, res) => {
    try {
      console.log('🍽️ [Nutrition] Generating meal plan for user:', req.user.userId);

      // Get user data needed for plan generation INCLUDING PROGRESS DATA
      const [userProfile, nutritionPreferences, weightGoal, currentWeekProgress, recentProgress] = await Promise.all([
        storage.getUser(req.user.userId),
        storage.getNutritionPreferences(req.user.userId),
        storage.getActiveWeightGoal(req.user.userId),
        storage.getCurrentWeekProgressEntry(req.user.userId), // 🆕 PROGRESO ACTUAL
        storage.getRecentProgressEntries(req.user.userId, 3) // 🆕 ÚLTIMAS 3 SEMANAS
      ]);

      if (!nutritionPreferences) {
        return res.status(400).json({
          message: "Please configure your nutrition preferences first"
        });
      }

      // Get current date and time in local timezone
      const currentTime = now(); // 🕐 SISTEMA CENTRALIZADO
      const currentDate = getCurrentDate(); // 🕐 SISTEMA CENTRALIZADO

      // Get local hour using centralized system
      const localHour = getCurrentHour(); // 🕐 SISTEMA CENTRALIZADO

      console.log('🕐 [Timezone Debug] Current time:', currentTime.toISOString());
      console.log('🕐 [Timezone Debug] Local hour detected:', localHour);
      console.log('🕐 [Timezone Debug] 🔧 FIXED - Local date:', currentDate);
      console.log('🕐 [Timezone Debug] ❌ OLD - UTC date:', currentTime.toISOString().split('T')[0]);
      console.log('🕐 [Timezone Debug] 🎯 Date comparison:', currentDate === currentTime.toISOString().split('T')[0] ? 'SAME' : 'DIFFERENT - TIMEZONE FIX WORKING!');

      // Generate meal plan using AI with ENHANCED CONTEXT
      const mealPlan = await generateMealPlanWithAI({
        userProfile,
        nutritionPreferences,
        weightGoal,
        currentDate,
        currentHour: localHour, // 🕐 SISTEMA CENTRALIZADO
        currentWeekProgress, // 🆕 PROGRESO ACTUAL
        recentProgress // 🆕 TENDENCIAS
      });

      // Save the generated plan
      const savedPlan = await storage.createOrUpdateDailyMealPlan(req.user.userId, {
        planDate: currentDate,
        totalCalories: mealPlan.totalCalories,
        meals: mealPlan.meals,
        macroBreakdown: mealPlan.macroBreakdown
      });

      console.log('🍽️ [Nutrition] Meal plan generated and saved:', savedPlan);
      res.status(201).json(savedPlan);
    } catch (error) {
      console.error('❌ [Nutrition] Error generating meal plan:', error);
      res.status(500).json({ message: "Failed to generate meal plan" });
    }
  });

  // Get daily meal plan
  app.get("/api/nutrition/meal-plan", authenticateToken, async (req: any, res) => {
    try {
      const { date } = req.query;
      // 🕐 SISTEMA CENTRALIZADO: Use local date consistently
      const planDate = date || getCurrentDate();

      console.log('🍽️ [Nutrition] Getting meal plan for date:', planDate);

      const mealPlan = await storage.getDailyMealPlan(req.user.userId, planDate as string);

      if (!mealPlan) {
        return res.status(404).json({ message: "No meal plan found for this date" });
      }

      res.json(mealPlan);
    } catch (error) {
      console.error('❌ [Nutrition] Error fetching meal plan:', error);
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });
}

// AI Meal Plan Generation Function - ENHANCED WITH PROGRESS DATA
async function generateMealPlanWithAI(context: {
  userProfile: any;
  nutritionPreferences: any;
  weightGoal: any;
  currentDate: string;
  currentHour: number;
  currentWeekProgress?: any; // 🆕 PROGRESO ACTUAL
  recentProgress?: any[]; // 🆕 TENDENCIAS
}) {
  const { userProfile, nutritionPreferences, weightGoal, currentDate, currentHour, currentWeekProgress, recentProgress } = context;

  // Determine meal frequency based on goal
  let mealCount = nutritionPreferences.mealFrequency;
  if (weightGoal?.goalType === 'lose_weight' && mealCount > 4) {
    mealCount = Math.min(mealCount, 4); // Max 4 meals for weight loss
  } else if (weightGoal?.goalType === 'gain_weight' && mealCount < 4) {
    mealCount = Math.max(mealCount, 4); // Min 4 meals for weight gain
  }

  // Calculate remaining meals based on current time
  const mealTimes = generateMealTimes(mealCount, currentHour);

  // 🧠 ANÁLISIS INTELIGENTE DE PROGRESO Y SALUD
  const healthAnalysis = analyzeHealthStatus(currentWeekProgress, recentProgress);
  const progressTrends = analyzeProgressTrends(recentProgress, weightGoal);

  console.log('🍽️ [Nutrition] ENHANCED meal plan context prepared:', {
    userAge: userProfile?.age,
    goalType: weightGoal?.goalType,
    mealCount,
    futureMealsCount: mealTimes.length,
    currentHour,
    healthStatus: healthAnalysis.status,
    moodLevel: healthAnalysis.moodLevel,
    hasSymptoms: healthAnalysis.hasSymptoms,
    weightTrend: progressTrends.weightTrend
  });

  // Prepare ENHANCED context for AI
  const aiContext = {
    userProfile: {
      age: userProfile?.age,
      gender: userProfile?.gender,
      currentWeight: userProfile?.currentWeight,
      height: userProfile?.height,
      fitnessLevel: userProfile?.fitnessLevel
    },
    nutritionPreferences: {
      dietType: nutritionPreferences.dietType,
      customDietTypes: nutritionPreferences.customDietTypes || [],
      allergies: [...nutritionPreferences.allergies, ...nutritionPreferences.customAllergies],
      medicalRestrictions: [...nutritionPreferences.medicalRestrictions, ...nutritionPreferences.customMedicalRestrictions],
      favoriteFoods: nutritionPreferences.favoriteFoods,
      customFoodHabits: nutritionPreferences.customFoodHabits || [],
      foodHabitsRating: nutritionPreferences.foodHabitsRating,
      dailyCalorieGoal: nutritionPreferences.dailyCalorieGoal,
      macroDistribution: nutritionPreferences.macroDistribution
    },
    weightGoal: {
      goalType: weightGoal?.goalType || 'maintain',
      targetWeight: weightGoal?.targetWeight
    },
    mealTimes,
    currentDate,
    currentHour,
    // 🆕 DATOS INTELIGENTES PARA IA
    healthAnalysis,
    progressTrends,
    currentWeekProgress
  };

  try {
    // Generate meal plan using Gemini AI
    const mealPlan = await geminiService.generateDailyMealPlan(aiContext);
    return mealPlan;
  } catch (error) {
    console.error('Error generating AI meal plan:', error);
    // Fallback to basic meal plan
    return generateFallbackMealPlan(nutritionPreferences, mealTimes);
  }
}

// Generate meal times based on count and current hour (LOCAL TIME)
function generateMealTimes(mealCount: number, currentHour: number) {
  const baseTimes = [7, 12, 15, 19, 21]; // breakfast, lunch, snack, dinner, evening snack
  const selectedTimes = baseTimes.slice(0, mealCount);

  console.log('🍽️ [MealTimes] Current local hour:', currentHour);
  console.log('🍽️ [MealTimes] Base meal times:', baseTimes);
  console.log('🍽️ [MealTimes] Selected times for', mealCount, 'meals:', selectedTimes);

  // Filter out past meal times (using local hour)
  const futureMeals = selectedTimes.filter(time => time > currentHour);
  console.log('🍽️ [MealTimes] Future meals after', currentHour + ':00:', futureMeals);

  return futureMeals.map(time => ({
    time: `${time}:00`,
    type: time <= 10 ? 'breakfast' : time <= 14 ? 'lunch' : time <= 17 ? 'snack' : 'dinner'
  }));
}

// Fallback meal plan generator
function generateFallbackMealPlan(preferences: any, mealTimes: any[]) {
  const caloriesPerMeal = Math.floor(preferences.dailyCalorieGoal / mealTimes.length);

  const meals = mealTimes.map((mealTime, index) => ({
    name: `Comida ${index + 1}`,
    time: mealTime.time,
    type: mealTime.type,
    calories: caloriesPerMeal,
    ingredients: [
      { name: "Proteína", amount: 100, unit: "gr", calories: Math.floor(caloriesPerMeal * 0.3) },
      { name: "Carbohidratos", amount: 80, unit: "gr", calories: Math.floor(caloriesPerMeal * 0.4) },
      { name: "Vegetales", amount: 150, unit: "gr", calories: Math.floor(caloriesPerMeal * 0.3) }
    ]
  }));

  return {
    totalCalories: preferences.dailyCalorieGoal,
    meals,
    macroBreakdown: preferences.macroDistribution || { protein: 30, carbs: 40, fat: 30 }
  };
}

// 🧠 ANÁLISIS INTELIGENTE DE ESTADO DE SALUD
function analyzeHealthStatus(currentWeekProgress: any, recentProgress: any[]) {
  const analysis = {
    status: 'normal',
    moodLevel: 3,
    hasSymptoms: false,
    needsGentleDiet: false,
    energyLevel: 'normal',
    symptoms: [] as string[],
    recommendations: [] as string[]
  };

  if (!currentWeekProgress) {
    return analysis;
  }

  // Analizar estado de ánimo
  analysis.moodLevel = currentWeekProgress.feelingRating || 3;

  if (analysis.moodLevel <= 2) {
    analysis.status = 'low_mood';
    analysis.needsGentleDiet = true;
    analysis.energyLevel = 'low';
    analysis.recommendations.push('Comidas reconfortantes pero saludables');
    analysis.recommendations.push('Porciones más pequeñas y fáciles de digerir');
  } else if (analysis.moodLevel >= 4) {
    analysis.status = 'good_mood';
    analysis.energyLevel = 'high';
    analysis.recommendations.push('Puede manejar comidas más complejas');
    analysis.recommendations.push('Mantener disciplina nutricional estricta');
  }

  // Analizar notas de salud para síntomas
  const notes = (currentWeekProgress.notes || '').toLowerCase();

  if (notes.includes('diarrea') || notes.includes('estómago') || notes.includes('digestivo')) {
    analysis.hasSymptoms = true;
    analysis.needsGentleDiet = true;
    analysis.symptoms.push('digestive_issues');
    analysis.recommendations.push('Comidas blandas: arroz, plátano, pollo hervido');
    analysis.recommendations.push('Evitar fibra alta y lácteos');
    analysis.recommendations.push('Aumentar hidratación con caldos');
  }

  if (notes.includes('gripe') || notes.includes('fiebre') || notes.includes('resfriado')) {
    analysis.hasSymptoms = true;
    analysis.needsGentleDiet = true;
    analysis.symptoms.push('flu_symptoms');
    analysis.recommendations.push('Comidas ligeras ricas en vitamina C');
    analysis.recommendations.push('Sopas, caldos y té con miel');
    analysis.recommendations.push('Frutas cítricas y vegetales suaves');
  }

  if (notes.includes('estreñimiento') || notes.includes('constipado')) {
    analysis.hasSymptoms = true;
    analysis.symptoms.push('constipation');
    analysis.recommendations.push('Aumentar fibra: avena, ciruelas, verduras');
    analysis.recommendations.push('Más líquidos y frutas');
  }

  if (notes.includes('dolor de cabeza') || notes.includes('migraña')) {
    analysis.hasSymptoms = true;
    analysis.symptoms.push('headache');
    analysis.recommendations.push('Evitar alimentos procesados y azúcar');
    analysis.recommendations.push('Comidas regulares para estabilizar glucosa');
  }

  if (notes.includes('cansado') || notes.includes('fatiga') || notes.includes('sin energía')) {
    analysis.energyLevel = 'low';
    analysis.recommendations.push('Carbohidratos complejos para energía sostenida');
    analysis.recommendations.push('Hierro: carnes magras, espinacas, legumbres');
  }

  return analysis;
}

// 📈 ANÁLISIS DE TENDENCIAS DE PROGRESO
function analyzeProgressTrends(recentProgress: any[], weightGoal: any) {
  const trends = {
    weightTrend: 'stable',
    progressRate: 'normal',
    needsAdjustment: false,
    recommendations: [] as string[]
  };

  if (!recentProgress || recentProgress.length < 2) {
    return trends;
  }

  // Analizar tendencia de peso (últimas 2-3 semanas)
  const weights = recentProgress
    .filter(entry => entry.weight)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(entry => entry.weight);

  if (weights.length >= 2) {
    const weightChange = weights[weights.length - 1] - weights[0];
    const weeksSpan = weights.length;
    const weeklyRate = weightChange / weeksSpan;

    if (Math.abs(weeklyRate) < 0.2) {
      trends.weightTrend = 'stable';
    } else if (weeklyRate > 0) {
      trends.weightTrend = 'gaining';
    } else {
      trends.weightTrend = 'losing';
    }

    // Evaluar si la tasa es apropiada para el objetivo
    if (weightGoal?.goalType === 'lose_weight') {
      if (weeklyRate > 0) {
        trends.needsAdjustment = true;
        trends.progressRate = 'too_slow';
        trends.recommendations.push('Reducir calorías ligeramente');
        trends.recommendations.push('Aumentar proteína para preservar músculo');
      } else if (weeklyRate < -1) {
        trends.needsAdjustment = true;
        trends.progressRate = 'too_fast';
        trends.recommendations.push('Aumentar calorías ligeramente');
        trends.recommendations.push('Pérdida muy rápida puede afectar músculo');
      }
    } else if (weightGoal?.goalType === 'gain_weight') {
      if (weeklyRate < 0) {
        trends.needsAdjustment = true;
        trends.progressRate = 'too_slow';
        trends.recommendations.push('Aumentar calorías y carbohidratos');
        trends.recommendations.push('Más comidas frecuentes');
      } else if (weeklyRate > 0.8) {
        trends.needsAdjustment = true;
        trends.progressRate = 'too_fast';
        trends.recommendations.push('Ganancia muy rápida puede ser grasa');
        trends.recommendations.push('Reducir calorías ligeramente');
      }
    }
  }

  return trends;
}
