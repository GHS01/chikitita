import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Clock, Dumbbell, Target, Heart, Shield, CheckCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserContextDisplayProps {
  className?: string;
  onChangeConsentDecision?: () => void; // 🏥 CALLBACK PARA CAMBIAR DECISIÓN
}

export default function UserContextDisplay({ className = "", onChangeConsentDecision }: UserContextDisplayProps) {
  const { user } = useAuth();

  // Obtener preferencias del usuario
  const { data: preferences } = useQuery({
    queryKey: ['/api/user/preferences'],
  });

  if (!preferences) {
    return (
      <div className="text-sm text-muted-foreground">
        Cargando datos del usuario...
      </div>
    );
  }

  // Mapear limitaciones a texto legible
  const limitationLabels = {
    'back_problems': 'Problemas de Espalda',
    'knee_issues': 'Problemas de Rodilla',
    'shoulder_issues': 'Problemas de Hombros',
    'asthma': 'Asma',
    'heart_condition': 'Condición Cardíaca',
    'pregnancy': 'Embarazo',
  };

  // Mapear tipos de ejercicio
  const exerciseTypeLabels = {
    'weights': 'Pesas',
    'cardio': 'Cardio',
    'functional': 'Funcional',
    'hiit': 'HIIT',
    'yoga': 'Yoga',
    'calisthenics': 'Calistenia',
  };

  // Mapear equipamiento
  const equipmentLabels = {
    'machines': 'Máquinas',
    'dumbbells': 'Mancuernas',
    'barbells': 'Barras',
    'resistance_bands': 'Bandas de Resistencia',
    'kettlebells': 'Kettlebells',
    'bodyweight': 'Solo Peso Corporal',
  };

  // Mapear ubicación
  const locationLabels = {
    'gym': 'Gimnasio',
    'home': 'Casa',
    'outdoor': 'Al Aire Libre',
  };

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      <Separator />

      {/* Información básica */}
      <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 text-xs sm:text-sm">
        {/* Ubicación */}
        <div className="flex items-center justify-between p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground truncate">Ubicación:</span>
          </div>
          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
            {locationLabels[preferences.location as keyof typeof locationLabels] || preferences.location}
          </Badge>
        </div>

        {/* Horario preferido */}
        <div className="flex items-center justify-between p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground truncate">Horario:</span>
          </div>
          <Badge variant="outline" className="text-xs capitalize ml-2 flex-shrink-0">
            {preferences.preferred_time || 'No especificado'}
          </Badge>
        </div>
      </div>

      {/* Tipos de ejercicio preferidos */}
      {preferences.exercise_types && preferences.exercise_types.length > 0 && (
        <div className="p-2 sm:p-3 bg-blue-50 sm:bg-transparent rounded-lg sm:rounded-none">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
            <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground">Tipos de ejercicio:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {preferences.exercise_types.map((type: string) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {exerciseTypeLabels[type as keyof typeof exerciseTypeLabels] || type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Equipamiento disponible */}
      {preferences.equipment && preferences.equipment.length > 0 && (
        <div className="p-2 sm:p-3 bg-green-50 sm:bg-transparent rounded-lg sm:rounded-none">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground">Equipamiento:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {preferences.equipment.map((equip: string) => (
              <Badge key={equip} variant="secondary" className="text-xs">
                {equipmentLabels[equip as keyof typeof equipmentLabels] || equip}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Limitaciones físicas - CRÍTICO PARA SEGURIDAD */}
      {preferences.limitations && preferences.limitations.length > 0 && (
        <div className="p-2 sm:p-3 bg-red-50 sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-red-200">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-red-600 font-medium">Limitaciones físicas:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {preferences.limitations.map((limitation: string) => (
              <Badge key={limitation} variant="destructive" className="text-xs">
                {limitationLabels[limitation as keyof typeof limitationLabels] || limitation}
              </Badge>
            ))}
          </div>

          {/* 🏥 DECISIÓN DE CONSENTIMIENTO ACTUAL */}
          <ConsentDecisionDisplay
            limitations={preferences.limitations}
            onChangeDecision={onChangeConsentDecision}
          />
        </div>
      )}

      {/* Información del usuario */}
      {user && (
        <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 text-xs sm:text-sm pt-2 border-t">
          <div className="flex items-center justify-between p-2 sm:p-0 bg-purple-50 sm:bg-transparent rounded-lg sm:rounded-none">
            <span className="text-muted-foreground">Nivel:</span>
            <Badge variant="outline" className="text-xs capitalize ml-2 flex-shrink-0">
              {user.fitnessLevel || 'No especificado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 sm:p-0 bg-purple-50 sm:bg-transparent rounded-lg sm:rounded-none">
            <span className="text-muted-foreground">Objetivo:</span>
            <Badge variant="outline" className="text-xs capitalize ml-2 flex-shrink-0">
              {user.fitnessGoal?.replace('_', ' ') || 'No especificado'}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// 🏥 Componente para mostrar la decisión de consentimiento actual
function ConsentDecisionDisplay({
  limitations,
  onChangeDecision
}: {
  limitations: string[],
  onChangeDecision?: () => void
}) {
  // Obtener decisión actual del localStorage
  const currentDecision = localStorage.getItem('fitness_consent_decision') as 'accept_risks' | 'use_alternatives' | null;

  if (!currentDecision) {
    return (
      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-xs text-amber-700">
          ⚠️ El sistema adaptará automáticamente las recomendaciones para evitar ejercicios que puedan agravar estas condiciones.
        </p>
      </div>
    );
  }

  const decisionConfig = {
    accept_risks: {
      icon: <CheckCircle className="h-4 w-4 text-red-600" />,
      label: "ACEPTO RIESGOS",
      description: "Mostrando todos los splits disponibles",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      badgeVariant: "destructive" as const
    },
    use_alternatives: {
      icon: <Shield className="h-4 w-4 text-green-600" />,
      label: "USO ALTERNATIVAS SEGURAS",
      description: "Evitando ejercicios que puedan agravar limitaciones",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      badgeVariant: "secondary" as const
    }
  };

  const config = decisionConfig[currentDecision];

  return (
    <div className={`mt-2 p-3 ${config.bgColor} border ${config.borderColor} rounded-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {config.icon}
            <Badge variant={config.badgeVariant} className="text-xs font-medium">
              🏥 {config.label}
            </Badge>
          </div>
          <p className={`text-xs ${config.textColor} mb-2`}>
            {config.description}
          </p>
          <p className={`text-xs ${config.textColor} opacity-75`}>
            Decisión aplicada a todos los entrenamientos con limitaciones físicas.
          </p>
        </div>

        {onChangeDecision && (
          <Button
            variant="outline"
            size="sm"
            onClick={onChangeDecision}
            className="ml-2 text-xs h-7 px-2"
          >
            <Settings className="h-3 w-3 mr-1" />
            Cambiar
          </Button>
        )}
      </div>
    </div>
  );
}
