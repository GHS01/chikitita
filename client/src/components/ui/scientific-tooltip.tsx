/**
 * 🧬 Scientific Tooltip Component
 * Tooltips educativos para explicaciones científicas
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Info, Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface ScientificTooltipProps {
  title: string;
  explanation: string;
  benefits?: string[];
  scientificBasis?: string;
  children: React.ReactNode;
  type?: 'info' | 'science' | 'benefit' | 'timing' | 'target';
}

const getIconAndColor = (type: string) => {
  switch (type) {
    case 'science':
      return { icon: Lightbulb, color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'benefit':
      return { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'timing':
      return { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    case 'target':
      return { icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50' };
    default:
      return { icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
};

export function ScientificTooltip({
  title,
  explanation,
  benefits = [],
  scientificBasis,
  children,
  type = 'info'
}: ScientificTooltipProps) {
  const { icon: Icon, color, bgColor } = getIconAndColor(type);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help inline-flex items-center">
            {children}
            <Icon className={`h-4 w-4 ml-1 ${color}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="top">
          <div className={`rounded-lg p-3 ${bgColor}`}>
            <div className="flex items-start space-x-2 mb-2">
              <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
              <div>
                <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
                <p className="text-sm text-gray-700 mt-1">{explanation}</p>
              </div>
            </div>

            {benefits.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Beneficios:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-1">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {scientificBasis && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  <ModernEmoji emoji="🔬" size={12} className="mr-1" />
                  Base científica:
                </p>
                <p className="text-xs text-gray-600">{scientificBasis}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componentes específicos para diferentes tipos de explicaciones

export function MuscleGroupTooltip({ muscleGroup, children }: { muscleGroup: string; children: React.ReactNode }) {
  const muscleInfo = {
    chest: {
      title: 'Pecho (Pectorales)',
      explanation: 'Músculos principales del torso anterior, responsables de empujar y abrazar.',
      benefits: ['Fuerza funcional para actividades diarias', 'Mejora la postura', 'Estética del torso superior'],
      scientificBasis: 'Los pectorales se componen de fibras claviculares y esternales, requiriendo diferentes ángulos para desarrollo completo.'
    },
    triceps: {
      title: 'Tríceps',
      explanation: 'Músculos posteriores del brazo, responsables de la extensión del codo.',
      benefits: ['Fuerza de empuje', 'Estabilidad del hombro', 'Definición del brazo'],
      scientificBasis: 'Compuesto por tres cabezas (larga, lateral, medial), se activa sinérgicamente en ejercicios de pecho.'
    },
    back: {
      title: 'Espalda',
      explanation: 'Complejo muscular posterior que incluye dorsales, romboides, y trapecio.',
      benefits: ['Postura correcta', 'Fuerza de tracción', 'Prevención de lesiones'],
      scientificBasis: 'Los músculos de la espalda trabajan como antagonistas del pecho, esencial para equilibrio muscular.'
    },
    // Agregar más músculos según necesidad
  };

  const info = muscleInfo[muscleGroup as keyof typeof muscleInfo];
  
  if (!info) {
    return <>{children}</>;
  }

  return (
    <ScientificTooltip
      title={info.title}
      explanation={info.explanation}
      benefits={info.benefits}
      scientificBasis={info.scientificBasis}
      type="target"
    >
      {children}
    </ScientificTooltip>
  );
}

export function RecoveryTooltip({ hours, children }: { hours: number; children: React.ReactNode }) {
  return (
    <ScientificTooltip
      title={`Recuperación de ${hours} horas`}
      explanation={`Tiempo necesario para que los músculos se recuperen completamente y estén listos para el próximo entrenamiento.`}
      benefits={[
        'Síntesis proteica óptima',
        'Prevención del sobreentrenamiento',
        'Máximo rendimiento en la próxima sesión'
      ]}
      scientificBasis={`La síntesis proteica muscular permanece elevada 24-48h post-ejercicio. ${hours}h permite recuperación completa según el volumen e intensidad del entrenamiento.`}
    >
      {children}
    </ScientificTooltip>
  );
}

export function SplitRationaleTooltip({ splitName, rationale, children }: { 
  splitName: string; 
  rationale: string; 
  children: React.ReactNode 
}) {
  return (
    <ScientificTooltip
      title={`¿Por qué ${splitName}?`}
      explanation={rationale}
      benefits={[
        'Máxima eficiencia de entrenamiento',
        'Recuperación optimizada',
        'Progreso sostenible'
      ]}
      scientificBasis="Basado en principios de fisiología del ejercicio y biomecánica muscular."
      type="science"
    >
      {children}
    </ScientificTooltip>
  );
}

export function MesocycleTooltip({
  currentWeek,
  totalWeeks,
  progressPercentage, // 🚨 RECIBIR EL PROGRESO REAL DEL BACKEND
  children
}: {
  currentWeek: number;
  totalWeeks: number;
  progressPercentage?: number; // 🚨 OPCIONAL PARA COMPATIBILIDAD
  children: React.ReactNode
}) {
  // 🚨 USAR EL PROGRESO DEL BACKEND O FALLBACK AL CÁLCULO SIMPLE
  const displayProgress = progressPercentage ?? Math.round((currentWeek / totalWeeks) * 100);
  
  return (
    <ScientificTooltip
      title={`Mesociclo: Semana ${currentWeek} de ${totalWeeks}`}
      explanation={`Un mesociclo es un período de entrenamiento de ${totalWeeks} semanas diseñado para lograr adaptaciones específicas antes de cambiar el estímulo.`}
      benefits={[
        'Previene estancamiento',
        'Progresión sistemática',
        'Adaptaciones específicas'
      ]}
      scientificBasis={`Los mesociclos de ${totalWeeks} semanas permiten adaptaciones neuromusculares completas antes de introducir nuevos estímulos, evitando el plateau.`}
      type="benefit"
    >
      <div className="flex items-center">
        {children}
        <Badge variant="secondary" className="ml-2">
          {displayProgress}% completado
        </Badge>
      </div>
    </ScientificTooltip>
  );
}
