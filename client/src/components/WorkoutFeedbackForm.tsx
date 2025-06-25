import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Star, Brain, Target, Clock, Zap } from 'lucide-react';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';
import { useTranslation } from 'react-i18next';

// Schema de validación para el formulario
const feedbackSchema = z.object({
  satisfactionRating: z.number().min(1).max(5),
  dislikeReasons: z.array(z.string()).optional(),
  todayMusclePreference: z.array(z.string()).optional(),
  preferredExercises: z.string().optional(),
  avoidedExercises: z.string().optional(),
  energyLevel: z.string(),
  availableTime: z.string(),
  userFeedback: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface WorkoutFeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => void;
  onSkip: () => void;
  isLoading?: boolean;
  previousWorkout?: any;
}

export default function WorkoutFeedbackForm({
  onSubmit,
  onSkip,
  isLoading = false,
  previousWorkout
}: WorkoutFeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const { t } = useTranslation();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      satisfactionRating: 0,
      dislikeReasons: [],
      todayMusclePreference: [],
      preferredExercises: '',
      avoidedExercises: '',
      energyLevel: '',
      availableTime: '',
      userFeedback: '',
    },
  });

  const dislikeOptions = [
    { id: 'too_intense', label: 'Muy intensa/difícil', emoji: '😰' },
    { id: 'too_easy', label: 'Muy fácil/aburrida', emoji: '😴' },
    { id: 'wrong_exercises', label: 'Ejercicios que no me gustan', emoji: '😒' },
    { id: 'wrong_muscles', label: 'Músculos incorrectos', emoji: '🎯' },
    { id: 'too_long', label: 'Muy larga', emoji: '⏰' },
    { id: 'too_short', label: 'Muy corta', emoji: '⚡' },
    { id: 'repetitive', label: 'Ejercicios repetitivos', emoji: '🔄' },
  ];

  const muscleOptions = [
    { id: 'legs', label: 'Piernas/Glúteos', emoji: '🦵' },
    { id: 'chest', label: 'Pecho', emoji: '💪' },
    { id: 'back', label: 'Espalda', emoji: '🏋️' },
    { id: 'arms', label: 'Brazos', emoji: '💪' },
    { id: 'shoulders', label: 'Hombros', emoji: '🤸' },
    { id: 'core', label: 'Core/Abdomen', emoji: '🔥' },
    { id: 'cardio', label: 'Cardio', emoji: '❤️' },
    { id: 'full_body', label: 'Cuerpo completo', emoji: '🏃' },
  ];

  const energyOptions = [
    { id: 'high', label: 'Con mucha energía - rutina intensa', emoji: '🚀' },
    { id: 'moderate', label: 'Energía normal - rutina moderada', emoji: '⚡' },
    { id: 'low', label: 'Poca energía - rutina suave', emoji: '🌙' },
    { id: 'minimal', label: 'Solo quiero moverme un poco', emoji: '🚶' },
  ];

  const timeOptions = [
    { id: '15-20', label: '15-20 min', emoji: '⚡' },
    { id: '30-40', label: '30-40 min', emoji: '⏰' },
    { id: '45-60', label: '45-60 min', emoji: '🕐' },
    { id: '60+', label: 'Más de 1 hora', emoji: '⏳' },
  ];

  const handleSubmit = (data: FeedbackFormData) => {
    onSubmit({
      ...data,
      satisfactionRating: rating,
    });
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              onChange(star);
              setRating(star);
            }}
            className={`text-2xl transition-colors ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <Star className={`h-6 w-6 ${star <= value ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary text-white p-3 rounded-xl">
            <Brain className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-primary">
          <ModernEmoji emoji="🧠" className="mr-2" />
          {t('feedback.title')}
        </CardTitle>
        <CardDescription>
          {t('feedback.subtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Rating de satisfacción */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                {t('feedback.satisfactionRating')}
              </Label>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rating === 1 && <EmojiText>😞 No me gustó nada</EmojiText>}
                  {rating === 2 && <EmojiText>😐 No me gustó mucho</EmojiText>}
                  {rating === 3 && <EmojiText>🙂 Estuvo bien</EmojiText>}
                  {rating === 4 && <EmojiText>😊 Me gustó bastante</EmojiText>}
                  {rating === 5 && <EmojiText>🤩 ¡Me encantó!</EmojiText>}
                </p>
              )}
            </div>

            {/* Razones de insatisfacción (solo si rating < 4) */}
            {rating > 0 && rating < 4 && (
              <FormField
                control={form.control}
                name="dislikeReasons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      {t('feedback.whatDidntLike')}
                    </FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dislikeOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={field.value?.includes(option.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, option.id]);
                              } else {
                                field.onChange(current.filter(item => item !== option.id));
                              }
                            }}
                          />
                          <Label htmlFor={option.id} className="flex items-center cursor-pointer">
                            <ModernEmoji emoji={option.emoji} className="mr-2" />
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Músculos que quiere trabajar HOY */}
            <FormField
              control={form.control}
              name="todayMusclePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    {t('feedback.musclePreference')}
                  </FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {muscleOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, option.id]);
                            } else {
                              field.onChange(current.filter(item => item !== option.id));
                            }
                          }}
                        />
                        <Label htmlFor={option.id} className="flex items-center cursor-pointer text-sm">
                          <ModernEmoji emoji={option.emoji} className="mr-1" />
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ejercicios favoritos */}
            <FormField
              control={form.control}
              name="preferredExercises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Tienes ejercicios favoritos?</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: sentadillas, flexiones, peso muerto..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ejercicios a evitar */}
            <FormField
              control={form.control}
              name="avoidedExercises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.avoidedExercises')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: burpees, saltos, ejercicios de rodillas..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nivel de energía */}
            <FormField
              control={form.control}
              name="energyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    {t('feedback.energyLevel')}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      {energyOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex items-center cursor-pointer">
                            <ModernEmoji emoji={option.emoji} className="mr-2" />
                            {option.label}
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
                  <FormLabel className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    {t('feedback.availableTime')}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {timeOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex items-center cursor-pointer">
                            <ModernEmoji emoji={option.emoji} className="mr-2" />
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comentarios adicionales */}
            <FormField
              control={form.control}
              name="userFeedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.additionalComments')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('feedback.additionalCommentsPlaceholder')}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading || rating === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('feedback.generating')}
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    {t('feedback.generatePerfectRoutine')}
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={isLoading}
              >
                {t('feedback.skipFeedback')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
