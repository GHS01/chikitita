import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface AdherenceData {
  completionRate: number;
  streakDays: number;
  averageWorkoutDuration: number;
  preferredWorkoutTimes: string[];
  missedWorkouts: number;
  totalPlannedWorkouts: number;
  weeklyPattern?: number[]; // Array of 7 numbers representing completion rate for each day of week
  monthlyTrend?: number[]; // Array representing monthly adherence trend
  // ✅ RESTAURADO: Sistema original sin días disponibles separados
}

interface AdherenceChartProps {
  data: AdherenceData;
  period?: number; // 7, 30, 90 days
}

const AdherenceChart: React.FC<AdherenceChartProps> = ({ data, period = 30 }) => {
  const completedWorkouts = data.totalPlannedWorkouts - data.missedWorkouts;
  const adherenceLevel = data.completionRate >= 90 ? 'excellent' : 
                        data.completionRate >= 75 ? 'good' : 
                        data.completionRate >= 50 ? 'fair' : 'needs-improvement';

  const getAdherenceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getAdherenceMessage = (level: string) => {
    switch (level) {
      case 'excellent': return '¡Excelente consistencia! 🔥';
      case 'good': return 'Muy buena adherencia 💪';
      case 'fair': return 'Adherencia regular 📈';
      default: return 'Necesita mejorar 🎯';
    }
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // ✅ RESTAURADO: Mostrar todos los días de la semana
  const daysToShow = dayKeys.map((key, index) => ({
    key,
    name: dayNames[index],
    index,
    rate: data.weeklyPattern ? data.weeklyPattern[index] : 0
  }));

  return (
    <div className="space-y-6">
      {/* Adherence Overview */}
      <Card className={`border-2 ${getAdherenceColor(adherenceLevel)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resumen de Adherencia
          </CardTitle>
          <CardDescription>
            Tu consistencia en los últimos {period} días
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {Math.round(data.completionRate)}%
            </div>
            <div className="text-sm font-medium mb-3">
              {getAdherenceMessage(adherenceLevel)}
            </div>
            <Progress value={data.completionRate} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedWorkouts}
              </div>
              <div className="text-xs text-green-600">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.missedWorkouts}
              </div>
              <div className="text-xs text-red-600">Perdidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.streakDays}
              </div>
              <div className="text-xs text-blue-600">Racha (días)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Pattern */}
      {data.weeklyPattern && data.weeklyPattern.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Patrón Semanal
            </CardTitle>
            <CardDescription>
              Días de la semana con mejor adherencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-2 ${daysToShow.length <= 3 ? 'grid-cols-3' : daysToShow.length <= 4 ? 'grid-cols-4' : daysToShow.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
              {daysToShow.map((day) => (
                <div key={day.key} className="text-center">
                  <div className="text-xs font-medium mb-2">{day.name}</div>
                  <div className="relative">
                    <div
                      className={`h-16 rounded-lg flex items-end justify-center text-xs font-bold text-white ${
                        day.rate >= 80 ? 'bg-green-500' :
                        day.rate >= 60 ? 'bg-blue-500' :
                        day.rate >= 40 ? 'bg-yellow-500' :
                        day.rate > 0 ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                      style={{ height: `${Math.max(20, day.rate || 20)}px` }}
                    >
                      {day.rate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {daysToShow.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Mejor día: <span className="font-medium">
                    {daysToShow.reduce((best, current) => current.rate > best.rate ? current : best, daysToShow[0]).name}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo se muestran tus días de entrenamiento configurados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Patrón Semanal
            </CardTitle>
            <CardDescription>
              Días de la semana con mejor adherencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">¡Comienza a entrenar!</p>
              <p className="text-sm text-gray-500 mt-2">
                Después de algunas sesiones verás tu patrón semanal aquí
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Horarios de Entrenamiento
          </CardTitle>
          <CardDescription>
            Tus patrones de horarios preferidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {data.preferredWorkoutTimes.map((time, index) => (
              <div key={time} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-blue-600' : 
                    index === 1 ? 'bg-blue-500' : 'bg-blue-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{time}</span>
                </div>
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  {index === 0 ? 'Favorito' : 
                   index === 1 ? 'Alternativo' : 'Ocasional'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Duración Promedio</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-bold text-purple-600">
                  {Math.round(data.averageWorkoutDuration)} min
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adherence Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Insights de Adherencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.completionRate >= 90 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">¡Excelente consistencia!</p>
                  <p className="text-sm text-green-600">
                    Mantienes una adherencia superior al 90%. ¡Sigue así!
                  </p>
                </div>
              </div>
            )}

            {data.streakDays >= 7 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <ModernEmoji emoji="🔥" size={20} />
                <div>
                  <p className="font-medium text-blue-800">Racha impresionante</p>
                  <p className="text-sm text-blue-600">
                    {data.streakDays} días consecutivos de entrenamiento. ¡Increíble disciplina!
                  </p>
                </div>
              </div>
            )}

            {data.completionRate < 50 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Oportunidad de mejora</p>
                  <p className="text-sm text-red-600">
                    Tu adherencia está por debajo del 50%. Considera ajustar tu plan de entrenamiento.
                  </p>
                </div>
              </div>
            )}

            {data.averageWorkoutDuration < 30 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Entrenamientos cortos</p>
                  <p className="text-sm text-yellow-600">
                    Tus entrenamientos duran menos de 30 minutos. Considera sesiones más largas para mejores resultados.
                  </p>
                </div>
              </div>
            )}

            {data.averageWorkoutDuration > 90 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Entrenamientos largos</p>
                  <p className="text-sm text-purple-600">
                    Tus entrenamientos duran más de 90 minutos. Asegúrate de no sobreentrenarte.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdherenceChart;
