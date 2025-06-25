-- 🧠 Migración: Sistema de Feedback Inteligente Consolidado
-- Fecha: 2025-06-18
-- Descripción: Crear tablas para consolidar y organizar feedback de usuarios

-- 1. Tabla para almacenar todos los tipos de feedback raw
CREATE TABLE IF NOT EXISTS "feedback_raw_data" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "feedback_type" VARCHAR(50) NOT NULL, -- 'workout_feedback', 'first_day', 'rejection', 'completion'
  "raw_data" JSONB NOT NULL, -- Todos los datos originales del formulario
  "context" JSONB DEFAULT '{}', -- {dayOfWeek, timeOfDay, energyLevel, workoutId, etc.}
  "processed" BOOLEAN DEFAULT FALSE,
  "processing_errors" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "expires_at" TIMESTAMP DEFAULT NOW() + INTERVAL '8 weeks' -- Retención mínima 8 semanas
);

-- 2. Tabla de perfil consolidado de feedback del usuario
CREATE TABLE IF NOT EXISTS "user_feedback_profile" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE,
  "consolidated_preferences" JSONB NOT NULL, -- Perfil consolidado resultado del procesamiento
  "last_updated" TIMESTAMP DEFAULT NOW(),
  "data_sources" JSONB DEFAULT '[]', -- Qué fuentes se usaron para consolidar
  "confidence_score" DECIMAL(3,2) DEFAULT 0.50, -- Confiabilidad del perfil (0.00-1.00)
  "total_feedback_count" INTEGER DEFAULT 0,
  "last_feedback_date" TIMESTAMP,
  "version" INTEGER DEFAULT 1,
  "previous_version_id" INTEGER REFERENCES "user_feedback_profile"("id"),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- 3. Tabla de decisiones y adaptaciones de la IA
CREATE TABLE IF NOT EXISTS "ai_decisions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "decision_type" VARCHAR(50) NOT NULL, -- 'routine_change', 'adaptation', 'progression', 'mesocycle_change'
  "decision_data" JSONB NOT NULL, -- Detalles específicos de la decisión
  "reasoning" JSONB NOT NULL, -- Por qué la IA tomó esta decisión
  "trigger_data" JSONB DEFAULT '{}', -- Qué datos causaron esta decisión
  "confidence_level" DECIMAL(3,2) DEFAULT 0.50, -- Seguridad de la IA en la decisión
  "implemented_at" TIMESTAMP DEFAULT NOW(),
  "user_response" JSONB, -- Cómo respondió el usuario a esta decisión
  "effectiveness" DECIMAL(3,2), -- Efectividad medida después
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 4. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS "idx_feedback_raw_data_user_id" ON "feedback_raw_data"("user_id");
CREATE INDEX IF NOT EXISTS "idx_feedback_raw_data_type" ON "feedback_raw_data"("feedback_type");
CREATE INDEX IF NOT EXISTS "idx_feedback_raw_data_created_at" ON "feedback_raw_data"("created_at");
CREATE INDEX IF NOT EXISTS "idx_feedback_raw_data_expires_at" ON "feedback_raw_data"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_feedback_raw_data_processed" ON "feedback_raw_data"("processed");

CREATE INDEX IF NOT EXISTS "idx_user_feedback_profile_user_id" ON "user_feedback_profile"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_feedback_profile_last_updated" ON "user_feedback_profile"("last_updated");
CREATE INDEX IF NOT EXISTS "idx_user_feedback_profile_confidence" ON "user_feedback_profile"("confidence_score");

CREATE INDEX IF NOT EXISTS "idx_ai_decisions_user_id" ON "ai_decisions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_decisions_type" ON "ai_decisions"("decision_type");
CREATE INDEX IF NOT EXISTS "idx_ai_decisions_implemented_at" ON "ai_decisions"("implemented_at");

-- 5. Función para limpiar datos expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_feedback()
RETURNS void AS $$
BEGIN
  DELETE FROM feedback_raw_data 
  WHERE expires_at < NOW() AND processed = TRUE;
  
  -- Log de limpieza
  INSERT INTO ai_decisions (user_id, decision_type, decision_data, reasoning)
  SELECT 
    0 as user_id, -- Sistema
    'data_cleanup' as decision_type,
    jsonb_build_object('deleted_count', ROW_COUNT) as decision_data,
    jsonb_build_object('reason', 'Automatic cleanup of expired feedback data') as reasoning;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar timestamp de user_feedback_profile
CREATE OR REPLACE FUNCTION update_feedback_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_profile_timestamp
  BEFORE UPDATE ON user_feedback_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_profile_timestamp();

-- 7. Comentarios para documentación
COMMENT ON TABLE feedback_raw_data IS 'Almacena todos los tipos de feedback raw del usuario con retención de 8 semanas mínimo';
COMMENT ON TABLE user_feedback_profile IS 'Perfil consolidado de preferencias del usuario procesado inteligentemente';
COMMENT ON TABLE ai_decisions IS 'Registro de todas las decisiones tomadas por la IA y su efectividad';

COMMENT ON COLUMN feedback_raw_data.feedback_type IS 'Tipo: workout_feedback, first_day, rejection, completion';
COMMENT ON COLUMN feedback_raw_data.expires_at IS 'Datos se mantienen mínimo 8 semanas para análisis de IA';
COMMENT ON COLUMN user_feedback_profile.confidence_score IS 'Confiabilidad del perfil consolidado (0.00-1.00)';
COMMENT ON COLUMN ai_decisions.effectiveness IS 'Efectividad de la decisión medida posteriormente (0.00-1.00)';
