import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, TrendingDown, Minus, Save, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface WeightGoal {
  id: number;
  startWeight: number;
  targetWeight: number;
  goalType: 'gain_weight' | 'lose_weight' | 'maintain';
  targetDate?: string;
}

interface SetGoalModalProps {
  onClose: () => void;
  onSuccess: () => void;
  existingGoal?: WeightGoal;
}

const goalTypes = [
  {
    value: 'gain_weight',
    label: 'Ganar Peso',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Aumentar masa muscular o peso corporal',
    color: 'text-green-600'
  },
  {
    value: 'lose_weight',
    label: 'Perder Peso',
    icon: <TrendingDown className="w-4 h-4" />,
    description: 'Reducir peso corporal y grasa',
    color: 'text-blue-600'
  },
  {
    value: 'maintain',
    label: 'Mantener Peso',
    icon: <Minus className="w-4 h-4" />,
    description: 'Mantener peso actual y mejorar composición',
    color: 'text-gray-600'
  }
];

export function SetGoalModal({ onClose, onSuccess, existingGoal }: SetGoalModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    targetWeight: '',
    goalType: 'gain_weight' as 'gain_weight' | 'lose_weight' | 'maintain',
    targetDate: ''
  });

  // Get user's current weight as start weight
  const startWeight = user?.currentWeight || 0;

  // Auto-detect goal type from user's registration data
  const autoDetectGoalType = (): 'gain_weight' | 'lose_weight' | 'maintain' => {
    if (!user?.targetWeight || !user?.currentWeight) return 'maintain';

    const difference = user.targetWeight - user.currentWeight;
    if (difference > 2) return 'gain_weight';
    if (difference < -2) return 'lose_weight';
    return 'maintain';
  };

  // Initialize form with existing goal data OR user's registration data
  useEffect(() => {
    if (existingGoal) {
      setFormData({
        targetWeight: existingGoal.targetWeight.toString(),
        goalType: existingGoal.goalType,
        targetDate: existingGoal.targetDate ? existingGoal.targetDate.split('T')[0] : ''
      });
    } else if (user?.targetWeight) {
      // Use data from registration
      setFormData({
        targetWeight: user.targetWeight.toString(),
        goalType: autoDetectGoalType(),
        targetDate: ''
      });
    }
  }, [existingGoal, user]);

  const createOrUpdateGoal = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token'); // 🔧 FIX: Use correct token key
      const response = await fetch('/api/weight-progress/goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save goal');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(existingGoal ? '¡Objetivo actualizado exitosamente! 🎯' : '¡Objetivo creado exitosamente! 🎯');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar objetivo: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.targetWeight) {
      toast.error('Peso objetivo es requerido');
      return;
    }

    if (!startWeight || startWeight <= 0) {
      toast.error('No se pudo obtener tu peso actual. Por favor, actualiza tu perfil.');
      return;
    }

    const targetWeight = Number(formData.targetWeight);

    // Validate weight values
    if (targetWeight <= 0) {
      toast.error('El peso objetivo debe ser un valor positivo');
      return;
    }

    // Validate goal logic
    if (formData.goalType === 'gain_weight' && targetWeight <= startWeight) {
      toast.error('Para ganar peso, el objetivo debe ser mayor a tu peso actual');
      return;
    }

    if (formData.goalType === 'lose_weight' && targetWeight >= startWeight) {
      toast.error('Para perder peso, el objetivo debe ser menor a tu peso actual');
      return;
    }

    if (formData.goalType === 'maintain' && Math.abs(targetWeight - startWeight) > 2) {
      toast.error('Para mantener peso, la diferencia no debe ser mayor a 2kg');
      return;
    }

    const goalData = {
      startWeight,
      targetWeight,
      goalType: formData.goalType,
      targetDate: formData.targetDate || undefined
    };

    createOrUpdateGoal.mutate(goalData);
  };

  const selectedGoalType = goalTypes.find(type => type.value === formData.goalType);
  const weightDifference = formData.targetWeight && startWeight
    ? Number(formData.targetWeight) - startWeight
    : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {existingGoal ? 'Editar Objetivo de Peso' : 'Confirmar Objetivo de Peso'}
          </DialogTitle>
          {!existingGoal && user?.targetWeight && (
            <p className="text-sm text-muted-foreground mt-2">
              Hemos pre-rellenado tus datos del registro. Puedes modificarlos si es necesario.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Objetivo</Label>
            <div className="grid gap-3">
              {goalTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, goalType: type.value as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.goalType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={type.color}>
                      {type.icon}
                    </div>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Weight Display and Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tu Peso Actual</Label>
              <div className="relative">
                <div className="flex items-center h-10 px-3 py-2 border border-gray-200 bg-gray-50 rounded-md">
                  <span className="text-gray-900 font-medium">{startWeight}</span>
                  <span className="ml-auto text-gray-500 text-sm">kg</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Desde tu perfil de registro
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetWeight">
                Peso Objetivo *
                {!existingGoal && user?.targetWeight && (
                  <span className="text-xs text-muted-foreground ml-1">(desde tu registro)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  className="pr-12"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Weight Difference Display */}
          {weightDifference !== 0 && (
            <div className={`p-3 rounded-lg ${
              weightDifference > 0 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}>
              <div className="flex items-center gap-2">
                {selectedGoalType?.icon}
                <span className="font-medium">
                  {weightDifference > 0 ? '+' : ''}{weightDifference.toFixed(1)}kg
                </span>
                <span className="text-sm">
                  ({selectedGoalType?.label})
                </span>
              </div>
            </div>
          )}

          {/* Target Date (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Fecha Objetivo (opcional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createOrUpdateGoal.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {createOrUpdateGoal.isPending
                ? 'Guardando...'
                : existingGoal ? 'Actualizar' : 'Crear Objetivo'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
