-- SQL para crear las tablas del sistema de rutinas semanales en Supabase

-- 1. Crear tabla weekly_workout_history
CREATE TABLE IF NOT EXISTS weekly_workout_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    workout_date DATE NOT NULL,
    exercise_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    exercise_type TEXT,
    workout_plan_id INTEGER REFERENCES workout_plans(id) ON DELETE SET NULL,
    session_id INTEGER REFERENCES workout_sessions(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para mejorar rendimiento
    CONSTRAINT weekly_workout_history_user_week_idx UNIQUE (user_id, week_start_date, workout_date, exercise_name)
);

-- 2. Crear tabla weekly_summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_workouts INTEGER NOT NULL DEFAULT 0,
    total_duration_minutes INTEGER NOT NULL DEFAULT 0,
    unique_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    workout_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    exercise_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint único por usuario y semana
    CONSTRAINT weekly_summaries_user_week_unique UNIQUE (user_id, week_start_date)
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_weekly_workout_history_user_id ON weekly_workout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_workout_history_week_start ON weekly_workout_history(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_workout_history_workout_date ON weekly_workout_history(workout_date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON weekly_summaries(week_start_date);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para weekly_summaries
DROP TRIGGER IF EXISTS update_weekly_summaries_updated_at ON weekly_summaries;
CREATE TRIGGER update_weekly_summaries_updated_at
    BEFORE UPDATE ON weekly_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE weekly_workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para weekly_workout_history
DROP POLICY IF EXISTS "Users can view their own workout history" ON weekly_workout_history;
CREATE POLICY "Users can view their own workout history" ON weekly_workout_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own workout history" ON weekly_workout_history;
CREATE POLICY "Users can insert their own workout history" ON weekly_workout_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own workout history" ON weekly_workout_history;
CREATE POLICY "Users can update their own workout history" ON weekly_workout_history
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own workout history" ON weekly_workout_history;
CREATE POLICY "Users can delete their own workout history" ON weekly_workout_history
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 8. Crear políticas RLS para weekly_summaries
DROP POLICY IF EXISTS "Users can view their own weekly summaries" ON weekly_summaries;
CREATE POLICY "Users can view their own weekly summaries" ON weekly_summaries
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own weekly summaries" ON weekly_summaries;
CREATE POLICY "Users can insert their own weekly summaries" ON weekly_summaries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own weekly summaries" ON weekly_summaries;
CREATE POLICY "Users can update their own weekly summaries" ON weekly_summaries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own weekly summaries" ON weekly_summaries;
CREATE POLICY "Users can delete their own weekly summaries" ON weekly_summaries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 9. Comentarios para documentación
COMMENT ON TABLE weekly_workout_history IS 'Registro detallado de ejercicios completados por semana';
COMMENT ON TABLE weekly_summaries IS 'Resúmenes semanales con estadísticas agregadas de entrenamientos';
COMMENT ON COLUMN weekly_workout_history.week_start_date IS 'Fecha del lunes de la semana (para agrupación)';
COMMENT ON COLUMN weekly_workout_history.workout_date IS 'Fecha específica del entrenamiento';
COMMENT ON COLUMN weekly_summaries.unique_exercises IS 'Array JSON de nombres de ejercicios únicos';
COMMENT ON COLUMN weekly_summaries.workout_days IS 'Array JSON de días de la semana con entrenamientos';
COMMENT ON COLUMN weekly_summaries.exercise_types IS 'Array JSON de tipos de ejercicio realizados';

-- 10. Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('weekly_workout_history', 'weekly_summaries')
ORDER BY table_name, ordinal_position;
