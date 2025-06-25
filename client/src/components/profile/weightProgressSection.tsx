import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Minus, Target, Scale, Edit3, BarChart3 } from 'lucide-react';
import { WeeklyProgressModal } from './WeeklyProgressModal';
import { SetGoalModal } from './SetGoalModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface WeightGoal {
  id: number;
  startWeight: number;
  targetWeight: number;
  goalType: 'gain_weight' | 'lose_weight' | 'maintain';
  targetDate?: string;
  isActive: boolean;
}

interface ProgressEntry {
  id: number;
  weight?: number;
  bodyMeasurements?: {
    waist?: number;
    chest?: number;
    arms?: number;
    thighs?: number;
    neck?: number;
    hips?: number;
  };
  feelingRating?: number;
  notes?: string;
  recordedAt: string;
}

interface ProgressTrends {
  weight: {
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    direction: 'up' | 'down' | 'stable';
  };
  measurements: Record<string, {
    change: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
}

const getTrendIcon = (direction: string, goalType: string) => {
  if (direction === 'stable') return <Minus className="w-4 h-4 text-gray-500" />;

  const isPositive = goalType === 'gain_weight' ? direction === 'up' : direction === 'down';

  if (direction === 'up') {
    return <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />;
  }
  return <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />;
};

const getTrendColor = (direction: string, goalType: string) => {
  if (direction === 'stable') return 'bg-gray-100 text-gray-700';

  const isPositive = goalType === 'gain_weight' ? direction === 'up' : direction === 'down';
  return isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
};

export function WeightProgressSection() {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Auto-create goal from registration data
  const createGoalFromRegistration = useMutation({
    mutationFn: async () => {
      if (!user?.currentWeight || !user?.targetWeight) {
        throw new Error('Missing weight data from registration');
      }

      const goalType = user.targetWeight > user.currentWeight ? 'gain_weight' :
                      user.targetWeight < user.currentWeight ? 'lose_weight' : 'maintain';

      const goalData = {
        startWeight: user.currentWeight,
        targetWeight: user.targetWeight,
        goalType,
        ...(targetDate && { targetDate })
      };

      const response = await fetch('/api/weight-progress/goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify(goalData)
      });

      if (!response.ok) throw new Error('Failed to create goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-goal'] });
      toast.success('Objetivo de peso configurado automáticamente desde tu registro');
    },
    onError: (error) => {
      console.error('Error creating goal:', error);
      toast.error('Error al configurar objetivo de peso');
    }
  });

  // Fetch weight goal
  const { data: goal } = useQuery<WeightGoal>({
    queryKey: ['weight-goal'],
    queryFn: async () => {
      const response = await fetch('/api/weight-progress/goal', {
        headers: authService.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch goal');
      return response.json();
    }
  });

  // Fetch latest progress entry
  const { data: latestEntry } = useQuery<ProgressEntry>({
    queryKey: ['latest-progress'],
    queryFn: async () => {
      const response = await fetch('/api/weight-progress/latest', {
        headers: authService.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch latest progress');
      return response.json();
    }
  });

  // Fetch trends
  const { data: trends } = useQuery<ProgressTrends>({
    queryKey: ['progress-trends'],
    queryFn: async () => {
      const response = await fetch('/api/weight-progress/trends', {
        headers: authService.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    }
  });

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!goal || !latestEntry?.weight) return 0;

    const totalDistance = Math.abs(goal.targetWeight - goal.startWeight);
    const currentDistance = Math.abs(latestEntry.weight - goal.startWeight);
    return Math.min((currentDistance / totalDistance) * 100, 100);
  };

  const progressPercentage = calculateProgress();

  if (!goal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t('preferences.weightBodyProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.currentWeight && user?.targetWeight ? (
            <div className="space-y-6">
              {/* Auto-detected Configuration */}
              <div className="text-center">
                <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('preferences.configureWeightGoal')}</h3>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-3 text-center">
                  Detectamos tus datos del registro:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Peso Actual</p>
                    <p className="text-lg font-bold text-gray-900">{user.currentWeight}kg</p>
                    <p className="text-xs text-gray-500">Desde tu perfil</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-2xl">→</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Peso Objetivo</p>
                    <p className="text-lg font-bold text-blue-900">{user.targetWeight}kg</p>
                    <p className="text-xs text-gray-500">Desde tu perfil</p>
                  </div>
                </div>
              </div>

              {/* Goal Type Auto-Detection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de Objetivo (Auto-detectado)</Label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {user.targetWeight > user.currentWeight ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">Ganar Peso</span>
                      <span className="text-sm">- Aumentar masa muscular o peso corporal</span>
                    </div>
                  ) : user.targetWeight < user.currentWeight ? (
                    <div className="flex items-center gap-2 text-blue-700">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium">Perder Peso</span>
                      <span className="text-sm">- Reducir peso corporal y grasa</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Minus className="w-4 h-4" />
                      <span className="font-medium">Mantener Peso</span>
                      <span className="text-sm">- Mantener peso actual y mejorar composición</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Target Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha Objetivo (Opcional)</Label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="dd/mm/aaaa"
                />
                <p className="text-xs text-gray-500">Deja vacío si no tienes una fecha específica</p>
              </div>

              {/* Progress Preview */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Vista Previa del Progreso</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Inicio: {user.currentWeight}kg</span>
                    <span>Meta: {Math.abs(user.targetWeight - user.currentWeight).toFixed(1)}kg {user.targetWeight > user.currentWeight ? 'ganar' : 'perder'}</span>
                    <span>Objetivo: {user.targetWeight}kg</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-green-600 text-center">
                    Tu progreso se mostrará aquí una vez que comiences a registrar tu peso semanal
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => createGoalFromRegistration.mutate()}
                disabled={createGoalFromRegistration.isPending}
                className="w-full"
                size="lg"
              >
                <Target className="w-5 h-5 mr-2" />
                {createGoalFromRegistration.isPending ? 'Creando Plan...' : 'Crear Plan de Seguimiento'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Set Your Weight Goal</h3>
              <p className="text-gray-600 mb-4">
                No weight data found in your profile. Please update your profile first.
              </p>
              <Button onClick={() => setShowGoalModal(true)}>
                <Target className="w-4 h-4 mr-2" />
                Set Goal Manually
              </Button>
            </div>
          )}
        </CardContent>
        {showGoalModal && (
          <SetGoalModal
            onClose={() => setShowGoalModal(false)}
            onSuccess={() => {
              setShowGoalModal(false);
              queryClient.invalidateQueries({ queryKey: ['weight-goal'] });
            }}
          />
        )}
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('preferences.weightBodyProgress')}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowGoalModal(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              {t('preferences.editGoal')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('preferences.currentWeight')}</p>
                <p className="text-2xl font-bold">{latestEntry?.weight || goal.startWeight}kg</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{t('preferences.target')}</p>
                <p className="text-2xl font-bold">{goal.targetWeight}kg</p>
              </div>
              <div className="text-right">
                {trends?.weight && (
                  <Badge className={getTrendColor(trends.weight.direction, goal.goalType)}>
                    {getTrendIcon(trends.weight.direction, goal.goalType)}
                    <span className="ml-1">
                      {trends.weight.change > 0 ? '+' : ''}{trends.weight.change.toFixed(1)}kg
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('preferences.started')}: {goal.startWeight}kg</span>
                <span>{progressPercentage.toFixed(0)}% {t('preferences.toGoal')}</span>
                <span>{t('preferences.goal')}: {goal.targetWeight}kg</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>

          {/* Weekly Comparison */}
          {latestEntry && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Esta Semana</h4>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-blue-900">{latestEntry.weight}kg</p>
                  {latestEntry.bodyMeasurements?.waist && (
                    <p className="text-sm text-blue-700 flex items-center"><ModernEmoji emoji="📏" size={14} className="mr-1" /> Cintura: {latestEntry.bodyMeasurements.waist}cm</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Tendencia</h4>
                <div className="space-y-1">
                  {trends?.weight && (
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trends.weight.direction, goal.goalType)}
                      <span className="text-sm font-medium">
                        {trends.weight.change > 0 ? '+' : ''}{trends.weight.change.toFixed(1)}kg
                      </span>
                    </div>
                  )}
                  {trends?.measurements?.waist && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex items-center"><ModernEmoji emoji="💪" size={14} className="mr-1" /> Waist: {trends.measurements.waist.change > 0 ? '+' : ''}{trends.measurements.waist.change.toFixed(1)}cm</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => setShowProgressModal(true)} className="flex-1">
              <Scale className="w-4 h-4 mr-2" />
              Registrar Progreso Semanal
            </Button>
            <Button variant="outline" className="flex-1">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Historial Completo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showProgressModal && (
        <WeeklyProgressModal
          onClose={() => setShowProgressModal(false)}
          onSuccess={() => {
            setShowProgressModal(false);
            queryClient.invalidateQueries({ queryKey: ['latest-progress'] });
            queryClient.invalidateQueries({ queryKey: ['progress-trends'] });
          }}
          currentGoal={goal}
        />
      )}

      {showGoalModal && (
        <SetGoalModal
          onClose={() => setShowGoalModal(false)}
          onSuccess={() => {
            setShowGoalModal(false);
            queryClient.invalidateQueries({ queryKey: ['weight-goal'] });
          }}
          existingGoal={goal}
        />
      )}
    </>
  );
}
