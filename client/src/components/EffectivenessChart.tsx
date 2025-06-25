import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Zap, 
  Target,
  Star,
  ThumbsUp,
  ThumbsDown,
  Activity
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface EffectivenessData {
  topSplits: Array<{
    splitName: string;
    averageSatisfaction: number;
    averageRpe: number;
    completionRate: number;
    progressScore: number;
  }>;
  topExercises: Array<{
    exerciseName: string;
    preferenceScore: number;
    progressRate: number;
    averageRpe: number;
  }>;
  rpeProgressCorrelation: number;
  satisfactionTrend: number;
}

interface EffectivenessChartProps {
  data: EffectivenessData;
  period?: number;
}

const EffectivenessChart: React.FC<EffectivenessChartProps> = ({ data, period = 30 }) => {
  const getCorrelationLevel = (correlation: number) => {
    if (Math.abs(correlation) >= 0.7) return 'strong';
    if (Math.abs(correlation) >= 0.4) return 'moderate';
    if (Math.abs(correlation) >= 0.2) return 'weak';
    return 'none';
  };

  const getCorrelationColor = (correlation: number) => {
    const level = getCorrelationLevel(correlation);
    if (correlation > 0) {
      switch (level) {
        case 'strong': return 'text-green-600 bg-green-50 border-green-200';
        case 'moderate': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'weak': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    } else {
      switch (level) {
        case 'strong': return 'text-red-600 bg-red-50 border-red-200';
        case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'weak': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    }
  };

  const getCorrelationMessage = (correlation: number) => {
    const level = getCorrelationLevel(correlation);
    if (correlation > 0) {
      switch (level) {
        case 'strong': return 'Excelente correlación: Mayor RPE = Mayor progreso';
        case 'moderate': return 'Buena correlación: RPE y progreso están relacionados';
        case 'weak': return 'Correlación débil: RPE y progreso poco relacionados';
        default: return 'Sin correlación clara entre RPE y progreso';
      }
    } else {
      switch (level) {
        case 'strong': return 'Correlación negativa fuerte: Menor RPE = Mayor progreso';
        case 'moderate': return 'Correlación negativa: Posible sobreentrenamiento';
        case 'weak': return 'Correlación negativa débil';
        default: return 'Sin correlación clara entre RPE y progreso';
      }
    }
  };

  const getSplitEffectivenessScore = (split: any) => {
    // Weighted score: satisfaction (40%) + progress (40%) + completion (20%)
    return (split.averageSatisfaction * 0.4 + split.progressScore * 0.4 + split.completionRate * 0.002) * 20;
  };

  return (
    <div className="space-y-6">
      {/* RPE vs Progress Correlation */}
      <Card className={`border-2 ${getCorrelationColor(data.rpeProgressCorrelation)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Correlación RPE vs Progreso
          </CardTitle>
          <CardDescription>
            Relación entre tu esfuerzo percibido y el progreso real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {data.rpeProgressCorrelation > 0 ? '+' : ''}{(data.rpeProgressCorrelation * 100).toFixed(0)}%
            </div>
            <div className="text-sm font-medium mb-3">
              {getCorrelationMessage(data.rpeProgressCorrelation)}
            </div>
            <Progress 
              value={Math.abs(data.rpeProgressCorrelation) * 100} 
              className="h-3" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="text-sm font-medium">Zona Óptima RPE</div>
              <div className="text-lg font-bold text-blue-600">6-8</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-sm font-medium">Progreso Ideal</div>
              <div className="text-lg font-bold text-green-600">+15%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Splits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Splits Más Efectivos
          </CardTitle>
          <CardDescription>
            Rutinas ordenadas por efectividad general (satisfacción + progreso + adherencia)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.topSplits && data.topSplits.length > 0 ? (
            <div className="space-y-4">
              {data.topSplits.slice(0, 5).map((split, index) => {
                const effectivenessScore = getSplitEffectivenessScore(split);
                return (
                  <div key={split.splitName} className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{split.splitName}</div>
                        <div className="text-sm text-muted-foreground">
                          Score de Efectividad: {effectivenessScore.toFixed(1)}/100
                        </div>
                      </div>
                    </div>
                    {index === 0 && <ModernEmoji emoji="🏆" size={24} />}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-sm text-muted-foreground">Satisfacción</div>
                      <div className="font-bold text-pink-600">
                        {split.averageSatisfaction.toFixed(1)}/5
                      </div>
                      <div className="flex justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < Math.round(split.averageSatisfaction) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-sm text-muted-foreground">RPE Promedio</div>
                      <div className="font-bold text-orange-600">
                        {split.averageRpe.toFixed(1)}/10
                      </div>
                      <Progress value={split.averageRpe * 10} className="h-1 mt-1" />
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-sm text-muted-foreground">Progreso</div>
                      <div className="font-bold text-green-600">
                        {split.progressScore.toFixed(1)}/5
                      </div>
                      <Progress value={split.progressScore * 20} className="h-1 mt-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Trophy className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">¡Comienza a entrenar!</p>
              <p className="text-sm text-gray-500 mt-2">
                Después de completar algunas rutinas verás tus splits más efectivos aquí
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise Preferences Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Loved Exercises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              Ejercicios Favoritos
            </CardTitle>
            <CardDescription>
              Ejercicios con mejor puntuación de preferencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.topExercises && data.topExercises.filter(ex => ex.preferenceScore > 0).length > 0 ? (
              <div className="space-y-3">
                {data.topExercises
                  .filter(ex => ex.preferenceScore > 0)
                  .slice(0, 5)
                  .map((exercise, index) => (
                  <div key={exercise.exerciseName} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ModernEmoji emoji="💚" size={20} />
                      <div>
                        <div className="font-medium">{exercise.exerciseName}</div>
                        <div className="text-sm text-muted-foreground">
                          Score: +{exercise.preferenceScore} | RPE: {exercise.averageRpe.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
            </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <ThumbsUp className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">¡Comienza a entrenar!</p>
                <p className="text-sm text-gray-500 mt-2">
                  Después de completar rutinas verás tus ejercicios favoritos aquí
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Least Loved Exercises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              Ejercicios a Mejorar
            </CardTitle>
            <CardDescription>
              Ejercicios con puntuación negativa que podrían necesitar ajustes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.topExercises && data.topExercises.filter(ex => ex.preferenceScore < 0).length > 0 ? (
              <div className="space-y-3">
                {data.topExercises
                  .filter(ex => ex.preferenceScore < 0)
                  .sort((a, b) => a.preferenceScore - b.preferenceScore)
                  .slice(0, 5)
                  .map((exercise, index) => (
                  <div key={exercise.exerciseName} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ModernEmoji emoji="💔" size={20} />
                      <div>
                        <div className="font-medium">{exercise.exerciseName}</div>
                        <div className="text-sm text-muted-foreground">
                          Score: {exercise.preferenceScore} | RPE: {exercise.averageRpe.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      Revisar
                    </Badge>
                  </div>
                ))}
            </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <ThumbsDown className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">¡Perfecto!</p>
                <p className="text-sm text-gray-500 mt-2">
                  No tienes ejercicios problemáticos por ahora
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Análisis de Tendencias
          </CardTitle>
          <CardDescription>
            Evolución de tu satisfacción y recomendaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold mb-2">
                {data.satisfactionTrend > 0 ? (
                  <span className="text-green-600 flex items-center justify-center gap-2">
                    <TrendingUp className="h-8 w-8" />
                    +{data.satisfactionTrend.toFixed(1)}
                  </span>
                ) : data.satisfactionTrend < 0 ? (
                  <span className="text-red-600 flex items-center justify-center gap-2">
                    <TrendingDown className="h-8 w-8" />
                    {data.satisfactionTrend.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-gray-600 flex items-center justify-center gap-2">
                    <Activity className="h-8 w-8" />
                    0.0
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Cambio en satisfacción promedio
              </div>
            </div>

            <div className="space-y-3">
              {data.satisfactionTrend > 0.5 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <ModernEmoji emoji="🚀" size={20} />
                  <div>
                    <p className="font-medium text-green-800">¡Tendencia excelente!</p>
                    <p className="text-sm text-green-600">
                      Tu satisfacción está mejorando. Mantén este enfoque.
                    </p>
                  </div>
                </div>
              )}

              {data.satisfactionTrend < -0.5 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <ModernEmoji emoji="⚠️" size={20} />
                  <div>
                    <p className="font-medium text-red-800">Satisfacción en declive</p>
                    <p className="text-sm text-red-600">
                      Considera cambiar tu rutina o reducir la intensidad.
                    </p>
                  </div>
                </div>
              )}

              {Math.abs(data.satisfactionTrend) <= 0.5 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <ModernEmoji emoji="📊" size={20} />
                  <div>
                    <p className="font-medium text-blue-800">Satisfacción estable</p>
                    <p className="text-sm text-blue-600">
                      Tu satisfacción se mantiene constante. Considera nuevos desafíos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EffectivenessChart;
