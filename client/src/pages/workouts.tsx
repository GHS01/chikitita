import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, CheckCircle, Clock, Target, Zap, BookOpen, 
  Plus, TrendingUp, Calendar, Award 
} from "lucide-react";

export default function Workouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['/api/workouts'],
  });

  const { data: activeWorkout } = useQuery({
    queryKey: ['/api/workouts/active'],
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/workouts/sessions'],
  });

  const generatePlanMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/workouts/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/active'] });
      toast({
        title: "New Workout Plan Generated!",
        description: "Your personalized workout plan is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startWorkoutMutation = useMutation({
    mutationFn: (workoutPlanId: number) => 
      apiRequest('POST', '/api/workouts/sessions', {
        workoutPlanId,
        startedAt: new Date().toISOString(),
        status: 'in_progress',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
      toast({
        title: "Workout Started!",
        description: "Track your progress and complete your exercises.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-muted rounded-2xl"></div>
            <div className="space-y-6">
              <div className="h-32 bg-muted rounded-xl"></div>
              <div className="h-64 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedThisWeek = sessions?.filter((session: any) => {
    const sessionDate = new Date(session.startedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate > weekAgo && session.status === 'completed';
  }).length || 0;

  const weeklyGoal = 5;
  const totalTimeThisWeek = sessions?.filter((session: any) => {
    const sessionDate = new Date(session.startedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate > weekAgo && session.status === 'completed';
  }).reduce((total: number, session: any) => {
    if (session.completedAt) {
      const duration = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
      return total + (duration / (1000 * 60)); // Convert to minutes
    }
    return total;
  }, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Workout Plans</h1>
          <p className="text-muted-foreground">AI-generated routines tailored to your goals</p>
        </div>
        <Button 
          onClick={() => generatePlanMutation.mutate()}
          disabled={generatePlanMutation.isPending}
          className="mt-4 md:mt-0"
        >
          <Zap className="h-4 w-4 mr-2" />
          {generatePlanMutation.isPending ? "Generating..." : "Generate New Plan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Workout Area */}
        <div className="lg:col-span-2">
          {activeWorkout ? (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">This Week's Schedule</CardTitle>
                  <Badge variant="default">Week {activeWorkout.weekNumber}</Badge>
                </div>
                <CardDescription>
                  {activeWorkout.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Workout */}
                <Card className="border-2 border-primary shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center">
                          <Play className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{activeWorkout.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Today • {activeWorkout.duration} min • Ready to start
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => startWorkoutMutation.mutate(activeWorkout.id)}
                        disabled={startWorkoutMutation.isPending}
                      >
                        {startWorkoutMutation.isPending ? "Starting..." : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Exercise Preview */}
                {activeWorkout.exercises && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Today's Exercises</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(activeWorkout.exercises as any[]).map((exercise, index) => (
                        <div key={index} className="bg-card border rounded-lg p-3">
                          <h5 className="font-medium">{exercise.name}</h5>
                          <div className="text-sm text-muted-foreground mt-1">
                            {exercise.sets && <span>{exercise.sets} sets</span>}
                            {exercise.reps && <span> • {exercise.reps} reps</span>}
                            {exercise.weight && <span> • {exercise.weight}kg</span>}
                            {exercise.duration && <span> • {exercise.duration}s</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Workout Plan</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a personalized workout plan based on your fitness goals and level.
                </p>
                <Button 
                  onClick={() => generatePlanMutation.mutate()}
                  disabled={generatePlanMutation.isPending}
                  size="lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {generatePlanMutation.isPending ? "Generating..." : "Generate Your First Plan"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Workouts Completed</span>
                  <span className="font-mono">{completedThisWeek}/{weeklyGoal}</span>
                </div>
                <Progress value={(completedThisWeek / weeklyGoal) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Time</span>
                  <span className="font-mono">{Math.round(totalTimeThisWeek)}m</span>
                </div>
                <Progress value={Math.min((totalTimeThisWeek / 300) * 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Exercise Library */}
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-6 text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Exercise Library</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse 500+ exercises with video guides
              </p>
              <Button variant="outline" size="sm">
                Browse Now
              </Button>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 text-primary mr-2" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-sm mb-2">
                  <span className="font-semibold">💡 Suggestion:</span> Your form has improved 15% this week!
                </p>
                <p className="text-xs text-muted-foreground">
                  Try increasing weight by 5kg next session.
                </p>
              </div>
              <div className="bg-secondary/5 rounded-lg p-3">
                <p className="text-sm mb-2">
                  <span className="font-semibold">🎯 Goal Update:</span> You're ahead of schedule!
                </p>
                <p className="text-xs text-muted-foreground">
                  Consider adding 1 extra cardio session this week.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          {sessions && sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 3).map((session: any, index: number) => (
                    <div key={session.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        session.status === 'completed' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Session {sessions.length - index}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startedAt).toLocaleDateString()} • {session.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
