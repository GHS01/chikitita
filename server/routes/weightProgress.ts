import type { Express } from "express";
import { storage } from "../storageNew";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth";
import { insertWeightGoalSchema, insertEnhancedProgressEntrySchema } from "@shared/schema";
// 🕐 SISTEMA HORARIO CENTRALIZADO (SERVER)
import { now, createDBTimestamp, getCurrentDate } from "../utils/timeSystem";

export default function registerWeightProgressRoutes(app: Express) {

  // Get active weight goal
  app.get("/api/weight-progress/goal", authenticateToken, async (req, res) => {
    try {
      const goal = await storage.getActiveWeightGoal(req.user!.userId);
      res.json(goal);
    } catch (error) {
      console.error('Error fetching weight goal:', error);
      res.status(500).json({ message: "Failed to fetch weight goal" });
    }
  });

  // Create or update weight goal
  app.post("/api/weight-progress/goal", authenticateToken, async (req, res) => {
    try {
      console.log('🎯 [WeightProgress] Creating weight goal:', req.body);
      console.log('🎯 [WeightProgress] User from token:', req.user);
      console.log('🎯 [WeightProgress] User ID:', req.user!.userId);

      const dataToValidate = {
        ...req.body,
        userId: req.user!.userId
      };
      console.log('🎯 [WeightProgress] Data to validate:', dataToValidate);

      const goalData = insertWeightGoalSchema.parse(dataToValidate);

      console.log('🎯 [WeightProgress] Parsed goal data:', goalData);

      const goal = await storage.createWeightGoal(goalData);
      console.log('🎯 [WeightProgress] Weight goal created:', goal);

      res.status(201).json(goal);
    } catch (error) {
      console.error('❌ [WeightProgress] Error creating weight goal:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join('.'),
          allErrors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create weight goal" });
    }
  });

  // Get progress entries
  app.get("/api/weight-progress/entries", authenticateToken, async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const entries = await storage.getEnhancedProgressEntries(req.user!.userId, parseInt(limit as string));
      res.json(entries);
    } catch (error) {
      console.error('Error fetching progress entries:', error);
      res.status(500).json({ message: "Failed to fetch progress entries" });
    }
  });

  // Get current week's progress entry
  app.get("/api/weight-progress/current-week", authenticateToken, async (req, res) => {
    try {
      const entry = await storage.getCurrentWeekProgressEntry(req.user!.userId);
      res.json(entry);
    } catch (error) {
      console.error('Error fetching current week progress entry:', error);
      res.status(500).json({ message: "Failed to fetch current week progress entry" });
    }
  });

  // Create or update progress entry
  app.post("/api/weight-progress/entries", authenticateToken, async (req, res) => {
    try {
      console.log('📊 [WeightProgress] Creating/updating progress entry:', req.body);

      const entryData = insertEnhancedProgressEntrySchema.parse({
        ...req.body,
        userId: req.user!.userId
      });

      // Check if entry exists for current week
      const existingEntry = await storage.getCurrentWeekProgressEntry(req.user!.userId);

      let entry;
      if (existingEntry) {
        // Update existing entry
        console.log('📊 [WeightProgress] Updating existing entry for week:', existingEntry.weekNumber);
        entry = await storage.updateEnhancedProgressEntry(existingEntry.id, entryData);
      } else {
        // Create new entry
        console.log('📊 [WeightProgress] Creating new progress entry');
        entry = await storage.createEnhancedProgressEntry(entryData);
      }

      console.log('📊 [WeightProgress] Progress entry saved:', entry);

      res.status(201).json(entry);
    } catch (error) {
      console.error('❌ [WeightProgress] Error saving progress entry:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join('.'),
          allErrors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to save progress entry" });
    }
  });

  // Get latest progress entry
  app.get("/api/weight-progress/latest", authenticateToken, async (req, res) => {
    try {
      const entry = await storage.getLatestProgressEntry(req.user!.userId);
      res.json(entry);
    } catch (error) {
      console.error('Error fetching latest progress entry:', error);
      res.status(500).json({ message: "Failed to fetch latest progress entry" });
    }
  });

  // Get progress trends
  app.get("/api/weight-progress/trends", authenticateToken, async (req, res) => {
    try {
      const trends = await storage.getProgressTrends(req.user!.userId);
      res.json(trends);
    } catch (error) {
      console.error('Error fetching progress trends:', error);
      res.status(500).json({ message: "Failed to fetch progress trends" });
    }
  });

  // Get progress summary for AI trainer
  app.get("/api/weight-progress/summary", authenticateToken, async (req, res) => {
    try {
      const [goal, latestEntry, trends, entries] = await Promise.all([
        storage.getActiveWeightGoal(req.user!.userId),
        storage.getLatestProgressEntry(req.user!.userId),
        storage.getProgressTrends(req.user!.userId),
        storage.getEnhancedProgressEntries(req.user!.userId, 4) // Last 4 weeks
      ]);

      const summary = {
        goal,
        current: latestEntry,
        trends,
        recentEntries: entries,
        progress: goal && latestEntry ? {
          startWeight: goal.startWeight,
          currentWeight: latestEntry.weight,
          targetWeight: goal.targetWeight,
          totalChange: latestEntry.weight ? latestEntry.weight - goal.startWeight : 0,
          remainingChange: goal.targetWeight && latestEntry.weight ? goal.targetWeight - latestEntry.weight : 0,
          progressPercentage: goal.targetWeight && latestEntry.weight ?
            Math.min(Math.abs(latestEntry.weight - goal.startWeight) / Math.abs(goal.targetWeight - goal.startWeight) * 100, 100) : 0
        } : null
      };

      res.json(summary);
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      res.status(500).json({ message: "Failed to fetch progress summary" });
    }
  });
}
