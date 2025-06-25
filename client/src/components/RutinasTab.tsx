import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Target, TrendingUp, ChevronLeft, ChevronRight, RefreshCw, Bot, Sparkles, Zap } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
// 🕐 SISTEMA HORARIO CENTRALIZADO
import { formatProgressDate } from '@/utils/timeFormatters';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import useAutoWorkouts from '@/hooks/useAutoWorkouts';
import PreWorkoutFeedbackModal from '@/components/PreWorkoutFeedbackModal';

interface WeeklyWorkoutHistory {
  id: number;
  weekStartDate: string;
  workoutDate: string;
  exerciseName: string;
  durationMinutes: number;
  exerciseType: string;
  completedAt: string;
}

interface WeeklySummary {
  id?: number;
  weekStartDate: string;
  totalWorkouts: number;
  totalDurationMinutes: number;
  uniqueExercises: string[];
  workoutDays: string[];
  exerciseTypes: string[];
}

interface WeekData {
  weekStartDate: string;
  history: WeeklyWorkoutHistory[];
  summary: WeeklySummary;
}

const RutinasTab: React.FC = () => {
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🤖 Hook para rutinas automáticas
  const {
    useTodayAutoWorkout,
    useAutoWorkoutStats,
    useRegenerateCache,
    refreshAutoWorkouts
  } = useAutoWorkouts();

  const { data: todayAutoWorkout, isLoading: loadingAutoWorkout } = useTodayAutoWorkout();
  const { totalCached, nextWeekCached, isHealthy } = useAutoWorkoutStats();
  const regenerateCache = useRegenerateCache();

  // 🎯 Estado para feedback pre-entrenamiento
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState(false);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);

  // 🎯 Mutación para crear feedback pre-entrenamiento
  const createPreWorkoutFeedback = useMutation({
    mutationFn: async (feedbackData: any) => {
      const token = localStorage.getItem('token');
      const response = await apiRequest('POST', '/api/workout-feedback/pre-workout', {
        ...feedbackData,
        userId: 1 // TODO: Get from auth context
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Pre-workout feedback created:', data);
      // TODO: Iniciar sesión de entrenamiento real
      setShowPreWorkoutModal(false);
      setIsStartingWorkout(false);
    },
    onError: (error) => {
      console.error('❌ Error creating pre-workout feedback:', error);
      setIsStartingWorkout(false);
    }
  });

  // 🎯 Función para manejar el inicio de rutina
  const handleStartWorkout = () => {
    setShowPreWorkoutModal(true);
  };

  // 🎯 Función para manejar el envío del feedback pre-entrenamiento
  const handlePreWorkoutSubmit = async (feedbackData: any) => {
    setIsStartingWorkout(true);

    // TODO: Crear sesión de entrenamiento primero
    const sessionId = 1; // Placeholder

    createPreWorkoutFeedback.mutate({
      sessionId,
      energy: feedbackData.energy,
      motivation: feedbackData.motivation,
      availableTime: feedbackData.availableTime,
      limitations: feedbackData.limitations
    });
  };

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  // Listen for storage events to refresh data when workouts are completed
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'workout-completed') {
        console.log('🔄 [RutinasTab] Workout completed, refreshing data...');
        fetchWeeklyData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchWeeklyData = async () => {
    try {
      console.log('🔥 [RutinasTab] Starting fetchWeeklyData...');
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ [RutinasTab] No authentication token found');
        setError('No authentication token found');
        return;
      }

      console.log('🔥 [RutinasTab] Token found, fetching current week data...');
      // Fetch current week data
      const currentResponse = await fetch('/api/weekly-history/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔥 [RutinasTab] Current response status:', currentResponse.status);
      if (!currentResponse.ok) {
        const errorText = await currentResponse.text();
        console.error('❌ [RutinasTab] Current response error:', errorText);
        throw new Error(`Failed to fetch current week data: ${currentResponse.status} ${errorText}`);
      }

      const currentWeek = await currentResponse.json();
      console.log('🔥 [RutinasTab] Current week data:', JSON.stringify(currentWeek, null, 2));

      console.log('🔥 [RutinasTab] Fetching weekly summaries...');
      // Fetch weekly summaries (last 4 weeks)
      const summariesResponse = await fetch('/api/weekly-history/summaries/4', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔥 [RutinasTab] Summaries response status:', summariesResponse.status);
      if (!summariesResponse.ok) {
        const errorText = await summariesResponse.text();
        console.error('❌ [RutinasTab] Summaries response error:', errorText);
        throw new Error(`Failed to fetch weekly summaries: ${summariesResponse.status} ${errorText}`);
      }

      const summaries: WeeklySummary[] = await summariesResponse.json();
      console.log('🔥 [RutinasTab] Summaries data:', JSON.stringify(summaries, null, 2));

      // Combine current week with historical data
      const allWeeks: WeekData[] = [];

      // Add current week first
      allWeeks.push({
        weekStartDate: currentWeek.weekStartDate,
        history: currentWeek.history,
        summary: currentWeek.summary
      });

      // Add historical weeks (if different from current)
      for (const summary of summaries) {
        if (summary.weekStartDate !== currentWeek.weekStartDate) {
          // Fetch history for this week
          const historyResponse = await fetch(`/api/weekly-history/${summary.weekStartDate}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const history = historyResponse.ok ? await historyResponse.json() : [];

          allWeeks.push({
            weekStartDate: summary.weekStartDate,
            history,
            summary
          });
        }
      }

      console.log('🔥 [RutinasTab] Final allWeeks data:', JSON.stringify(allWeeks, null, 2));
      setWeekData(allWeeks);
      console.log('✅ [RutinasTab] Week data set successfully, total weeks:', allWeeks.length);

      // Auto-select the week with data (not empty)
      const weekWithData = allWeeks.findIndex(week => week.history.length > 0 || week.summary.totalWorkouts > 0);
      if (weekWithData !== -1 && weekWithData !== selectedWeekIndex) {
        console.log('🎯 [RutinasTab] Auto-selecting week with data, index:', weekWithData);
        setSelectedWeekIndex(weekWithData);
      }
    } catch (err) {
      console.error('❌ [RutinasTab] Error fetching weekly data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      console.log('🔥 [RutinasTab] Loading finished');
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return formatProgressDate(date); // 🕐 SISTEMA CENTRALIZADO
  };

  const formatWeekRange = (weekStartDate: string): string => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  };

  const currentWeek = weekData[selectedWeekIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchWeeklyData} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!currentWeek) {
    return (
      <div className="text-center py-8">
        <ModernEmoji emoji="📅" size={48} />
        <h3 className="text-lg font-semibold mt-4 mb-2">No hay datos de entrenamientos</h3>
        <p className="text-muted-foreground">Completa tu primer entrenamiento para ver el historial aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🤖 Rutina Automática de Hoy */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>Rutina Automática de Hoy</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAutoWorkout ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Cargando rutina automática...</span>
            </div>
          ) : todayAutoWorkout?.success && todayAutoWorkout?.workout ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {todayAutoWorkout.workout.splitName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {todayAutoWorkout.workout.estimatedDuration} min • {todayAutoWorkout.workout.exercises?.length || 0} ejercicios
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-generada
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {todayAutoWorkout.workout.targetMuscleGroups?.map((muscle: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Confianza IA: {Math.round((todayAutoWorkout.workout.aiConfidenceScore || 0) * 100)}%
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleStartWorkout}
                  disabled={isStartingWorkout}
                >
                  {isStartingWorkout ? 'Iniciando...' : 'Comenzar Rutina'}
                </Button>
              </div>
            </div>
          ) : todayAutoWorkout?.isRestDay ? (
            <div className="text-center py-4">
              <ModernEmoji emoji="😴" size={32} className="mb-2" />
              <p className="font-medium">Día de Descanso</p>
              <p className="text-sm text-muted-foreground">Tu cuerpo necesita recuperación</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <ModernEmoji emoji="⚙️" size={32} className="mb-2" />
              <p className="font-medium">Configurando rutinas automáticas...</p>
              <p className="text-sm text-muted-foreground">Completa tu configuración de splits</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => regenerateCache.mutate(7)}
                disabled={regenerateCache.isPending}
              >
                {regenerateCache.isPending ? 'Generando...' : 'Generar Rutinas'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📊 Estado del Sistema Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Sistema Automático</span>
            <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{totalCached}</div>
              <div className="text-xs text-muted-foreground">Rutinas en Cache</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{nextWeekCached}</div>
              <div className="text-xs text-muted-foreground">Próxima Semana</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{isHealthy ? '✓' : '⚠'}</div>
              <div className="text-xs text-muted-foreground">Estado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>
                Semana del {formatWeekRange(currentWeek.weekStartDate)}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWeeklyData}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeekIndex(Math.min(selectedWeekIndex + 1, weekData.length - 1))}
                disabled={selectedWeekIndex >= weekData.length - 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedWeekIndex === 0 ? 'Actual' : `Hace ${selectedWeekIndex} semana${selectedWeekIndex > 1 ? 's' : ''}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeekIndex(Math.max(selectedWeekIndex - 1, 0))}
                disabled={selectedWeekIndex <= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Resumen Semanal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{currentWeek.summary.totalWorkouts}</div>
              <div className="text-sm text-muted-foreground">Entrenamientos</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Math.round(currentWeek.summary.totalDurationMinutes / 60 * 10) / 10}h</div>
              <div className="text-sm text-muted-foreground">Tiempo Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{currentWeek.summary.uniqueExercises.length}</div>
              <div className="text-sm text-muted-foreground">Ejercicios Únicos</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{currentWeek.summary.workoutDays.length}</div>
              <div className="text-sm text-muted-foreground">Días Activos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Types Used */}
      {currentWeek.summary.exerciseTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Tipos de Ejercicio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentWeek.summary.exerciseTypes.map((type, index) => (
                <Badge key={index} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Historial de Entrenamientos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentWeek.history.length === 0 ? (
            <div className="text-center py-8">
              <ModernEmoji emoji="💪" size={48} />
              <p className="text-muted-foreground mt-4">No hay entrenamientos registrados esta semana</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWeek.history.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-sm font-medium">{getDayName(workout.workoutDate)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(workout.workoutDate)}</div>
                    </div>
                    <div>
                      <h4 className="font-medium">{workout.exerciseName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {workout.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {workout.exerciseType && (
                      <Badge variant="outline" className="text-xs">
                        {workout.exerciseType}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🎯 Modal de Feedback Pre-Entrenamiento */}
      <PreWorkoutFeedbackModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onSubmit={handlePreWorkoutSubmit}
        workoutName={todayAutoWorkout?.workout?.splitName || "Rutina de Hoy"}
        isLoading={isStartingWorkout}
      />
    </div>
  );
};

export default RutinasTab;
