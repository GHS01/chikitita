import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration
const supabaseUrl = 'https://iqunjzbbfcffnkrualua.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdW5qemJiZmNmZm5rcnVhbHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODExNTEwNywiZXhwIjoyMDYzNjkxMTA3fQ.THbohHs5dljh5jIm3NHKiXkwJ_Cv3ncn72hRUgWBQjI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createWeeklyTables() {
  console.log('🔧 Creating weekly history tables in Supabase...');

  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return false;
    }

    console.log('✅ Supabase connection successful');

    // Create weekly_workout_history table
    console.log('📝 Creating weekly_workout_history table...');
    
    const createHistoryTableSQL = `
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
    `;

    // Since we can't use rpc('exec_sql'), let's try to insert a test record to see if table exists
    try {
      const { error: insertError } = await supabase
        .from('weekly_workout_history')
        .insert({
          user_id: 999999, // Test user ID that doesn't exist
          week_start_date: '2025-01-01',
          workout_date: '2025-01-01',
          exercise_name: 'test',
          duration_minutes: 1
        });

      if (insertError && insertError.message.includes('relation "weekly_workout_history" does not exist')) {
        console.log('❌ Table weekly_workout_history does not exist');
        console.log('📋 Please create it manually in Supabase Dashboard with this SQL:');
        console.log(createHistoryTableSQL);
      } else {
        console.log('✅ Table weekly_workout_history exists');
        // Delete the test record if it was inserted
        await supabase
          .from('weekly_workout_history')
          .delete()
          .eq('user_id', 999999);
      }
    } catch (error) {
      console.log('❌ Table weekly_workout_history does not exist');
    }

    // Create weekly_summaries table
    console.log('📝 Creating weekly_summaries table...');
    
    const createSummaryTableSQL = `
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
    `;

    try {
      const { error: insertError } = await supabase
        .from('weekly_summaries')
        .insert({
          user_id: 999999,
          week_start_date: '2025-01-01',
          total_workouts: 0,
          total_duration_minutes: 0,
          unique_exercises: [],
          workout_days: [],
          exercise_types: []
        });

      if (insertError && insertError.message.includes('relation "weekly_summaries" does not exist')) {
        console.log('❌ Table weekly_summaries does not exist');
        console.log('📋 Please create it manually in Supabase Dashboard with this SQL:');
        console.log(createSummaryTableSQL);
      } else {
        console.log('✅ Table weekly_summaries exists');
        // Delete the test record if it was inserted
        await supabase
          .from('weekly_summaries')
          .delete()
          .eq('user_id', 999999);
      }
    } catch (error) {
      console.log('❌ Table weekly_summaries does not exist');
    }

    console.log('\n🎯 MANUAL SETUP REQUIRED:');
    console.log('Go to Supabase Dashboard > SQL Editor and run these commands:');
    console.log('\n-- 1. Create weekly_workout_history table:');
    console.log(createHistoryTableSQL);
    console.log('\n-- 2. Create weekly_summaries table:');
    console.log(createSummaryTableSQL);
    console.log('\n-- 3. Create indexes:');
    console.log('CREATE INDEX IF NOT EXISTS idx_weekly_workout_history_user_id ON weekly_workout_history(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);');

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

createWeeklyTables().then(success => {
  if (success) {
    console.log('\n✅ Setup check completed');
  } else {
    console.error('\n❌ Setup check failed');
  }
  process.exit(0);
});
