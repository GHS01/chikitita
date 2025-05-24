import { 
  users, workoutPlans, workoutSessions, meals, progressEntries, achievements,
  type User, type InsertUser, type WorkoutPlan, type InsertWorkoutPlan,
  type WorkoutSession, type InsertWorkoutSession, type Meal, type InsertMeal,
  type ProgressEntry, type InsertProgressEntry, type Achievement, type InsertAchievement
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Workout plan operations
  getWorkoutPlans(userId: number): Promise<WorkoutPlan[]>;
  getActiveWorkoutPlan(userId: number): Promise<WorkoutPlan | undefined>;
  createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan>;
  updateWorkoutPlan(id: number, plan: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan | undefined>;

  // Workout session operations
  getWorkoutSessions(userId: number, limit?: number): Promise<WorkoutSession[]>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  updateWorkoutSession(id: number, session: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined>;

  // Meal operations
  getMeals(userId: number, date?: string): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number, userId: number): Promise<boolean>;

  // Progress operations
  getProgressEntries(userId: number): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;

  // Achievement operations
  getAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workoutPlans: Map<number, WorkoutPlan>;
  private workoutSessions: Map<number, WorkoutSession>;
  private meals: Map<number, Meal>;
  private progressEntries: Map<number, ProgressEntry>;
  private achievements: Map<number, Achievement>;
  private currentUserId: number;
  private currentWorkoutPlanId: number;
  private currentWorkoutSessionId: number;
  private currentMealId: number;
  private currentProgressEntryId: number;
  private currentAchievementId: number;

  constructor() {
    this.users = new Map();
    this.workoutPlans = new Map();
    this.workoutSessions = new Map();
    this.meals = new Map();
    this.progressEntries = new Map();
    this.achievements = new Map();
    this.currentUserId = 1;
    this.currentWorkoutPlanId = 1;
    this.currentWorkoutSessionId = 1;
    this.currentMealId = 1;
    this.currentProgressEntryId = 1;
    this.currentAchievementId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Workout plan operations
  async getWorkoutPlans(userId: number): Promise<WorkoutPlan[]> {
    return Array.from(this.workoutPlans.values()).filter(plan => plan.userId === userId);
  }

  async getActiveWorkoutPlan(userId: number): Promise<WorkoutPlan | undefined> {
    return Array.from(this.workoutPlans.values()).find(plan => plan.userId === userId && plan.isActive);
  }

  async createWorkoutPlan(insertPlan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    const id = this.currentWorkoutPlanId++;
    const plan: WorkoutPlan = { 
      ...insertPlan, 
      id, 
      createdAt: new Date() 
    };
    this.workoutPlans.set(id, plan);
    return plan;
  }

  async updateWorkoutPlan(id: number, planData: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan | undefined> {
    const plan = this.workoutPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...planData };
    this.workoutPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // Workout session operations
  async getWorkoutSessions(userId: number, limit?: number): Promise<WorkoutSession[]> {
    const sessions = Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    return limit ? sessions.slice(0, limit) : sessions;
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const id = this.currentWorkoutSessionId++;
    const session: WorkoutSession = { ...insertSession, id };
    this.workoutSessions.set(id, session);
    return session;
  }

  async updateWorkoutSession(id: number, sessionData: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const session = this.workoutSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...sessionData };
    this.workoutSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Meal operations
  async getMeals(userId: number, date?: string): Promise<Meal[]> {
    let meals = Array.from(this.meals.values()).filter(meal => meal.userId === userId);
    
    if (date) {
      const targetDate = new Date(date);
      meals = meals.filter(meal => {
        const mealDate = new Date(meal.loggedAt!);
        return mealDate.toDateString() === targetDate.toDateString();
      });
    }
    
    return meals.sort((a, b) => new Date(b.loggedAt!).getTime() - new Date(a.loggedAt!).getTime());
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const id = this.currentMealId++;
    const meal: Meal = { 
      ...insertMeal, 
      id, 
      loggedAt: new Date() 
    };
    this.meals.set(id, meal);
    return meal;
  }

  async deleteMeal(id: number, userId: number): Promise<boolean> {
    const meal = this.meals.get(id);
    if (!meal || meal.userId !== userId) return false;
    
    return this.meals.delete(id);
  }

  // Progress operations
  async getProgressEntries(userId: number): Promise<ProgressEntry[]> {
    return Array.from(this.progressEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.recordedAt!).getTime() - new Date(a.recordedAt!).getTime());
  }

  async createProgressEntry(insertEntry: InsertProgressEntry): Promise<ProgressEntry> {
    const id = this.currentProgressEntryId++;
    const entry: ProgressEntry = { 
      ...insertEntry, 
      id, 
      recordedAt: new Date() 
    };
    this.progressEntries.set(id, entry);
    return entry;
  }

  // Achievement operations
  async getAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const achievement: Achievement = { 
      ...insertAchievement, 
      id, 
      unlockedAt: new Date() 
    };
    this.achievements.set(id, achievement);
    return achievement;
  }
}

export const storage = new MemStorage();
