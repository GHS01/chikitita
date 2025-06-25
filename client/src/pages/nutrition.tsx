import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PhotoUpload from "@/components/photo-upload";
import { NutritionSetupModal } from "@/components/nutrition/NutritionSetupModal";
import { useRealTime } from "@/hooks/useRealTime"; // 🕐 Real-time clock hook
import {
  Plus, Camera, Upload, Target, Brain, Fish, Drumstick,
  UtensilsCrossed, TrendingUp, Droplets, Trash2, Settings
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { ModernEmoji } from '@/components/ui/modern-emoji';

export default function Nutrition() {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showNutritionSetup, setShowNutritionSetup] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const { t } = useTranslation();

  // 🕐 Real-time clock hook
  const { time12h, dateTime } = useRealTime();

  const { data: todaysMeals, isLoading } = useQuery({
    queryKey: ['/api/nutrition/meals', { date: today }],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch nutrition preferences
  const { data: nutritionPreferences } = useQuery({
    queryKey: ['/api/nutrition/preferences'],
  });

  // Fetch daily meal plan
  const { data: mealPlan } = useQuery({
    queryKey: ['/api/nutrition/meal-plan', { date: today }],
    enabled: !!nutritionPreferences?.dietType, // Only fetch if preferences are configured
  });

  // Auto-show meal plan when data is available (React Query v5 compatible)
  useEffect(() => {
    if (mealPlan && mealPlan.meals && mealPlan.meals.length > 0) {
      setShowMealPlan(true);
    }
  }, [mealPlan]);

  const deleteMealMutation = useMutation({
    mutationFn: (mealId: number) => apiRequest('DELETE', `/api/nutrition/meals/${mealId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Meal deleted",
        description: "The meal has been removed from your log.",
      });
    },
  });

  // Generate meal plan mutation
  const generateMealPlanMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/nutrition/generate-plan'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/meal-plan'] });
      setShowMealPlan(true);
      toast({
        title: "¡Plan alimenticio generado! 🍽️",
        description: "Tu plan personalizado está listo basado en tus preferencias.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al generar plan",
        description: error.message || "No se pudo generar el plan alimenticio",
        variant: "destructive",
      });
    },
  });

  const onPhotoAnalyzed = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/nutrition/meals'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    setShowPhotoUpload(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCalories = todaysMeals?.reduce((sum: number, meal: any) => sum + meal.calories, 0) || 0;
  const currentProtein = todaysMeals?.reduce((sum: number, meal: any) => sum + meal.protein, 0) || 0;
  const currentCarbs = todaysMeals?.reduce((sum: number, meal: any) => sum + meal.carbs, 0) || 0;
  const currentFat = todaysMeals?.reduce((sum: number, meal: any) => sum + meal.fat, 0) || 0;

  const targetCalories = stats?.targetCalories || 2200;
  const targetProtein = stats?.targetProtein || 150;
  const targetCarbs = stats?.targetCarbs || 200;
  const targetFat = stats?.targetFat || 85;

  const mealTypeIcons = {
    breakfast: UtensilsCrossed,
    lunch: UtensilsCrossed,
    dinner: UtensilsCrossed,
    snack: UtensilsCrossed,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('nutrition.title')}</h1>
          <p className="text-muted-foreground">{t('nutrition.subtitle')}</p>
        </div>
        <div className="flex gap-2 sm:gap-3 mt-4 md:mt-0">
          {/* Nutrition Setup Button */}
          <Button
            onClick={() => setShowNutritionSetup(true)}
            variant="outline"
            className="border-green-200 hover:bg-green-50 text-sm px-3 sm:px-4"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{nutritionPreferences?.dietType ? 'Configuración' : 'Configuración'}</span>
            <span className="sm:hidden">Configuración</span>
          </Button>

          {/* Generate Meal Plan Button */}
          {nutritionPreferences?.dietType && (
            <Button
              onClick={() => generateMealPlanMutation.mutate()}
              disabled={generateMealPlanMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-sm px-3 sm:px-4"
              size="sm"
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{generateMealPlanMutation.isPending ? 'Generando...' : 'Generar Plan Alimenticio'}</span>
              <span className="sm:hidden">{generateMealPlanMutation.isPending ? 'Generando...' : 'Generar Plan'}</span>
            </Button>
          )}

          {/* Add Meal Button */}
          <Button
            onClick={() => setShowPhotoUpload(true)}
            className="bg-secondary hover:bg-secondary/90 text-sm px-3 sm:px-4"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Agregar Comida</span>
            <span className="sm:hidden">Agregar Comida</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Meals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generated Meal Plan */}
          {mealPlan && showMealPlan && (
            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center text-slate-800">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-lg">🍽️</span>
                      </div>
                      {t('nutrition.personalizedMealPlan')}
                      <Badge className="ml-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
                        {mealPlan.totalCalories} {t('nutrition.calories')}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-2 font-medium">
                      {t('nutrition.optimizedNutritionalPlan')}{' '}
                      <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-semibold">
                        <ModernEmoji emoji="🕐" size={14} className="mr-1" /> {dateTime}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMealPlan(false)}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg w-8 h-8 p-0"
                  >
                    <ModernEmoji emoji="✕" size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {mealPlan.meals?.map((meal: any, index: number) => {
                  const mealIcons = {
                    'Breakfast': '🌅',
                    'Lunch': '☀️',
                    'Snack': '🍎',
                    'Dinner': '🌙',
                    'Desayuno': '🌅',
                    'Almuerzo': '☀️',
                    'Merienda': '🍎',
                    'Cena': '🌙'
                  };
                  const mealColors = {
                    'Breakfast': 'from-orange-400 to-amber-500',
                    'Lunch': 'from-blue-400 to-cyan-500',
                    'Snack': 'from-green-400 to-emerald-500',
                    'Dinner': 'from-purple-400 to-indigo-500',
                    'Desayuno': 'from-orange-400 to-amber-500',
                    'Almuerzo': 'from-blue-400 to-cyan-500',
                    'Merienda': 'from-green-400 to-emerald-500',
                    'Cena': 'from-purple-400 to-indigo-500'
                  };
                  const mealBadgeColors = {
                    'Breakfast': 'bg-gradient-to-r from-orange-500 to-amber-600',
                    'Lunch': 'bg-gradient-to-r from-blue-500 to-cyan-600',
                    'Snack': 'bg-gradient-to-r from-green-500 to-emerald-600',
                    'Dinner': 'bg-gradient-to-r from-purple-500 to-indigo-600'
                  };

                  return (
                    <Card key={index} className="border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                          <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${mealColors[meal.type] || 'from-indigo-500 to-purple-600'} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <ModernEmoji emoji={mealIcons[meal.type] || '🍽️'} size={24} luxury={true} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                                <h4 className="font-bold text-lg sm:text-xl text-gray-900 truncate">{meal.name}</h4>
                                <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                                  <Badge variant="outline" className="text-xs font-medium border-blue-300 text-blue-700 bg-blue-50">
                                    {meal.time}
                                  </Badge>
                                  <Badge className={`${mealBadgeColors[meal.type] || 'bg-gradient-to-r from-indigo-500 to-purple-600'} text-white font-medium text-xs shadow-md`}>
                                    {meal.type}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-3">
                                {meal.ingredients?.map((ingredient: any, idx: number) => (
                                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-2 sm:px-3 py-2 border border-blue-100 space-y-1 sm:space-y-0">
                                    <span className="text-sm font-semibold text-gray-800">
                                      • {ingredient.name}
                                    </span>
                                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                                      <span className="text-sm font-bold text-indigo-700">
                                        {ingredient.amount}{ingredient.unit || 'gr'}
                                      </span>
                                      <span className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 sm:px-2.5 py-0.5 rounded-lg font-mono font-bold shadow-sm whitespace-nowrap inline-flex items-center justify-center">
                                        {ingredient.calories || 0} {t('nutrition.calories')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-center sm:text-right sm:ml-4 mt-3 sm:mt-0">
                            <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent">
                              {meal.calories}
                            </div>
                            <div className="text-sm font-bold text-orange-600">{t('nutrition.caloriesText')}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Macro Breakdown */}
                {mealPlan.macroBreakdown && (
                  <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 border-purple-200 shadow-lg">
                    <CardContent className="p-6">
                      <h4 className="font-black text-xl text-gray-900 mb-6 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                          <ModernEmoji emoji="📊" size={18} luxury={true} />
                        </div>
                        Distribución de Macronutrientes
                      </h4>
                      <div className="grid grid-cols-3 gap-3 sm:gap-6">
                        <div className="text-center bg-white rounded-xl p-2 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl">
                            <span className="text-white text-lg sm:text-2xl font-black">P</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-red-600 mb-1 sm:mb-2">Proteínas</p>
                          <p className="text-lg sm:text-2xl font-black text-gray-900">
                            {mealPlan.macroBreakdown.protein}g
                          </p>
                        </div>
                        <div className="text-center bg-white rounded-xl p-2 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl">
                            <span className="text-white text-lg sm:text-2xl font-black">C</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-orange-600 mb-1 sm:mb-2">Carbohidratos</p>
                          <p className="text-lg sm:text-2xl font-black text-gray-900">
                            {mealPlan.macroBreakdown.carbs}g
                          </p>
                        </div>
                        <div className="text-center bg-white rounded-xl p-2 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl">
                            <span className="text-white text-lg sm:text-2xl font-black">G</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-green-600 mb-1 sm:mb-2">Grasas</p>
                          <p className="text-lg sm:text-2xl font-black text-gray-900">
                            {mealPlan.macroBreakdown.fat}g
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {/* Today's Meals */}
          <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-2 rounded-lg shadow-lg">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800">{t('nutrition.todaysMeals')}</CardTitle>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                  {todaysMeals?.length || 0} comidas
                </div>
              </div>
              <CardDescription className="text-slate-600 font-medium">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysMeals && todaysMeals.length > 0 ? (
                <>
                  {todaysMeals.map((meal: any) => {
                    const Icon = mealTypeIcons[meal.mealType as keyof typeof mealTypeIcons] || UtensilsCrossed;

                    return (
                      <Card key={meal.id} className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-bold capitalize text-slate-800">{t(`nutrition.mealTypes.${meal.mealType}`)}</h4>
                                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-md">
                                    {new Date(meal.loggedAt).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">{meal.name}</p>
                                {meal.description && (
                                  <p className="text-xs text-slate-600 mt-1 font-medium">{meal.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg shadow-lg mb-2">
                                <p className="text-lg font-bold font-mono">{meal.calories}</p>
                                <p className="text-xs font-semibold">{t('nutrition.calories')}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMealMutation.mutate(meal.id)}
                                disabled={deleteMealMutation.isPending}
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-lg p-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200 shadow-sm">
                              <p className="text-xs font-bold text-amber-700 mb-1">Carbs</p>
                              <p className="font-bold text-amber-800 font-mono text-lg">{meal.carbs}g</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-lg border border-red-200 shadow-sm">
                              <p className="text-xs font-bold text-red-700 mb-1">Protein</p>
                              <p className="font-bold text-red-800 font-mono text-lg">{meal.protein}g</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 shadow-sm">
                              <p className="text-xs font-bold text-green-700 mb-1">Fat</p>
                              <p className="font-bold text-green-800 font-mono text-lg">{meal.fat}g</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">{t('nutrition.noMealsLogged')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('nutrition.startTracking')}
                  </p>
                </div>
              )}

              {/* Photo Upload Area */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-secondary transition-colors cursor-pointer"
                    onClick={() => setShowPhotoUpload(true)}>
                <CardContent className="p-8 text-center">
                  <div className="bg-secondary/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8 text-secondary" />
                  </div>
                  <h4 className="font-medium mb-2">{t('nutrition.addYourNextMeal')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('nutrition.takePhotoForAnalysis')}
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <Button className="bg-secondary hover:bg-secondary/90">
                      <Camera className="h-4 w-4 mr-2" />
                      {t('nutrition.takePicture')}
                    </Button>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('nutrition.uploadPhoto')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Daily Macros */}
          <Card className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-600 to-violet-700 text-white p-2 rounded-lg shadow-lg">
                  <Target className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-800">{t('nutrition.dailyMacros')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200 shadow-sm">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-orange-700">{t('nutrition.caloriesText')}</span>
                  <span className="font-mono font-bold text-orange-800">{currentCalories} / {targetCalories}</span>
                </div>
                <Progress value={(currentCalories / targetCalories) * 100} className="h-4 bg-orange-100" />
                <p className="text-xs font-semibold text-orange-600 mt-2">
                  {targetCalories - currentCalories > 0 ?
                    `${targetCalories - currentCalories} ${t('nutrition.calories')} ${t('nutrition.remaining')}` :
                    t('nutrition.goalReached')
                  }
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200 shadow-sm">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-red-700">{t('nutrition.protein')}</span>
                  <span className="font-mono font-bold text-red-800">{currentProtein}g / {targetProtein}g</span>
                </div>
                <Progress value={(currentProtein / targetProtein) * 100} className="h-4 bg-red-100" />
                <p className="text-xs font-semibold text-red-600 mt-2">
                  {targetProtein - currentProtein > 0 ?
                    `${targetProtein - currentProtein}g remaining` :
                    'Goal reached!'
                  }
                </p>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200 shadow-sm">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-amber-700">{t('nutrition.carbs')}</span>
                  <span className="font-mono font-bold text-amber-800">{currentCarbs}g / {targetCarbs}g</span>
                </div>
                <Progress value={(currentCarbs / targetCarbs) * 100} className="h-4 bg-amber-100" />
                <p className="text-xs font-semibold text-amber-600 mt-2">
                  {targetCarbs - currentCarbs > 0 ?
                    `${targetCarbs - currentCarbs}g remaining` :
                    'Goal reached!'
                  }
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 shadow-sm">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-green-700">{t('nutrition.fat')}</span>
                  <span className="font-mono font-bold text-green-800">{currentFat}g / {targetFat}g</span>
                </div>
                <Progress value={(currentFat / targetFat) * 100} className="h-4 bg-green-100" />
                <p className="text-xs font-semibold text-green-600 mt-2">
                  {targetFat - currentFat > 0 ?
                    `${targetFat - currentFat}g remaining` :
                    'Goal reached!'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Nutrition Insights */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Brain className="h-5 w-5 text-primary mr-2" />
                {t('nutrition.nutritionInsights')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-card/70 rounded-lg p-3">
                <p className="text-sm mb-1">
                  <span className="font-semibold flex items-center"><ModernEmoji emoji="🥗" size={16} className="mr-1" /> {t('common.excellentChoice')}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('nutrition.excellentNutrientVariety')}
                </p>
              </div>
              <div className="bg-card/70 rounded-lg p-3">
                <p className="text-sm mb-1">
                  <span className="font-semibold flex items-center"><ModernEmoji emoji="💪" size={16} className="mr-1" /> {t('common.proteinTip')}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('nutrition.addProteinShake')}
                </p>
              </div>
              <div className="bg-card/70 rounded-lg p-3">
                <p className="text-sm mb-1">
                  <span className="font-semibold flex items-center"><ModernEmoji emoji="💧" size={16} className="mr-1" /> {t('nutrition.hydration')}:</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('nutrition.drinkWater')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meal Suggestions */}
          <Card className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-2 rounded-lg shadow-lg">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">{t('common.mealSuggestions')}</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">{t('common.basedOnMacros')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Fish className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{t('common.grilledSalmon')}</h4>
                    <p className="text-xs text-slate-600 font-medium">{t('common.withRoastedVegetables')}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-lg shadow-md">
                      <p className="text-sm font-bold font-mono">485 cal</p>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-1">38g protein</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-white to-amber-50 border border-amber-200 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Drumstick className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{t('common.chickenStirFry')}</h4>
                    <p className="text-xs text-slate-600 font-medium">{t('common.withBrownRice')}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-lg shadow-md">
                      <p className="text-sm font-bold font-mono">420 cal</p>
                    </div>
                    <p className="text-xs text-amber-600 font-semibold mt-1">32g protein</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <PhotoUpload
          isOpen={showPhotoUpload}
          onClose={() => setShowPhotoUpload(false)}
          onSuccess={onPhotoAnalyzed}
        />
      )}

      {/* Nutrition Setup Modal */}
      {showNutritionSetup && (
        <NutritionSetupModal
          onClose={() => setShowNutritionSetup(false)}
          onSuccess={() => {
            setShowNutritionSetup(false);
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/preferences'] });
          }}
        />
      )}
    </div>
  );
}
