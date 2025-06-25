import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  Download,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Heart
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { apiRequest } from '@/lib/queryClient';

interface AutomaticReportsProps {
  userId: number;
}

const AutomaticReports: React.FC<AutomaticReportsProps> = ({ userId }) => {
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const queryClient = useQueryClient();

  // Obtener reporte semanal
  const { data: weeklyReport, isLoading: loadingWeekly, refetch: refetchWeekly } = useQuery({
    queryKey: ['weekly-report', userId, selectedWeek],
    queryFn: async () => {
      const params = selectedWeek ? `?weekStartDate=${selectedWeek}` : '';
      const response = await apiRequest('GET', `/api/analytics/reports/weekly/${userId}${params}`);
      return response.json();
    },
  });

  // Obtener reporte mensual
  const { data: monthlyReport, isLoading: loadingMonthly, refetch: refetchMonthly } = useQuery({
    queryKey: ['monthly-report', userId, selectedMonth],
    queryFn: async () => {
      const params = selectedMonth ? `?monthStartDate=${selectedMonth}` : '';
      const response = await apiRequest('GET', `/api/analytics/reports/monthly/${userId}${params}`);
      return response.json();
    },
  });

  // Guardar reporte semanal
  const saveWeeklyMutation = useMutation({
    mutationFn: async () => {
      const params = selectedWeek ? `?weekStartDate=${selectedWeek}` : '';
      const response = await apiRequest('POST', `/api/analytics/reports/weekly/${userId}/save${params}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report', userId] });
    }
  });

  const getWeekDates = () => {
    const today = new Date();
    const currentWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const weeks = [];
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentWeek);
      weekStart.setDate(currentWeek.getDate() - (i * 7));
      weeks.push({
        value: weekStart.toISOString().split('T')[0],
        label: `Semana del ${weekStart.toLocaleDateString()}`
      });
    }
    
    return weeks;
  };

  const getMonthDates = () => {
    const today = new Date();
    const months = [];
    
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        value: monthStart.toISOString().split('T')[0],
        label: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      });
    }
    
    return months;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Reportes Automáticos
          </h2>
          <p className="text-muted-foreground">
            Análisis detallados de tu progreso y rendimiento
          </p>
        </div>
      </div>

      {/* Tabs de Reportes */}
      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reporte Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reporte Mensual
          </TabsTrigger>
        </TabsList>

        {/* Reporte Semanal */}
        <TabsContent value="weekly" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Semana actual</option>
              {getWeekDates().map(week => (
                <option key={week.value} value={week.value}>
                  {week.label}
                </option>
              ))}
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchWeekly()}
              disabled={loadingWeekly}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingWeekly ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              size="sm" 
              onClick={() => saveWeeklyMutation.mutate()}
              disabled={saveWeeklyMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>

          {loadingWeekly ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded-xl"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
              </div>
            </div>
          ) : weeklyReport?.report ? (
            <div className="space-y-6">
              {/* Resumen Semanal */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ModernEmoji emoji="📊" size={24} />
                    Resumen de la Semana
                  </CardTitle>
                  <CardDescription>
                    {new Date(weeklyReport.report.weekStartDate).toLocaleDateString()} - {new Date(weeklyReport.report.weekEndDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {weeklyReport.report.summary.workoutsCompleted}
                      </div>
                      <div className="text-sm text-blue-600">Entrenamientos</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatDuration(weeklyReport.report.summary.totalDuration)}
                      </div>
                      <div className="text-sm text-green-600">Tiempo Total</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {weeklyReport.report.summary.averageRpe.toFixed(1)}
                      </div>
                      <div className="text-sm text-orange-600">RPE Promedio</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {weeklyReport.report.summary.averageSatisfaction.toFixed(1)}
                      </div>
                      <div className="text-sm text-purple-600">Satisfacción</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logros de la Semana */}
              {weeklyReport.report.summary.achievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Logros de la Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {weeklyReport.report.summary.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <ModernEmoji emoji="🏆" size={20} />
                          <span className="font-medium">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights y Recomendaciones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Insights de la Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyReport.report.insights && weeklyReport.report.insights.length > 0 ? (
                      <div className="space-y-3">
                        {weeklyReport.report.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <ModernEmoji emoji="💡" size={16} />
                            <span className="text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-gray-400 mb-3">
                          <TrendingUp className="h-8 w-8 mx-auto" />
                        </div>
                        <p className="text-gray-600 font-medium">¡Comienza a entrenar!</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Después de completar entrenamientos verás insights personalizados aquí
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recomendaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Recomendaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyReport.report.recommendations && weeklyReport.report.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {weeklyReport.report.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <ModernEmoji emoji="🎯" size={16} />
                            <span className="text-sm">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-gray-400 mb-3">
                          <Target className="h-8 w-8 mx-auto" />
                        </div>
                        <p className="text-gray-600 font-medium">¡Comienza a entrenar!</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Después de completar entrenamientos verás recomendaciones personalizadas aquí
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ejercicios Top */}
              {weeklyReport.report.summary.topExercises.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Ejercicios Más Frecuentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {weeklyReport.report.summary.topExercises.map((exercise, index) => (
                        <Badge key={index} variant={index === 0 ? "default" : "secondary"}>
                          {exercise}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No hay datos suficientes</h3>
                <p className="text-sm text-muted-foreground">
                  Necesitas al menos un entrenamiento para generar el reporte semanal.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reporte Mensual */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Mes actual</option>
              {getMonthDates().map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchMonthly()}
              disabled={loadingMonthly}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingMonthly ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {loadingMonthly ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded-xl"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
              </div>
            </div>
          ) : monthlyReport?.report ? (
            <div className="space-y-6">
              {/* Resumen Mensual */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ModernEmoji emoji="📈" size={24} />
                    Resumen del Mes
                  </CardTitle>
                  <CardDescription>
                    {new Date(monthlyReport.report.monthStartDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {monthlyReport.report.summary.totalWorkouts}
                      </div>
                      <div className="text-sm text-blue-600">Entrenamientos</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(monthlyReport.report.summary.adherenceRate)}%
                      </div>
                      <div className="text-sm text-green-600">Adherencia</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {monthlyReport.report.summary.strengthProgress > 0 ? '+' : ''}{Math.round(monthlyReport.report.summary.strengthProgress)}%
                      </div>
                      <div className="text-sm text-orange-600">Progreso Fuerza</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {monthlyReport.report.trends.satisfactionTrend > 0 ? '+' : ''}{monthlyReport.report.trends.satisfactionTrend.toFixed(1)}
                      </div>
                      <div className="text-sm text-purple-600">Tendencia</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mejoras del Mes */}
              {monthlyReport.report.summary.improvements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Mejoras del Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthlyReport.report.summary.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <ModernEmoji emoji="📈" size={20} />
                          <span className="font-medium">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Objetivos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Objetivos Logrados */}
                {monthlyReport.report.goals.achieved.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        Objetivos Logrados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {monthlyReport.report.goals.achieved.map((goal, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <ModernEmoji emoji="✅" size={16} />
                            <span className="text-sm">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Objetivos Sugeridos */}
                {monthlyReport.report.goals.suggested.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Objetivos Sugeridos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {monthlyReport.report.goals.suggested.map((goal, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <ModernEmoji emoji="🎯" size={16} />
                            <span className="text-sm">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Ejercicios Favoritos */}
              {monthlyReport.report.summary.favoriteExercises.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-600" />
                      Ejercicios Favoritos del Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {monthlyReport.report.summary.favoriteExercises.map((exercise, index) => (
                        <Badge key={index} variant={index === 0 ? "default" : "secondary"}>
                          {exercise}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No hay datos suficientes</h3>
                <p className="text-sm text-muted-foreground">
                  Necesitas al menos una semana de entrenamientos para generar el reporte mensual.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomaticReports;
