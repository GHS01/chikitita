/**
 * 🔄 Unified Profile Component
 * Componente moderno para editar perfil completo (datos del registro + preferencias)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Dumbbell, Heart, Settings } from 'lucide-react';

interface CompleteProfile {
  // Datos básicos
  id: number;
  username: string;
  email: string;
  fullName: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  gender?: string;
  
  // Datos de fitness
  fitnessLevel?: string;
  fitnessGoal?: string;
  experienceLevel?: string;
  weeklyFrequency?: number;
  
  // Datos de salud
  limitations?: string[];
  injuries?: string[];
  
  // Preferencias
  equipment?: string[];
  workoutLocation?: string;
  timePreferences?: string;
  exerciseTypes?: string[];
}

interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
  fieldsByCategory: {
    basic: { completed: string[]; missing: string[] };
    fitness: { completed: string[]; missing: string[] };
    health: { completed: string[]; missing: string[] };
    preferences: { completed: string[]; missing: string[] };
  };
}

// 📋 Componente de sección reutilizable
interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  progress: number;
  colorClass: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: any) => void;
  saving: boolean;
  missingFields: string[];
  children: React.ReactNode;
}

function ProfileSection({
  title, icon, progress, colorClass, isEditing, onEdit, onCancel, onSave, saving, missingFields, children
}: ProfileSectionProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${colorClass} text-white`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Progress value={progress} className="h-2 w-20" />
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>

        {missingFields.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Campos pendientes:</p>
            <div className="flex flex-wrap gap-1">
              {missingFields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {children}

        {isEditing && (
          <div className="flex space-x-2 mt-4 pt-4 border-t">
            <Button
              onClick={() => onSave({})}
              disabled={saving}
              className="flex-1"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 👤 Campos de información básica
function BasicInfoFields({ profile, isEditing, onUpdate }: {
  profile: CompleteProfile;
  isEditing: boolean;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    age: profile.age || '',
    height: profile.height || '',
    currentWeight: profile.currentWeight || '',
    targetWeight: profile.targetWeight || '',
    gender: profile.gender || ''
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        fullName: profile.fullName || '',
        age: profile.age || '',
        height: profile.height || '',
        currentWeight: profile.currentWeight || '',
        targetWeight: profile.targetWeight || '',
        gender: profile.gender || ''
      });
    }
  }, [isEditing, profile]);

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-600">Nombre</Label>
            <p className="font-medium">{profile.fullName || 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Edad</Label>
            <p className="font-medium">{profile.age ? `${profile.age} años` : 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Altura</Label>
            <p className="font-medium">{profile.height ? `${profile.height} cm` : 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Peso Actual</Label>
            <p className="font-medium">{profile.currentWeight ? `${profile.currentWeight} kg` : 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Peso Objetivo</Label>
            <p className="font-medium">{profile.targetWeight ? `${profile.targetWeight} kg` : 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Género</Label>
            <p className="font-medium">{profile.gender || 'No especificado'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="Tu nombre completo"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="age">Edad</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            placeholder="Años"
          />
        </div>
        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
            placeholder="Centímetros"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentWeight">Peso Actual (kg)</Label>
          <Input
            id="currentWeight"
            type="number"
            step="0.1"
            value={formData.currentWeight}
            onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
            placeholder="Kilogramos"
          />
        </div>
        <div>
          <Label htmlFor="targetWeight">Peso Objetivo (kg)</Label>
          <Input
            id="targetWeight"
            type="number"
            step="0.1"
            value={formData.targetWeight}
            onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
            placeholder="Kilogramos"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="gender">Género</Label>
        <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Masculino</SelectItem>
            <SelectItem value="female">Femenino</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// 💪 Campos de fitness
function FitnessFields({ profile, isEditing, onUpdate }: {
  profile: CompleteProfile;
  isEditing: boolean;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    fitnessLevel: profile.fitnessLevel || '',
    fitnessGoal: profile.fitnessGoal || '',
    experienceLevel: profile.experienceLevel || '',
    weeklyFrequency: profile.weeklyFrequency || ''
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        fitnessLevel: profile.fitnessLevel || '',
        fitnessGoal: profile.fitnessGoal || '',
        experienceLevel: profile.experienceLevel || '',
        weeklyFrequency: profile.weeklyFrequency || ''
      });
    }
  }, [isEditing, profile]);

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <Label className="text-gray-600">Nivel de Fitness</Label>
            <p className="font-medium">{profile.fitnessLevel || 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Objetivo Principal</Label>
            <p className="font-medium">{profile.fitnessGoal || 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Experiencia</Label>
            <p className="font-medium">{profile.experienceLevel || 'No especificado'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Frecuencia Semanal</Label>
            <p className="font-medium">{profile.weeklyFrequency ? `${profile.weeklyFrequency} días/semana` : 'No especificado'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fitnessLevel">Nivel de Fitness</Label>
        <Select value={formData.fitnessLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessLevel: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Principiante</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="fitnessGoal">Objetivo Principal</Label>
        <Select value={formData.fitnessGoal} onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessGoal: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu objetivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lose_weight">Perder peso</SelectItem>
            <SelectItem value="gain_muscle">Ganar músculo</SelectItem>
            <SelectItem value="maintain_fitness">Mantener forma</SelectItem>
            <SelectItem value="improve_endurance">Mejorar resistencia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="experienceLevel">Experiencia con Ejercicios</Label>
        <Select value={formData.experienceLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu experiencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="novice">Novato (0-6 meses)</SelectItem>
            <SelectItem value="beginner">Principiante (6-12 meses)</SelectItem>
            <SelectItem value="intermediate">Intermedio (1-3 años)</SelectItem>
            <SelectItem value="advanced">Avanzado (3+ años)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="weeklyFrequency">Frecuencia Semanal</Label>
        <Select value={formData.weeklyFrequency.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, weeklyFrequency: parseInt(value) }))}>
          <SelectTrigger>
            <SelectValue placeholder="Días por semana" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 días/semana</SelectItem>
            <SelectItem value="3">3 días/semana</SelectItem>
            <SelectItem value="4">4 días/semana</SelectItem>
            <SelectItem value="5">5 días/semana</SelectItem>
            <SelectItem value="6">6 días/semana</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// 🏥 Campos de salud
function HealthFields({ profile, isEditing, onUpdate }: {
  profile: CompleteProfile;
  isEditing: boolean;
  onUpdate: (data: any) => void;
}) {
  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="text-sm">
          <Label className="text-gray-600">Limitaciones Físicas</Label>
          <p className="font-medium">
            {profile.limitations && profile.limitations.length > 0
              ? profile.limitations.join(', ')
              : 'Ninguna especificada'
            }
          </p>
        </div>
        <div className="text-sm">
          <Label className="text-gray-600">Lesiones</Label>
          <p className="font-medium">
            {profile.injuries && profile.injuries.length > 0
              ? profile.injuries.join(', ')
              : 'Ninguna especificada'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Limitaciones Físicas</Label>
        <p className="text-sm text-gray-600 mb-2">Selecciona las limitaciones que tienes</p>
        {/* Aquí iría un componente de selección múltiple */}
        <p className="text-sm text-gray-500">Componente de selección múltiple pendiente</p>
      </div>

      <div>
        <Label>Lesiones</Label>
        <p className="text-sm text-gray-600 mb-2">Indica lesiones previas o actuales</p>
        {/* Aquí iría un componente de selección múltiple */}
        <p className="text-sm text-gray-500">Componente de selección múltiple pendiente</p>
      </div>
    </div>
  );
}

// ⚙️ Campos de preferencias
function PreferencesFields({ profile, isEditing, onUpdate }: {
  profile: CompleteProfile;
  isEditing: boolean;
  onUpdate: (data: any) => void;
}) {
  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="text-sm">
          <Label className="text-gray-600">Equipamiento</Label>
          <p className="font-medium">
            {profile.equipment && profile.equipment.length > 0
              ? profile.equipment.join(', ')
              : 'No especificado'
            }
          </p>
        </div>
        <div className="text-sm">
          <Label className="text-gray-600">Ubicación</Label>
          <p className="font-medium">{profile.workoutLocation || 'No especificado'}</p>
        </div>
        <div className="text-sm">
          <Label className="text-gray-600">Horarios Preferidos</Label>
          <p className="font-medium">{profile.timePreferences || 'No especificado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Equipamiento Disponible</Label>
        <p className="text-sm text-gray-600 mb-2">Selecciona el equipamiento que tienes</p>
        <p className="text-sm text-gray-500">Componente de selección múltiple pendiente</p>
      </div>

      <div>
        <Label>Ubicación de Entrenamiento</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gym">Gimnasio</SelectItem>
            <SelectItem value="home">Casa</SelectItem>
            <SelectItem value="park">Parque</SelectItem>
            <SelectItem value="mixed">Mixto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Horarios Preferidos</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona horario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Mañana</SelectItem>
            <SelectItem value="afternoon">Tarde</SelectItem>
            <SelectItem value="evening">Noche</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// 👤 Sección de información básica simplificada
function BasicInfoSection({
  profile,
  completeness,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving
}: {
  profile: CompleteProfile;
  completeness: ProfileCompleteness;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    age: profile.age?.toString() || '',
    height: profile.height?.toString() || '',
    currentWeight: profile.currentWeight?.toString() || '',
    targetWeight: profile.targetWeight?.toString() || '',
    gender: profile.gender || ''
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        fullName: profile.fullName || '',
        age: profile.age?.toString() || '',
        height: profile.height?.toString() || '',
        currentWeight: profile.currentWeight?.toString() || '',
        targetWeight: profile.targetWeight?.toString() || '',
        gender: profile.gender || ''
      });
    }
  }, [isEditing, profile]);

  const handleSave = async () => {
    const updateData = {
      fullName: formData.fullName,
      age: formData.age ? parseInt(formData.age) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      currentWeight: formData.currentWeight ? parseFloat(formData.currentWeight) : undefined,
      targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
      gender: formData.gender
    };

    await onSave(updateData);
  };

  const progress = getCategoryProgress('basic', completeness);
  const missingFields = completeness.fieldsByCategory.basic.missing;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Información Básica</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Progress value={progress} className="h-2 w-20" />
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>

        {missingFields.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Campos pendientes:</p>
            <div className="flex flex-wrap gap-1">
              {missingFields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Nombre</Label>
                <p className="font-medium">{profile.fullName || 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Edad</Label>
                <p className="font-medium">{profile.age ? `${profile.age} años` : 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Altura</Label>
                <p className="font-medium">{profile.height ? `${profile.height} cm` : 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Peso Actual</Label>
                <p className="font-medium">{profile.currentWeight ? `${profile.currentWeight} kg` : 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Peso Objetivo</Label>
                <p className="font-medium">{profile.targetWeight ? `${profile.targetWeight} kg` : 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Género</Label>
                <p className="font-medium">{profile.gender || 'No especificado'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Años"
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="Centímetros"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentWeight">Peso Actual (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
                  placeholder="Kilogramos"
                />
              </div>
              <div>
                <Label htmlFor="targetWeight">Peso Objetivo (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  placeholder="Kilogramos"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Género</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex space-x-2 mt-4 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 💪 Sección de información de fitness
function FitnessInfoSection({
  profile,
  completeness,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving
}: {
  profile: CompleteProfile;
  completeness: ProfileCompleteness;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    fitnessLevel: profile.fitnessLevel || '',
    fitnessGoal: profile.fitnessGoal || '',
    experienceLevel: profile.experienceLevel || '',
    weeklyFrequency: profile.weeklyFrequency?.toString() || ''
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        fitnessLevel: profile.fitnessLevel || '',
        fitnessGoal: profile.fitnessGoal || '',
        experienceLevel: profile.experienceLevel || '',
        weeklyFrequency: profile.weeklyFrequency?.toString() || ''
      });
    }
  }, [isEditing, profile]);

  const handleSave = async () => {
    const updateData = {
      fitnessLevel: formData.fitnessLevel,
      fitnessGoal: formData.fitnessGoal,
      experienceLevel: formData.experienceLevel,
      weeklyFrequency: formData.weeklyFrequency ? parseInt(formData.weeklyFrequency) : undefined
    };

    await onSave(updateData);
  };

  const progress = getCategoryProgress('fitness', completeness);
  const missingFields = completeness.fieldsByCategory.fitness.missing;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500 text-white">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Datos de Fitness</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Progress value={progress} className="h-2 w-20" />
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>

        {missingFields.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Campos pendientes:</p>
            <div className="flex flex-wrap gap-1">
              {missingFields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Nivel de Fitness</Label>
                <p className="font-medium">{profile.fitnessLevel || 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Objetivo Principal</Label>
                <p className="font-medium">{profile.fitnessGoal?.replace('_', ' ') || 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Experiencia</Label>
                <p className="font-medium">{profile.experienceLevel || 'No especificado'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Frecuencia Semanal</Label>
                <p className="font-medium">{profile.weeklyFrequency ? `${profile.weeklyFrequency} días/semana` : 'No especificado'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fitnessLevel">Nivel de Fitness</Label>
              <Select value={formData.fitnessLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fitnessGoal">Objetivo Principal</Label>
              <Select value={formData.fitnessGoal} onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessGoal: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Perder peso</SelectItem>
                  <SelectItem value="gain_muscle">Ganar músculo</SelectItem>
                  <SelectItem value="maintain_fitness">Mantener forma</SelectItem>
                  <SelectItem value="improve_endurance">Mejorar resistencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experienceLevel">Experiencia con Ejercicios</Label>
              <Select value={formData.experienceLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu experiencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novice">Novato (0-6 meses)</SelectItem>
                  <SelectItem value="beginner">Principiante (6-12 meses)</SelectItem>
                  <SelectItem value="intermediate">Intermedio (1-3 años)</SelectItem>
                  <SelectItem value="advanced">Avanzado (3+ años)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weeklyFrequency">Frecuencia Semanal</Label>
              <Select value={formData.weeklyFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, weeklyFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Días por semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 días/semana</SelectItem>
                  <SelectItem value="3">3 días/semana</SelectItem>
                  <SelectItem value="4">4 días/semana</SelectItem>
                  <SelectItem value="5">5 días/semana</SelectItem>
                  <SelectItem value="6">6 días/semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex space-x-2 mt-4 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Función auxiliar para calcular progreso
function getCategoryProgress(category: keyof ProfileCompleteness['fieldsByCategory'], completeness: ProfileCompleteness) {
  const { completed, missing } = completeness.fieldsByCategory[category];
  const total = completed.length + missing.length;
  return total > 0 ? Math.round((completed.length / total) * 100) : 100;
}

export default function UnifiedProfile() {
  const [profile, setProfile] = useState<CompleteProfile | null>(null);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar datos del perfil
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const [profileResponse, completenessResponse] = await Promise.all([
        fetch('/api/user/complete-profile', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/user/real-completeness', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (profileResponse.ok && completenessResponse.ok) {
        const profileData = await profileResponse.json();
        const completenessData = await completenessResponse.json();
        
        setProfile(profileData);
        setCompleteness(completenessData);
      } else {
        throw new Error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updateData: Partial<CompleteProfile>) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/user/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        console.log('🔄 [UnifiedProfile] Profile updated:', updatedProfile);
        setProfile(updatedProfile);

        // Recargar completitud
        const completenessResponse = await fetch('/api/user/real-completeness', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (completenessResponse.ok) {
          const completenessData = await completenessResponse.json();
          console.log('📊 [UnifiedProfile] Completeness updated:', completenessData);
          setCompleteness(completenessData);
        }
        
        toast({
          title: "✅ Perfil actualizado",
          description: "Los cambios se guardaron correctamente"
        });

        setEditingSection(null);

        // 🔄 Force refresh para asegurar sincronización
        setTimeout(() => {
          loadProfile();
        }, 500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryProgress = (category: keyof ProfileCompleteness['fieldsByCategory']) => {
    if (!completeness) return 0;
    const { completed, missing } = completeness.fieldsByCategory[category];
    const total = completed.length + missing.length;
    return total > 0 ? Math.round((completed.length / total) * 100) : 100;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      basic: 'bg-blue-500',
      fitness: 'bg-green-500',
      health: 'bg-orange-500',
      preferences: 'bg-purple-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      basic: <User className="h-5 w-5" />,
      fitness: <Dumbbell className="h-5 w-5" />,
      health: <Heart className="h-5 w-5" />,
      preferences: <Settings className="h-5 w-5" />
    };
    return icons[category as keyof typeof icons] || <User className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando perfil...</span>
      </div>
    );
  }

  if (!profile || !completeness) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No se pudo cargar el perfil</p>
        <Button onClick={loadProfile} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 Header con completitud general */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-900">
                🎯 Completitud del Perfil Unificado
              </CardTitle>
              <p className="text-blue-700 mt-1">
                {completeness.percentage}% completo • {completeness.missingFields.length} campos pendientes
              </p>
              <p className="text-blue-600 text-xs mt-1">
                ✅ Datos sincronizados: Registro + Preferencias
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-white text-blue-800 border-blue-300 text-lg px-4 py-2">
                {completeness.percentage}%
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProfile}
                className="mt-2 ml-2 text-xs"
              >
                🔄 Refrescar
              </Button>
            </div>
          </div>
          <Progress value={completeness.percentage} className="h-3 mt-4" />
        </CardHeader>
      </Card>

      {/* 📋 Secciones del perfil */}
      <div className="space-y-6">

        {/* 👤 INFORMACIÓN BÁSICA */}
        <BasicInfoSection
          key={`basic-${profile.id}-${profile.age}-${profile.height}-${profile.currentWeight}`}
          profile={profile}
          completeness={completeness}
          isEditing={editingSection === 'basic'}
          onEdit={() => setEditingSection('basic')}
          onCancel={() => setEditingSection(null)}
          onSave={updateProfile}
          saving={saving}
        />

        {/* 💪 DATOS DE FITNESS */}
        <FitnessInfoSection
          key={`fitness-${profile.id}-${profile.fitnessLevel}-${profile.experienceLevel}`}
          profile={profile}
          completeness={completeness}
          isEditing={editingSection === 'fitness'}
          onEdit={() => setEditingSection('fitness')}
          onCancel={() => setEditingSection(null)}
          onSave={updateProfile}
          saving={saving}
        />

        {/* 💡 Mensaje temporal para otras secciones */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-amber-800 font-medium">🚧 Secciones de Salud y Preferencias</p>
              <p className="text-amber-600 text-sm mt-1">
                Se agregarán en la siguiente iteración
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
