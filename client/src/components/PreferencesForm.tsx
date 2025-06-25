import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFrequencyChange } from "@/hooks/useFrequencyChange";
import FrequencyChangeModal from "./FrequencyChangeModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertUserPreferencesSchema, type InsertUserPreferences, type UserPreferences } from "@shared/schema";
import {
  Dumbbell, Heart, Zap, Bike, TreePine, Home,
  MapPin, Clock, AlertTriangle, CheckCircle
} from "lucide-react";
import { ModernEmoji } from "@/components/ui/modern-emoji";
import { useTranslation } from 'react-i18next';

interface PreferencesFormProps {
  preferences?: UserPreferences;
  onSuccess?: () => void;
}

// Moved to component to use translations

// Moved to component to use translations

const limitationOptions = [
  { id: 'back_problems', label: 'Back Problems', icon: '🦴' },
  { id: 'knee_issues', label: 'Knee Issues', icon: '🦵' },
  { id: 'shoulder_issues', label: 'Shoulder Issues', icon: '💪' },
  { id: 'asthma', label: 'Asthma', icon: '🫁' },
  { id: 'heart_condition', label: 'Heart Condition', icon: '❤️' },
  { id: 'pregnancy', label: 'Pregnancy', icon: '🤱' },
  { id: 'other', label: 'Other', icon: '✏️', hasCustomInput: true },
];

export default function PreferencesForm({ preferences, onSuccess }: PreferencesFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  // 🔄 Hook para manejar cambios de frecuencia
  const {
    showModal,
    currentChangeData,
    isProcessing,
    processDecision,
    closeModal,
    handleFrequencyChangeDetection
  } = useFrequencyChange();

  // Exercise type options with translations
  const exerciseTypeOptions = [
    { id: 'functional', label: t('preferences.functional'), icon: '🏃‍♂️' },
    { id: 'weights', label: t('preferences.weights'), icon: '🏋️‍♂️' },
    { id: 'cardio', label: t('preferences.cardio'), icon: '❤️' },
    { id: 'hiit', label: t('preferences.hiit'), icon: '⚡' },
    { id: 'yoga', label: t('preferences.yoga'), icon: '🧘‍♀️' },
    { id: 'calisthenics', label: t('preferences.calisthenics'), icon: '💪' },
    { id: 'other', label: t('preferences.other'), icon: '✏️', hasCustomInput: true },
  ];

  const timeOptions = [
    { value: 'morning', label: t('preferences.morning'), icon: '🌅' },
    { value: 'afternoon', label: t('preferences.afternoon'), icon: '☀️' },
    { value: 'evening', label: t('preferences.evening'), icon: '🌆' },
  ];

  const locationOptions = [
    { value: 'home', label: t('preferences.home'), icon: '🏠' },
    { value: 'gym', label: t('preferences.gym'), icon: '🏋️‍♂️' },
    { value: 'park', label: t('preferences.park'), icon: '🌳' },
    { value: 'mixed', label: t('preferences.mixed'), icon: '🔄' },
  ];

  const equipmentOptions = [
    { id: 'dumbbells', label: t('preferences.dumbbells'), icon: '🏋️‍♂️' },
    { id: 'barbell', label: t('preferences.barbell'), icon: '🏋️‍♀️' },
    { id: 'resistance_bands', label: t('preferences.resistanceBands'), icon: '🎯' },
    { id: 'bodyweight', label: t('preferences.bodyweightOnly'), icon: '💪' },
    { id: 'machines', label: t('preferences.gymMachines'), icon: '⚙️' },
    { id: 'kettlebells', label: t('preferences.kettlebells'), icon: '🔔' },
    { id: 'other', label: t('preferences.other'), icon: '✏️', hasCustomInput: true },
  ];

  // Estados para inputs personalizados
  const [customExerciseType, setCustomExerciseType] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [customLimitation, setCustomLimitation] = useState('');

  const form = useForm<InsertUserPreferences>({
    resolver: zodResolver(insertUserPreferencesSchema),
    defaultValues: {
      exerciseTypes: preferences?.exerciseTypes || [],
      weeklyFrequency: preferences?.weeklyFrequency || 3,
      preferredTime: preferences?.preferredTime || 'morning',
      location: preferences?.location || 'gym',
      equipment: preferences?.equipment || [],
      limitations: preferences?.limitations || [],
      // ✅ RESTAURADO: Sistema original sin días disponibles separados
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: InsertUserPreferences) => {
      console.log('🔧 [PreferencesForm] Sending preferences data:', data);

      const token = localStorage.getItem('token'); // 🔧 FIX: Use correct token key
      console.log('🔧 [PreferencesForm] Token exists:', !!token);
      console.log('🔧 [PreferencesForm] Token value:', token ? `${token.substring(0, 20)}...` : 'null');

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      console.log('🔧 [PreferencesForm] Response status:', response.status);
      console.log('🔧 [PreferencesForm] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 [PreferencesForm] Error response:', errorText);
        throw new Error(`Failed to update preferences: ${errorText}`);
      }

      const result = await response.json();
      console.log('🔧 [PreferencesForm] Success response:', result);

      // 🔄 Verificar si hay detección de cambio de frecuencia
      if (result.frequencyChangeDetection) {
        console.log('🚨 [PreferencesForm] Frequency change detected:', result.frequencyChangeDetection);
        handleFrequencyChangeDetection(result.frequencyChangeDetection);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your training preferences have been saved successfully.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertUserPreferences) => {
    console.log('🔧 [PreferencesForm] onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      console.log('🔧 [PreferencesForm] Calling mutation...');
      await updatePreferencesMutation.mutateAsync(data);
      console.log('🔧 [PreferencesForm] Mutation completed successfully');
    } catch (error) {
      console.error('🔧 [PreferencesForm] Mutation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  // Función para manejar valores custom
  const handleCustomValue = (array: string[], customValue: string, type: 'exercise' | 'equipment' | 'limitation') => {
    if (!customValue.trim()) return array;

    const customKey = `other:${customValue.trim()}`;

    // Remover "other" simple y agregar el valor custom
    const filteredArray = array.filter(item => item !== 'other');

    // Si ya existe este valor custom, no lo agregamos de nuevo
    if (filteredArray.includes(customKey)) return array;

    return [...filteredArray, customKey];
  };

  // Función para obtener el display value
  const getDisplayValue = (value: string, options: any[]) => {
    if (value.startsWith('other:')) {
      return value.replace('other:', '');
    }
    return options.find(opt => opt.id === value)?.label || value;
  };

  // Función para verificar si "other" está seleccionado
  const hasOtherSelected = (array: string[]) => {
    return array.includes('other') || array.some(item => item.startsWith('other:'));
  };

  // Debug logs
  console.log('🔧 [PreferencesForm] Component rendered');
  console.log('🔧 [PreferencesForm] Preferences data:', preferences);
  console.log('🔧 [PreferencesForm] Form values:', form.getValues());
  console.log('🔧 [PreferencesForm] isSubmitting:', isSubmitting);

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log('🔧 [PreferencesForm] Form onSubmit triggered!');
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-6"
      >
        {/* Exercise Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Dumbbell className="h-5 w-5" />
              <span>{t('preferences.exerciseTypes')}</span>
            </CardTitle>
            <CardDescription>{t('preferences.selectPreferredTypes')}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="exerciseTypes"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {exerciseTypeOptions.map((option) => (
                      <div key={option.id}>
                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            field.value.includes(option.id) || (option.id === 'other' && hasOtherSelected(field.value))
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => {
                            if (option.id === 'other') {
                              // Si ya hay valores custom, no hacer nada aquí
                              if (!hasOtherSelected(field.value)) {
                                const newValue = toggleArrayItem(field.value, option.id);
                                field.onChange(newValue);
                              }
                            } else {
                              const newValue = toggleArrayItem(field.value, option.id);
                              field.onChange(newValue);
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="mb-1">
                              <ModernEmoji emoji={option.icon} size={32} />
                            </div>
                            <div className="text-sm font-medium">{option.label}</div>
                          </div>
                        </div>

                        {/* Input personalizado para "Other" */}
                        {option.id === 'other' && (field.value.includes('other') || hasOtherSelected(field.value)) && (
                          <div className="mt-2">
                            <Input
                              placeholder="Specify your exercise type..."
                              value={customExerciseType}
                              onChange={(e) => setCustomExerciseType(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && customExerciseType.trim()) {
                                  const newValue = handleCustomValue(field.value, customExerciseType, 'exercise');
                                  field.onChange(newValue);
                                  setCustomExerciseType('');
                                }
                              }}
                              className="text-sm"
                            />
                            {customExerciseType.trim() && (
                              <Button
                                type="button"
                                size="sm"
                                className="mt-1 w-full"
                                onClick={() => {
                                  const newValue = handleCustomValue(field.value, customExerciseType, 'exercise');
                                  field.onChange(newValue);
                                  setCustomExerciseType('');
                                }}
                              >
                                Add "{customExerciseType}"
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mostrar valores custom seleccionados */}
                  {field.value.some(item => item.startsWith('other:')) && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Custom Exercise Types:</div>
                      <div className="flex flex-wrap gap-2">
                        {field.value
                          .filter(item => item.startsWith('other:'))
                          .map((item, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => {
                                const newValue = field.value.filter(v => v !== item);
                                field.onChange(newValue);
                              }}
                            >
                              {getDisplayValue(item, exerciseTypeOptions)} ×
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Training Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>{t('preferences.trainingFrequency')}</span>
            </CardTitle>
            <CardDescription>{t('preferences.howManyDaysPerWeek')}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="weeklyFrequency"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-primary">{field.value}</span>
                      <span className="text-lg text-muted-foreground ml-2">{t('preferences.daysPerWeek')}</span>
                    </div>
                    <Slider
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      max={7}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>1 day</span>
                      <span>7 days</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ✅ RESTAURADO: Sistema original sin configuración de días separada */}

        {/* Preferred Time & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{t('preferences.preferredTime')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <ModernEmoji emoji={option.icon} size={16} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>{t('preferences.location')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <ModernEmoji emoji={option.icon} size={16} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Available Equipment</span>
            </CardTitle>
            <CardDescription>What equipment do you have access to?</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {equipmentOptions.map((option) => (
                      <div key={option.id}>
                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            field.value.includes(option.id) || (option.id === 'other' && hasOtherSelected(field.value))
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => {
                            if (option.id === 'other') {
                              if (!hasOtherSelected(field.value)) {
                                const newValue = toggleArrayItem(field.value, option.id);
                                field.onChange(newValue);
                              }
                            } else {
                              const newValue = toggleArrayItem(field.value, option.id);
                              field.onChange(newValue);
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="mb-1">
                              <ModernEmoji emoji={option.icon} size={32} />
                            </div>
                            <div className="text-sm font-medium">{option.label}</div>
                          </div>
                        </div>

                        {/* Input personalizado para "Other" */}
                        {option.id === 'other' && (field.value.includes('other') || hasOtherSelected(field.value)) && (
                          <div className="mt-2">
                            <Input
                              placeholder="Specify your equipment..."
                              value={customEquipment}
                              onChange={(e) => setCustomEquipment(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && customEquipment.trim()) {
                                  const newValue = handleCustomValue(field.value, customEquipment, 'equipment');
                                  field.onChange(newValue);
                                  setCustomEquipment('');
                                }
                              }}
                              className="text-sm"
                            />
                            {customEquipment.trim() && (
                              <Button
                                type="button"
                                size="sm"
                                className="mt-1 w-full"
                                onClick={() => {
                                  const newValue = handleCustomValue(field.value, customEquipment, 'equipment');
                                  field.onChange(newValue);
                                  setCustomEquipment('');
                                }}
                              >
                                Add "{customEquipment}"
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mostrar valores custom seleccionados */}
                  {field.value.some(item => item.startsWith('other:')) && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Custom Equipment:</div>
                      <div className="flex flex-wrap gap-2">
                        {field.value
                          .filter(item => item.startsWith('other:'))
                          .map((item, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => {
                                const newValue = field.value.filter(v => v !== item);
                                field.onChange(newValue);
                              }}
                            >
                              {getDisplayValue(item, equipmentOptions)} ×
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Physical Limitations</span>
            </CardTitle>
            <CardDescription>Any injuries or conditions we should consider?</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="limitations"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {limitationOptions.map((option) => (
                      <div key={option.id}>
                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            field.value.includes(option.id) || (option.id === 'other' && hasOtherSelected(field.value))
                              ? 'border-destructive bg-destructive/10'
                              : 'border-border hover:border-destructive/50'
                          }`}
                          onClick={() => {
                            if (option.id === 'other') {
                              if (!hasOtherSelected(field.value)) {
                                const newValue = toggleArrayItem(field.value, option.id);
                                field.onChange(newValue);
                              }
                            } else {
                              const newValue = toggleArrayItem(field.value, option.id);
                              field.onChange(newValue);
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="mb-1">
                              <ModernEmoji emoji={option.icon} size={32} />
                            </div>
                            <div className="text-sm font-medium">{option.label}</div>
                          </div>
                        </div>

                        {/* Input personalizado para "Other" */}
                        {option.id === 'other' && (field.value.includes('other') || hasOtherSelected(field.value)) && (
                          <div className="mt-2">
                            <Input
                              placeholder="Specify your limitation..."
                              value={customLimitation}
                              onChange={(e) => setCustomLimitation(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && customLimitation.trim()) {
                                  const newValue = handleCustomValue(field.value, customLimitation, 'limitation');
                                  field.onChange(newValue);
                                  setCustomLimitation('');
                                }
                              }}
                              className="text-sm"
                            />
                            {customLimitation.trim() && (
                              <Button
                                type="button"
                                size="sm"
                                className="mt-1 w-full"
                                onClick={() => {
                                  const newValue = handleCustomValue(field.value, customLimitation, 'limitation');
                                  field.onChange(newValue);
                                  setCustomLimitation('');
                                }}
                              >
                                Add "{customLimitation}"
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mostrar valores custom seleccionados */}
                  {field.value.some(item => item.startsWith('other:')) && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Custom Limitations:</div>
                      <div className="flex flex-wrap gap-2">
                        {field.value
                          .filter(item => item.startsWith('other:'))
                          .map((item, index) => (
                            <Badge
                              key={index}
                              variant="destructive"
                              className="cursor-pointer hover:bg-destructive/80"
                              onClick={() => {
                                const newValue = field.value.filter(v => v !== item);
                                field.onChange(newValue);
                              }}
                            >
                              {getDisplayValue(item, limitationOptions)} ×
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center px-4 pb-6 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>

      {/* 🔄 Modal de Cambio de Frecuencia */}
      {showModal && currentChangeData && (
        <FrequencyChangeModal
          isOpen={showModal}
          onClose={closeModal}
          changeData={currentChangeData}
          onDecision={processDecision}
        />
      )}
    </Form>
  );
}
