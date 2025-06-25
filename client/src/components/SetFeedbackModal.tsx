import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { CheckCircle, XCircle, Minus, Zap, Weight } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface SetFeedbackData {
  setRpe: number;
  completedAsPlanned: boolean;
  weightFeeling: 'too_light' | 'perfect' | 'too_heavy';
}

interface SetFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SetFeedbackData) => void;
  exerciseName: string;
  setNumber: number;
  isLoading?: boolean;
}

const SetFeedbackModal: React.FC<SetFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  exerciseName,
  setNumber,
  isLoading = false
}) => {
  const [rpe, setRpe] = useState([7]);
  const [completedAsPlanned, setCompletedAsPlanned] = useState<boolean | null>(null);
  const [weightFeeling, setWeightFeeling] = useState<'too_light' | 'perfect' | 'too_heavy' | null>(null);

  const handleSubmit = () => {
    if (completedAsPlanned === null || weightFeeling === null) {
      return; // Require all fields
    }

    const data: SetFeedbackData = {
      setRpe: rpe[0],
      completedAsPlanned,
      weightFeeling
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

  const getRpeLabel = (level: number) => {
    if (level <= 2) return 'Muy fácil';
    if (level <= 4) return 'Fácil';
    if (level <= 6) return 'Moderado';
    if (level <= 8) return 'Difícil';
    return 'Muy difícil';
  };

  const isFormValid = completedAsPlanned !== null && weightFeeling !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center text-lg">
            <ModernEmoji emoji="💪" size={20} />
            ¿Cómo fue el set?
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            {exerciseName} - Set {setNumber}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* RPE Slider */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Esfuerzo (RPE)</span>
              </div>
              <div className="text-center mb-3">
                <ModernEmoji emoji={getRpeEmoji(rpe[0])} size={28} />
                <p className="text-sm font-medium mt-1">{getRpeLabel(rpe[0])}</p>
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
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </CardContent>
          </Card>

          {/* Completed as Planned */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">¿Completaste como planeado?</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={completedAsPlanned === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCompletedAsPlanned(true)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-3 w-3" />
                  Sí
                </Button>
                <Button
                  variant={completedAsPlanned === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCompletedAsPlanned(false)}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-3 w-3" />
                  No
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weight Feeling */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Weight className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">¿Cómo se sintió el peso?</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={weightFeeling === 'too_light' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWeightFeeling('too_light')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <ModernEmoji emoji="😌" size={16} />
                  <span className="text-xs">Muy fácil</span>
                </Button>
                <Button
                  variant={weightFeeling === 'perfect' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWeightFeeling('perfect')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <ModernEmoji emoji="👌" size={16} />
                  <span className="text-xs">Perfecto</span>
                </Button>
                <Button
                  variant={weightFeeling === 'too_heavy' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWeightFeeling('too_heavy')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <ModernEmoji emoji="😤" size={16} />
                  <span className="text-xs">Muy pesado</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
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
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Guardando...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetFeedbackModal;
