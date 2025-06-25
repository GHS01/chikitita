import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Utensils, AlertTriangle, Target, Droplets,
  Plus, X, Save, Calculator, Heart
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';
import { authService } from '@/lib/auth';

interface NutritionSetupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Diet type options
const dietTypeOptions = [
  { id: 'omnivore', label: 'Omnívoro', emoji: '🍽️' },
  { id: 'vegetarian', label: 'Vegetariano', emoji: '🥗' },
  { id: 'vegan', label: 'Vegano', emoji: '🌱' },
  { id: 'keto', label: 'Keto', emoji: '🥑' },
  { id: 'paleo', label: 'Paleo', emoji: '🥩' },
  { id: 'mediterranean', label: 'Mediterránea', emoji: '🫒' },
];

// Food habits options
const foodHabitsOptions = [
  { id: 'home_cooking', label: 'Comida casera', emoji: '🏠' },
  { id: 'fast_food', label: 'Comida rápida frecuente', emoji: '🍔' },
  { id: 'processed_food', label: 'Comida procesada', emoji: '📦' },
  { id: 'meal_prep', label: 'Meal prep', emoji: '📋' },
];

// Common allergies
const allergyOptions = [
  { id: 'nuts', label: 'Nueces', emoji: '🥜' },
  { id: 'seafood', label: 'Mariscos', emoji: '🦐' },
  { id: 'dairy', label: 'Lácteos', emoji: '🥛' },
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'eggs', label: 'Huevos', emoji: '🥚' },
  { id: 'soy', label: 'Soja', emoji: '🫘' },
];

// Medical restrictions
const medicalRestrictionOptions = [
  { id: 'diabetes', label: 'Diabetes', emoji: '💉' },
  { id: 'hypertension', label: 'Hipertensión', emoji: '❤️' },
  { id: 'high_cholesterol', label: 'Colesterol alto', emoji: '🩺' },
  { id: 'heart_disease', label: 'Enfermedad cardíaca', emoji: '💔' },
];

// Food habits rating options
const foodHabitsRatingOptions = [
  { value: 1, label: 'Muy mala', emoji: '😞', color: 'text-red-600' },
  { value: 2, label: 'Mala', emoji: '😔', color: 'text-orange-600' },
  { value: 3, label: 'Regular', emoji: '😐', color: 'text-yellow-600' },
  { value: 4, label: 'Buena', emoji: '🙂', color: 'text-blue-600' },
  { value: 5, label: 'Excelente', emoji: '😊', color: 'text-green-600' },
];

export function NutritionSetupModal({ onClose, onSuccess }: NutritionSetupModalProps) {
  const [currentTab, setCurrentTab] = useState('preferences');
  const [formData, setFormData] = useState({
    // Diet preferences
    dietType: '',
    customDietTypes: [] as string[],
    foodHabitsRating: 3,
    customFoodHabits: [] as string[],
    favoriteFoods: [] as string[],
    // Restrictions and allergies
    allergies: [] as string[],
    customAllergies: [] as string[],
    medicalRestrictions: [] as string[],
    customMedicalRestrictions: [] as string[],
    // Goals
    dailyCalorieGoal: 0,
    dailyWaterGoal: 2000,
    mealFrequency: 3,
  });

  // Input states for custom tags
  const [customInputs, setCustomInputs] = useState({
    dietType: '',
    foodHabits: '',
    favoriteFoods: '',
    allergies: '',
    medicalRestrictions: '',
  });

  // Fetch user data for calorie calculation
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  const { data: weightGoal } = useQuery({
    queryKey: ['/api/weight-progress/goal'],
  });

  // 🔧 FIX: Fetch existing nutrition preferences to populate form
  const { data: existingPreferences } = useQuery({
    queryKey: ['/api/nutrition/preferences'],
  });

  // 🔧 FIX: Load existing preferences into form
  useEffect(() => {
    if (existingPreferences && existingPreferences.dietType) {
      console.log('🔄 [NutritionModal] Loading existing preferences:', existingPreferences);
      console.log('🔍 [NutritionModal] Custom data check:');
      console.log('  - customDietTypes:', existingPreferences.customDietTypes);
      console.log('  - customFoodHabits:', existingPreferences.customFoodHabits);
      console.log('  - favoriteFoods:', existingPreferences.favoriteFoods);
      console.log('  - customAllergies:', existingPreferences.customAllergies);
      console.log('  - customMedicalRestrictions:', existingPreferences.customMedicalRestrictions);

      setFormData(prev => ({
        ...prev,
        // Diet preferences
        dietType: existingPreferences.dietType || '',
        customDietTypes: existingPreferences.customDietTypes || [],
        foodHabitsRating: existingPreferences.foodHabitsRating || 3,
        customFoodHabits: existingPreferences.customFoodHabits || [],
        favoriteFoods: existingPreferences.favoriteFoods || [],
        // Restrictions and allergies
        allergies: existingPreferences.allergies || [],
        customAllergies: existingPreferences.customAllergies || [],
        medicalRestrictions: existingPreferences.medicalRestrictions || [],
        customMedicalRestrictions: existingPreferences.customMedicalRestrictions || [],
        // Goals
        dailyCalorieGoal: existingPreferences.dailyCalorieGoal || 0,
        dailyWaterGoal: existingPreferences.dailyWaterGoal || 2000,
        mealFrequency: existingPreferences.mealFrequency || 3,
      }));
    }
  }, [existingPreferences]);

  // Calculate recommended calories based on user data
  useEffect(() => {
    if (userProfile && weightGoal && (!existingPreferences || !existingPreferences.dailyCalorieGoal)) {
      const calculatedCalories = calculateDailyCalories(userProfile, weightGoal);
      setFormData(prev => ({ ...prev, dailyCalorieGoal: calculatedCalories }));
    }
  }, [userProfile, weightGoal, existingPreferences]);

  // Harris-Benedict formula for calorie calculation
  const calculateDailyCalories = (user: any, goal: any) => {
    if (!user.age || !user.currentWeight || !user.height || !user.gender) {
      return 2000; // Default fallback
    }

    let bmr;
    if (user.gender === 'male') {
      bmr = 88.362 + (13.397 * user.currentWeight) + (4.799 * user.height) - (5.677 * user.age);
    } else {
      bmr = 447.593 + (9.247 * user.currentWeight) + (3.098 * user.height) - (4.330 * user.age);
    }

    // Activity factor (assuming moderate activity)
    const activityFactor = 1.55;
    let tdee = bmr * activityFactor;

    // Adjust based on goal
    if (goal?.goalType === 'lose_weight') {
      tdee -= 500; // 500 calorie deficit for weight loss
    } else if (goal?.goalType === 'gain_weight') {
      tdee += 500; // 500 calorie surplus for weight gain
    }

    return Math.round(tdee);
  };

  // Save nutrition preferences
  const savePreferences = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔍 [NutritionModal] mutationFn called with data:', JSON.stringify(data, null, 2));

      // 🔧 FIX: Use AuthService for consistent token management
      const token = authService.getToken();

      // 🔍 DEBUG: Log token details
      console.log('🔍 [NutritionModal] Token exists:', !!token);
      console.log('🔍 [NutritionModal] Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔍 [NutritionModal] AuthService authenticated:', authService.isAuthenticated());

      if (!token) {
        console.error('❌ [NutritionModal] No auth token found');
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('🔍 [NutritionModal] Making fetch request to /api/nutrition/preferences');

      const response = await fetch('/api/nutrition/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify(data)
      });

      console.log('🔍 [NutritionModal] Response status:', response.status);
      console.log('🔍 [NutritionModal] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [NutritionModal] Error response:', errorText);

        // If 403, likely token issue
        if (response.status === 403) {
          throw new Error('Session expired. Please login again.');
        }

        try {
          const error = JSON.parse(errorText);
          throw new Error(error.message || 'Failed to save preferences');
        } catch {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('✅ [NutritionModal] Success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ [NutritionModal] onSuccess called with:', data);
      toast.success('¡Preferencias nutricionales guardadas exitosamente! 🎉');
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('❌ [NutritionModal] onError called with:', error);
      toast.error(`Error al guardar preferencias: ${error.message}`);
    }
  });

  const handleSubmit = () => {
    console.log('🔍 [NutritionModal] handleSubmit called');
    console.log('🔍 [NutritionModal] Current formData:', JSON.stringify(formData, null, 2));

    // Validate required fields
    if (!formData.dietType) {
      console.log('❌ [NutritionModal] Validation failed: No diet type selected');
      toast.error('Por favor selecciona un tipo de dieta');
      return;
    }

    if (formData.dailyCalorieGoal <= 0) {
      console.log('❌ [NutritionModal] Validation failed: Invalid calorie goal:', formData.dailyCalorieGoal);
      toast.error('Por favor establece una meta calórica válida');
      return;
    }

    console.log('✅ [NutritionModal] Validation passed');
    console.log('🔍 [NutritionModal] Weight goal:', weightGoal);

    // Calculate macro distribution based on goal type
    const macroDistribution = calculateMacroDistribution(weightGoal?.goalType || 'maintain');
    console.log('🔍 [NutritionModal] Calculated macro distribution:', macroDistribution);

    const preferencesData = {
      ...formData,
      macroDistribution,
    };

    console.log('🔍 [NutritionModal] Final preferences data to send:', JSON.stringify(preferencesData, null, 2));
    console.log('🔍 [NutritionModal] Calling savePreferences.mutate...');

    savePreferences.mutate(preferencesData);
  };

  const calculateMacroDistribution = (goalType: string) => {
    switch (goalType) {
      case 'lose_weight':
        return { protein: 35, carbs: 35, fat: 30 }; // Higher protein for weight loss
      case 'gain_weight':
        return { protein: 25, carbs: 50, fat: 25 }; // Higher carbs for weight gain
      default:
        return { protein: 30, carbs: 40, fat: 30 }; // Balanced for maintenance
    }
  };

  // 🎨 Utility function for proper capitalization
  const capitalizeText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  // Add custom tag functions
  const addCustomTag = (category: keyof typeof customInputs) => {
    const value = customInputs[category].trim();
    if (!value) return;

    console.log('🔍 [NutritionModal] Adding custom tag:', { category, value });

    setFormData(prev => {
      const key = category === 'dietType' ? 'customDietTypes' :
                  category === 'foodHabits' ? 'customFoodHabits' :
                  category === 'favoriteFoods' ? 'favoriteFoods' :
                  category === 'allergies' ? 'customAllergies' :
                  'customMedicalRestrictions';

      const newArray = [...(prev[key] as string[]), value];
      console.log('🔍 [NutritionModal] Updated array for', key, ':', newArray);

      return {
        ...prev,
        [key]: newArray
      };
    });

    setCustomInputs(prev => ({ ...prev, [category]: '' }));
  };

  const removeCustomTag = (category: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: (prev[category] as string[]).filter((_, i) => i !== index)
    }));
  };

  const toggleSelection = (category: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[category] as string[];
      const isSelected = currentArray.includes(value);

      return {
        ...prev,
        [category]: isSelected
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Utensils className="w-6 h-6 text-green-600" />
            <ModernEmoji emoji="🥗" size={24} luxury={true} />
            <EmojiText>Configuración Nutricional Personalizada</EmojiText>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            <TabsTrigger value="restrictions">Restricciones</TabsTrigger>
            <TabsTrigger value="goals">Objetivos</TabsTrigger>
            <TabsTrigger value="hydration">Hidratación</TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Diet Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Tipo de Dieta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {dietTypeOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.dietType === option.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, dietType: option.id }))}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          <ModernEmoji emoji={option.emoji} size={24} luxury={true} />
                        </div>
                        <div className="text-sm font-medium">
                          <EmojiText>{option.label}</EmojiText>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom diet types */}
                <div className="space-y-2">
                  <Label>Tipos de dieta personalizados:</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar tipo de dieta personalizada..."
                      value={customInputs.dietType}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, dietType: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomTag('dietType')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCustomTag('dietType')}
                      disabled={!customInputs.dietType.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.customDietTypes.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors"
                      >
                        <span>{capitalizeText(tag)}</span>
                        <X
                          className="w-4 h-4 cursor-pointer hover:text-blue-900 transition-colors"
                          onClick={() => removeCustomTag('customDietTypes', index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Food Habits Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Calidad de Hábitos Alimenticios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {foodHabitsRatingOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, foodHabitsRating: option.value }))}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        formData.foodHabitsRating === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        <ModernEmoji emoji={option.emoji} size={24} luxury={true} />
                      </div>
                      <div className={`text-xs font-medium ${option.color}`}>
                        <EmojiText>{option.label}</EmojiText>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Food Habits */}
            <Card>
              <CardHeader>
                <CardTitle>Hábitos Alimenticios Actuales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {foodHabitsOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={formData.customFoodHabits.includes(option.id)}
                        onCheckedChange={() => toggleSelection('customFoodHabits', option.id)}
                      />
                      <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                        <ModernEmoji emoji={option.emoji} size={16} luxury={true} />
                        <EmojiText>{option.label}</EmojiText>
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Custom food habits */}
                <div className="space-y-2">
                  <Label>Hábitos personalizados:</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar hábito alimenticio..."
                      value={customInputs.foodHabits}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, foodHabits: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomTag('foodHabits')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCustomTag('foodHabits')}
                      disabled={!customInputs.foodHabits.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.customFoodHabits.filter(habit => !foodHabitsOptions.some(opt => opt.id === habit)).map((tag, filteredIndex) => {
                      // 🔧 FIX: Find the real index in the original array
                      const realIndex = formData.customFoodHabits.indexOf(tag);
                      return (
                        <div
                          key={filteredIndex}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 text-sm font-medium rounded-lg border border-purple-200 hover:bg-purple-200 transition-colors"
                        >
                          <span>{capitalizeText(tag)}</span>
                          <X
                            className="w-4 h-4 cursor-pointer hover:text-purple-900 transition-colors"
                            onClick={() => removeCustomTag('customFoodHabits', realIndex)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Foods */}
            <Card>
              <CardHeader>
                <CardTitle>Comidas Favoritas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar comida favorita..."
                      value={customInputs.favoriteFoods}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, favoriteFoods: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomTag('favoriteFoods')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCustomTag('favoriteFoods')}
                      disabled={!customInputs.favoriteFoods.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.favoriteFoods.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-lg border border-green-200 hover:bg-green-200 transition-colors"
                      >
                        <span>{capitalizeText(tag)}</span>
                        <X
                          className="w-4 h-4 cursor-pointer hover:text-green-900 transition-colors"
                          onClick={() => removeCustomTag('favoriteFoods', index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restrictions Tab */}
          <TabsContent value="restrictions" className="space-y-6">
            {/* Allergies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Alergias Alimentarias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {allergyOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={formData.allergies.includes(option.id)}
                        onCheckedChange={() => toggleSelection('allergies', option.id)}
                      />
                      <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                        <ModernEmoji emoji={option.emoji} size={16} luxury={true} />
                        <EmojiText>{option.label}</EmojiText>
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Custom allergies */}
                <div className="space-y-2">
                  <Label>Alergias personalizadas:</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar alergia..."
                      value={customInputs.allergies}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, allergies: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomTag('allergies')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCustomTag('allergies')}
                      disabled={!customInputs.allergies.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.customAllergies.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-200 transition-colors"
                      >
                        <span>{capitalizeText(tag)}</span>
                        <X
                          className="w-4 h-4 cursor-pointer hover:text-red-900 transition-colors"
                          onClick={() => removeCustomTag('customAllergies', index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-blue-500" />
                  Restricciones Médicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {medicalRestrictionOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={formData.medicalRestrictions.includes(option.id)}
                        onCheckedChange={() => toggleSelection('medicalRestrictions', option.id)}
                      />
                      <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                        <ModernEmoji emoji={option.emoji} size={16} luxury={true} />
                        <EmojiText>{option.label}</EmojiText>
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Custom medical restrictions */}
                <div className="space-y-2">
                  <Label>Restricciones médicas personalizadas:</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar restricción médica..."
                      value={customInputs.medicalRestrictions}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, medicalRestrictions: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomTag('medicalRestrictions')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCustomTag('medicalRestrictions')}
                      disabled={!customInputs.medicalRestrictions.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.customMedicalRestrictions.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 text-sm font-medium rounded-lg border border-orange-200 hover:bg-orange-200 transition-colors"
                      >
                        <span>{capitalizeText(tag)}</span>
                        <X
                          className="w-4 h-4 cursor-pointer hover:text-orange-900 transition-colors"
                          onClick={() => removeCustomTag('customMedicalRestrictions', index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Objetivos Calóricos y Nutricionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Daily Calorie Goal */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Meta Calórica Diaria
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={formData.dailyCalorieGoal}
                      onChange={(e) => setFormData(prev => ({ ...prev, dailyCalorieGoal: parseInt(e.target.value) || 0 }))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">calorías/día</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <EmojiText size={14}>💡 Calculado automáticamente basado en tu perfil y objetivos de peso</EmojiText>
                  </p>
                </div>

                {/* Meal Frequency */}
                <div className="space-y-3">
                  <Label>Frecuencia de Comidas</Label>
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-green-600">{formData.mealFrequency}</span>
                      <span className="text-lg text-gray-500 ml-2">comidas por día</span>
                    </div>
                    <Slider
                      value={[formData.mealFrequency]}
                      onValueChange={([value]) => setFormData(prev => ({ ...prev, mealFrequency: value }))}
                      max={6}
                      min={2}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>2 comidas</span>
                      <span>6 comidas</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="flex items-center"><ModernEmoji emoji="🍽️" size={14} className="mr-1" luxury={true} /> El AI ajustará automáticamente según tu objetivo de peso</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hydration Tab */}
          <TabsContent value="hydration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Configuración de Hidratación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Meta Diaria de Agua</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={formData.dailyWaterGoal}
                      onChange={(e) => setFormData(prev => ({ ...prev, dailyWaterGoal: parseInt(e.target.value) || 2000 }))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">ml/día</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <EmojiText size={14}>💧 Recomendado: 35ml por kg de peso corporal</EmojiText>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
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
              type="button"
              onClick={handleSubmit}
              disabled={savePreferences.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {savePreferences.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
