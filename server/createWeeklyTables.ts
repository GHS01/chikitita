import { supabase } from './supabase';

async function createWeeklyHistoryTables() {
  console.log('🔧 Creating weekly history tables...');

  try {
    // Create weekly_workout_history table
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS weekly_workout_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          week_start_date TEXT NOT NULL,
          workout_date TEXT NOT NULL,
          exercise_name TEXT NOT NULL,
          duration_minutes INTEGER NOT NULL DEFAULT 0,
          exercise_type TEXT,
          workout_plan_id INTEGER,
          session_id INTEGER,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_weekly_workout_history_user_id ON weekly_workout_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_weekly_workout_history_week_start ON weekly_workout_history(week_start_date);
      `
    });

    if (historyError) {
      console.error('❌ Error creating weekly_workout_history table:', historyError);
    } else {
      console.log('✅ weekly_workout_history table created successfully');
    }

    // Create weekly_summaries table
    const { error: summaryError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS weekly_summaries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          week_start_date TEXT NOT NULL,
          total_workouts INTEGER NOT NULL DEFAULT 0,
          total_duration_minutes INTEGER NOT NULL DEFAULT 0,
          unique_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
          workout_days JSONB NOT NULL DEFAULT '[]'::jsonb,
          exercise_types JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, week_start_date)
        );
        
        CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);
        CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON weekly_summaries(week_start_date);
      `
    });

    if (summaryError) {
      console.error('❌ Error creating weekly_summaries table:', summaryError);
    } else {
      console.log('✅ weekly_summaries table created successfully');
    }

    console.log('🎉 Weekly history tables setup completed!');
    return true;

  } catch (error) {
    console.error('❌ Error creating weekly history tables:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createWeeklyHistoryTables().then(success => {
    if (success) {
      console.log('✅ Tables created successfully');
      process.exit(0);
    } else {
      console.error('❌ Failed to create tables');
      process.exit(1);
    }
  });
}

export { createWeeklyHistoryTables };
