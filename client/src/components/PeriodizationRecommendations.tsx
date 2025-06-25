import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  Zap,
  Target,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { apiRequest } from '@/lib/queryClient';
import PhaseTransitionGuide from '@/components/PhaseTransitionGuide';

interface PeriodizationRecommendationsProps {
  userId: number;
}

const PeriodizationRecommendations: React.FC<PeriodizationRecommendationsProps> = ({ userId }) => {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const queryClient = useQueryClient();

  // Obtener estado de periodización
  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['periodization-status', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/periodization/status/${userId}`);
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Forzar análisis
  const forceAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/periodization/force-analysis/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodization-status', userId] });
    }
  });

  // Actualizar decisión del usuario
  const updateDecisionMutation = useMutation({
    mutationFn: async ({ analysisId, decision, feedback }: { analysisId: number, decision: string, feedback?: string }) => {
      const response = await apiRequest('PUT', `/api/periodization/decision/${analysisId}`, {
        decision,
        feedback
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodization-status', userId] });
      setShowFeedback(false);
      setFeedback('');
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = statusData?.status;
  const currentAnalysis = statusData?.currentAnalysis;
  const activeRecommendations = statusData?.activeRecommendations;

  const getPhaseEmoji = (phase: string) => {
    switch (phase) {
      case 'strength': return '💪';
      case 'hypertrophy': return '🏗️';
      case 'definition': return '✨';
      case 'recovery': return '🛌';
      default: return '🎯';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'strength': return 'text-red-600 bg-red-50 border-red-200';
      case 'hypertrophy': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'definition': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'recovery': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleDecision = (decision: 'accepted' | 'rejected') => {
    if (!activeRecommendations?.id) return;
    
    updateDecisionMutation.mutate({
      analysisId: activeRecommendations.id,
      decision,
      feedback: feedback.trim() || undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Phase Transition Guide */}
      <PhaseTransitionGuide
        currentPhase={status?.currentPhase || 'hypertrophy'}
        weeksInPhase={status?.weeksInPhase || 0}
        suggestedPhase={activeRecommendations?.recommended_phase}
        showTransition={!!activeRecommendations && activeRecommendations.recommended_action === 'change_phase'}
      />

      {/* Current Phase Status */}
      <Card className={`border-2 ${getPhaseColor(status?.currentPhase)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Estado de Periodización
          </CardTitle>
          <CardDescription>
            Tu fase actual de entrenamiento y progreso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ModernEmoji emoji={getPhaseEmoji(status?.currentPhase)} size={32} />
              <div>
                <div className="text-xl font-bold capitalize">{status?.currentPhase}</div>
                <div className="text-sm text-muted-foreground">
                  Semana {status?.weeksInPhase} de esta fase
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => forceAnalysisMutation.mutate()}
              disabled={forceAnalysisMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${forceAnalysisMutation.isPending ? 'animate-spin' : ''}`} />
              Analizar
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-sm text-muted-foreground">Progreso</div>
              <div className="flex items-center justify-center gap-1">
                {status?.progressTrend === 'improving' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : status?.progressTrend === 'declining' ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-600" />
                )}
                <span className="font-medium capitalize">{status?.progressTrend}</span>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-sm text-muted-foreground">Confianza IA</div>
              <div className="font-bold">
                {Math.round((status?.confidenceScore || 0) * 100)}%
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-sm text-muted-foreground">Estancamiento</div>
              <div className="flex items-center justify-center">
                {status?.stagnationDetected ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Recommendations */}
      {activeRecommendations && (
        <Card className={`border-2 ${getSeverityColor(activeRecommendations.severity || 'medium')}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recomendación de IA
            </CardTitle>
            <CardDescription>
              Análisis detectó patrones que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confianza del Análisis</span>
                <span className="font-mono">
                  {Math.round((activeRecommendations.confidence_score || 0) * 100)}%
                </span>
              </div>
              <Progress value={(activeRecommendations.confidence_score || 0) * 100} className="h-2" />
            </div>

            {/* Recommended Action */}
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Acción Recomendada</span>
              </div>
              <div className="text-lg font-bold mb-2">
                {activeRecommendations.recommended_action === 'change_phase' && '🔄 Cambiar de Fase'}
                {activeRecommendations.recommended_action === 'deload' && '📉 Semana de Descarga'}
                {activeRecommendations.recommended_action === 'rest' && '🛌 Descanso Activo'}
                {activeRecommendations.recommended_action === 'change_exercises' && '🔀 Cambiar Ejercicios'}
                {activeRecommendations.recommended_action === 'continue' && '✅ Continuar Plan'}
              </div>
              {activeRecommendations.recommended_phase && (
                <div className="text-sm text-muted-foreground">
                  Fase sugerida: <span className="font-medium capitalize">{activeRecommendations.recommended_phase}</span>
                </div>
              )}
            </div>

            {/* Indicators */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                Indicadores Detectados
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm">
                    <strong>Tipo:</strong> {activeRecommendations.stagnation_type || 'General'}
                  </div>
                  <div className="text-sm">
                    <strong>Severidad:</strong> {activeRecommendations.severity || 'Medium'}
                  </div>
                </div>
              </div>
            </div>

            {/* User Decision */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">¿Qué quieres hacer?</h4>
              
              {!showFeedback ? (
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleDecision('accepted')}
                    disabled={updateDecisionMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceptar Recomendación
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowFeedback(true)}
                    disabled={updateDecisionMutation.isPending}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Rechazar con Feedback
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="¿Por qué no estás de acuerdo con esta recomendación? (opcional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleDecision('rejected')}
                      disabled={updateDecisionMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowFeedback(false)}
                      disabled={updateDecisionMutation.isPending}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Recommendations */}
      {!activeRecommendations && status?.lastAnalysisDate && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">¡Todo se ve bien!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No hay recomendaciones activas. Tu progreso está en buen camino.
            </p>
            <div className="text-xs text-muted-foreground">
              Último análisis: {new Date(status.lastAnalysisDate).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* First Time */}
      {!status?.lastAnalysisDate && (
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Análisis de Periodización</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ejecuta tu primer análisis para obtener recomendaciones personalizadas de IA.
            </p>
            <Button 
              onClick={() => forceAnalysisMutation.mutate()}
              disabled={forceAnalysisMutation.isPending}
            >
              <Brain className="h-4 w-4 mr-2" />
              Ejecutar Análisis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PeriodizationRecommendations;
