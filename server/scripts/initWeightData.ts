/**
 * 🚀 Script de Inicialización para Sistema de Peso Inteligente
 * Crea datos iniciales y sugerencias base para el usuario
 */

import { supabaseStorage } from '../supabaseStorage';
import { weightSuggestionService } from '../services/weightSuggestionService';

const USER_ID = 17; // Usuario principal

interface ExerciseData {
  name: string;
  muscleGroup: string;
  exerciseType: 'compound' | 'isolation';
  baseWeight: number;
  rpeRange: string;
}

const INITIAL_EXERCISES: ExerciseData[] = [
  // Ejercicios de Pecho
  { name: 'Press de Banca', muscleGroup: 'Pecho', exerciseType: 'compound', baseWeight: 60, rpeRange: '6-8' },
  { name: 'Press Inclinado', muscleGroup: 'Pecho', exerciseType: 'compound', baseWeight: 50, rpeRange: '6-8' },
  { name: 'Aperturas', muscleGroup: 'Pecho', exerciseType: 'isolation', baseWeight: 15, rpeRange: '7-9' },
  
  // Ejercicios de Espalda
  { name: 'Remo con Barra', muscleGroup: 'Espalda', exerciseType: 'compound', baseWeight: 50, rpeRange: '6-8' },
  { name: 'Jalón al Pecho', muscleGroup: 'Espalda', exerciseType: 'compound', baseWeight: 45, rpeRange: '6-8' },
  { name: 'Remo con Mancuerna', muscleGroup: 'Espalda', exerciseType: 'isolation', baseWeight: 20, rpeRange: '7-9' },
  
  // Ejercicios de Piernas
  { name: 'Sentadilla', muscleGroup: 'Piernas', exerciseType: 'compound', baseWeight: 70, rpeRange: '6-8' },
  { name: 'Prensa de Piernas', muscleGroup: 'Piernas', exerciseType: 'compound', baseWeight: 100, rpeRange: '6-8' },
  { name: 'Extensión de Cuádriceps', muscleGroup: 'Piernas', exerciseType: 'isolation', baseWeight: 30, rpeRange: '7-9' },
  
  // Ejercicios de Hombros
  { name: 'Press Militar', muscleGroup: 'Hombros', exerciseType: 'compound', baseWeight: 40, rpeRange: '6-8' },
  { name: 'Elevaciones Laterales', muscleGroup: 'Hombros', exerciseType: 'isolation', baseWeight: 10, rpeRange: '7-9' },
  { name: 'Elevaciones Posteriores', muscleGroup: 'Hombros', exerciseType: 'isolation', baseWeight: 8, rpeRange: '7-9' },
  
  // Ejercicios de Brazos
  { name: 'Curl de Bíceps', muscleGroup: 'Bíceps', exerciseType: 'isolation', baseWeight: 15, rpeRange: '7-9' },
  { name: 'Extensión de Tríceps', muscleGroup: 'Tríceps', exerciseType: 'isolation', baseWeight: 12, rpeRange: '7-9' },
  { name: 'Martillo', muscleGroup: 'Bíceps', exerciseType: 'isolation', baseWeight: 12, rpeRange: '7-9' }
];

class WeightDataInitializer {
  
  /**
   * 🚀 Inicializar todos los datos
   */
  async initializeAll(): Promise<void> {
    console.log('🚀 [Init] Starting Weight System Initialization...\n');

    try {
      // Paso 1: Crear sugerencias iniciales de IA
      await this.createInitialSuggestions();
      
      // Paso 2: Crear historial de ejemplo
      await this.createSampleHistory();
      
      // Paso 3: Crear feedback de ejemplo
      await this.createSampleFeedback();
      
      // Paso 4: Crear patrones de descanso de ejemplo
      await this.createSampleRestPatterns();
      
      console.log('\n✅ [Init] Weight System Initialization Complete!');
      
    } catch (error) {
      console.error('❌ [Init] Error during initialization:', error);
    }
  }

  /**
   * 🤖 Crear sugerencias iniciales de IA
   */
  private async createInitialSuggestions(): Promise<void> {
    console.log('🤖 [Init] Creating initial AI weight suggestions...');

    for (const exercise of INITIAL_EXERCISES) {
      try {
        const suggestion = await supabaseStorage.saveAiWeightSuggestion(USER_ID, {
          exerciseName: exercise.name,
          suggestedWeight: exercise.baseWeight,
          confidenceScore: 0.6, // Confianza inicial moderada
          basedOnSessions: 0, // Sin sesiones previas
          progressionTrend: 'stable',
          targetRpeRange: exercise.rpeRange,
          muscleGroup: exercise.muscleGroup,
          exerciseType: exercise.exerciseType,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        });

        console.log(`  ✅ Created suggestion for ${exercise.name}: ${exercise.baseWeight}kg`);
        
      } catch (error) {
        console.error(`  ❌ Error creating suggestion for ${exercise.name}:`, error.message);
      }
    }
  }

  /**
   * 📊 Crear historial de ejemplo
   */
  private async createSampleHistory(): Promise<void> {
    console.log('📊 [Init] Creating sample weight history...');

    // Crear historial para algunos ejercicios principales
    const mainExercises = INITIAL_EXERCISES.slice(0, 5);
    
    for (const exercise of mainExercises) {
      try {
        // Crear 3-5 entradas de historial con progresión
        const entries = this.generateProgressionHistory(exercise);
        
        for (const entry of entries) {
          await supabaseStorage.saveExerciseWeightHistory(USER_ID, {
            exerciseName: exercise.name,
            suggestedWeight: entry.suggestedWeight,
            actualWeight: entry.actualWeight,
            weightFeedback: entry.feedback,
            rpeAchieved: entry.rpe,
            repsCompleted: entry.reps,
            setsCompleted: 3,
            sessionId: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
            workoutDate: entry.date
          });
        }

        console.log(`  ✅ Created history for ${exercise.name}: ${entries.length} entries`);
        
      } catch (error) {
        console.error(`  ❌ Error creating history for ${exercise.name}:`, error.message);
      }
    }
  }

  /**
   * 💪 Crear feedback de ejemplo
   */
  private async createSampleFeedback(): Promise<void> {
    console.log('💪 [Init] Creating sample set feedback...');

    try {
      // Crear algunos feedbacks de ejemplo
      const sampleFeedbacks = [
        { exerciseLogId: 1, setNumber: 1, setRpe: 7, weightFeeling: 'perfect', completedAsPlanned: true, actualReps: 8, targetReps: 8, restTimeSeconds: 90 },
        { exerciseLogId: 2, setNumber: 2, setRpe: 8, weightFeeling: 'perfect', completedAsPlanned: true, actualReps: 7, targetReps: 8, restTimeSeconds: 120 },
        { exerciseLogId: 3, setNumber: 1, setRpe: 6, weightFeeling: 'too_light', completedAsPlanned: true, actualReps: 10, targetReps: 8, restTimeSeconds: 60 },
        { exerciseLogId: 4, setNumber: 3, setRpe: 9, weightFeeling: 'too_heavy', completedAsPlanned: false, actualReps: 5, targetReps: 8, restTimeSeconds: 180 }
      ];

      for (const feedback of sampleFeedbacks) {
        try {
          await supabaseStorage.saveExerciseSetFeedback(USER_ID, {
            ...feedback,
            notes: 'Sample feedback data'
          });
        } catch (error) {
          // Ignorar errores de exercise_log_id no válido
          console.log(`  ⚠️ Skipped feedback for exercise log ${feedback.exerciseLogId} (may not exist)`);
        }
      }

      console.log(`  ✅ Created sample set feedback`);
      
    } catch (error) {
      console.error(`  ❌ Error creating sample feedback:`, error.message);
    }
  }

  /**
   * ⏱️ Crear patrones de descanso de ejemplo
   */
  private async createSampleRestPatterns(): Promise<void> {
    console.log('⏱️ [Init] Creating sample rest patterns...');

    const restPatterns = [
      { exercise: 'Press de Banca', recommended: 120, actual: 135, performance: 'good', fatigue: 'moderate' },
      { exercise: 'Sentadilla', recommended: 180, actual: 200, performance: 'excellent', fatigue: 'low' },
      { exercise: 'Curl de Bíceps', recommended: 60, actual: 45, performance: 'poor', fatigue: 'high' },
      { exercise: 'Press Militar', recommended: 90, actual: 90, performance: 'good', fatigue: 'moderate' }
    ];

    for (const pattern of restPatterns) {
      try {
        const exercise = INITIAL_EXERCISES.find(e => e.name === pattern.exercise);
        if (!exercise) continue;

        await supabaseStorage.saveRestTimePattern(USER_ID, {
          exerciseName: pattern.exercise,
          muscleGroup: exercise.muscleGroup,
          recommendedRestSeconds: pattern.recommended,
          actualRestSeconds: pattern.actual,
          nextSetPerformance: pattern.performance,
          fatigueLevel: pattern.fatigue,
          sessionId: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
          setNumber: 1
        });

        console.log(`  ✅ Created rest pattern for ${pattern.exercise}: ${pattern.actual}s (recommended: ${pattern.recommended}s)`);
        
      } catch (error) {
        console.error(`  ❌ Error creating rest pattern for ${pattern.exercise}:`, error.message);
      }
    }
  }

  /**
   * 📈 Generar historial de progresión realista
   */
  private generateProgressionHistory(exercise: ExerciseData): any[] {
    const entries = [];
    const baseWeight = exercise.baseWeight;
    const dates = this.getLastNDates(5);

    for (let i = 0; i < 5; i++) {
      // Progresión gradual con algo de variabilidad
      const weightProgression = i * 2.5; // +2.5kg por sesión
      const actualWeight = baseWeight + weightProgression + (Math.random() - 0.5) * 2.5;
      
      // RPE y feedback basado en la progresión
      let rpe = 7;
      let feedback: 'too_light' | 'perfect' | 'too_heavy' = 'perfect';
      
      if (i === 0) {
        rpe = 6;
        feedback = 'too_light';
      } else if (i === 4) {
        rpe = 8;
        feedback = 'too_heavy';
      }

      entries.push({
        suggestedWeight: baseWeight + (i * 2.5),
        actualWeight: Math.round(actualWeight / 2.5) * 2.5, // Redondear a 2.5kg
        feedback,
        rpe,
        reps: Math.floor(Math.random() * 3) + 6, // 6-8 reps
        date: dates[i]
      });
    }

    return entries;
  }

  /**
   * 📅 Obtener últimas N fechas
   */
  private getLastNDates(n: number): string[] {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 3)); // Cada 3 días
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }
}

/**
 * 🚀 Ejecutar inicialización
 */
async function initializeWeightData() {
  const initializer = new WeightDataInitializer();
  await initializer.initializeAll();
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeWeightData().catch(console.error);
}

export { WeightDataInitializer, initializeWeightData };
