import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  Target, 
  Zap, 
  TrendingUp, 
  Clock, 
  Repeat,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface PhaseInfo {
  name: string;
  emoji: string;
  duration: string;
  reps: string;
  sets: string;
  rest: string;
  intensity: string;
  goals: string[];
  benefits: string[];
  indicators: string[];
}

interface PhaseTransitionGuideProps {
  currentPhase: string;
  weeksInPhase: number;
  suggestedPhase?: string;
  showTransition?: boolean;
}

const PhaseTransitionGuide: React.FC<PhaseTransitionGuideProps> = ({
  currentPhase,
  weeksInPhase,
  suggestedPhase,
  showTransition = false
}) => {
  const phases: Record<string, PhaseInfo> = {
    strength: {
      name: 'Fuerza',
      emoji: '💪',
      duration: '4-6 semanas',
      reps: '1-5 reps',
      sets: '3-5 sets',
      rest: '3-5 minutos',
      intensity: '85-95% 1RM',
      goals: ['Aumentar fuerza máxima', 'Mejorar potencia', 'Desarrollar sistema nervioso'],
      benefits: ['Mayor capacidad de carga', 'Mejor coordinación neuromuscular', 'Base para otras fases'],
      indicators: ['Pesos más altos', 'Mejor técnica', 'Mayor confianza']
    },
    hypertrophy: {
      name: 'Hipertrofia',
      emoji: '🏗️',
      duration: '6-8 semanas',
      reps: '6-12 reps',
      sets: '3-4 sets',
      rest: '60-90 segundos',
      intensity: '65-80% 1RM',
      goals: ['Aumentar masa muscular', 'Mejorar volumen', 'Desarrollar resistencia muscular'],
      benefits: ['Mayor tamaño muscular', 'Mejor metabolismo', 'Apariencia más atlética'],
      indicators: ['Músculos más grandes', 'Mayor resistencia', 'Mejor pump']
    },
    definition: {
      name: 'Definición',
      emoji: '✨',
      duration: '4-6 semanas',
      reps: '12-20 reps',
      sets: '2-4 sets',
      rest: '30-60 segundos',
      intensity: '50-70% 1RM',
      goals: ['Reducir grasa corporal', 'Mejorar definición', 'Mantener masa muscular'],
      benefits: ['Músculos más definidos', 'Mejor vascularización', 'Mayor resistencia'],
      indicators: ['Menos grasa corporal', 'Músculos más marcados', 'Mayor resistencia cardiovascular']
    },
    recovery: {
      name: 'Recuperación',
      emoji: '🛌',
      duration: '1-2 semanas',
      reps: '8-15 reps',
      sets: '2-3 sets',
      rest: '60-120 segundos',
      intensity: '40-60% 1RM',
      goals: ['Recuperación activa', 'Prevenir sobreentrenamiento', 'Preparar siguiente fase'],
      benefits: ['Mejor recuperación', 'Reducir fatiga', 'Prevenir lesiones'],
      indicators: ['Menos fatiga', 'Mejor sueño', 'Mayor motivación']
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'strength': return 'border-red-200 bg-red-50';
      case 'hypertrophy': return 'border-blue-200 bg-blue-50';
      case 'definition': return 'border-purple-200 bg-purple-50';
      case 'recovery': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPhaseProgress = (weeks: number, maxWeeks: number) => {
    return Math.min((weeks / maxWeeks) * 100, 100);
  };

  const getMaxWeeks = (phase: string) => {
    switch (phase) {
      case 'strength': return 6;
      case 'hypertrophy': return 8;
      case 'definition': return 6;
      case 'recovery': return 2;
      default: return 6;
    }
  };

  const currentPhaseInfo = phases[currentPhase] || phases.hypertrophy;
  const suggestedPhaseInfo = suggestedPhase ? phases[suggestedPhase] : null;
  const maxWeeks = getMaxWeeks(currentPhase);
  const progress = getPhaseProgress(weeksInPhase, maxWeeks);

  return (
    <div className="space-y-6">
      {/* Current Phase Status */}
      <Card className={`border-2 ${getPhaseColor(currentPhase)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ModernEmoji emoji={currentPhaseInfo.emoji} size={24} />
            Fase Actual: {currentPhaseInfo.name}
          </CardTitle>
          <CardDescription>
            Semana {weeksInPhase} de {currentPhaseInfo.duration}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de la fase</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Inicio</span>
              <span>{progress >= 100 ? 'Completada' : 'En progreso'}</span>
            </div>
          </div>

          {/* Phase Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <Repeat className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-xs text-muted-foreground">Repeticiones</div>
              <div className="font-bold text-sm">{currentPhaseInfo.reps}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Target className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <div className="text-xs text-muted-foreground">Sets</div>
              <div className="font-bold text-sm">{currentPhaseInfo.sets}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <div className="text-xs text-muted-foreground">Descanso</div>
              <div className="font-bold text-sm">{currentPhaseInfo.rest}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Zap className="h-4 w-4 mx-auto mb-1 text-orange-600" />
              <div className="text-xs text-muted-foreground">Intensidad</div>
              <div className="font-bold text-sm">{currentPhaseInfo.intensity}</div>
            </div>
          </div>

          {/* Goals and Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Objetivos
              </h4>
              <div className="space-y-1">
                {currentPhaseInfo.goals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {goal}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Beneficios
              </h4>
              <div className="space-y-1">
                {currentPhaseInfo.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Transition Suggestion */}
      {showTransition && suggestedPhaseInfo && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Transición Sugerida
            </CardTitle>
            <CardDescription>
              La IA recomienda cambiar a la siguiente fase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transition Flow */}
            <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg border">
              <div className="text-center">
                <ModernEmoji emoji={currentPhaseInfo.emoji} size={32} />
                <div className="font-medium mt-1">{currentPhaseInfo.name}</div>
                <Badge variant="outline">{weeksInPhase} semanas</Badge>
              </div>
              <ArrowRight className="h-8 w-8 text-orange-600" />
              <div className="text-center">
                <ModernEmoji emoji={suggestedPhaseInfo.emoji} size={32} />
                <div className="font-medium mt-1">{suggestedPhaseInfo.name}</div>
                <Badge variant="default">Recomendada</Badge>
              </div>
            </div>

            {/* Why This Transition */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                ¿Por qué esta transición?
              </h4>
              <div className="text-sm space-y-2">
                {currentPhase === 'strength' && suggestedPhase === 'hypertrophy' && (
                  <p>Has desarrollado una buena base de fuerza. Es momento de aprovechar esa fuerza para construir masa muscular con mayor volumen de entrenamiento.</p>
                )}
                {currentPhase === 'hypertrophy' && suggestedPhase === 'definition' && (
                  <p>Has ganado masa muscular significativa. Ahora puedes enfocarte en definir y mostrar esos músculos que has construido.</p>
                )}
                {currentPhase === 'definition' && suggestedPhase === 'strength' && (
                  <p>Has mejorado tu definición muscular. Es momento de volver a construir fuerza para el próximo ciclo de crecimiento.</p>
                )}
                {suggestedPhase === 'recovery' && (
                  <p>Los indicadores muestran fatiga acumulada. Una fase de recuperación activa te ayudará a regenerarte y prepararte para el próximo ciclo.</p>
                )}
              </div>
            </div>

            {/* Next Phase Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <Repeat className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="text-xs text-muted-foreground">Nuevas Reps</div>
                <div className="font-bold text-sm">{suggestedPhaseInfo.reps}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <Target className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="text-xs text-muted-foreground">Nuevos Sets</div>
                <div className="font-bold text-sm">{suggestedPhaseInfo.sets}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                <div className="text-xs text-muted-foreground">Nuevo Descanso</div>
                <div className="font-bold text-sm">{suggestedPhaseInfo.rest}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <Zap className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                <div className="text-xs text-muted-foreground">Nueva Intensidad</div>
                <div className="font-bold text-sm">{suggestedPhaseInfo.intensity}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Phases Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-purple-600" />
            Ciclo Completo de Periodización
          </CardTitle>
          <CardDescription>
            Comprende cómo funciona cada fase en tu desarrollo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(phases).map(([key, phase]) => (
              <div 
                key={key} 
                className={`p-4 rounded-lg border-2 ${
                  key === currentPhase ? getPhaseColor(key) : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-center mb-3">
                  <ModernEmoji emoji={phase.emoji} size={24} />
                  <div className="font-bold mt-1">{phase.name}</div>
                  <div className="text-xs text-muted-foreground">{phase.duration}</div>
                  {key === currentPhase && (
                    <Badge variant="default" className="mt-1">Actual</Badge>
                  )}
                  {key === suggestedPhase && (
                    <Badge variant="secondary" className="mt-1">Sugerida</Badge>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div><strong>Reps:</strong> {phase.reps}</div>
                  <div><strong>Intensidad:</strong> {phase.intensity}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhaseTransitionGuide;
