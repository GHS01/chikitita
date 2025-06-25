import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, Clock, Heart, AlertTriangle } from 'lucide-react';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';
import { useTranslation } from 'react-i18next';

// Schema de validación para el formulario
const firstDayFeedbackSchema = z.object({
  muscleGroupsSelected: z.array(z.string()).min(1, "Debes seleccionar al menos un grupo muscular"),
  energyLevel: z.enum(['low', 'medium', 'high']),
  availableTime: z.enum(['15-20', '30-40', '45-60', '60+']),
  preferredIntensity: z.enum(['light', 'moderate', 'intense']).optional(),
  specificGoalToday: z.string().optional(),
  todayLimitations: z.array(z.string()).optional(),
  userNotes: z.string().optional(),
  isFirstTime: z.boolean().default(true),
});

type FirstDayFeedbackFormData = z.infer<typeof firstDayFeedbackSchema>;

interface FirstDayFeedbackFormProps {
  onSubmit: (data: FirstDayFeedbackFormData) => void;
  onSkip: () => void;
  isLoading?: boolean;
  userName?: string;
}

export default function FirstDayFeedbackForm({
  onSubmit,
  onSkip,
  isLoading = false,
  userName = 'Usuario'
}: FirstDayFeedbackFormProps) {
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const { t } = useTranslation();

  const form = useForm<FirstDayFeedbackFormData>({
    resolver: zodResolver(firstDayFeedbackSchema),
    defaultValues: {
      muscleGroupsSelected: [],
      energyLevel: 'medium',
      availableTime: '45-60',
      preferredIntensity: 'moderate',
      specificGoalToday: '',
      todayLimitations: [],
      userNotes: '',
      isFirstTime: true,
    },
  });

  // Grupos musculares disponibles con iconos
  const muscleGroups = [
    { id: 'chest', name: 'Pecho', icon: '💪', color: 'bg-red-100 text-red-800' },
    { id: 'back', name: 'Espalda', icon: '🔙', color: 'bg-blue-100 text-blue-800' },
    { id: 'shoulders', name: 'Hombros', icon: '🤲', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'arms', name: 'Brazos', icon: '💪', color: 'bg-green-100 text-green-800' },
    { id: 'legs', name: 'Piernas', icon: '🦵', color: 'bg-purple-100 text-purple-800' },
    { id: 'glutes', name: 'Glúteos', icon: '🍑', color: 'bg-pink-100 text-pink-800' },
    { id: 'abs', name: 'Abdominales', icon: '🔥', color: 'bg-orange-100 text-orange-800' },
    { id: 'calves', name: 'Pantorrillas', icon: '🦵', color: 'bg-indigo-100 text-indigo-800' },
  ];

  // Limitaciones comunes del día
  const todayLimitations = [
    { id: 'back_pain_today', name: 'Me duele la espalda hoy', icon: '🔙' },
    { id: 'knee_pain_today', name: 'Me duelen las rodillas hoy', icon: '🦵' },
    { id: 'low_energy_today', name: 'Tengo poca energía hoy', icon: '😴' },
    { id: 'time_pressure', name: 'Tengo prisa hoy', icon: '⏰' },
    { id: 'stress_today', name: 'Estoy estresado hoy', icon: '😰' },
  ];

  const handleMuscleGroupToggle = (groupId: string) => {
    const newSelection = selectedMuscleGroups.includes(groupId)
      ? selectedMuscleGroups.filter(id => id !== groupId)
      : [...selectedMuscleGroups, groupId];
    
    setSelectedMuscleGroups(newSelection);
    form.setValue('muscleGroupsSelected', newSelection);
  };

  const handleSubmit = (data: FirstDayFeedbackFormData) => {
    onSubmit({
      ...data,
      muscleGroupsSelected: selectedMuscleGroups,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-xl">
            <Target className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          <ModernEmoji emoji="🎯" className="mr-2" />
          ¡Hola {userName}! Vamos a crear tu rutina perfecta
        </CardTitle>
        <CardDescription className="text-lg">
          Cuéntanos qué quieres entrenar hoy y nosotros nos encargamos del resto
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            
            {/* Selección de grupos musculares */}
            <div className="space-y-4">
              <Label className="text-xl font-semibold flex items-center">
                <Target className="h-6 w-6 mr-2 text-primary" />
                ¿Qué quieres entrenar hoy? <span className="text-red-500 ml-1">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Selecciona uno o más grupos musculares que te gustaría trabajar
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {muscleGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleMuscleGroupToggle(group.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedMuscleGroups.includes(group.id)
                        ? 'border-primary bg-primary/10 scale-105'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        <ModernEmoji emoji={group.icon} size={24} luxury={true} />
                      </div>
                      <div className="font-medium text-sm">{group.name}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedMuscleGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedMuscleGroups.map((groupId) => {
                    const group = muscleGroups.find(g => g.id === groupId);
                    return group ? (
                      <Badge key={groupId} variant="secondary" className={group.color}>
                        <ModernEmoji emoji={group.icon} size={16} luxury={true} className="mr-1" />
                        {group.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Nivel de energía */}
            <FormField
              control={form.control}
              name="energyLevel"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    ¿Cómo te sientes hoy?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low" className="flex items-center cursor-pointer">
                          <EmojiText>😴 Poca energía</EmojiText>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium" className="flex items-center cursor-pointer">
                          <EmojiText>🙂 Energía normal</EmojiText>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high" className="flex items-center cursor-pointer">
                          <EmojiText>⚡ Mucha energía</EmojiText>
                        </Label>
                      </div>
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
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-500" />
                    ¿Cuánto tiempo tienes disponible?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="15-20" id="15-20" />
                        <Label htmlFor="15-20" className="cursor-pointer">15-20 min</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="30-40" id="30-40" />
                        <Label htmlFor="30-40" className="cursor-pointer">30-40 min</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="45-60" id="45-60" />
                        <Label htmlFor="45-60" className="cursor-pointer">45-60 min</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="60+" id="60+" />
                        <Label htmlFor="60+" className="cursor-pointer">60+ min</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Intensidad preferida (opcional) */}
            <FormField
              control={form.control}
              name="preferredIntensity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    ¿Qué intensidad prefieres? <span className="text-sm text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="flex items-center cursor-pointer">
                          <EmojiText>🌱 Suave</EmojiText>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="moderate" id="moderate" />
                        <Label htmlFor="moderate" className="flex items-center cursor-pointer">
                          <EmojiText>🔥 Moderada</EmojiText>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="intense" id="intense" />
                        <Label htmlFor="intense" className="flex items-center cursor-pointer">
                          <EmojiText>💪 Intensa</EmojiText>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Objetivo específico del día (opcional) */}
            <FormField
              control={form.control}
              name="specificGoalToday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-500" />
                    ¿Tienes algún objetivo específico para hoy? <span className="text-sm text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Quiero sentirme energizado, liberar estrés, probar algo nuevo..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Limitaciones del día (opcional) */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                ¿Algo que debamos considerar hoy? <span className="text-sm text-muted-foreground">(opcional)</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Selecciona si tienes alguna molestia o limitación específica para hoy
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayLimitations.map((limitation) => (
                  <div key={limitation.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={limitation.id}
                      className="rounded"
                      onChange={(e) => {
                        const currentLimitations = form.getValues('todayLimitations') || [];
                        const newLimitations = e.target.checked
                          ? [...currentLimitations, limitation.id]
                          : currentLimitations.filter(id => id !== limitation.id);
                        form.setValue('todayLimitations', newLimitations);
                      }}
                    />
                    <Label htmlFor={limitation.id} className="flex items-center cursor-pointer">
                      <ModernEmoji emoji={limitation.icon} size={18} luxury={true} className="mr-2" />
                      {limitation.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas adicionales (opcional) */}
            <FormField
              control={form.control}
              name="userNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">
                    ¿Algo más que quieras contarnos? <span className="text-sm text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cualquier comentario adicional que nos ayude a crear la rutina perfecta para ti..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex space-x-4 pt-6">
              <Button
                type="submit"
                disabled={isLoading || selectedMuscleGroups.length === 0}
                className="flex-1 h-12 text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generando tu rutina perfecta...
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5 mr-2" />
                    ¡Crear mi rutina personalizada!
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={isLoading}
                className="h-12"
              >
                Saltar por ahora
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
