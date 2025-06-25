# 🔧 Sistema de Peso Inteligente - Documentación Técnica

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: React + TypeScript + TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **IA/ML**: Algoritmos personalizados en TypeScript

### Estructura de Archivos
```
├── client/src/
│   ├── components/
│   │   ├── WeightSelectionModal.tsx
│   │   ├── SetFeedbackModal.tsx
│   │   └── WeightSystemTester.tsx
│   ├── hooks/
│   │   └── useWeightSuggestions.ts
│   └── pages/
├── server/
│   ├── services/
│   │   ├── weightSuggestionService.ts
│   │   └── aiLearningService.ts
│   ├── routes/
│   │   └── weightSuggestions.ts
│   ├── scripts/
│   │   ├── testWeightSystem.ts
│   │   └── initWeightData.ts
│   └── supabaseStorage.ts
└── shared/
    └── schema.ts
```

## 🗄️ Esquema de Base de Datos

### Tabla: `ai_weight_suggestions`
```sql
CREATE TABLE ai_weight_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  suggested_weight DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  based_on_sessions INTEGER DEFAULT 0,
  last_used_weight DECIMAL(5,2),
  progression_trend VARCHAR(20) DEFAULT 'stable',
  target_rpe_range VARCHAR(10) DEFAULT '6-8',
  muscle_group VARCHAR(50),
  exercise_type VARCHAR(20),
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_name)
);
```

### Tabla: `exercise_weight_history`
```sql
CREATE TABLE exercise_weight_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  suggested_weight DECIMAL(5,2),
  actual_weight DECIMAL(5,2) NOT NULL,
  weight_feedback VARCHAR(20),
  rpe_achieved INTEGER,
  reps_completed INTEGER,
  sets_completed INTEGER,
  session_id VARCHAR(255),
  workout_date DATE DEFAULT CURRENT_DATE,
  progression_percentage DECIMAL(5,2),
  ai_confidence_score DECIMAL(3,2),
  user_override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `exercise_set_feedback`
```sql
CREATE TABLE exercise_set_feedback (
  id SERIAL PRIMARY KEY,
  exercise_log_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  set_rpe INTEGER,
  weight_feeling VARCHAR(20),
  completed_as_planned BOOLEAN DEFAULT TRUE,
  actual_reps INTEGER,
  target_reps INTEGER,
  rest_time_seconds INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `rest_time_patterns`
```sql
CREATE TABLE rest_time_patterns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  muscle_group VARCHAR(50),
  recommended_rest_seconds INTEGER,
  actual_rest_seconds INTEGER NOT NULL,
  next_set_performance VARCHAR(20),
  fatigue_level VARCHAR(20),
  session_id VARCHAR(255),
  set_number INTEGER,
  workout_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### GET `/api/weight-suggestions/:exerciseName`
Obtiene sugerencia de peso para un ejercicio específico.

**Respuesta**:
```json
{
  "success": true,
  "suggestion": {
    "suggestedWeight": 62.5,
    "confidenceScore": 0.85,
    "lastUsedWeight": 60,
    "progressionTrend": "increasing",
    "basedOnSessions": 8,
    "targetRpeRange": "6-8",
    "muscleGroup": "Pecho",
    "exerciseType": "compound"
  }
}
```

### POST `/api/weight-suggestions/record-usage`
Registra el peso usado por el usuario.

**Payload**:
```json
{
  "exerciseName": "Press de Banca",
  "suggestedWeight": 60,
  "actualWeight": 62.5,
  "weightFeedback": "perfect",
  "rpeAchieved": 7,
  "repsCompleted": 8,
  "setsCompleted": 3,
  "sessionId": "session-123"
}
```

### POST `/api/weight-suggestions/set-feedback`
Registra feedback detallado por set.

**Payload**:
```json
{
  "exerciseLogId": 123,
  "setNumber": 1,
  "setRpe": 7,
  "weightFeeling": "perfect",
  "completedAsPlanned": true,
  "actualReps": 8,
  "targetReps": 8,
  "restTimeSeconds": 90
}
```

### POST `/api/weight-suggestions/rest-pattern`
Registra patrón de tiempo de descanso.

**Payload**:
```json
{
  "exerciseName": "Press de Banca",
  "muscleGroup": "Pecho",
  "recommendedRestSeconds": 120,
  "actualRestSeconds": 135,
  "nextSetPerformance": "good",
  "fatigueLevel": "moderate",
  "sessionId": "session-123",
  "setNumber": 1
}
```

### POST `/api/weight-suggestions/process-ai-learning`
Procesa datos de entrenamiento para mejorar sugerencias de IA.

**Respuesta**:
```json
{
  "success": true,
  "message": "AI learning processed successfully"
}
```

## 🧠 Algoritmo de IA

### Clase: `AILearningService`

#### Método: `processWeightLearningData(userId: number)`
Procesa todos los datos de peso de un usuario para generar nuevas sugerencias.

**Flujo**:
1. Obtener ejercicios únicos del usuario
2. Para cada ejercicio:
   - Recopilar historial de peso (últimas 4 semanas)
   - Obtener feedback de sets relacionado
   - Generar nueva recomendación
   - Actualizar sugerencia en base de datos

#### Método: `generateWeightRecommendation(weightHistory, setFeedback)`
Genera recomendación de peso usando algoritmo de aprendizaje.

**Factores considerados**:
- Tendencia de progresión (últimas 5 vs. 5 anteriores sesiones)
- RPE promedio (objetivo: 6-8)
- Feedback de peso (too_light/perfect/too_heavy)
- Consistencia en pesos usados
- Cantidad de datos disponibles

**Lógica de ajuste**:
```typescript
if (avgRpe < 6 || tooLightCount > perfectCount) {
  // Incrementar 5-7.5%
  newWeight = avgRecentWeight * (1 + increment);
} else if (avgRpe > 9 || tooHeavyCount > perfectCount) {
  // Reducir 5-7.5%
  newWeight = avgRecentWeight * (1 - decrement);
} else if (avgRpe >= 6 && avgRpe <= 8 && perfectCount >= others) {
  // Progresión gradual +2.5%
  newWeight = avgRecentWeight * 1.025;
}
```

## 🎣 Hook: `useWeightSuggestions`

### Funciones Principales
- `getWeightSuggestion(exerciseName)`: Obtiene sugerencia con cache
- `recordWeightUsage(data)`: Registra uso de peso
- `recordSetFeedback(data)`: Registra feedback de set
- `processAILearning()`: Procesa aprendizaje de IA

### Queries con Cache
- `useWeightSuggestionQuery`: Cache de 10 minutos
- `useWeightHistory`: Cache de 5 minutos
- Invalidación automática después de mutaciones

### Utilidades
- `getProgressionTrend(history)`: Analiza tendencia de progresión
- `getAverageRPE(history)`: Calcula RPE promedio
- `generateSmartRecommendation()`: Genera recomendación inteligente

## 🧪 Testing

### Script: `testWeightSystem.ts`
Ejecuta suite completa de tests para validar el sistema.

**Tests incluidos**:
1. Operaciones de base de datos
2. Sugerencias de peso
3. Captura de datos
4. Aprendizaje de IA
5. Integración completa

**Ejecución**:
```bash
cd server
npx ts-node scripts/testWeightSystem.ts
```

### Script: `initWeightData.ts`
Inicializa datos de prueba para el sistema.

**Datos creados**:
- Sugerencias iniciales para 15 ejercicios
- Historial de progresión realista
- Feedback de sets de ejemplo
- Patrones de descanso

## 🔧 Configuración de Desarrollo

### Variables de Entorno
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Testing
TEST_USER_ID=17
```

### Instalación
```bash
# Instalar dependencias
npm install

# Crear tablas en Supabase
npm run db:migrate

# Inicializar datos de prueba
npm run init:weight-data

# Ejecutar tests
npm run test:weight-system
```

## 📊 Monitoreo y Métricas

### Logs Importantes
- `🏋️‍♂️ [API] Getting weight suggestion`: Solicitud de sugerencia
- `📊 [API] Recording weight usage`: Registro de uso de peso
- `🤖 [AI Learning] Processing data`: Procesamiento de IA
- `✅ [AI Learning] Updated recommendation`: Sugerencia actualizada

### Métricas de Performance
- Tiempo de respuesta de sugerencias: < 500ms
- Tasa de éxito de procesamiento de IA: > 95%
- Precisión de sugerencias: Mejora continua

### Alertas Recomendadas
- Error rate > 5% en endpoints de peso
- Tiempo de procesamiento de IA > 30 segundos
- Falta de datos de entrenamiento por > 7 días

## 🚀 Deployment

### Checklist Pre-Deploy
- [ ] Tests pasando al 100%
- [ ] Migraciones de BD aplicadas
- [ ] Variables de entorno configuradas
- [ ] Datos iniciales cargados
- [ ] Monitoreo configurado

### Rollback Plan
1. Revertir cambios de BD si es necesario
2. Restaurar versión anterior del código
3. Verificar que sugerencias existentes siguen funcionando
4. Notificar a usuarios si hay impacto

---

## 📞 Contacto Técnico

Para consultas técnicas o reportar bugs:
- **Issues**: GitHub repository
- **Slack**: #fitness-ai-team
- **Email**: dev-team@fitnessapp.com

**Versión**: 1.0  
**Última actualización**: Diciembre 2024
