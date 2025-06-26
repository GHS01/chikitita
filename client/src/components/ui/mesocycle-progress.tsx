/**
 * 🔄 Mesocycle Progress Component
 * Visualización del progreso del mesociclo con información educativa
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Calendar, Target, RotateCcw,
  CheckCircle, Clock, Zap, Info, RefreshCw, Edit
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { ScientificTooltip, MesocycleTooltip } from './scientific-tooltip';
import { useQueryClient } from '@tanstack/react-query';
import { useMesocycleState, useMesocycleUITexts } from '@/hooks/useMesocycleStatus';

interface MesocycleProgressProps {
  mesocycle: {
    id: number;
    mesocycle_name: string;
    start_date: string;
    end_date: string;
    duration_weeks: number;
    split_type: string;
    status: string;
    progress?: {
      currentWeek: number;
      totalWeeks: number;
      elapsedDays: number;
      remainingDays: number;
      progressPercentage: number;
      intelligentProgress?: {
        temporalProgress: number;
        workoutProgress: number;
        consistencyFactor: number;
        details: {
          completedWorkouts: number;
          expectedWorkouts: number;
          weeklyConsistency: number;
          participationRate: number;
        };
      };
    };
  } | null;
  onCreateNew?: () => void;
  onEditMesocycle?: () => void; // 🚨 NUEVA PROP PARA EDITAR MESOCICLO
  onAutoProgress?: () => void;
  showActions?: boolean;
  onRefresh?: () => void;
}

export function MesocycleProgress({
  mesocycle,
  onCreateNew,
  onEditMesocycle, // 🚨 NUEVA PROP
  onAutoProgress,
  showActions = true,
  onRefresh
}: MesocycleProgressProps) {
  const queryClient = useQueryClient();

  // 🔍 Obtener estado del mesociclo desde el backend
  const { canCreateNew, mustEdit, hasActiveMesocycle, isLoading } = useMesocycleState();
  const uiTexts = useMesocycleUITexts();

  // 🚨 UI CONDICIONAL BASADA EN ESTADO DEL MESOCICLO
  if (!mesocycle && canCreateNew) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            {uiTexts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ModernEmoji emoji="🎯" size={48} className="mb-4" />
            <p className="text-muted-foreground mb-4">
              {uiTexts.description}
            </p>
            <ScientificTooltip
              title="Configuración de Mesociclo"
              explanation="Te guiaremos paso a paso para elegir el split científico perfecto para ti. Luego crearemos tu mesociclo de 6-8 semanas."
              benefits={[
                'Eliges tu split preferido',
                'Configuración personalizada',
                'Base científica sólida',
                'Progresión automática'
              ]}
              scientificBasis="La configuración inicial determina el éxito del mesociclo. Elegir el split correcto es fundamental para maximizar resultados."
              type="science"
            >
              <Button onClick={onCreateNew} className="w-full" disabled={isLoading}>
                <Target className="h-4 w-4 mr-2" />
                {uiTexts.primaryButtonText}
              </Button>
            </ScientificTooltip>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🚨 MOSTRAR OPCIÓN DE EDITAR SI DEBE EDITAR MESOCICLO EXISTENTE
  if (!mesocycle && mustEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            {uiTexts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ModernEmoji emoji="✏️" size={48} className="mb-4" />
            <p className="text-muted-foreground mb-4">
              {uiTexts.description}
            </p>
            <ScientificTooltip
              title="Editar Mesociclo"
              explanation="Puedes modificar los días de entrenamiento de tu mesociclo activo sin perder el progreso."
              benefits={[
                'Mantiene tu progreso actual',
                'Ajusta días de entrenamiento',
                'Flexibilidad total',
                'Sin perder datos'
              ]}
              scientificBasis="La flexibilidad en la programación permite adaptarse a cambios en la disponibilidad sin comprometer los resultados."
              type="science"
            >
              <Button onClick={onEditMesocycle} className="w-full" disabled={isLoading}>
                <Edit className="h-4 w-4 mr-2" />
                {uiTexts.primaryButtonText}
              </Button>
            </ScientificTooltip>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🚨 ESTADO DE CARGA
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Verificando Mesociclo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ModernEmoji emoji="⏳" size={48} className="mb-4" />
            <p className="text-muted-foreground mb-4">
              Verificando el estado de tu mesociclo...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { progress } = mesocycle;



  const isNearEnd = progress && progress.remainingDays <= 7;
  const isCompleted = progress && progress.progressPercentage >= 100;

  const getSplitTypeDisplay = (splitType: string) => {
    const types = {
      'body_part_split': { name: 'Split por Grupos', emoji: '💪', color: 'bg-blue-100 text-blue-800' },
      'push_pull_legs': { name: 'Push/Pull/Legs', emoji: '🔄', color: 'bg-green-100 text-green-800' },
      'upper_lower': { name: 'Upper/Lower', emoji: '⚖️', color: 'bg-purple-100 text-purple-800' }
    };
    return types[splitType as keyof typeof types] || { name: splitType, emoji: '🏋️', color: 'bg-gray-100 text-gray-800' };
  };

  const splitDisplay = getSplitTypeDisplay(mesocycle.split_type);

  return (
    <Card className={`${isCompleted ? 'border-green-500 bg-green-50' : isNearEnd ? 'border-orange-500 bg-orange-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Mesociclo Actual
          </div>
          <Badge className={splitDisplay.color}>
            <ModernEmoji emoji={splitDisplay.emoji} size={14} className="mr-1" />
            {splitDisplay.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">

        {/* Información del mesociclo */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm font-medium">Nombre:</span>
            <span className="text-xs sm:text-sm text-muted-foreground truncate">{mesocycle.mesocycle_name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm font-medium">Duración:</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{mesocycle.duration_weeks} semanas</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm font-medium">Período:</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {new Date(mesocycle.start_date).toLocaleDateString()} - {new Date(mesocycle.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Progreso visual */}
        {progress && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
              <MesocycleTooltip
                currentWeek={progress.currentWeek}
                totalWeeks={progress.totalWeeks}
                progressPercentage={progress.progressPercentage} // 🚨 PASAR EL PROGRESO REAL
              >
                <span className="text-xs sm:text-sm font-medium">Progreso</span>
              </MesocycleTooltip>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Semana {progress.currentWeek} de {progress.totalWeeks}
              </span>
            </div>

            <Progress
              value={progress.progressPercentage}
              className={`h-2 sm:h-3 ${isCompleted ? 'bg-green-100' : isNearEnd ? 'bg-orange-100' : ''}`}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.elapsedDays} días transcurridos</span>
              <span>{progress.remainingDays} días restantes</span>
            </div>

            {/* 🧠 Información del progreso inteligente */}
            {progress.intelligentProgress && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Zap className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Análisis Inteligente</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Entrenamientos:</span>
                    <span className="font-medium text-blue-800">
                      {progress.intelligentProgress.details.completedWorkouts}/{progress.intelligentProgress.details.expectedWorkouts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Consistencia:</span>
                    <span className="font-medium text-blue-800">
                      {progress.intelligentProgress.details.participationRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Por semana:</span>
                    <span className="font-medium text-blue-800">
                      {progress.intelligentProgress.details.weeklyConsistency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Progreso real:</span>
                    <span className="font-medium text-blue-800">
                      {progress.intelligentProgress.workoutProgress}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado y acciones */}
        <div className="space-y-3">
          {isCompleted && (
            <div className="flex items-center p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">¡Mesociclo Completado!</p>
                <p className="text-xs text-green-700">Es hora de cambiar el tipo de entrenamiento</p>
              </div>
            </div>
          )}

          {isNearEnd && !isCompleted && (
            <div className="flex items-center p-3 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800">Última Semana</p>
                <p className="text-xs text-orange-700">Prepárate para el siguiente mesociclo</p>
              </div>
            </div>
          )}

          {!isNearEnd && !isCompleted && progress && (
            <div className="flex items-center p-3 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">En Progreso</p>
                <p className="text-xs text-blue-700">
                  {progress.progressPercentage}% completado
                  {progress.intelligentProgress && progress.intelligentProgress.details.completedWorkouts === 0
                    ? ' - ¡Comienza tu primer entrenamiento!'
                    : progress.intelligentProgress && progress.intelligentProgress.details.participationRate < 50
                    ? ' - Mantén la consistencia'
                    : ' - ¡Excelente progreso!'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            {(isCompleted || isNearEnd) && onAutoProgress && (
              <ScientificTooltip
                title="Progresión Automática"
                explanation="El sistema cambiará automáticamente a un nuevo tipo de split para evitar estancamiento y continuar progresando."
                benefits={[
                  'Previene plateaus',
                  'Nuevos estímulos musculares',
                  'Motivación renovada'
                ]}
                scientificBasis="La variación periódica del entrenamiento es esencial para adaptaciones continuas según el principio de sobrecarga progresiva."
                type="science"
              >
                <Button onClick={onAutoProgress} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Siguiente Mesociclo
                </Button>
              </ScientificTooltip>
            )}

            {/* 🚨 BOTÓN CONDICIONAL: Editar en lugar de Nuevo Mesociclo */}
            {mustEdit && onEditMesocycle && (
              <Button variant="outline" onClick={onEditMesocycle} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Editar Mesociclo
              </Button>
            )}

            {/* 🚨 OCULTAR BOTÓN DE NUEVO MESOCICLO SI HAY UNO ACTIVO */}
            {canCreateNew && onCreateNew && (
              <Button variant="outline" onClick={onCreateNew} className="flex-1">
                <Target className="h-4 w-4 mr-2" />
                Nuevo Mesociclo
              </Button>
            )}
          </div>
        )}

        {/* Información educativa adicional */}
        <div className="pt-3 border-t">
          <ScientificTooltip
            title="Beneficios del Sistema de Mesociclos"
            explanation="Los mesociclos estructurados maximizan tus resultados mediante variación científica del entrenamiento."
            benefits={[
              'Progresión sistemática y medible',
              'Prevención del estancamiento',
              'Adaptaciones específicas por período',
              'Mayor adherencia al programa'
            ]}
            scientificBasis="La periodización por mesociclos está respaldada por décadas de investigación en ciencias del deporte y fisiología del ejercicio."
            type="info"
          >
            <div className="flex items-center text-xs text-muted-foreground cursor-help">
              <Info className="h-3 w-3 mr-1" />
              ¿Por qué usar mesociclos?
            </div>
          </ScientificTooltip>
        </div>
      </CardContent>
    </Card>
  );
}
