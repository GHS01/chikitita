import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Clock, AlertTriangle, CheckCircle, Settings, Zap } from 'lucide-react';

interface IntelligentAssignment {
  day: string;
  splitId: number;
  splitName: string;
  splitType: string;
  muscleGroups: string[];
  autoAssigned: boolean;
  recoveryHours: number;
  scientificReason: string;
}

interface AssignmentResult {
  assignments: IntelligentAssignment[];
  scientificRationale: string;
  recoveryPattern: string;
  canOverride: boolean;
  warnings: string[];
}

interface IntelligentSplitAssignmentProps {
  weeklyFrequency: number;
  availableDays: string[];
  onAssignmentApplied: (assignments: IntelligentAssignment[]) => void;
  onManualOverride: () => void;
}

const dayNames = {
  monday: 'Lunes',
  tuesday: 'Martes', 
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const splitTypeColors = {
  push_pull_legs: 'bg-blue-100 text-blue-800',
  body_part_split: 'bg-purple-100 text-purple-800',
  upper_lower: 'bg-green-100 text-green-800',
  full_body: 'bg-orange-100 text-orange-800',
  rest: 'bg-gray-100 text-gray-800'
};

export default function IntelligentSplitAssignment({
  weeklyFrequency,
  availableDays,
  onAssignmentApplied,
  onManualOverride
}: IntelligentSplitAssignmentProps) {
  const [assignment, setAssignment] = useState<AssignmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (weeklyFrequency >= 5) {
      generateIntelligentAssignment();
    }
  }, [weeklyFrequency, availableDays]);

  const generateIntelligentAssignment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/splits/intelligent-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weeklyFrequency,
          availableDays
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate intelligent assignment');
      }

      const data = await response.json();
      setAssignment(data);
    } catch (error) {
      console.error('Error generating intelligent assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyAssignment = async () => {
    if (!assignment) return;

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/splits/apply-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignments: assignment.assignments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply assignment');
      }

      const result = await response.json();
      if (result.success) {
        onAssignmentApplied(assignment.assignments);
      }
    } catch (error) {
      console.error('Error applying assignment:', error);
    } finally {
      setApplying(false);
    }
  };

  if (weeklyFrequency < 5) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración Manual</span>
          </CardTitle>
          <CardDescription>
            Para {weeklyFrequency} días se recomienda configuración manual para máxima personalización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onManualOverride} className="w-full">
            Configurar Manualmente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 p-3 sm:p-6">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          <span className="ml-0 sm:ml-2 mt-2 sm:mt-0 text-xs sm:text-sm text-center">
            Generando asignación inteligente...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6 sm:py-8 p-3 sm:p-6">
          <Button onClick={generateIntelligentAssignment} className="text-xs sm:text-sm">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Generar Asignación Inteligente</span>
            <span className="sm:hidden">Generar Asignación</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con lógica científica */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm sm:text-base">Asignación Inteligente - {weeklyFrequency} Días</span>
            </div>
            <Badge variant="secondary" className="text-xs w-fit">
              <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
              Automático
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {assignment.scientificRationale}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{assignment.recoveryPattern}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencias si las hay */}
      {assignment.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {assignment.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Asignaciones por día */}
      <div className="space-y-3 sm:space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
        {assignment.assignments.map((dayAssignment, index) => (
          <Card key={dayAssignment.day} className="relative">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-lg">
                  {dayNames[dayAssignment.day as keyof typeof dayNames]}
                </CardTitle>
                {dayAssignment.autoAssigned && (
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1 flex-shrink-0" />
                    Auto
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
              {dayAssignment.splitId > 0 ? (
                <>
                  <div>
                    <Badge className={`text-xs ${splitTypeColors[dayAssignment.splitType as keyof typeof splitTypeColors]}`}>
                      {dayAssignment.splitName}
                    </Badge>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-xs sm:text-sm text-gray-600">
                      <strong>Músculos:</strong>
                      <span className="block sm:inline sm:ml-1 text-xs">
                        {dayAssignment.muscleGroups.join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>Recuperación: {dayAssignment.recoveryHours}h</span>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded text-left">
                      {dayAssignment.scientificReason}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-3 sm:py-4">
                  <Badge variant="outline" className="bg-gray-50 text-xs">
                    {dayAssignment.splitName}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1 sm:mt-2 px-2">
                    {dayAssignment.scientificReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <Button
          onClick={applyAssignment}
          disabled={applying}
          className="flex-1 text-xs sm:text-sm"
        >
          {applying ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
              <span className="hidden sm:inline">Aplicando...</span>
              <span className="sm:hidden">Aplicando</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Aplicar Asignación Inteligente</span>
              <span className="sm:hidden">Aplicar Asignación</span>
            </>
          )}
        </Button>

        {assignment.canOverride && (
          <Button
            variant="outline"
            onClick={onManualOverride}
            className="flex-1 text-xs sm:text-sm"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Configurar Manualmente</span>
            <span className="sm:hidden">Configurar</span>
          </Button>
        )}
      </div>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-3 sm:pt-4 p-3 sm:p-6">
          <div className="flex items-start space-x-2">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-blue-800">
              <strong>¿Por qué esta configuración?</strong>
              <p className="mt-1">
                Esta asignación está basada en principios científicos de recuperación muscular 
                y frecuencia de entrenamiento óptima para maximizar tus resultados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
