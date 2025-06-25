/**
 * 🧪 Componente de Testing para Sistema de Peso Inteligente
 * Solo visible para usuarios de desarrollo
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  Database, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Play,
  BarChart3,
  Weight
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useWeightSuggestions } from '@/hooks/useWeightSuggestions';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

const WeightSystemTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  
  const { processAILearning } = useWeightSuggestions();

  const tests = [
    'Inicializar datos de peso',
    'Crear sugerencias de IA',
    'Probar captura de peso',
    'Probar feedback de sets',
    'Probar patrones de descanso',
    'Procesar aprendizaje de IA',
    'Validar sugerencias actualizadas'
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    try {
      // Test 1: Inicializar datos
      setCurrentTest('Inicializando datos de peso...');
      setProgress(10);
      
      try {
        const response = await apiRequest('POST', '/api/weight-suggestions/initialize-data');
        const data = await response.json();
        
        addResult('Inicializar datos de peso', data.success, data.message);
      } catch (error) {
        addResult('Inicializar datos de peso', false, `Error: ${error.message}`);
      }

      // Test 2: Probar obtención de sugerencias
      setCurrentTest('Probando sugerencias de IA...');
      setProgress(25);
      
      const testExercises = ['Press de Banca', 'Sentadilla', 'Curl de Bíceps'];
      
      for (const exercise of testExercises) {
        try {
          const response = await apiRequest('GET', `/api/weight-suggestions/${encodeURIComponent(exercise)}`);
          const data = await response.json();
          
          addResult(`Sugerencia - ${exercise}`, data.success, 
            data.success ? `${data.suggestion.suggestedWeight}kg (confianza: ${data.suggestion.confidenceScore})` 
                         : 'No hay sugerencia disponible');
        } catch (error) {
          addResult(`Sugerencia - ${exercise}`, false, `Error: ${error.message}`);
        }
      }

      // Test 3: Probar captura de peso
      setCurrentTest('Probando captura de peso...');
      setProgress(50);
      
      try {
        const response = await apiRequest('POST', '/api/weight-suggestions/record-usage', {
          exerciseName: 'Press de Banca Test',
          suggestedWeight: 60,
          actualWeight: 62.5,
          weightFeedback: 'perfect',
          rpeAchieved: 7,
          repsCompleted: 8,
          setsCompleted: 3,
          sessionId: Math.floor(Date.now() / 1000)
        });
        const data = await response.json();
        
        addResult('Captura de peso', data.success, data.message);
      } catch (error) {
        addResult('Captura de peso', false, `Error: ${error.message}`);
      }

      // Test 4: Probar feedback de sets
      setCurrentTest('Probando feedback de sets...');
      setProgress(65);

      try {
        const response = await apiRequest('POST', '/api/weight-suggestions/set-feedback', {
          exerciseLogId: 79, // Usar un exercise_log_id válido
          setNumber: 1,
          setRpe: 7,
          weightFeeling: 'perfect',
          completedAsPlanned: true,
          actualReps: 8,
          targetReps: 8,
          restTimeSeconds: 90
        });
        const data = await response.json();

        addResult('Feedback de sets', data.success, data.message);
      } catch (error) {
        addResult('Feedback de sets', false, `Error: ${error.message}`);
      }

      // Test 5: Probar patrones de descanso
      setCurrentTest('Probando patrones de descanso...');
      setProgress(80);
      
      try {
        const response = await apiRequest('POST', '/api/weight-suggestions/rest-pattern', {
          exerciseName: 'Press de Banca Test',
          muscleGroup: 'Pecho',
          recommendedRestSeconds: 120,
          actualRestSeconds: 135,
          nextSetPerformance: 8,
          fatigueLevel: 5,
          sessionId: Math.floor(Date.now() / 1000),
          setNumber: 1
        });
        const data = await response.json();
        
        addResult('Patrones de descanso', data.success, data.message);
      } catch (error) {
        addResult('Patrones de descanso', false, `Error: ${error.message}`);
      }

      // Test 6: Procesar aprendizaje de IA
      setCurrentTest('Procesando aprendizaje de IA...');
      setProgress(90);
      
      try {
        const response = await apiRequest('POST', '/api/weight-suggestions/process-ai-learning');
        const data = await response.json();
        
        addResult('Aprendizaje de IA', data.success, data.message);
      } catch (error) {
        addResult('Aprendizaje de IA', false, `Error: ${error.message}`);
      }

      // Test 7: Validar sugerencias actualizadas
      setCurrentTest('Validando sugerencias actualizadas...');
      setProgress(100);
      
      try {
        const response = await apiRequest('GET', `/api/weight-suggestions/${encodeURIComponent('Press de Banca Test')}`);
        const data = await response.json();
        
        addResult('Sugerencias actualizadas', data.success, 
          data.success ? `Sugerencia actualizada: ${data.suggestion.suggestedWeight}kg` 
                       : 'No se encontraron sugerencias actualizadas');
      } catch (error) {
        addResult('Sugerencias actualizadas', false, `Error: ${error.message}`);
      }

    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const addResult = (test: string, passed: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, passed, message, data }]);
  };

  const getSuccessRate = () => {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.passed).length;
    return Math.round((passed / results.length) * 100);
  };

  const resetTests = () => {
    setResults([]);
    setProgress(0);
    setCurrentTest('');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Sistema de Testing - Peso Inteligente
          <Badge variant="outline" className="ml-auto">
            Desarrollo
          </Badge>
        </CardTitle>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>¿Qué es esto?</strong> Sistema de inteligencia artificial que aprende de tus entrenamientos
            para sugerir pesos óptimos, analizar tu RPE (esfuerzo percibido) y optimizar tus tiempos de descanso.
          </p>
          <p>
            <strong>¿Cómo funciona?</strong> Cada vez que entrenas, el sistema captura datos como el peso usado,
            tu RPE por set, tiempo de descanso real vs recomendado, y tu feedback sobre si el peso fue fácil/perfecto/pesado.
            Con estos datos, la IA mejora continuamente sus recomendaciones.
          </p>
          <p>
            <strong>Beneficios:</strong> Progresión más inteligente, prevención de lesiones, personalización total,
            y optimización automática de tu entrenamiento basada en ciencia del ejercicio.
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex gap-3">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Ejecutando Tests...' : 'Ejecutar Todos los Tests'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetTests}
            disabled={isRunning}
          >
            Limpiar Resultados
          </Button>
        </div>

        {/* Progreso */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{currentTest}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Resumen de Resultados */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                <div className="text-sm text-muted-foreground">Tests Ejecutados</div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.passed).length}
                </div>
                <div className="text-sm text-muted-foreground">Tests Exitosos</div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{getSuccessRate()}%</div>
                <div className="text-sm text-muted-foreground">Tasa de Éxito</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resultados Detallados */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Resultados Detallados</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.passed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.test}</div>
                    <div className={`text-xs ${
                      result.passed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado del Sistema */}
        {getSuccessRate() >= 80 && results.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                🎉 Sistema de Peso Inteligente funcionando correctamente!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeightSystemTester;
