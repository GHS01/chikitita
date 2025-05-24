import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { 
  Weight, Dumbbell, UtensilsCrossed, Calendar, 
  Play, Camera, TrendingUp, ArrowRight, Target, Flame 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: activeWorkout } = useQuery({
    queryKey: ['/api/workouts/active'],
  });

  const { data: todaysMeals } = useQuery({
    queryKey: ['/api/nutrition/meals', { date: new Date().toISOString().split('T')[0] }],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentCalories = todaysMeals?.reduce((sum: number, meal: any) => sum + meal.calories, 0) || 0;
  const targetCalories = stats?.targetCalories || 2200;
  const remainingCalories = targetCalories - currentCalories;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <section className="mb-8 py-8 px-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, <span className="text-primary">{user?.firstName}</span>! 💪
          </h1>
          <p className="text-muted-foreground">Let's continue your fitness journey today.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Weight</p>
                  <p className="text-2xl font-bold font-mono">
                    {stats?.currentWeight || user?.currentWeight || 0}kg
                  </p>
                  {user?.targetWeight && user?.currentWeight && (
                    <p className="text-xs text-secondary mt-1 flex items-center">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {Math.abs(user.currentWeight - user.targetWeight).toFixed(1)}kg to goal
                    </p>
                  )}
                </div>
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Weight className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Workouts This Week</p>
                  <p className="text-2xl font-bold font-mono">{stats?.weeklyWorkouts || 0}/5</p>
                  <p className="text-xs text-primary mt-1 flex items-center">
                    <Flame className="h-3 w-3 mr-1" />
                    {stats?.weeklyWorkouts >= 4 ? "On track!" : "Keep going!"}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calories Today</p>
                  <p className="text-2xl font-bold font-mono">{currentCalories}</p>
                  <p className="text-xs text-accent mt-1 flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    {remainingCalories > 0 ? `${remainingCalories} remaining` : 'Goal reached!'}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <UtensilsCrossed className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold font-mono">{stats?.streak || 0} days</p>
                  <p className="text-xs text-secondary mt-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Keep it up!
                  </p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Today's Workout</h3>
              <p className="text-sm text-muted-foreground">
                {activeWorkout ? `${activeWorkout.name} • ${activeWorkout.duration} min` : "No active workout plan"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-secondary/10 p-3 rounded-lg group-hover:bg-secondary/20 transition-colors">
                  <Camera className="h-5 w-5 text-secondary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Log a Meal</h3>
              <p className="text-sm text-muted-foreground">Snap a photo for instant analysis</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:border-accent/30 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-accent/10 p-3 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Progress</h3>
              <p className="text-sm text-muted-foreground">Track your fitness journey</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Today's Overview */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Today's Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nutrition Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Summary</CardTitle>
              <CardDescription>Your daily macro progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Calories</span>
                  <span className="font-mono">{currentCalories} / {targetCalories}</span>
                </div>
                <Progress value={(currentCalories / targetCalories) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Protein</span>
                  <span className="font-mono">
                    {todaysMeals?.reduce((sum: number, meal: any) => sum + meal.protein, 0) || 0}g / {stats?.targetProtein || 150}g
                  </span>
                </div>
                <Progress 
                  value={((todaysMeals?.reduce((sum: number, meal: any) => sum + meal.protein, 0) || 0) / (stats?.targetProtein || 150)) * 100} 
                  className="h-2" 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Carbs</span>
                  <span className="font-mono">
                    {todaysMeals?.reduce((sum: number, meal: any) => sum + meal.carbs, 0) || 0}g / {stats?.targetCarbs || 200}g
                  </span>
                </div>
                <Progress 
                  value={((todaysMeals?.reduce((sum: number, meal: any) => sum + meal.carbs, 0) || 0) / (stats?.targetCarbs || 200)) * 100} 
                  className="h-2" 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Fat</span>
                  <span className="font-mono">
                    {todaysMeals?.reduce((sum: number, meal: any) => sum + meal.fat, 0) || 0}g / {stats?.targetFat || 85}g
                  </span>
                </div>
                <Progress 
                  value={((todaysMeals?.reduce((sum: number, meal: any) => sum + meal.fat, 0) || 0) / (stats?.targetFat || 85)) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Workout Status */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Status</CardTitle>
              <CardDescription>Your training progress</CardDescription>
            </CardHeader>
            <CardContent>
              {activeWorkout ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">{activeWorkout.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{activeWorkout.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Duration: {activeWorkout.duration} min</span>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Start Workout
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Week {activeWorkout.weekNumber} • {activeWorkout.difficulty} level
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">No Active Workout Plan</h4>
                  <p className="text-sm text-muted-foreground mb-4">Generate a personalized workout plan to get started</p>
                  <Button>Generate Workout Plan</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
