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
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Generando asignación inteligente...</span>
        </CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Button onClick={generateIntelligentAssignment}>
            <Brain className="h-4 w-4 mr-2" />
            Generar Asignación Inteligente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con lógica científica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>Asignación Inteligente - {weeklyFrequency} Días</span>
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              Automático
            </Badge>
          </CardTitle>
          <CardDescription>
            {assignment.scientificRationale}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignment.assignments.map((dayAssignment, index) => (
          <Card key={dayAssignment.day} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {dayNames[dayAssignment.day as keyof typeof dayNames]}
                </CardTitle>
                {dayAssignment.autoAssigned && (
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayAssignment.splitId > 0 ? (
                <>
                  <div>
                    <Badge className={splitTypeColors[dayAssignment.splitType as keyof typeof splitTypeColors]}>
                      {dayAssignment.splitName}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Músculos:</strong> {dayAssignment.muscleGroups.join(', ')}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>Recuperación: {dayAssignment.recoveryHours}h</span>
                    </div>
                    
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {dayAssignment.scientificReason}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Badge variant="outline" className="bg-gray-50">
                    {dayAssignment.splitName}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-2">
                    {dayAssignment.scientificReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-4">
        <Button 
          onClick={applyAssignment}
          disabled={applying}
          className="flex-1"
        >
          {applying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Aplicando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aplicar Asignación Inteligente
            </>
          )}
        </Button>
        
        {assignment.canOverride && (
          <Button 
            variant="outline" 
            onClick={onManualOverride}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Manualmente
          </Button>
        )}
      </div>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-2">
            <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
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
