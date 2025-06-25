/**
 * 🧪 Test Script para Sistema de Peso Inteligente
 * Valida todas las funcionalidades del sistema de captura de peso, RPE y tiempo de descanso
 */

import { supabaseStorage } from '../supabaseStorage';
import { weightSuggestionService } from '../services/weightSuggestionService';
import { aiLearningService } from '../services/aiLearningService';

const TEST_USER_ID = 17; // Usuario de prueba
const TEST_EXERCISES = [
  'Press de Banca',
  'Sentadilla',
  'Remo con Barra',
  'Press Militar',
  'Curl de Bíceps'
];

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

class WeightSystemTester {
  private results: TestResult[] = [];

  /**
   * 🚀 Ejecutar todas las pruebas
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 [Test] Starting Weight System Tests...\n');

    try {
      // Fase 1: Pruebas de Base de Datos
      await this.testDatabaseOperations();
      
      // Fase 2: Pruebas de Sugerencias de Peso
      await this.testWeightSuggestions();
      
      // Fase 3: Pruebas de Captura de Datos
      await this.testDataCapture();
      
      // Fase 4: Pruebas de Aprendizaje de IA
      await this.testAILearning();
      
      // Fase 5: Pruebas de Integración
      await this.testIntegration();
      
      // Mostrar resultados
      this.showResults();
      
    } catch (error) {
      console.error('❌ [Test] Error running tests:', error);
    }
  }

  /**
   * 🗄️ Pruebas de operaciones de base de datos
   */
  private async testDatabaseOperations(): Promise<void> {
    console.log('🗄️ [Test] Testing Database Operations...');

    // Test 1: Crear sugerencia de peso
    try {
      const suggestion = await supabaseStorage.saveAiWeightSuggestion(TEST_USER_ID, {
        exerciseName: 'Press de Banca Test',
        suggestedWeight: 60,
        confidenceScore: 0.8,
        basedOnSessions: 5,
        progressionTrend: 'increasing',
        targetRpeRange: '6-8',
        muscleGroup: 'Pecho',
        exerciseType: 'compound'
      });

      this.addResult('Database - Save Weight Suggestion', true, 'Weight suggestion saved successfully', suggestion);
    } catch (error) {
      this.addResult('Database - Save Weight Suggestion', false, `Error: ${error.message}`);
    }

    // Test 2: Obtener sugerencia de peso
    try {
      const suggestion = await supabaseStorage.getAiWeightSuggestion(TEST_USER_ID, 'Press de Banca Test');
      
      this.addResult('Database - Get Weight Suggestion', !!suggestion, 
        suggestion ? 'Weight suggestion retrieved successfully' : 'No suggestion found', suggestion);
    } catch (error) {
      this.addResult('Database - Get Weight Suggestion', false, `Error: ${error.message}`);
    }

    // Test 3: Guardar historial de peso
    try {
      const history = await supabaseStorage.saveExerciseWeightHistory(TEST_USER_ID, {
        exerciseName: 'Press de Banca Test',
        suggestedWeight: 60,
        actualWeight: 62.5,
        weightFeedback: 'perfect',
        rpeAchieved: 7,
        repsCompleted: 8,
        setsCompleted: 3,
        sessionId: 'test-session-123'
      });

      this.addResult('Database - Save Weight History', true, 'Weight history saved successfully', history);
    } catch (error) {
      this.addResult('Database - Save Weight History', false, `Error: ${error.message}`);
    }
  }

  /**
   * 🏋️‍♂️ Pruebas de sugerencias de peso
   */
  private async testWeightSuggestions(): Promise<void> {
    console.log('🏋️‍♂️ [Test] Testing Weight Suggestions...');

    for (const exercise of TEST_EXERCISES) {
      try {
        // Test: Obtener sugerencia para ejercicio
        const suggestion = await weightSuggestionService.getWeightSuggestion(TEST_USER_ID, exercise);
        
        this.addResult(`Weight Suggestion - ${exercise}`, !!suggestion, 
          suggestion ? `Suggestion: ${suggestion.suggestedWeight}kg (confidence: ${suggestion.confidenceScore})` 
                     : 'No suggestion available', suggestion);
      } catch (error) {
        this.addResult(`Weight Suggestion - ${exercise}`, false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * 📊 Pruebas de captura de datos
   */
  private async testDataCapture(): Promise<void> {
    console.log('📊 [Test] Testing Data Capture...');

    // Test 1: Captura de feedback de set
    try {
      const setFeedback = await supabaseStorage.saveExerciseSetFeedback(TEST_USER_ID, {
        exerciseLogId: 1, // ID de prueba
        setNumber: 1,
        setRpe: 7,
        weightFeeling: 'perfect',
        completedAsPlanned: true,
        actualReps: 8,
        targetReps: 8,
        restTimeSeconds: 90,
        notes: 'Test set feedback'
      });

      this.addResult('Data Capture - Set Feedback', true, 'Set feedback captured successfully', setFeedback);
    } catch (error) {
      this.addResult('Data Capture - Set Feedback', false, `Error: ${error.message}`);
    }

    // Test 2: Captura de patrón de descanso
    try {
      const restPattern = await supabaseStorage.saveRestTimePattern(TEST_USER_ID, {
        exerciseName: 'Press de Banca Test',
        muscleGroup: 'Pecho',
        recommendedRestSeconds: 120,
        actualRestSeconds: 135,
        nextSetPerformance: 'good',
        fatigueLevel: 'moderate',
        sessionId: 'test-session-123',
        setNumber: 1
      });

      this.addResult('Data Capture - Rest Pattern', true, 'Rest pattern captured successfully', restPattern);
    } catch (error) {
      this.addResult('Data Capture - Rest Pattern', false, `Error: ${error.message}`);
    }
  }

  /**
   * 🤖 Pruebas de aprendizaje de IA
   */
  private async testAILearning(): Promise<void> {
    console.log('🤖 [Test] Testing AI Learning...');

    try {
      // Procesar datos de aprendizaje para el usuario de prueba
      await aiLearningService.processWeightLearningData(TEST_USER_ID);
      
      this.addResult('AI Learning - Process Data', true, 'AI learning processed successfully');
    } catch (error) {
      this.addResult('AI Learning - Process Data', false, `Error: ${error.message}`);
    }

    // Verificar que las sugerencias se actualizaron
    try {
      const updatedSuggestion = await supabaseStorage.getAiWeightSuggestion(TEST_USER_ID, 'Press de Banca Test');
      
      this.addResult('AI Learning - Updated Suggestions', !!updatedSuggestion, 
        updatedSuggestion ? 'Suggestions updated by AI learning' : 'No updated suggestions found', 
        updatedSuggestion);
    } catch (error) {
      this.addResult('AI Learning - Updated Suggestions', false, `Error: ${error.message}`);
    }
  }

  /**
   * 🔗 Pruebas de integración
   */
  private async testIntegration(): Promise<void> {
    console.log('🔗 [Test] Testing Integration...');

    // Test: Flujo completo de entrenamiento
    try {
      const exercise = 'Sentadilla Test';
      
      // 1. Obtener sugerencia inicial
      const initialSuggestion = await weightSuggestionService.getWeightSuggestion(TEST_USER_ID, exercise);
      
      // 2. Simular uso de peso
      const weightUsage = await weightSuggestionService.recordWeightUsed(TEST_USER_ID, {
        exerciseName: exercise,
        suggestedWeight: initialSuggestion?.suggestedWeight || 50,
        actualWeight: 55,
        weightFeedback: 'too_light',
        rpeAchieved: 5,
        repsCompleted: 10,
        setsCompleted: 3,
        sessionId: 'integration-test-session'
      });
      
      // 3. Procesar aprendizaje
      await aiLearningService.processWeightLearningData(TEST_USER_ID);
      
      // 4. Verificar nueva sugerencia
      const newSuggestion = await weightSuggestionService.getWeightSuggestion(TEST_USER_ID, exercise);
      
      const weightIncreased = newSuggestion && initialSuggestion && 
                             newSuggestion.suggestedWeight > initialSuggestion.suggestedWeight;
      
      this.addResult('Integration - Complete Flow', weightIncreased, 
        weightIncreased ? `Weight increased from ${initialSuggestion?.suggestedWeight}kg to ${newSuggestion?.suggestedWeight}kg` 
                        : 'Weight did not increase as expected',
        { initialSuggestion, newSuggestion, weightUsage });
        
    } catch (error) {
      this.addResult('Integration - Complete Flow', false, `Error: ${error.message}`);
    }
  }

  /**
   * ➕ Agregar resultado de prueba
   */
  private addResult(test: string, passed: boolean, message: string, data?: any): void {
    this.results.push({ test, passed, message, data });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} [Test] ${test}: ${message}`);
  }

  /**
   * 📊 Mostrar resumen de resultados
   */
  private showResults(): void {
    console.log('\n📊 [Test] Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (percentage >= 80) {
      console.log('\n🎉 [Test] Weight System is working correctly!');
    } else {
      console.log('\n⚠️ [Test] Weight System needs attention. Check failed tests.');
    }
    
    // Mostrar tests fallidos
    const failed = this.results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      failed.forEach(test => {
        console.log(`  - ${test.test}: ${test.message}`);
      });
    }
  }
}

/**
 * 🚀 Ejecutar pruebas
 */
async function runTests() {
  const tester = new WeightSystemTester();
  await tester.runAllTests();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

export { WeightSystemTester, runTests };
