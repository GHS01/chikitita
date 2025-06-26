/**
 * 🗓️ WeeklyScheduleBuilder - Componente para asignar splits a días específicos
 * Reemplaza la selección individual de splits por una asignación semanal inteligente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Dumbbell,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  Target,
  Info,
  Brain,
  ChevronDown
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { useFilteredSplits } from '@/hooks/useFilteredSplits';
import IntelligentSplitAssignment from '@/components/IntelligentSplitAssignment';

// Tipos de datos
interface Split {
  id: number;
  split_name: string;
  split_type: string;
  muscle_groups: string[];
  recovery_time_hours: number;
  scientific_rationale: string;
  difficulty_level: string;
}

interface WeeklySchedule {
  monday?: Split;
  tuesday?: Split;
  wednesday?: Split;
  thursday?: Split;
  friday?: Split;
  saturday?: Split;
  sunday?: Split;
}

interface WeeklyScheduleBuilderProps {
  availableSplits?: Split[]; // 🚨 OPCIONAL: Ahora se obtiene dinámicamente
  onScheduleChange: (schedule: WeeklySchedule) => void;
  userLimitations?: string[];
  weeklyFrequency: number; // 🎯 NUEVO: Frecuencia semanal del usuario
  availableDays?: string[]; // 🎯 NUEVO: Días disponibles específicos
  className?: string;
}

// Configuración completa de días de la semana
const ALL_DAYS_CONFIG = [
  { key: 'monday', label: 'Lunes', emoji: '💪', color: 'bg-blue-50 border-blue-200' },
  { key: 'tuesday', label: 'Martes', emoji: '🔥', color: 'bg-red-50 border-red-200' },
  { key: 'wednesday', label: 'Miércoles', emoji: '⚡', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'thursday', label: 'Jueves', emoji: '💚', color: 'bg-green-50 border-green-200' },
  { key: 'friday', label: 'Viernes', emoji: '🎯', color: 'bg-purple-50 border-purple-200' },
  { key: 'saturday', label: 'Sábado', emoji: '🌟', color: 'bg-orange-50 border-orange-200' },
  { key: 'sunday', label: 'Domingo', emoji: '😴', color: 'bg-gray-50 border-gray-200' }
] as const;

// 🚨 ELIMINADO: Función de fallback hardcodeado
// Esta función ha sido eliminada para forzar el uso de configuración real del usuario

export default function WeeklyScheduleBuilder({
  availableSplits: propSplits, // 🔄 Renombrar para distinguir de splits dinámicos
  onScheduleChange,
  userLimitations = [],
  weeklyFrequency,
  availableDays,
  className = ""
}: WeeklyScheduleBuilderProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [selectedSplits, setSelectedSplits] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showIntelligentAssignment, setShowIntelligentAssignment] = useState(weeklyFrequency >= 5);
  const [useManualAssignment, setUseManualAssignment] = useState(false);

  // 🧠 OBTENER SPLITS FILTRADOS DINÁMICAMENTE
  const { splits: dynamicSplits, isLoading: splitsLoading, filterContext } = useFilteredSplits();

  // 🎯 Usar splits dinámicos o props como fallback
  const availableSplits = propSplits || dynamicSplits;

  // 🚨 VALIDACIÓN ESTRICTA: Solo días reales del usuario
  if (!availableDays || availableDays.length === 0) {
    throw new Error('CONFIGURACIÓN_INCOMPLETA: No se han configurado días disponibles para el usuario');
  }

  const userAvailableDays = availableDays;
  const daysToShow = ALL_DAYS_CONFIG.filter(day => userAvailableDays.includes(day.key));

  // Validar horario cuando cambie
  useEffect(() => {
    validateSchedule(schedule);
    onScheduleChange(schedule);
  }, [schedule, onScheduleChange]);

  // Función para asignar split a un día - PERMITIR REPETICIONES PARA 5+ DÍAS
  const assignSplitToDay = (dayKey: keyof WeeklySchedule, split: Split | null) => {
    const newSchedule = { ...schedule };

    if (split) {
      // 🔄 PARA 5+ DÍAS: Permitir splits repetidos (PPL x2)
      if (weeklyFrequency >= 5) {
        // No remover de otros días - permitir repetición
        newSchedule[dayKey] = split;
      } else {
        // 🚨 PARA <5 DÍAS: Comportamiento original (sin repetición)
        Object.keys(newSchedule).forEach(key => {
          if (newSchedule[key as keyof WeeklySchedule]?.id === split.id) {
            delete newSchedule[key as keyof WeeklySchedule];
          }
        });
        newSchedule[dayKey] = split;
      }

      // Actualizar splits seleccionados
      setSelectedSplits(prev => new Set([...Array.from(prev), split.id]));
    } else {
      // Remover split del día
      if (newSchedule[dayKey]) {
        const removedSplitId = newSchedule[dayKey]!.id;

        // Solo remover de selectedSplits si no está usado en otros días
        const isUsedElsewhere = Object.entries(newSchedule).some(([key, s]) =>
          key !== dayKey && s?.id === removedSplitId
        );

        if (!isUsedElsewhere) {
          setSelectedSplits(prev => {
            const newSet = new Set(prev);
            newSet.delete(removedSplitId);
            return newSet;
          });
        }
      }
      delete newSchedule[dayKey];
    }

    setSchedule(newSchedule);
  };

  // Validar el horario semanal
  const validateSchedule = (currentSchedule: WeeklySchedule) => {
    const errors: string[] = [];
    const assignedDays = Object.keys(currentSchedule).length;
    const availableDaysCount = userAvailableDays.length;

    // Validar que se asignen todos los splits sugeridos
    if (assignedDays < availableSplits.length) {
      errors.push(`Asigna los ${availableSplits.length} splits sugeridos a días específicos`);
    }

    // Validar que no se excedan los días disponibles
    if (assignedDays > availableDaysCount) {
      errors.push(`Solo tienes ${availableDaysCount} días disponibles para entrenar`);
    }

    // Validar recuperación entre grupos musculares
    const muscleGroupDays: { [key: string]: string[] } = {};
    Object.entries(currentSchedule).forEach(([day, split]) => {
      if (split) {
        split.muscle_groups.forEach(muscle => {
          if (!muscleGroupDays[muscle]) muscleGroupDays[muscle] = [];
          muscleGroupDays[muscle].push(day);
        });
      }
    });

    // Verificar que no haya grupos musculares consecutivos
    Object.entries(muscleGroupDays).forEach(([muscle, days]) => {
      if (days.length > 1) {
        const dayIndices = days.map(day => daysToShow.findIndex(d => d.key === day));
        dayIndices.sort((a, b) => a - b);

        for (let i = 1; i < dayIndices.length; i++) {
          if (dayIndices[i] - dayIndices[i-1] === 1) {
            errors.push(`${muscle} aparece en días consecutivos - necesita más recuperación`);
          }
        }
      }
    });

    setValidationErrors(errors);
  };

  // Limpiar horario
  const clearSchedule = () => {
    setSchedule({});
    setSelectedSplits(new Set());
  };

  // Sugerir horario automático basado en días disponibles
  const suggestSchedule = () => {
    if (availableSplits.length === 0 || userAvailableDays.length === 0) return;

    const suggested: WeeklySchedule = {};

    // 🎯 Asignar splits a días disponibles en orden
    userAvailableDays.forEach((dayKey, index) => {
      if (index < availableSplits.length) {
        suggested[dayKey as keyof WeeklySchedule] = availableSplits[index];
      }
    });

    setSchedule(suggested);
    const newSelectedSplits = new Set<number>();
    Object.values(suggested).forEach(split => {
      if (split) newSelectedSplits.add(split.id);
    });
    setSelectedSplits(newSelectedSplits);
  };

  // 🧠 Manejar asignación inteligente aplicada
  const handleIntelligentAssignmentApplied = (assignments: any[]) => {
    console.log('🧠 [WeeklyScheduleBuilder] Intelligent assignment applied:', assignments);

    // Convertir asignaciones a formato WeeklySchedule
    const newSchedule: WeeklySchedule = {};
    const newSelectedSplits = new Set<number>();

    assignments.forEach(assignment => {
      if (assignment.splitId > 0) {
        // Crear objeto Split compatible
        const split: Split = {
          id: assignment.splitId,
          split_name: assignment.splitName,
          split_type: assignment.splitType,
          muscle_groups: assignment.muscleGroups,
          recovery_time_hours: assignment.recoveryHours,
          scientific_rationale: assignment.scientificReason,
          difficulty_level: 'intermediate' // Default
        };

        newSchedule[assignment.day as keyof WeeklySchedule] = split;
        newSelectedSplits.add(assignment.splitId);
      }
    });

    setSchedule(newSchedule);
    setSelectedSplits(newSelectedSplits);
    setUseManualAssignment(false);
  };

  // 🔧 Manejar override manual
  const handleManualOverride = () => {
    setUseManualAssignment(true);
    // Limpiar asignación automática si existe
    setSchedule({});
    setSelectedSplits(new Set());
  };

  // 🔄 Mostrar loading si está cargando splits
  if (splitsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-8">
          <ModernEmoji emoji="⏳" size={48} className="mb-4" />
          <p className="text-muted-foreground">Cargando splits disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 🧠 Contexto del Filtrado */}
      {filterContext && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  {filterContext.mode === 'active_editing' && '🔒 Editando Mesociclo Activo'}
                  {filterContext.mode === 'creation' && '🆕 Creando Nuevo Mesociclo'}
                  {filterContext.mode === 'evolution' && '🚀 Evolución Disponible'}
                </h4>
                <p className="text-xs text-blue-700">
                  {filterContext.description} • {filterContext.filtered} de {filterContext.totalAvailable} splits disponibles
                  {filterContext.mode === 'active_editing' && filterContext.remainingDays &&
                    ` • ${filterContext.remainingDays} días restantes`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🧠 Asignación Inteligente para 5+ días */}
      {weeklyFrequency >= 5 && !useManualAssignment && (
        <IntelligentSplitAssignment
          weeklyFrequency={weeklyFrequency}
          availableDays={userAvailableDays}
          onAssignmentApplied={handleIntelligentAssignmentApplied}
          onManualOverride={handleManualOverride}
        />
      )}

      {/* 🔧 Asignación Manual (para <5 días o cuando el usuario elige override) */}
      {(weeklyFrequency < 5 || useManualAssignment) && (
        <div className="space-y-6">

      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">
          <ModernEmoji emoji="🗓️" className="mr-2" />
          Asigna Cada Split a un Día
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Tienes {userAvailableDays.length} días disponibles - asigna cada split sugerido a un día específico
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={suggestSchedule}
          className="text-xs"
        >
          <Zap className="h-3 w-3 mr-1" />
          Sugerir Automático
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSchedule}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Limpiar Todo
        </Button>
      </div>

      {/* Calendario Semanal - Solo días disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-2 sm:px-0">
        {daysToShow.map((day) => {
          const assignedSplit = schedule[day.key as keyof WeeklySchedule];

          return (
            <Card
              key={day.key}
              className={`${day.color} transition-all duration-200 hover:shadow-md ${
                assignedSplit ? 'ring-2 ring-primary' : ''
              } overflow-hidden`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center">
                    <ModernEmoji emoji={day.emoji} className="mr-1" />
                    {day.label}
                  </span>
                  {assignedSplit && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {assignedSplit ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {assignedSplit.split_name}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {assignedSplit.muscle_groups.slice(0, 3).map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => assignSplitToDay(day.key as keyof WeeklySchedule, null)}
                      className="w-full text-xs h-6"
                    >
                      Quitar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <p className="text-xs text-muted-foreground">Sin asignar</p>
                    </div>
                    <Select
                      onValueChange={(value) => {
                        const splitId = parseInt(value);
                        const split = availableSplits.find(s => s.id === splitId);
                        if (split) assignSplitToDay(day.key as keyof WeeklySchedule, split);
                      }}
                    >
                      <SelectTrigger className="w-full h-9 sm:h-8 text-xs bg-white border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 shadow-sm">
                        <SelectValue placeholder="Seleccionar split..." className="text-xs text-gray-600 truncate" />
                        <ChevronDown className="h-3 w-3 text-gray-400 ml-auto flex-shrink-0" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-w-[calc(100vw-2rem)] sm:max-w-[280px] bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50"
                        position="popper"
                        sideOffset={4}
                        align="start"
                        avoidCollisions={true}
                        collisionPadding={8}
                      >
                        {availableSplits
                          .filter(split => {
                            // 🔄 PARA 5+ DÍAS: Mostrar todos los splits (permitir repetición)
                            if (weeklyFrequency >= 5) {
                              return true;
                            }
                            // 🚨 PARA <5 DÍAS: Solo mostrar splits no seleccionados
                            return !selectedSplits.has(split.id);
                          })
                          .map(split => {
                            // 🔢 Contar cuántas veces está usado este split
                            const usageCount = Object.values(schedule).filter(s => s?.id === split.id).length;
                            const displayName = weeklyFrequency >= 5 && usageCount > 0
                              ? `${split.split_name} (${usageCount + 1}ª vez)`
                              : split.split_name;

                            return (
                              <SelectItem
                                key={`${split.id}-${usageCount}`}
                                value={split.id.toString()}
                                className="text-xs py-3 px-3 hover:bg-gray-50 focus:bg-primary/5 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-start justify-between w-full gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Dumbbell className="h-3 w-3 text-primary flex-shrink-0" />
                                      <span className="font-medium text-gray-900 truncate">
                                        {displayName}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                      {split.split_type.replace(/_/g, ' ').toUpperCase()}
                                    </div>
                                  </div>
                                  {usageCount > 0 && weeklyFrequency >= 5 && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5 flex-shrink-0">
                                      {usageCount + 1}x
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validación */}
      {validationErrors.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-orange-800 mb-1">
                  Ajustes Recomendados
                </h4>
                <ul className="text-xs text-orange-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      {Object.keys(schedule).length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Target className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">
                  Horario Configurado
                </h4>
                <p className="text-xs text-green-700">
                  {Object.keys(schedule).length} días de entrenamiento asignados. 
                  La IA generará rutinas automáticamente basadas en esta configuración.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      )}
    </div>
  );
}
