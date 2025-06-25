/**
 * 🧬 Scientific Workout Modal
 * Modal científico e inteligente para generación de rutinas
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Target, Zap, Clock, Calendar, Brain, Lightbulb,
  TrendingUp, Activity, CheckCircle, Info, Save, Edit
} from 'lucide-react';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { ScientificTooltip, MuscleGroupTooltip, SplitRationaleTooltip } from '@/components/ui/scientific-tooltip';
import { MesocycleProgress } from '@/components/ui/mesocycle-progress';
import { WeeklyCalendar } from '@/components/ui/weekly-calendar';
import UserContextDisplay from '@/components/UserContextDisplay';
import ConsentModal from '@/components/ConsentModal';
import WeeklyScheduleBuilder from '@/components/WeeklyScheduleBuilder';
import ModernConfirmDialog from '@/components/ui/ModernConfirmDialog';
import { useMesocycleState } from '@/hooks/useMesocycleStatus';
import { useFilteredSplits } from '@/hooks/useFilteredSplits';

// Schema de validación
const scientificWorkoutSchema = z.object({
  selectedSplitId: z.number().min(1, "Debes seleccionar un split"),
  energyLevel: z.enum(['low', 'medium', 'high']),
  availableTime: z.enum(['30', '45', '60', '75']),
  personalizedPreferences: z.object({
    preferredExercises: z.string().optional(),
    avoidedExercises: z.string().optional(),
    intensityPreference: z.enum(['light', 'moderate', 'intense']).optional(),
  }).optional(),
});

type ScientificWorkoutFormData = z.infer<typeof scientificWorkoutSchema>;

interface ScientificWorkoutModalProps {
  onSubmit: (data: ScientificWorkoutFormData & { splitData: any }) => void;
  onClose: () => void;
  isLoading?: boolean;
  userName?: string;
}

export default function ScientificWorkoutModal({
  onSubmit,
  onClose,
  isLoading = false,
  userName = 'Usuario'
}: ScientificWorkoutModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSplit, setSelectedSplit] = useState<any>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<any>({});
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentDecision, setConsentDecision] = useState<'accept_risks' | 'use_alternatives' | null>(() => {
    // 🏥 RECUPERAR DECISIÓN GUARDADA DEL LOCALSTORAGE
    const saved = localStorage.getItem('fitness_consent_decision');
    return saved as 'accept_risks' | 'use_alternatives' | null;
  });
  const [userLimitations, setUserLimitations] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  // 🔍 Obtener estado del mesociclo
  const { canCreateNew, mustEdit, hasActiveMesocycle, isLoading: mesocycleLoading } = useMesocycleState();

  // 🎯 Obtener splits filtrados dinámicamente
  const { splits: filteredSplits, isLoading: splitsLoading, filterContext } = useFilteredSplits();

  const form = useForm<ScientificWorkoutFormData>({
    resolver: zodResolver(scientificWorkoutSchema),
    defaultValues: {
      selectedSplitId: 0,
      energyLevel: 'medium',
      availableTime: '45',
      personalizedPreferences: {
        preferredExercises: '',
        avoidedExercises: '',
        intensityPreference: 'moderate',
      },
    },
  });

  // Obtener recomendación científica
  const { data: recommendation, isLoading: loadingRecommendation, error: recommendationError, refetch } = useQuery({
    queryKey: ['/api/scientific-workouts/recommend-split', consentDecision],
    queryFn: async () => {
      console.log('🔬 [Frontend] Fetching scientific recommendation...');
      console.log('🏥 [Frontend] Consent decision:', consentDecision);

      const response = await apiRequest('POST', '/api/scientific-workouts/recommend-split', {
        consentDecision // 🏥 ENVIAR DECISIÓN DE CONSENTIMIENTO
      });
      const data = await response.json();
      console.log('🔬 [Frontend] Scientific recommendation response:', data);

      // 🏥 DETECTAR LIMITACIONES Y MOSTRAR MODAL DE CONSENTIMIENTO
      if (data?.debug?.userLimitations && data.debug.userLimitations.length > 0) {
        setUserLimitations(data.debug.userLimitations);

        // 🏥 SOLO MOSTRAR MODAL SI NO HAY DECISIÓN GUARDADA
        const savedDecision = localStorage.getItem('fitness_consent_decision');
        if (!savedDecision && !consentDecision) {
          console.log('🏥 [ConsentModal] Showing consent modal - no previous decision found');
          setShowConsentModal(true);
        } else {
          console.log('🏥 [ConsentModal] Skipping modal - decision already exists:', savedDecision || consentDecision);
        }
      }

      return data;
    },
  });

  // Obtener mesociclo activo
  const { data: activeMesocycle, refetch: refetchMesocycle } = useQuery({
    queryKey: ['/api/scientific-workouts/active-mesocycle'],
    queryFn: async () => {
      console.log('🔄 [Frontend] Fetching active mesocycle...');
      const response = await apiRequest('GET', '/api/scientific-workouts/active-mesocycle');
      const data = await response.json();
      console.log('📊 [Frontend] Mesocycle data received:', JSON.stringify(data, null, 2));
      return data;
    },
    staleTime: 0, // 🚨 FORZAR ACTUALIZACIÓN - No usar caché
    cacheTime: 0, // 🚨 No guardar en caché
    refetchOnMount: true, // 🚨 Refetch al montar
    refetchOnWindowFocus: true, // 🚨 Refetch al enfocar ventana
  });

  // Obtener recomendación para hoy
  const { data: todayRecommendation } = useQuery({
    queryKey: ['/api/scientific-workouts/today-recommendation'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scientific-workouts/today-recommendation');
      return await response.json();
    },
  });

  // 🎯 Obtener preferencias del usuario (frecuencia semanal)
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user/preferences'],
  });

  // 🔄 Generar días disponibles basado en frecuencia
  const generateAvailableDays = (frequency: number): string[] => {
    const dayMappings: { [key: number]: string[] } = {
      1: ['monday'],
      2: ['monday', 'thursday'],
      3: ['monday', 'wednesday', 'friday'],
      4: ['monday', 'tuesday', 'thursday', 'friday'],
      5: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      7: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    };
    return dayMappings[frequency] || dayMappings[3];
  };

  // 🎯 Calcular días disponibles dinámicamente
  const currentFrequency = userPreferences?.weeklyFrequency || recommendation?.recommendation?.userFrequency || 3;
  const availableDays = generateAvailableDays(currentFrequency);

  const handleSubmit = async (data: ScientificWorkoutFormData) => {
    try {
      console.log('🔧 [ScientificWorkout] Form submission started');
      console.log('🔧 [ScientificWorkout] Form data:', data);
      console.log('🔧 [ScientificWorkout] Selected split:', selectedSplit);
      console.log('🔧 [ScientificWorkout] Weekly schedule:', weeklySchedule);
      console.log('🔧 [ScientificWorkout] Mesocycle state - canCreateNew:', canCreateNew, 'mustEdit:', mustEdit);

      // 🚨 FLUJO CONDICIONAL: Crear vs Editar Mesociclo
      if (mustEdit && Object.keys(weeklySchedule).length > 0) {
        // 🔧 MODO EDICIÓN: Solo actualizar días de entrenamiento
        console.log('✏️ [ScientificWorkout] EDIT MODE: Updating existing mesocycle...');

        const weeklyFrequency = currentFrequency;

        const response = await apiRequest('PUT', '/api/scientific-workouts/edit-mesocycle', {
          weeklySchedule,
          weeklyFrequency
        });

        const result = await response.json();
        console.log('✅ [ScientificWorkout] Mesocycle updated successfully:', result);

        // Cerrar modal después de editar
        alert('Mesociclo actualizado exitosamente. Ahora puedes generar rutinas con los nuevos días.');
        onClose();
        return;
      }

      // 🔧 MODO CREACIÓN: Crear nuevo mesociclo
      if (canCreateNew) {
        console.log('🆕 [ScientificWorkout] CREATE MODE: Creating new mesocycle...');

        // 🔧 VALIDACIÓN ADICIONAL PARA CREACIÓN
        if (!data.selectedSplitId || data.selectedSplitId === 0) {
          console.error('❌ [ScientificWorkout] selectedSplitId is invalid:', data.selectedSplitId);
          alert('Por favor selecciona un split en el paso 2 antes de continuar.');
          return;
        }

        if (!selectedSplit) {
          console.error('❌ [ScientificWorkout] selectedSplit is null');
          alert('Error: No se ha seleccionado un split válido.');
          return;
        }

        // 🗓️ Guardar asignaciones de splits antes de generar rutina
        if (Object.keys(weeklySchedule).length > 0) {
          console.log('🗓️ [ScientificWorkout] Saving split assignments...');

          const weeklyFrequency = currentFrequency;

          await apiRequest('POST', '/api/scientific-workouts/save-split-assignments', {
            weeklySchedule,
            weeklyFrequency
          });

          console.log('✅ [ScientificWorkout] Split assignments saved successfully');
        }

        console.log('🚀 [ScientificWorkout] Calling onSubmit with data...');
        // Continuar con el flujo normal de creación
        onSubmit({
          ...data,
          splitData: selectedSplit,
          weeklySchedule: weeklySchedule,
          consentDecision: consentDecision
        });
      } else {
        console.error('❌ [ScientificWorkout] Invalid state - cannot create or edit mesocycle');
        alert('Error: No se puede proceder. Verifica tu configuración.');
      }
    } catch (error) {
      console.error('❌ [ScientificWorkout] Error in handleSubmit:', error);

      // Solo continuar con flujo de creación si es modo creación
      if (canCreateNew) {
        onSubmit({
          ...data,
          splitData: selectedSplit,
          weeklySchedule: weeklySchedule,
          consentDecision: consentDecision
        });
      } else {
        alert('Error al procesar la solicitud. Inténtalo de nuevo.');
      }
    }
  };

  // 🏥 Handler para decisiones de consentimiento
  const handleConsentDecision = (decision: 'accept_risks' | 'use_alternatives' | 'consult_professional') => {
    console.log('🏥 [ConsentModal] User decision:', decision);

    if (decision === 'consult_professional') {
      // Mostrar información de contacto profesional
      alert('Te recomendamos consultar con un fisioterapeuta o médico deportivo antes de continuar con el entrenamiento.');
      onClose();
      return;
    }

    // 🏥 GUARDAR DECISIÓN EN LOCALSTORAGE PARA PERSISTENCIA
    localStorage.setItem('fitness_consent_decision', decision);
    console.log('🏥 [ConsentModal] Decision saved to localStorage:', decision);

    setConsentDecision(decision);
    setShowConsentModal(false);

    // 🏥 REFETCH CON NUEVA DECISIÓN DE CONSENTIMIENTO
    console.log('🏥 [ConsentModal] Refetching with consent decision:', decision);
    refetch();
  };

  // 💾 Handler para guardar cambios del mesociclo
  const handleSaveMesocycle = async () => {
    if (Object.keys(weeklySchedule).length === 0) {
      alert('Por favor asigna al menos un split a un día antes de guardar.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('✏️ [ScientificWorkout] EDIT MODE: Saving changes...');
      const weeklyFrequency = currentFrequency;

      const response = await apiRequest('PUT', '/api/scientific-workouts/edit-mesocycle', {
        weeklySchedule,
        weeklyFrequency
      });

      const result = await response.json();
      console.log('✅ [ScientificWorkout] Mesocycle updated successfully:', result);

      setShowConfirmDialog(true);
    } catch (error) {
      console.error('❌ [ScientificWorkout] Error updating mesocycle:', error);
      alert('Error al actualizar el mesociclo. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const energyOptions = [
    { id: 'low', label: 'Poca energía - rutina suave', emoji: '🌙', description: 'Ejercicios de baja intensidad, más descanso' },
    { id: 'medium', label: 'Energía normal - rutina moderada', emoji: '⚡', description: 'Intensidad equilibrada, volumen estándar' },
    { id: 'high', label: 'Mucha energía - rutina intensa', emoji: '🚀', description: 'Alta intensidad, máximo volumen' },
  ];

  const timeOptions = [
    { id: '30', label: '30 minutos', description: 'Rutina express, ejercicios compuestos' },
    { id: '45', label: '45 minutos', description: 'Duración óptima, balance perfecto' },
    { id: '60', label: '60 minutos', description: 'Rutina completa, máximo desarrollo' },
    { id: '75', label: '75+ minutos', description: 'Sesión extendida, especialización' },
  ];

  if (loadingRecommendation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Analizando tu perfil...</p>
            <p className="text-sm text-muted-foreground">Planeación profesional basada en tus datos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-4xl lg:max-w-6xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl">
              <Brain className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {/* 🚨 TÍTULO CONDICIONAL BASADO EN ESTADO DEL MESOCICLO */}
            {canCreateNew && (
              <>
                <ModernEmoji emoji="🎯" className="mr-2" />
                Crear Primer Mesociclo
              </>
            )}
            {mustEdit && (
              <>
                <ModernEmoji emoji="✏️" className="mr-2" />
                Editar Mesociclo Activo
              </>
            )}
            {mesocycleLoading && (
              <>
                <ModernEmoji emoji="⏳" className="mr-2" />
                Verificando Estado
              </>
            )}
          </CardTitle>
          <CardDescription className="text-lg">
            {/* 🚨 DESCRIPCIÓN CONDICIONAL */}
            {canCreateNew && "Configuración inicial de tu mesociclo científico"}
            {mustEdit && "Modifica los días de entrenamiento de tu mesociclo activo"}
            {mesocycleLoading && "Verificando el estado de tu mesociclo..."}
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-4">
            {/* 🚨 PROGRESO CONDICIONAL: 3 pasos para editar, 4 para crear */}
            {mustEdit ? (
              <>
                <Progress value={(currentStep / 3) * 100} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  Paso {currentStep} de 3 (Modo Edición)
                </p>
              </>
            ) : (
              <>
                <Progress value={(currentStep / 4) * 100} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  Paso {currentStep} de 4 (Modo Creación)
                </p>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <Tabs value={`step-${currentStep}`} className="w-full">
            {/* Progreso visual */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {/* 🚨 PROGRESO CONDICIONAL */}
                  {mustEdit ? `Paso ${currentStep} de 3` : `Paso ${currentStep} de 4`}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {/* 🚨 PORCENTAJE CONDICIONAL */}
                  {mustEdit ? Math.round((currentStep / 3) * 100) : Math.round((currentStep / 4) * 100)}% completado
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${mustEdit ? (currentStep / 3) * 100 : (currentStep / 4) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Tabs dinámicas - solo mostrar las disponibles */}
            <TabsList className={`grid w-full ${
              currentStep === 1 ? 'grid-cols-1' :
              currentStep === 2 ? 'grid-cols-2' :
              currentStep === 3 ? 'grid-cols-3' : 'grid-cols-4'
            } mb-6`}>
              <TabsTrigger value="step-1" className="text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Contexto</span>
                <span className="sm:hidden">1</span>
              </TabsTrigger>
              {currentStep >= 2 && (
                <TabsTrigger value="step-2" className="text-xs sm:text-sm">
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Splits</span>
                  <span className="sm:hidden">2</span>
                </TabsTrigger>
              )}
              {currentStep >= 3 && (
                <TabsTrigger value="step-3" className="text-xs sm:text-sm">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Planificación</span>
                  <span className="sm:hidden">3</span>
                </TabsTrigger>
              )}
              {currentStep >= 4 && (
                <TabsTrigger value="step-4" className="text-xs sm:text-sm">
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Personalización</span>
                  <span className="sm:hidden">4</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Paso 1: Contexto del Usuario */}
            <TabsContent value="step-1" className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  <ModernEmoji emoji="🎯" className="mr-2" />
                  Tu Contexto Inteligente
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Basado en tu perfil y preferencias guardadas
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Progreso del mesociclo */}
                <MesocycleProgress
                  mesocycle={activeMesocycle?.mesocycle || null}
                  showActions={true}
                  onRefresh={refetchMesocycle}
                  onCreateNew={() => {
                    // 🚨 SOLO SI PUEDE CREAR NUEVO MESOCICLO
                    if (canCreateNew) {
                      setCurrentStep(2);
                    } else {
                      console.warn('⚠️ Cannot create new mesocycle - user has active mesocycle');
                    }
                  }}
                  onEditMesocycle={() => {
                    // 🚨 SOLO SI DEBE EDITAR MESOCICLO EXISTENTE
                    if (mustEdit) {
                      setCurrentStep(2); // 🔧 FIX: Ir a Fase 2 (asignación de splits) no Fase 3 (calendario)
                    } else {
                      console.warn('⚠️ Cannot edit mesocycle - no active mesocycle found');
                    }
                  }}
                />

                {/* Información del perfil */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Tu Perfil de Entrenamiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScientificTooltip
                      title="Frecuencia Semanal Óptima"
                      explanation="Tu frecuencia de entrenamiento determina el tipo de split más efectivo para maximizar resultados."
                      benefits={[
                        'Recuperación adecuada entre sesiones',
                        'Volumen óptimo por grupo muscular',
                        'Adherencia sostenible al programa'
                      ]}
                      scientificBasis="La frecuencia óptima varía según el nivel de entrenamiento, capacidad de recuperación y objetivos específicos."
                      type="info"
                    >
                      <div className="flex justify-between">
                        <span>Días por semana:</span>
                        <Badge variant="secondary">
                          {recommendation?.recommendation?.userFrequency || 3} días
                        </Badge>
                      </div>
                    </ScientificTooltip>

                    {/* Mostrar más datos del usuario */}
                    <UserContextDisplay
                      onChangeConsentDecision={() => {
                        localStorage.removeItem('fitness_consent_decision');
                        setConsentDecision(null);
                        setShowConsentModal(true);
                        console.log('🏥 [UserContext] Consent decision reset - showing modal again');
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Recomendación para hoy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Recomendación para Hoy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayRecommendation?.recommendation?.todayWorkout?.rest ? (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <ModernEmoji emoji="😴" size={32} className="mb-2" />
                        <p className="font-medium">Día de Descanso Recomendado</p>
                        <p className="text-sm text-muted-foreground">
                          Tu cuerpo necesita recuperación para máximo rendimiento
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <ModernEmoji emoji="💪" size={32} className="mb-2" />
                        <p className="font-medium">
                          {todayRecommendation?.recommendation?.todayWorkout?.split_name || 'Entrenamiento Recomendado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Óptimo según tu planificación científica
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center sm:justify-end">
                {/* 🚨 BOTÓN CONDICIONAL BASADO EN ESTADO DEL MESOCICLO */}
                {canCreateNew && (
                  <Button onClick={() => setCurrentStep(2)} size="lg" className="w-full sm:w-auto">
                    Continuar a Splits Profesionales
                    <Target className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {mustEdit && (
                  <Button onClick={() => setCurrentStep(2)} size="lg" className="w-full sm:w-auto">
                    Editar Días de Entrenamiento
                    <Edit className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {mesocycleLoading && (
                  <Button disabled size="lg" className="w-full sm:w-auto">
                    Verificando estado...
                    <Clock className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Paso 2: Asignación Semanal de Splits */}
            <TabsContent value="step-2" className="space-y-4 sm:space-y-6">
              {/* Debug info */}
              {loadingRecommendation && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando splits profesionales...</p>
                </div>
              )}

              {recommendationError && (
                <div className="text-center py-8">
                  <p className="text-red-600">Error cargando splits: {recommendationError.message}</p>
                </div>
              )}

              {/* Mensaje explicativo sobre limitaciones */}
              {recommendation?.recommendation?.limitationsMessage && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Splits Filtrados por Seguridad
                      </p>
                      <p className="text-sm text-amber-700">
                        {recommendation.recommendation.limitationsMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 🗓️ NUEVO: WeeklyScheduleBuilder */}
              {filteredSplits && filteredSplits.length > 0 && (
                <WeeklyScheduleBuilder
                  availableSplits={filteredSplits}
                  onScheduleChange={(schedule) => {
                    setWeeklySchedule(schedule);
                    console.log('🗓️ Weekly schedule updated:', schedule);

                    // 🔧 FIX: Establecer selectedSplitId automáticamente con validación de seguridad
                    const scheduledSplits = Object.values(schedule).filter(split => split !== null);
                    if (scheduledSplits.length > 0) {
                      // 🏥 PRIORIZAR SPLITS SEGUROS: Evitar splits que conflicten con limitaciones
                      let safestSplit = scheduledSplits[0];

                      // Si el usuario tiene limitaciones físicas, buscar el split más seguro
                      if (userLimitations.length > 0) {
                        const safeSplits = scheduledSplits.filter(split => {
                          const splitMuscleGroups = split.muscle_groups?.map(mg => mg.toLowerCase()) || [];

                          // Verificar si este split tiene conflictos con limitaciones
                          const hasConflict = userLimitations.some(limitation => {
                            if (limitation === 'knee_issues') {
                              return splitMuscleGroups.some(mg =>
                                mg.includes('quadriceps') || mg.includes('hamstrings') ||
                                mg.includes('glutes') || mg.includes('calves') || mg.includes('legs')
                              );
                            }
                            if (limitation === 'shoulder_issues') {
                              return splitMuscleGroups.some(mg =>
                                mg.includes('shoulders') || mg.includes('deltoids')
                              );
                            }
                            if (limitation === 'back_issues') {
                              return splitMuscleGroups.some(mg =>
                                mg.includes('back') || mg.includes('lats') || mg.includes('traps')
                              );
                            }
                            return false;
                          });

                          return !hasConflict;
                        });

                        if (safeSplits.length > 0) {
                          safestSplit = safeSplits[0];
                          console.log('🏥 [ScientificWorkout] Selected safe split:', safestSplit.split_name, 'avoiding limitations:', userLimitations);
                        } else {
                          console.warn('⚠️ [ScientificWorkout] No completely safe splits found, using first available:', safestSplit.split_name);
                        }
                      }

                      console.log('🔧 [ScientificWorkout] Setting selectedSplitId:', safestSplit.id, safestSplit.split_name);
                      form.setValue('selectedSplitId', safestSplit.id);
                      setSelectedSplit(safestSplit);
                    }
                  }}
                  userLimitations={userLimitations}
                  weeklyFrequency={currentFrequency}
                  availableDays={availableDays} // 🔄 Días generados dinámicamente
                />
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-full sm:w-auto">
                  ← Anterior
                </Button>
                {/* 🚨 BOTÓN CONDICIONAL: En modo edición, guardar directamente */}
                {mustEdit ? (
                  <Button
                    onClick={handleSaveMesocycle}
                    disabled={Object.keys(weeklySchedule).length === 0 || isSaving}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="hidden sm:inline">Guardando cambios...</span>
                        <span className="sm:hidden">Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Guardar Cambios</span>
                        <span className="sm:hidden">Guardar</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={Object.keys(weeklySchedule).length === 0}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Continuar
                    <Lightbulb className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Paso 3: Planificación Semanal */}
            <TabsContent value="step-3" className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  <ModernEmoji emoji="📅" className="mr-2" />
                  Tu Semana de Entrenamiento
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Planificación profesional con recuperación óptima
                </p>
              </div>

              {/* Calendario semanal educativo */}
              <WeeklyCalendar
                weeklySchedule={recommendation?.recommendation?.weeklySchedule || {}}
                onDayClick={(day, workout) => {
                  console.log('Day clicked:', day, workout);
                }}
              />

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-full sm:w-auto">
                  ← Anterior
                </Button>
                <Button onClick={() => setCurrentStep(4)} size="lg" className="w-full sm:w-auto">
                  Continuar
                  <Calendar className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            {/* Paso 4: Personalización IA */}
            <TabsContent value="step-4" className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  <ModernEmoji emoji="🧠" className="mr-2" />
                  Personalización Inteligente
                </h3>
                <p className="text-muted-foreground">
                  La IA adaptará el split científico a tus preferencias
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Nivel de energía */}
                  <FormField
                    control={form.control}
                    name="energyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <ScientificTooltip
                          title="Nivel de Energía y Personalización"
                          explanation="Tu nivel de energía actual determina la intensidad y volumen óptimo del entrenamiento para maximizar resultados sin sobreentrenamiento."
                          benefits={[
                            'Entrenamiento adaptado a tu estado actual',
                            'Prevención del sobreentrenamiento',
                            'Máximo rendimiento según energía disponible',
                            'Recuperación optimizada'
                          ]}
                          scientificBasis="La percepción subjetiva del esfuerzo (RPE) es un indicador válido del estado de recuperación y capacidad de entrenamiento."
                          type="science"
                        >
                          <FormLabel className="flex items-center text-lg cursor-help">
                            <Zap className="h-5 w-5 mr-2" />
                            ¿Cómo te sientes hoy?
                          </FormLabel>
                        </ScientificTooltip>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            {energyOptions.map((option) => (
                              <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                <RadioGroupItem value={option.id} id={option.id} />
                                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                  <div className="flex items-center">
                                    <ModernEmoji emoji={option.emoji} className="mr-3" />
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-sm text-muted-foreground">{option.description}</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tiempo disponible */}
                  <FormField
                    control={form.control}
                    name="availableTime"
                    render={({ field }) => (
                      <FormItem>
                        <ScientificTooltip
                          title="Duración Óptima del Entrenamiento"
                          explanation="La duración del entrenamiento afecta el tipo de ejercicios, volumen y intensidad para maximizar la eficiencia."
                          benefits={[
                            'Ejercicios priorizados según tiempo',
                            'Volumen optimizado por minuto',
                            'Intensidad ajustada a duración',
                            'Máxima eficiencia del entrenamiento'
                          ]}
                          scientificBasis="Entrenamientos de 45-60 minutos optimizan la respuesta hormonal anabólica, mientras que sesiones más cortas requieren mayor intensidad."
                          type="timing"
                        >
                          <FormLabel className="flex items-center text-lg cursor-help">
                            <Clock className="h-5 w-5 mr-2" />
                            ¿Cuánto tiempo tienes?
                          </FormLabel>
                        </ScientificTooltip>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-3"
                          >
                            {timeOptions.map((option) => (
                              <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                <RadioGroupItem value={option.id} id={option.id} />
                                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botones finales */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} className="w-full sm:w-auto">
                      ← Anterior
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                      <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Generando rutina profesional...</span>
                            <span className="sm:hidden">Generando...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">¡Crear Rutina Profesional!</span>
                            <span className="sm:hidden">¡Crear Rutina!</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 🏥 Modal de Consentimiento Informado */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        limitations={userLimitations}
        onConsentDecision={handleConsentDecision}
      />

      {/* 🎉 Modal de Confirmación Moderno */}
      <ModernConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          onClose();
        }}
        title="¡Mesociclo Actualizado!"
        message="Mesociclo actualizado exitosamente. Ahora puedes generar rutinas con los nuevos días."
        confirmText="Aceptar"
        type="success"
      />
    </div>
  );
}
