import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Heart, 
  Battery, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  CheckCircle 
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface PostWorkoutFeedbackData {
  rpe: number;
  satisfaction: number;
  fatigue: number;
  progressFeeling: number;
  preferredExercises: string[];
  dislikedExercises: string[];
  notes: string;
}

interface PostWorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostWorkoutFeedbackData) => void;
  workoutName?: string;
  exercises?: string[];
  isLoading?: boolean;
}

const PostWorkoutFeedbackModal: React.FC<PostWorkoutFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workoutName = "Rutina",
  exercises = [],
  isLoading = false
}) => {
  const [rpe, setRpe] = useState([7]);
  const [satisfaction, setSatisfaction] = useState([4]);
  const [fatigue, setFatigue] = useState([3]);
  const [progressFeeling, setProgressFeeling] = useState([3]);
  const [preferredExercises, setPreferredExercises] = useState<string[]>([]);
  const [dislikedExercises, setDislikedExercises] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const data: PostWorkoutFeedbackData = {
      rpe: rpe[0],
      satisfaction: satisfaction[0],
      fatigue: fatigue[0],
      progressFeeling: progressFeeling[0],
      preferredExercises,
      dislikedExercises,
      notes: notes.trim()
    };
    onSubmit(data);
  };

  const getRpeEmoji = (level: number) => {
    if (level <= 2) return '😌';
    if (level <= 4) return '🙂';
    if (level <= 6) return '😊';
    if (level <= 8) return '😤';
    return '🥵';
  };

  const getSatisfactionEmoji = (level: number) => {
    if (level <= 1) return '😞';
    if (level <= 2) return '😐';
    if (level <= 3) return '🙂';
    if (level <= 4) return '😊';
    return '🤩';
  };

  const getFatigueEmoji = (level: number) => {
    if (level <= 1) return '⚡';
    if (level <= 2) return '😊';
    if (level <= 3) return '😐';
    if (level <= 4) return '😴';
    return '🥱';
  };

  const getProgressEmoji = (level: number) => {
    if (level <= 1) return '📉';
    if (level <= 2) return '😐';
    if (level <= 3) return '📊';
    if (level <= 4) return '📈';
    return '🚀';
  };

  const toggleExercisePreference = (exercise: string, type: 'preferred' | 'disliked') => {
    if (type === 'preferred') {
      setPreferredExercises(prev => 
        prev.includes(exercise) 
          ? prev.filter(e => e !== exercise)
          : [...prev, exercise]
      );
      // Remove from disliked if adding to preferred
      setDislikedExercises(prev => prev.filter(e => e !== exercise));
    } else {
      setDislikedExercises(prev => 
        prev.includes(exercise) 
          ? prev.filter(e => e !== exercise)
          : [...prev, exercise]
      );
      // Remove from preferred if adding to disliked
      setPreferredExercises(prev => prev.filter(e => e !== exercise));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <ModernEmoji emoji="🎉" size={24} />
            ¡Rutina Completada!
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Ayúdanos a mejorar tu próximo {workoutName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* RPE General */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Esfuerzo General (RPE)</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getRpeEmoji(rpe[0])} size={32} />
                <p className="text-sm font-medium mt-1">
                  {rpe[0] <= 2 ? 'Muy fácil' : 
                   rpe[0] <= 4 ? 'Fácil' : 
                   rpe[0] <= 6 ? 'Moderado' : 
                   rpe[0] <= 8 ? 'Difícil' : 'Muy difícil'}
                </p>
                <p className="text-xs text-muted-foreground">RPE {rpe[0]}/10</p>
              </div>
              <Slider
                value={rpe}
                onValueChange={setRpe}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Satisfacción */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-pink-600" />
                <span className="font-medium">Satisfacción</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getSatisfactionEmoji(satisfaction[0])} size={32} />
                <p className="text-sm font-medium mt-1">
                  {satisfaction[0] <= 1 ? 'No me gustó' : 
                   satisfaction[0] <= 2 ? 'Regular' : 
                   satisfaction[0] <= 3 ? 'Bien' : 
                   satisfaction[0] <= 4 ? 'Me gustó' : 'Me encantó'}
                </p>
              </div>
              <Slider
                value={satisfaction}
                onValueChange={setSatisfaction}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Fatiga */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Battery className="h-4 w-4 text-blue-600" />
                <span className="font-medium">¿Cómo te sientes ahora?</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getFatigueEmoji(fatigue[0])} size={32} />
                <p className="text-sm font-medium mt-1">
                  {fatigue[0] <= 1 ? 'Con mucha energía' : 
                   fatigue[0] <= 2 ? 'Bien' : 
                   fatigue[0] <= 3 ? 'Normal' : 
                   fatigue[0] <= 4 ? 'Cansado' : 'Muy cansado'}
                </p>
              </div>
              <Slider
                value={fatigue}
                onValueChange={setFatigue}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Progreso Percibido */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">¿Sientes que progresaste?</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getProgressEmoji(progressFeeling[0])} size={32} />
                <p className="text-sm font-medium mt-1">
                  {progressFeeling[0] <= 1 ? 'Retrocedí' : 
                   progressFeeling[0] <= 2 ? 'Igual que antes' : 
                   progressFeeling[0] <= 3 ? 'Un poco mejor' : 
                   progressFeeling[0] <= 4 ? 'Buen progreso' : 'Excelente progreso'}
                </p>
              </div>
              <Slider
                value={progressFeeling}
                onValueChange={setProgressFeeling}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Ejercicios Favoritos/Odiados */}
          {exercises.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">¿Qué ejercicios te gustaron?</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {exercises.map((exercise, index) => (
                    <Badge
                      key={index}
                      variant={preferredExercises.includes(exercise) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-green-100"
                      onClick={() => toggleExercisePreference(exercise, 'preferred')}
                    >
                      {preferredExercises.includes(exercise) && <ThumbsUp className="h-3 w-3 mr-1" />}
                      {exercise}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="font-medium">¿Cuáles cambiarías?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exercises.map((exercise, index) => (
                    <Badge
                      key={index}
                      variant={dislikedExercises.includes(exercise) ? "destructive" : "outline"}
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => toggleExercisePreference(exercise, 'disliked')}
                    >
                      {dislikedExercises.includes(exercise) && <ThumbsDown className="h-3 w-3 mr-1" />}
                      {exercise}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Comentarios adicionales</span>
              </div>
              <Textarea
                placeholder="¿Algo más que quieras compartir? (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length}/300 caracteres
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Saltar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostWorkoutFeedbackModal;
