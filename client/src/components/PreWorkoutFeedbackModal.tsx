import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Battery, Target, AlertTriangle, Play } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface PreWorkoutFeedbackData {
  energy: number;
  motivation: number;
  availableTime: number;
  limitations: string;
}

interface PreWorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PreWorkoutFeedbackData) => void;
  workoutName?: string;
  isLoading?: boolean;
}

const PreWorkoutFeedbackModal: React.FC<PreWorkoutFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workoutName = "Rutina de Hoy",
  isLoading = false
}) => {
  const [energy, setEnergy] = useState([3]);
  const [motivation, setMotivation] = useState([3]);
  const [availableTime, setAvailableTime] = useState([45]);
  const [limitations, setLimitations] = useState('');

  const handleSubmit = () => {
    const data: PreWorkoutFeedbackData = {
      energy: energy[0],
      motivation: motivation[0],
      availableTime: availableTime[0],
      limitations: limitations.trim()
    };
    onSubmit(data);
  };

  const getEnergyEmoji = (level: number) => {
    if (level <= 1) return '😴';
    if (level <= 2) return '😐';
    if (level <= 3) return '🙂';
    if (level <= 4) return '😊';
    return '⚡';
  };

  const getMotivationEmoji = (level: number) => {
    if (level <= 1) return '😞';
    if (level <= 2) return '😐';
    if (level <= 3) return '🙂';
    if (level <= 4) return '😄';
    return '🔥';
  };

  const getEnergyLabel = (level: number) => {
    if (level <= 1) return 'Muy cansado';
    if (level <= 2) return 'Algo cansado';
    if (level <= 3) return 'Normal';
    if (level <= 4) return 'Con energía';
    return 'Súper energético';
  };

  const getMotivationLabel = (level: number) => {
    if (level <= 1) return 'Sin ganas';
    if (level <= 2) return 'Pocas ganas';
    if (level <= 3) return 'Normal';
    if (level <= 4) return 'Motivado';
    return 'Súper motivado';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <ModernEmoji emoji="🎯" size={24} />
            ¿Cómo te sientes hoy?
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Ayúdanos a personalizar tu {workoutName}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Energy Level */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Battery className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Nivel de Energía</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getEnergyEmoji(energy[0])} size={32} />
                <p className="text-sm font-medium mt-1">{getEnergyLabel(energy[0])}</p>
              </div>
              <Slider
                value={energy}
                onValueChange={setEnergy}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Muy bajo</span>
                <span>Muy alto</span>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Level */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Motivación</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getMotivationEmoji(motivation[0])} size={32} />
                <p className="text-sm font-medium mt-1">{getMotivationLabel(motivation[0])}</p>
              </div>
              <Slider
                value={motivation}
                onValueChange={setMotivation}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Sin ganas</span>
                <span>Súper motivado</span>
              </div>
            </CardContent>
          </Card>

          {/* Available Time */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium">Tiempo Disponible</span>
              </div>
              <div className="text-center mb-3">
                <span className="text-2xl font-bold text-green-600">{availableTime[0]}</span>
                <span className="text-sm text-muted-foreground ml-1">minutos</span>
              </div>
              <Slider
                value={availableTime}
                onValueChange={setAvailableTime}
                max={120}
                min={15}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15 min</span>
                <span>2 horas</span>
              </div>
            </CardContent>
          </Card>

          {/* Limitations */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Limitaciones de Hoy</span>
              </div>
              <Textarea
                placeholder="¿Alguna molestia, dolor o limitación hoy? (opcional)"
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                className="min-h-[60px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {limitations.length}/200 caracteres
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
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Iniciando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Comenzar Rutina
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreWorkoutFeedbackModal;
