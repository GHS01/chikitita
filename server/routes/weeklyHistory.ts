import { Router } from 'express';
import { storage } from '../storageNew';
import { authenticateToken } from '../middleware/auth';
import { insertWeeklyWorkoutHistorySchema, insertWeeklySummarySchema } from '@shared/schema';
import { z } from 'zod';
// 🕐 SISTEMA HORARIO CENTRALIZADO (SERVER)
import { now, getCurrentDate } from '../utils/timeSystem';

const router = Router();

// Helper function to get Monday of the week
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate days to subtract to get to Monday
  // If today is Sunday (0), go back 6 days
  // If today is Monday (1), go back 0 days
  // If today is Tuesday (2), go back 1 day
  // etc.
  const daysToSubtract = day === 0 ? 6 : day - 1;

  d.setDate(d.getDate() - daysToSubtract);
  const result = d.toISOString().split('T')[0];

  console.log(`🔥 [getMonday] Input date: ${date.toISOString()}, day: ${day}, daysToSubtract: ${daysToSubtract}, result: ${result}`);
  return result;
}

// Helper function to get day name
function getDayName(date: string): string {
  const d = new Date(date);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[d.getDay()];
}

// POST /api/weekly-history - Log a workout exercise
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 [WeeklyHistory] POST /api/weekly-history called');
    console.log('🔥 [WeeklyHistory] Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔥 [WeeklyHistory] User:', req.user);

    const userId = req.user?.id;
    if (!userId) {
      console.error('❌ [WeeklyHistory] User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('🔥 [WeeklyHistory] Validating data with schema...');
    const validatedData = insertWeeklyWorkoutHistorySchema.parse(req.body);
    console.log('✅ [WeeklyHistory] Data validated:', JSON.stringify(validatedData, null, 2));

    // Calculate week start date (Monday)
    const workoutDate = validatedData.workoutDate;
    const weekStartDate = getMonday(now()); // 🕐 SISTEMA CENTRALIZADO
    console.log('🔥 [WeeklyHistory] Week start date calculated:', weekStartDate);

    const historyEntry = await storage.createWorkoutHistoryEntry({
      ...validatedData,
      userId,
      weekStartDate,
    });
    console.log('✅ [WeeklyHistory] History entry created:', JSON.stringify(historyEntry, null, 2));

    // Update weekly summary
    await updateWeeklySummary(userId, weekStartDate);
    console.log('✅ [WeeklyHistory] Weekly summary updated');

    res.status(201).json(historyEntry);
  } catch (error) {
    console.error('❌ [WeeklyHistory] Error logging workout history:', error);
    if (error instanceof z.ZodError) {
      console.error('❌ [WeeklyHistory] Validation errors:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to log workout history' });
  }
});

// GET /api/weekly-history/current - Get current week data (MUST BE BEFORE /:weekStartDate)
router.get('/current', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 [WeeklyHistory] GET /api/weekly-history/current called');
    const userId = req.user?.id;
    if (!userId) {
      console.error('❌ [WeeklyHistory] User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentWeekStart = getMonday(now()); // 🕐 SISTEMA CENTRALIZADO
    console.log('🔥 [WeeklyHistory] Current week start calculated:', currentWeekStart);
    console.log('🔥 [WeeklyHistory] User ID:', userId);

    const [history, summaries] = await Promise.all([
      storage.getWeeklyWorkoutHistory(userId, currentWeekStart),
      storage.getWeeklySummaries(userId, 1)
    ]);

    console.log('🔥 [WeeklyHistory] History fetched:', history.length, 'entries');
    console.log('🔥 [WeeklyHistory] Summaries fetched:', summaries.length, 'entries');
    console.log('🔥 [WeeklyHistory] History data:', JSON.stringify(history, null, 2));
    console.log('🔥 [WeeklyHistory] Summaries data:', JSON.stringify(summaries, null, 2));

    const currentSummary = summaries.find(s => s.weekStartDate === currentWeekStart);
    console.log('🔥 [WeeklyHistory] Current summary found:', !!currentSummary);

    const response = {
      weekStartDate: currentWeekStart,
      history,
      summary: currentSummary || {
        weekStartDate: currentWeekStart,
        totalWorkouts: 0,
        totalDurationMinutes: 0,
        uniqueExercises: [],
        workoutDays: [],
        exerciseTypes: []
      }
    };

    console.log('🔥 [WeeklyHistory] Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ [WeeklyHistory] Error fetching current week data:', error);
    res.status(500).json({ error: 'Failed to fetch current week data' });
  }
});

// DELETE /api/weekly-history/cleanup - Clean old data (admin/maintenance)
router.delete('/cleanup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const weeksToKeep = parseInt(req.query.weeks as string) || 4;

    await storage.cleanOldWeeklyData(userId, weeksToKeep);

    res.json({ message: `Cleaned old data, keeping last ${weeksToKeep} weeks` });
  } catch (error) {
    console.error('Error cleaning old data:', error);
    res.status(500).json({ error: 'Failed to clean old data' });
  }
});

// Helper function to update weekly summary
async function updateWeeklySummary(userId: number, weekStartDate: string) {
  try {
    // Get all workout history for this week
    const weekHistory = await storage.getWeeklyWorkoutHistory(userId, weekStartDate);

    if (weekHistory.length === 0) {
      return;
    }

    // Calculate summary data
    const totalWorkouts = new Set(weekHistory.map(h => h.workoutDate)).size;
    const totalDurationMinutes = weekHistory.reduce((sum, h) => sum + h.durationMinutes, 0);
    const uniqueExercises = [...new Set(weekHistory.map(h => h.exerciseName))];
    const workoutDays = [...new Set(weekHistory.map(h => getDayName(h.workoutDate)))];
    const exerciseTypes = [...new Set(weekHistory.map(h => h.exerciseType).filter(Boolean))];

    // Create or update summary
    await storage.createOrUpdateWeeklySummary({
      weekStartDate,
      totalWorkouts,
      totalDurationMinutes,
      uniqueExercises,
      workoutDays,
      exerciseTypes,
      userId
    });
  } catch (error) {
    console.error('Error updating weekly summary:', error);
  }
}

// GET /api/weekly-history/summaries/:limit? - Get weekly summaries
router.get('/summaries/:limit?', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 [WeeklyHistory] GET /api/weekly-history/summaries called');
    const userId = req.user?.id;
    if (!userId) {
      console.error('❌ [WeeklyHistory] User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.params.limit || '4');
    console.log('🔥 [WeeklyHistory] Limit:', limit);
    if (limit < 1 || limit > 12) {
      return res.status(400).json({ error: 'Limit must be between 1 and 12' });
    }

    const summaries = await storage.getWeeklySummaries(userId, limit);
    console.log('🔥 [WeeklyHistory] Summaries fetched:', summaries.length, 'entries');
    console.log('🔥 [WeeklyHistory] Summaries data:', JSON.stringify(summaries, null, 2));
    res.json(summaries);
  } catch (error) {
    console.error('❌ [WeeklyHistory] Error fetching weekly summaries:', error);
    res.status(500).json({ error: 'Failed to fetch weekly summaries' });
  }
});

// GET /api/weekly-history/:weekStartDate - Get workout history for a specific week
router.get('/:weekStartDate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { weekStartDate } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const history = await storage.getWeeklyWorkoutHistory(userId, weekStartDate);
    res.json(history);
  } catch (error) {
    console.error('Error fetching weekly history:', error);
    res.status(500).json({ error: 'Failed to fetch weekly history' });
  }
});

export default router;
