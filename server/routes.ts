import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import { z } from "zod";
import { 
  loginSchema, registerSchema, insertMealSchema, insertProgressEntrySchema,
  insertWorkoutSessionSchema, insertWorkoutPlanSchema, type User 
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const upload = multer({ storage: multer.memoryStorage() });

// Mock AI service for workout generation
const generateWorkoutPlan = (userId: number, fitnessLevel: string, goal: string) => {
  const exercises = {
    beginner: [
      { name: "Push-ups", sets: 3, reps: 10, rest: 60 },
      { name: "Squats", sets: 3, reps: 15, rest: 60 },
      { name: "Plank", sets: 3, duration: 30, rest: 60 }
    ],
    intermediate: [
      { name: "Bench Press", sets: 4, reps: 8, weight: 60, rest: 90 },
      { name: "Deadlifts", sets: 4, reps: 6, weight: 80, rest: 120 },
      { name: "Pull-ups", sets: 3, reps: 8, rest: 90 }
    ],
    advanced: [
      { name: "Heavy Squats", sets: 5, reps: 5, weight: 100, rest: 180 },
      { name: "Military Press", sets: 4, reps: 6, weight: 50, rest: 120 },
      { name: "Barbell Rows", sets: 4, reps: 8, weight: 70, rest: 90 }
    ]
  };

  return {
    name: `${goal} Training - Week 1`,
    description: `AI-generated ${fitnessLevel} workout plan for ${goal}`,
    difficulty: fitnessLevel,
    duration: 45,
    exercises: exercises[fitnessLevel as keyof typeof exercises] || exercises.beginner,
    weekNumber: 1,
    isActive: true
  };
};

// Mock nutrition analysis API
const analyzeFoodImage = async (imageBuffer: Buffer): Promise<any> => {
  // In a real implementation, this would call Google Cloud Vision API or similar
  // For now, return mock nutritional data
  const mockAnalysis = {
    name: "Mixed Meal",
    description: "AI analyzed meal content",
    calories: Math.floor(Math.random() * 400) + 200,
    protein: Math.floor(Math.random() * 30) + 15,
    carbs: Math.floor(Math.random() * 50) + 20,
    fat: Math.floor(Math.random() * 20) + 10,
    fiber: Math.floor(Math.random() * 10) + 3
  };
  
  return mockAnalysis;
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
      const { confirmPassword, ...userToCreate } = userData;
      const user = await storage.createUser({
        ...userToCreate,
        password: hashedPassword
      });

      // Generate initial workout plan if fitness data provided
      if (user.fitnessLevel && user.fitnessGoal) {
        const workoutPlan = generateWorkoutPlan(user.id, user.fitnessLevel, user.fitnessGoal);
        await storage.createWorkoutPlan({ ...workoutPlan, userId: user.id });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
      
      res.status(201).json({ 
        token, 
        user: { ...user, password: undefined } 
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
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { ...user, password: undefined } 
      });
    } catch (error) {
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
      res.json({ ...user, password: undefined });
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
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Workout routes
  app.get("/api/workouts", authenticateToken, async (req: any, res) => {
    try {
      const workoutPlans = await storage.getWorkoutPlans(req.user.userId);
      res.json(workoutPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout plans" });
    }
  });

  app.get("/api/workouts/active", authenticateToken, async (req: any, res) => {
    try {
      const activeWorkout = await storage.getActiveWorkoutPlan(req.user.userId);
      res.json(activeWorkout);
    } catch (error) {
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

      // Generate new plan
      const workoutPlan = generateWorkoutPlan(user.id, user.fitnessLevel, user.fitnessGoal);
      const newPlan = await storage.createWorkoutPlan({ ...workoutPlan, userId: user.id });
      
      res.json(newPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate workout plan" });
    }
  });

  app.post("/api/workouts/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      const session = await storage.createWorkoutSession({
        ...sessionData,
        userId: req.user.userId
      });
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
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

  // Dashboard stats route
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      const todaysMeals = await storage.getMeals(req.user.userId, new Date().toISOString().split('T')[0]);
      const recentSessions = await storage.getWorkoutSessions(req.user.userId, 7);
      const progressEntries = await storage.getProgressEntries(req.user.userId);

      // Calculate stats
      const todayCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
      const weeklyWorkouts = recentSessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate > weekAgo && session.status === 'completed';
      }).length;

      const currentWeight = progressEntries[0]?.weight || user?.currentWeight || 0;
      const streak = recentSessions.length; // Simplified streak calculation

      res.json({
        currentWeight,
        weeklyWorkouts,
        todayCalories,
        streak,
        targetCalories: 2200, // Could be calculated based on user profile
        targetProtein: 150,
        targetCarbs: 200,
        targetFat: 85
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
