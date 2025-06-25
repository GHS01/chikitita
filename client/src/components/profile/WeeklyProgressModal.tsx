import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Scale, Ruler, Heart, Save, X, RefreshCw } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';

interface WeightGoal {
  goalType: 'gain_weight' | 'lose_weight' | 'maintain';
}

interface WeeklyProgressModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentGoal: WeightGoal;
}

const bodyMeasurements = {
  waist: { label: 'Cintura', unit: 'cm', icon: '📏' },
  chest: { label: 'Pecho', unit: 'cm', icon: '💪' },
  arms: { label: 'Brazos', unit: 'cm', icon: '💪' },
  thighs: { label: 'Muslos', unit: 'cm', icon: '🦵' },
  neck: { label: 'Cuello', unit: 'cm', icon: '📏' },
  hips: { label: 'Caderas', unit: 'cm', icon: '📏' }
};

const feelingOptions = [
  { value: 5, emoji: '😊', label: 'Excelente', color: 'text-green-600' },
  { value: 4, emoji: '🙂', label: 'Bien', color: 'text-blue-600' },
  { value: 3, emoji: '😐', label: 'Normal', color: 'text-yellow-600' },
  { value: 2, emoji: '😔', label: 'Mal', color: 'text-orange-600' },
  { value: 1, emoji: '😞', label: 'Terrible', color: 'text-red-600' }
];

export function WeeklyProgressModal({ onClose, onSuccess, currentGoal }: WeeklyProgressModalProps) {
  const [formData, setFormData] = useState({
    weight: '',
    measurements: {} as Record<string, string>,
    feelingRating: 3,
    notes: ''
  });

  // Fetch current week's progress entry
  const { data: currentWeekEntry, isLoading: isLoadingCurrentWeek } = useQuery({
    queryKey: ['current-week-progress'],
    queryFn: async () => {
      // 🔧 FIX: Usar 'token' en lugar de 'authToken' obsoleto
      const token = localStorage.getItem('token');

      // 🐛 DEBUG: Logs para detectar problemas de autenticación
      console.log('🔐 [WeeklyProgressModal] Token exists:', !!token);
      console.log('🔐 [WeeklyProgressModal] Token preview:', token ? `${token.substring(0, 20)}...` : 'null');

      if (!token) {
        console.error('❌ [WeeklyProgressModal] No authentication token found');
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/weight-progress/current-week', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 🐛 DEBUG: Log response status
      console.log('📡 [WeeklyProgressModal] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📝 [WeeklyProgressModal] No entry for current week (404)');
          return null; // No entry for current week
        }
        if (response.status === 403) {
          console.error('🚫 [WeeklyProgressModal] 403 Forbidden - Invalid token');
          const errorText = await response.text();
          console.error('🚫 [WeeklyProgressModal] Error details:', errorText);
        }
        throw new Error(`Failed to fetch current week progress: ${response.status}`);
      }

      console.log('✅ [WeeklyProgressModal] Successfully fetched current week data');
      return response.json();
    }
  });

  // Load existing data when component mounts or data changes
  useEffect(() => {
    if (currentWeekEntry) {
      console.log('🔄 [WeeklyProgressModal] Loading existing data:', currentWeekEntry);

      // Convert body measurements from object to form format
      const measurements: Record<string, string> = {};
      if (currentWeekEntry.bodyMeasurements) {
        Object.entries(currentWeekEntry.bodyMeasurements).forEach(([key, value]) => {
          measurements[key] = String(value);
        });
      }

      setFormData({
        weight: currentWeekEntry.weight ? String(currentWeekEntry.weight) : '',
        measurements,
        feelingRating: currentWeekEntry.feelingRating || 3,
        notes: currentWeekEntry.notes || ''
      });
    }
  }, [currentWeekEntry]);

  const createProgressEntry = useMutation({
    mutationFn: async (data: any) => {
      // 🔧 FIX: Usar 'token' en lugar de 'authToken' obsoleto
      const token = localStorage.getItem('token');

      // 🐛 DEBUG: Logs para detectar problemas de autenticación
      console.log('📊 [WeeklyProgressModal] Submitting progress with token:', !!token);
      console.log('📊 [WeeklyProgressModal] Progress data:', data);

      if (!token) {
        console.error('❌ [WeeklyProgressModal] No authentication token for submission');
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/weight-progress/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      // 🐛 DEBUG: Log submission response
      console.log('📊 [WeeklyProgressModal] Submission response status:', response.status);

      if (!response.ok) {
        if (response.status === 403) {
          console.error('🚫 [WeeklyProgressModal] 403 Forbidden during submission');
          const errorText = await response.text();
          console.error('🚫 [WeeklyProgressModal] Submission error details:', errorText);
        } else {
          const error = await response.json();
          console.error('❌ [WeeklyProgressModal] Submission error:', error);
        }
        throw new Error(`Failed to save progress: ${response.status}`);
      }

      console.log('✅ [WeeklyProgressModal] Progress submitted successfully');
      return response.json();
    },
    onSuccess: () => {
      const message = currentWeekEntry
        ? '¡Progreso actualizado exitosamente! 🎉'
        : '¡Progreso registrado exitosamente! 🎉';
      toast.success(message);
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar progreso: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.weight) {
      toast.error('El peso es requerido');
      return;
    }

    // Convert measurements to numbers
    const bodyMeasurements: Record<string, number> = {};
    Object.entries(formData.measurements).forEach(([key, value]) => {
      if (value && !isNaN(Number(value))) {
        bodyMeasurements[key] = Number(value);
      }
    });

    const progressData = {
      weight: Number(formData.weight),
      bodyMeasurements: Object.keys(bodyMeasurements).length > 0 ? bodyMeasurements : undefined,
      goalType: currentGoal.goalType,
      feelingRating: formData.feelingRating,
      notes: formData.notes || undefined
    };

    createProgressEntry.mutate(progressData);
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [key]: value
      }
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            {isLoadingCurrentWeek ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cargando datos...
              </span>
            ) : currentWeekEntry ? (
              'Actualizar Progreso Semanal'
            ) : (
              'Registro Semanal de Progreso'
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weight Input */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Peso Actual *
            </Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.5"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="pr-12"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                kg
              </span>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Medidas Corporales (opcional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(bodyMeasurements).map(([key, config]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-xs flex items-center gap-1">
                    <ModernEmoji emoji={config.icon} size={14} />
                    <EmojiText size={12}>{config.label}</EmojiText>
                  </Label>
                  <div className="relative">
                    <Input
                      id={key}
                      type="number"
                      step="0.5"
                      placeholder="85"
                      value={formData.measurements[key] || ''}
                      onChange={(e) => handleMeasurementChange(key, e.target.value)}
                      className="pr-8 text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      {config.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feeling Rating */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              ¿Cómo te sientes esta semana?
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {feelingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, feelingRating: option.value }))}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.feelingRating === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    <ModernEmoji emoji={option.emoji} size={24} />
                  </div>
                  <div className={`text-xs font-medium ${option.color}`}>
                    <EmojiText>{option.label}</EmojiText>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="¿Cómo te has sentido? ¿Algún cambio notable?"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
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
              disabled={createProgressEntry.isPending || isLoadingCurrentWeek}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {createProgressEntry.isPending ? 'Guardando...' :
               isLoadingCurrentWeek ? 'Cargando...' :
               currentWeekEntry ? 'Actualizar Progreso' : 'Guardar Progreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
