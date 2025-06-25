/**
 * 💪 Recovery Dashboard Component
 * Dashboard de recuperación muscular con visualización científica
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, Zap, Target, Calendar 
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { ScientificTooltip, RecoveryTooltip, MuscleGroupTooltip } from './scientific-tooltip';

interface RecoveryDashboardProps {
  recoveryData: {
    recoveryStatus: {
      [muscle: string]: {
        muscle_group: string;
        recovery_status: 'ready' | 'recovering' | 'overdue';
        next_available_date: string;
        last_trained_date?: string;
      };
    };
    statistics: {
      totalMuscles: number;
      readyMuscles: number;
      recoveringMuscles: number;
      readyPercentage: number;
    };
    todayRecommendation: string;
    optimalWorkout: any;
  };
  onMuscleClick?: (muscle: string) => void;
}

export function RecoveryDashboard({ recoveryData, onMuscleClick }: RecoveryDashboardProps) {
  const { recoveryStatus, statistics, todayRecommendation, optimalWorkout } = recoveryData;

  const getMuscleEmoji = (muscle: string) => {
    const emojis: { [key: string]: string } = {
      chest: '💪',
      back: '🏋️',
      shoulders: '🤸',
      arms: '💪',
      quads: '🦵',
      hamstrings: '🦵',
      glutes: '🍑',
      calves: '🦵',
      abs: '🔥'
    };
    return emojis[muscle] || '💪';
  };

  const getMuscleDisplayName = (muscle: string) => {
    const names: { [key: string]: string } = {
      chest: 'Pecho',
      back: 'Espalda',
      shoulders: 'Hombros',
      arms: 'Brazos',
      quads: 'Cuádriceps',
      hamstrings: 'Isquiotibiales',
      glutes: 'Glúteos',
      calves: 'Gemelos',
      abs: 'Abdominales'
    };
    return names[muscle] || muscle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'recovering':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'recovering':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateHoursUntilReady = (nextAvailableDate: string) => {
    const now = new Date();
    const nextDate = new Date(nextAvailableDate);
    const diffMs = nextDate.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    return diffHours;
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Músculos Listos</p>
                <p className="text-2xl font-bold text-green-600">{statistics.readyMuscles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Recuperación</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.recoveringMuscles}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">% Disponible</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.readyPercentage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Grupos</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.totalMuscles}</p>
              </div>
              <Activity className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Estado General de Recuperación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Músculos disponibles para entrenar</span>
              <span className="text-sm text-muted-foreground">{statistics.readyPercentage}%</span>
            </div>
            <Progress value={statistics.readyPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{statistics.readyMuscles} listos</span>
              <span>{statistics.recoveringMuscles} en recuperación</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado detallado por grupo muscular */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Estado por Grupo Muscular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(recoveryStatus).map(([muscle, status]) => {
              const hoursUntilReady = calculateHoursUntilReady(status.next_available_date);
              
              return (
                <MuscleGroupTooltip key={muscle} muscleGroup={muscle}>
                  <div
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
                      ${getStatusColor(status.recovery_status)}
                    `}
                    onClick={() => onMuscleClick?.(muscle)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <ModernEmoji emoji={getMuscleEmoji(muscle)} size={20} className="mr-2" />
                        <span className="font-medium text-sm">{getMuscleDisplayName(muscle)}</span>
                      </div>
                      {getStatusIcon(status.recovery_status)}
                    </div>

                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {status.recovery_status === 'ready' ? 'Listo' : 
                         status.recovery_status === 'recovering' ? 'Recuperando' : 'Atrasado'}
                      </Badge>

                      {status.recovery_status === 'recovering' && hoursUntilReady > 0 && (
                        <RecoveryTooltip hours={hoursUntilReady}>
                          <div className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {hoursUntilReady}h restantes
                          </div>
                        </RecoveryTooltip>
                      )}

                      {status.last_trained_date && (
                        <div className="text-xs text-muted-foreground">
                          Último: {new Date(status.last_trained_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </MuscleGroupTooltip>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recomendación para hoy */}
      {optimalWorkout && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Recomendación para Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Entrenamiento Óptimo</p>
                    <p className="text-sm text-blue-700">{optimalWorkout.split_name}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Explicación científica:</p>
                <p>{todayRecommendation}</p>
              </div>

              {optimalWorkout.muscle_groups && (
                <div>
                  <p className="text-sm font-medium mb-2">Grupos musculares a entrenar:</p>
                  <div className="flex flex-wrap gap-2">
                    {optimalWorkout.muscle_groups.map((muscle: string) => (
                      <Badge key={muscle} variant="secondary">
                        <ModernEmoji emoji={getMuscleEmoji(muscle)} size={14} className="mr-1" />
                        {getMuscleDisplayName(muscle)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información educativa */}
      <Card>
        <CardContent className="p-4">
          <ScientificTooltip
            title="Sistema de Recuperación Muscular"
            explanation="Este dashboard te ayuda a optimizar tu entrenamiento respetando los tiempos de recuperación científicamente probados."
            benefits={[
              'Prevención del sobreentrenamiento',
              'Máxima síntesis proteica',
              'Progreso sostenible',
              'Reducción del riesgo de lesiones'
            ]}
            scientificBasis="La recuperación muscular completa requiere 48-72h según el volumen e intensidad. Durante este tiempo ocurre la síntesis proteica y adaptaciones neuromusculares."
            type="science"
          >
            <div className="text-center text-sm text-muted-foreground cursor-help">
              <Calendar className="h-4 w-4 inline mr-1" />
              Sistema basado en fisiología del ejercicio
            </div>
          </ScientificTooltip>
        </CardContent>
      </Card>
    </div>
  );
}
