import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  Zap,
  Heart,
  Trophy,
  Activity,
  Clock,
  Flame,
  RefreshCw
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import AdherenceChart from '@/components/AdherenceChart';
import EffectivenessChart from '@/components/EffectivenessChart';
import PeriodizationRecommendations from '@/components/PeriodizationRecommendations';
import AutomaticReports from '@/components/AutomaticReports';
import SchedulerStatus from '@/components/SchedulerStatus';

interface AnalyticsDashboardProps {
  userId?: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { user } = useAuth();

  // 🎯 CORRECCIÓN CRÍTICA: Usar usuario autenticado en lugar de hardcoded
  const actualUserId = userId || user?.id;

  if (!actualUserId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <ModernEmoji emoji="⚠️" size={32} className="mb-2" />
          <p className="text-muted-foreground">Usuario no autenticado</p>
        </div>
      </div>
    );
  }

  // Obtener datos del dashboard
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-dashboard', actualUserId, selectedPeriod],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics/dashboard/${actualUserId}?days=${selectedPeriod}`);
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: !!actualUserId, // Solo ejecutar si tenemos userId
  });

  // Obtener resumen rápido
  const { data: summaryData } = useQuery({
    queryKey: ['analytics-summary', actualUserId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics/summary/${actualUserId}`);
      return response.json();
    },
    enabled: !!actualUserId, // Solo ejecutar si tenemos userId
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progress = dashboardData?.dashboard?.progress;
  const adherence = dashboardData?.dashboard?.adherence;
  const effectiveness = dashboardData?.dashboard?.effectiveness;
  const summary = summaryData?.summary;

  const formatTrend = (value: number) => {
    if (value > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${value.toFixed(1)}%` };
    if (value < 0) return { icon: TrendingDown, color: 'text-red-600', text: `${value.toFixed(1)}%` };
    return { icon: Activity, color: 'text-gray-600', text: '0%' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ModernEmoji emoji="📊" size={32} />
            Dashboard Analytics
          </h1>
          <p className="text-muted-foreground">
            Análisis inteligente de tu progreso fitness
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={selectedPeriod === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(7)}
            >
              7 días
            </Button>
            <Button
              variant={selectedPeriod === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(30)}
            >
              30 días
            </Button>
            <Button
              variant={selectedPeriod === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(90)}
            >
              90 días
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Entrenamientos Semanales */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Entrenamientos</p>
                <p className="text-3xl font-bold text-blue-800">
                  {summary?.weeklyWorkouts || 0}
                </p>
                <p className="text-xs text-blue-600">Esta semana</p>
              </div>
              <div className="bg-blue-600 text-white p-3 rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adherencia */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Adherencia</p>
                <p className="text-3xl font-bold text-green-800">
                  {summary?.completionRate || 0}%
                </p>
                <p className="text-xs text-green-600">Tasa de completación</p>
              </div>
              <div className="bg-green-600 text-white p-3 rounded-xl">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RPE Promedio */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">RPE Promedio</p>
                <p className="text-3xl font-bold text-orange-800">
                  {summary?.averageRpe || 0}
                </p>
                <p className="text-xs text-orange-600">Esfuerzo percibido</p>
              </div>
              <div className="bg-orange-600 text-white p-3 rounded-xl">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volumen Total */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Volumen Total</p>
                <p className="text-3xl font-bold text-purple-800">
                  {Math.round(summary?.totalVolume || 0)}kg
                </p>
                <p className="text-xs text-purple-600">Peso levantado</p>
              </div>
              <div className="bg-purple-600 text-white p-3 rounded-xl">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Analytics */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progreso
          </TabsTrigger>
          <TabsTrigger value="adherence" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Adherencia
          </TabsTrigger>
          <TabsTrigger value="effectiveness" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Efectividad
          </TabsTrigger>
          <TabsTrigger value="periodization" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Periodización
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        {/* Tab de Progreso */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métricas de Fuerza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Progreso de Fuerza
                </CardTitle>
                <CardDescription>
                  Evolución de tu volumen y peso de entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Volumen Total</span>
                    <span className="font-mono">
                      {Math.round(progress?.strengthProgress?.totalVolumeKg || 0)}kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.min(100, (progress?.strengthProgress?.totalVolumeKg || 0) / 100)} 
                      className="flex-1" 
                    />
                    {progress?.strengthProgress?.volumeChange && (
                      <Badge variant={progress.strengthProgress.volumeChange > 0 ? "default" : "secondary"}>
                        {formatTrend(progress.strengthProgress.volumeChange).text}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Peso Promedio</span>
                    <span className="font-mono">
                      {Math.round(progress?.strengthProgress?.averageWeight || 0)}kg
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (progress?.strengthProgress?.averageWeight || 0) / 2)} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ejercicios Únicos</span>
                    <span className="font-mono">
                      {progress?.strengthProgress?.exerciseCount || 0}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (progress?.strengthProgress?.exerciseCount || 0) * 5)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Métricas de RPE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Análisis de Intensidad
                </CardTitle>
                <CardDescription>
                  Tu esfuerzo percibido y consistencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {progress?.rpeMetrics?.averageRpe?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-orange-600">RPE Promedio</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Consistencia</span>
                    <span className="font-mono">
                      {Math.round(progress?.rpeMetrics?.consistencyScore || 0)}%
                    </span>
                  </div>
                  <Progress 
                    value={progress?.rpeMetrics?.consistencyScore || 0} 
                    className="h-2" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-sm font-bold text-green-600">Fácil</div>
                    <div className="text-xs text-green-600">RPE 1-4</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <div className="text-sm font-bold text-yellow-600">Moderado</div>
                    <div className="text-xs text-yellow-600">RPE 5-7</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <div className="text-sm font-bold text-red-600">Intenso</div>
                    <div className="text-xs text-red-600">RPE 8-10</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Frecuencia Muscular */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Frecuencia por Grupo Muscular
              </CardTitle>
              <CardDescription>
                Distribución de tu entrenamiento por grupos musculares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(progress?.frequencyMetrics?.muscleGroupFrequency || {}).map(([muscle, frequency]) => (
                  <div key={muscle} className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{frequency}</div>
                    <div className="text-sm text-purple-600">{muscle}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Adherencia */}
        <TabsContent value="adherence" className="space-y-6">
          {adherence && (
            <AdherenceChart
              data={{
                completionRate: adherence.completionRate || 0,
                streakDays: adherence.streakDays || 0,
                averageWorkoutDuration: adherence.averageWorkoutDuration || 0,
                preferredWorkoutTimes: adherence.preferredWorkoutTimes || [],
                missedWorkouts: adherence.missedWorkouts || 0,
                totalPlannedWorkouts: adherence.totalPlannedWorkouts || 0,
                // Usar datos reales del backend o undefined para usuarios nuevos
                weeklyPattern: adherence.weeklyPattern || undefined,
                // ✅ RESTAURADO: Sistema original sin días disponibles separados
              }}
              period={selectedPeriod}
            />
          )}
        </TabsContent>

        {/* Tab de Efectividad */}
        <TabsContent value="effectiveness" className="space-y-6">
          {effectiveness && (
            <EffectivenessChart
              data={{
                topSplits: effectiveness.topSplits || [],
                topExercises: effectiveness.topExercises || [],
                rpeProgressCorrelation: effectiveness.rpeProgressCorrelation || 0,
                satisfactionTrend: effectiveness.satisfactionTrend || 0,
              }}
              period={selectedPeriod}
            />
          )}
        </TabsContent>

        {/* Tab de Periodización */}
        <TabsContent value="periodization" className="space-y-6">
          <PeriodizationRecommendations userId={actualUserId} />
        </TabsContent>

        {/* Tab de Reportes */}
        <TabsContent value="reports" className="space-y-6">
          <AutomaticReports userId={actualUserId} />
        </TabsContent>

        {/* Tab de Administración */}
        <TabsContent value="admin" className="space-y-6">
          <SchedulerStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
