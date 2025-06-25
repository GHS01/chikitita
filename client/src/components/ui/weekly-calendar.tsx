/**
 * 📅 Weekly Calendar Component
 * Calendario semanal educativo con explicaciones científicas
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Zap, Moon, CheckCircle, Dumbbell, Heart, Flame, Zap as Lightning, Target, Activity } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { ScientificTooltip, RecoveryTooltip, SplitRationaleTooltip } from './scientific-tooltip';

interface WeeklyCalendarProps {
  weeklySchedule: {
    [key: string]: {
      split_id?: number;
      split_name?: string;
      rest: boolean;
      muscle_groups?: string[];
      recovery_time?: number;
      rationale?: string;
    };
  };
  currentDay?: string;
  completedDays?: string[];
  onDayClick?: (day: string, workout: any) => void;
}

export function WeeklyCalendar({ 
  weeklySchedule, 
  currentDay = '',
  completedDays = [],
  onDayClick 
}: WeeklyCalendarProps) {
  
  const days = [
    { key: 'monday', label: 'Lun', fullName: 'Lunes' },
    { key: 'tuesday', label: 'Mar', fullName: 'Martes' },
    { key: 'wednesday', label: 'Mié', fullName: 'Miércoles' },
    { key: 'thursday', label: 'Jue', fullName: 'Jueves' },
    { key: 'friday', label: 'Vie', fullName: 'Viernes' },
    { key: 'saturday', label: 'Sáb', fullName: 'Sábado' },
    { key: 'sunday', label: 'Dom', fullName: 'Domingo' }
  ];

  const getMuscleGroupIcon = (muscleGroup: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      chest: <Dumbbell className="w-6 h-6 text-orange-600" />,
      triceps: <Lightning className="w-6 h-6 text-orange-500" />,
      back: <Activity className="w-6 h-6 text-blue-600" />,
      biceps: <Flame className="w-6 h-6 text-blue-500" />,
      shoulders: <Target className="w-6 h-6 text-purple-600" />,
      abs: <Zap className="w-6 h-6 text-red-600" />,
      quads: <Heart className="w-6 h-6 text-green-600" />,
      hamstrings: <Heart className="w-6 h-6 text-green-500" />,
      glutes: <Heart className="w-6 h-6 text-pink-600" />,
      calves: <Heart className="w-6 h-6 text-green-400" />,
      arms: <Dumbbell className="w-6 h-6 text-indigo-600" />
    };
    return icons[muscleGroup] || <Dumbbell className="w-6 h-6 text-gray-600" />;
  };

  const getWorkoutTypeGradient = (muscleGroups: string[] = []) => {
    if (muscleGroups.includes('chest') || muscleGroups.includes('triceps')) {
      return 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-300 shadow-lg shadow-blue-100/50';
    }
    if (muscleGroups.includes('back') || muscleGroups.includes('biceps')) {
      return 'bg-gradient-to-br from-green-50 via-green-100 to-green-200 border-green-300 shadow-lg shadow-green-100/50';
    }
    if (muscleGroups.includes('shoulders')) {
      return 'bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-purple-300 shadow-lg shadow-purple-100/50';
    }
    if (muscleGroups.includes('quads') || muscleGroups.includes('glutes')) {
      return 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 border-orange-300 shadow-lg shadow-orange-100/50';
    }
    return 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 border-gray-300 shadow-lg shadow-gray-100/50';
  };

  const isToday = (dayKey: string) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[dayOfWeek];
    return dayKey === todayKey;
  };

  const isCompleted = (dayKey: string) => {
    return completedDays.includes(dayKey);
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="flex items-center text-xl font-bold text-gray-800 tracking-wide">
          <Calendar className="h-6 w-6 mr-3 text-blue-600" />
          Planificación Semanal Profesional
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 md:pt-8">
        {/* Layout responsivo en cubos organizados */}
        <div className="space-y-3 md:space-y-4">
          {/* Primera fila: Lun, Mar, Mié */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {days.slice(0, 3).map((day) => {
              const daySchedule = weeklySchedule[day.key];
              const isRestDay = !daySchedule || daySchedule.rest;
              const isTodayDay = isToday(day.key);
              const isDayCompleted = isCompleted(day.key);

              return (
                <DayCard
                  key={day.key}
                  day={day}
                  daySchedule={daySchedule}
                  isRestDay={isRestDay}
                  isTodayDay={isTodayDay}
                  isDayCompleted={isDayCompleted}
                  onDayClick={onDayClick}
                  getMuscleGroupIcon={getMuscleGroupIcon}
                  getWorkoutTypeGradient={getWorkoutTypeGradient}
                />
              );
            })}
          </div>

          {/* Segunda fila: Jue, Vie, Sáb */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {days.slice(3, 6).map((day) => {
              const daySchedule = weeklySchedule[day.key];
              const isRestDay = !daySchedule || daySchedule.rest;
              const isTodayDay = isToday(day.key);
              const isDayCompleted = isCompleted(day.key);

              return (
                <DayCard
                  key={day.key}
                  day={day}
                  daySchedule={daySchedule}
                  isRestDay={isRestDay}
                  isTodayDay={isTodayDay}
                  isDayCompleted={isDayCompleted}
                  onDayClick={onDayClick}
                  getMuscleGroupIcon={getMuscleGroupIcon}
                  getWorkoutTypeGradient={getWorkoutTypeGradient}
                />
              );
            })}
          </div>

          {/* Tercera fila: Dom (centrado) */}
          <div className="flex justify-center">
            <div className="w-1/3">
              {(() => {
                const day = days[6]; // Domingo
                const daySchedule = weeklySchedule[day.key];
                const isRestDay = !daySchedule || daySchedule.rest;
                const isTodayDay = isToday(day.key);
                const isDayCompleted = isCompleted(day.key);

                return (
                  <DayCard
                    key={day.key}
                    day={day}
                    daySchedule={daySchedule}
                    isRestDay={isRestDay}
                    isTodayDay={isTodayDay}
                    isDayCompleted={isDayCompleted}
                    onDayClick={onDayClick}
                    getMuscleGroupIcon={getMuscleGroupIcon}
                    getWorkoutTypeGradient={getWorkoutTypeGradient}
                  />
                );
              })()}
            </div>
          </div>
        </div>

        {/* Leyenda mejorada */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 rounded-lg">
              <Moon className="w-4 h-4 text-slate-600 mr-2" />
              <span className="text-gray-700 font-medium">Descanso</span>
            </div>
            <div className="flex items-center bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
              <span className="text-gray-700 font-medium">Completado</span>
            </div>
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-gray-700 font-medium">Hoy</span>
            </div>
          </div>
        </div>

        {/* Información educativa */}
        <div className="mt-4 pt-4 border-t">
          <ScientificTooltip
            title="Planificación Profesional Semanal"
            explanation="Esta planificación garantiza recuperación óptima entre grupos musculares y máxima eficiencia del entrenamiento."
            benefits={[
              'Recuperación muscular de 48-72h',
              'Prevención del sobreentrenamiento',
              'Máximo volumen por grupo muscular',
              'Adherencia sostenible al programa'
            ]}
            scientificBasis="Basado en estudios de fisiología del ejercicio que demuestran que los músculos necesitan 48-72h para recuperación completa según el volumen e intensidad."
            type="science"
          >
            <div className="text-xs text-muted-foreground text-center cursor-help">
              <Zap className="w-3 h-3 inline mr-1" />
              Planificación basada en metodología profesional
            </div>
          </ScientificTooltip>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente DayCard para reutilización
interface DayCardProps {
  day: { key: string; label: string; fullName: string };
  daySchedule: any;
  isRestDay: boolean;
  isTodayDay: boolean;
  isDayCompleted: boolean;
  onDayClick?: (day: string, workout: any) => void;
  getMuscleGroupIcon: (muscle: string) => React.ReactNode;
  getWorkoutTypeGradient: (muscleGroups?: string[]) => string;
}

function DayCard({
  day,
  daySchedule,
  isRestDay,
  isTodayDay,
  isDayCompleted,
  onDayClick,
  getMuscleGroupIcon,
  getWorkoutTypeGradient
}: DayCardProps) {
  return (
    <div
      className={`
        relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer min-h-[120px] md:min-h-[140px]
        ${isTodayDay ? 'shadow-2xl shadow-blue-500/80 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 ring-2 ring-blue-300/50' : ''}
        ${isDayCompleted && !isTodayDay ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-emerald-300 shadow-lg shadow-emerald-100/50' : ''}
        ${isRestDay && !isTodayDay && !isDayCompleted ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 border-slate-300 shadow-lg shadow-slate-100/50' : ''}
        ${!isRestDay && !isTodayDay && !isDayCompleted ? getWorkoutTypeGradient(daySchedule?.muscle_groups) : ''}
        hover:shadow-xl
        backdrop-blur-sm
      `}
      onClick={() => onDayClick?.(day.key, daySchedule)}
    >


      {/* Día de la semana */}
      <div className="text-center mb-3 md:mb-4">
        <div className={`text-base md:text-lg font-bold tracking-wide ${isTodayDay ? 'text-blue-700' : 'text-gray-800'}`}>
          {day.label}
        </div>
      </div>

      {/* Contenido del día */}
      {isRestDay ? (
        <div className="flex flex-col items-center justify-center text-center h-full">
          <div className="mb-2 md:mb-3 flex justify-center">
            <Moon className="w-6 h-6 md:w-8 md:h-8 text-slate-600" />
          </div>
          <div className="text-sm md:text-base font-bold text-slate-700 tracking-wide">Descanso</div>
          <div className="text-xs md:text-sm text-slate-600 font-medium">Recuperación</div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-full">
          {/* Iconos profesionales del grupo muscular principal */}
          <div className="mb-2 md:mb-3 flex justify-center items-center space-x-1 md:space-x-2">
            {daySchedule?.muscle_groups?.slice(0, 2).map((muscle, index) => (
              <div key={muscle} className="flex justify-center">
                {React.cloneElement(getMuscleGroupIcon(muscle) as React.ReactElement, {
                  className: "w-5 h-5 md:w-6 md:h-6 " + (getMuscleGroupIcon(muscle) as React.ReactElement).props.className.split(' ').slice(2).join(' ')
                })}
              </div>
            ))}
          </div>

          {/* Nombre del split */}
          <div className="text-sm md:text-base font-bold mb-2 md:mb-3 text-gray-800 tracking-wide">
            {daySchedule?.split_name?.split(' ')[0] || 'Entreno'}
          </div>

          {/* Grupos musculares */}
          <div className="space-y-1 md:space-y-2 flex flex-col items-center">
            {daySchedule?.muscle_groups?.slice(0, 2).map((muscle) => (
              <Badge key={muscle} variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1 font-medium bg-white/70 backdrop-blur-sm">
                {muscle}
              </Badge>
            ))}
            {daySchedule?.muscle_groups && daySchedule.muscle_groups.length > 2 && (
              <Badge variant="outline" className="text-xs md:text-sm px-2 md:px-3 py-1 font-medium bg-white/50 backdrop-blur-sm">
                +{daySchedule.muscle_groups.length - 2}
              </Badge>
            )}
          </div>

          {/* Tiempo de recuperación - Solo en desktop grande */}
          {daySchedule?.recovery_time && (
            <div className="hidden xl:flex items-center justify-center mt-2">
              <span className="text-xs text-gray-500">{daySchedule.recovery_time}h</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
