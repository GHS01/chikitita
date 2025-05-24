import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PhotoUpload from "@/components/photo-upload";
import { 
  Plus, Camera, Upload, Target, Brain, Fish, Drumstick, 
  UtensilsCrossed, TrendingUp, Droplets, Trash2 
} from "lucide-react";

export default function Nutrition() {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: todaysMeals, isLoading } = useQuery({
    queryKey: ['/api/nutrition/meals', { date: today }],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

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
          <h1 className="text-3xl font-bold mb-2">Nutrition Tracking</h1>
          <p className="text-muted-foreground">AI-powered meal analysis and macro tracking</p>
        </div>
        <Button 
          onClick={() => setShowPhotoUpload(true)}
          className="mt-4 md:mt-0 bg-secondary hover:bg-secondary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Meals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Today's Meals</CardTitle>
              <CardDescription>
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
                      <Card key={meal.id} className="border hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium capitalize">{meal.mealType}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(meal.loggedAt).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{meal.name}</p>
                                {meal.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold font-mono">{meal.calories} cal</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMealMutation.mutate(meal.id)}
                                disabled={deleteMealMutation.isPending}
                                className="text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Carbs</p>
                              <p className="font-semibold text-accent font-mono">{meal.carbs}g</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Protein</p>
                              <p className="font-semibold text-secondary font-mono">{meal.protein}g</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Fat</p>
                              <p className="font-semibold text-primary font-mono">{meal.fat}g</p>
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
                  <h4 className="font-semibold mb-2">No meals logged today</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking your nutrition by adding your first meal
                  </p>
                </div>
              )}

              {/* Photo Upload Area */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-secondary transition-colors cursor-pointer"
                    onClick={() => setShowPhotoUpload(true)}>
                <CardContent className="p-8 text-center">
                  <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8 text-secondary" />
                  </div>
                  <h4 className="font-medium mb-2">Add Your Next Meal</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Take a photo for instant AI analysis
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <Button className="bg-secondary hover:bg-secondary/90">
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </Button>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Macros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Calories</span>
                  <span className="font-mono">{currentCalories} / {targetCalories}</span>
                </div>
                <Progress value={(currentCalories / targetCalories) * 100} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {targetCalories - currentCalories > 0 ? 
                    `${targetCalories - currentCalories} cal remaining` : 
                    'Goal reached!'
                  }
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Protein</span>
                  <span className="font-mono">{currentProtein}g / {targetProtein}g</span>
                </div>
                <Progress value={(currentProtein / targetProtein) * 100} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {targetProtein - currentProtein > 0 ? 
                    `${targetProtein - currentProtein}g remaining` : 
                    'Goal reached!'
                  }
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Carbs</span>
                  <span className="font-mono">{currentCarbs}g / {targetCarbs}g</span>
                </div>
                <Progress value={(currentCarbs / targetCarbs) * 100} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {targetCarbs - currentCarbs > 0 ? 
                    `${targetCarbs - currentCarbs}g remaining` : 
                    'Goal reached!'
                  }
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Fat</span>
                  <span className="font-mono">{currentFat}g / {targetFat}g</span>
                </div>
                <Progress value={(currentFat / targetFat) * 100} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
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
                Nutrition Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-card/70 rounded-lg p-3">
                <p className="text-sm mb-1">
                  <span className="font-semibold">🥗 Great choice!</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Your meals today provide excellent nutrient variety.
                </p>
              </div>
              <div className="bg-card/70 rounded-lg p-3">
                <p className="text-sm mb-1">
                  <span className="font-semibold">💪 Protein tip:</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Add a protein shake post-workout to hit your daily target.
                </p>
              </div>
              <div className="bg-card/70 rounded-lg p-3">
                <p className="text-sm mb-1">
                  <span className="font-semibold">💧 Hydration:</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Remember to drink 2-3 glasses of water before dinner.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meal Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meal Suggestions</CardTitle>
              <CardDescription>Based on your remaining macros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Fish className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Grilled Salmon</h4>
                  <p className="text-xs text-muted-foreground">with roasted vegetables</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono">485 cal</p>
                  <p className="text-xs text-muted-foreground">38g protein</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Drumstick className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Chicken Stir-fry</h4>
                  <p className="text-xs text-muted-foreground">with brown rice</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono">420 cal</p>
                  <p className="text-xs text-muted-foreground">32g protein</p>
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
    </div>
  );
}
