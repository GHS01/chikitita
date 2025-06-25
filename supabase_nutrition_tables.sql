-- SQL para crear las tablas del sistema nutricional en Supabase

-- 1. Actualizar tabla nutrition_preferences con nuevos campos
DROP TABLE IF EXISTS nutrition_preferences CASCADE;

CREATE TABLE nutrition_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Diet preferences
    diet_type TEXT, -- 'omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'
    custom_diet_types JSONB DEFAULT '[]', -- Custom diet types added by user
    food_habits_rating INTEGER DEFAULT 3, -- 1-5 scale
    custom_food_habits JSONB DEFAULT '[]', -- Custom food habits
    favorite_foods JSONB DEFAULT '[]', -- User's favorite foods
    
    -- Restrictions and allergies
    allergies JSONB DEFAULT '[]', -- ['nuts', 'seafood', 'dairy', 'gluten', 'eggs', 'soy']
    custom_allergies JSONB DEFAULT '[]', -- Custom allergies
    medical_restrictions JSONB DEFAULT '[]', -- ['diabetes', 'hypertension', 'high_cholesterol']
    custom_medical_restrictions JSONB DEFAULT '[]', -- Custom medical restrictions
    
    -- Caloric and hydration goals
    daily_calorie_goal INTEGER,
    macro_distribution JSONB, -- {protein: 25, carbs: 45, fat: 30}
    daily_water_goal_ml INTEGER DEFAULT 2000, -- ml
    meal_frequency INTEGER DEFAULT 3, -- comidas por día
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one preference per user
    CONSTRAINT nutrition_preferences_user_unique UNIQUE (user_id)
);

-- 2. Crear tabla daily_meal_plans
CREATE TABLE IF NOT EXISTS daily_meal_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date TEXT NOT NULL, -- YYYY-MM-DD format
    total_calories INTEGER NOT NULL,
    meals JSONB NOT NULL, -- Array of meal objects with detailed ingredients
    macro_breakdown JSONB, -- {protein: X, carbs: Y, fat: Z}
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one plan per user per date
    CONSTRAINT daily_meal_plans_user_date_unique UNIQUE (user_id, plan_date)
);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_nutrition_preferences_user_id ON nutrition_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_meal_plans_user_id ON daily_meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_meal_plans_date ON daily_meal_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_daily_meal_plans_user_date ON daily_meal_plans(user_id, plan_date);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear triggers para updated_at
DROP TRIGGER IF EXISTS update_nutrition_preferences_updated_at ON nutrition_preferences;
CREATE TRIGGER update_nutrition_preferences_updated_at
    BEFORE UPDATE ON nutrition_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_meal_plans_updated_at ON daily_meal_plans;
CREATE TRIGGER update_daily_meal_plans_updated_at
    BEFORE UPDATE ON daily_meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insertar datos de ejemplo (opcional)
-- INSERT INTO nutrition_preferences (user_id, diet_type, daily_calorie_goal, macro_distribution)
-- VALUES (1, 'omnivore', 2200, '{"protein": 30, "carbs": 40, "fat": 30}');

-- 7. Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('nutrition_preferences', 'daily_meal_plans')
ORDER BY table_name, ordinal_position;
