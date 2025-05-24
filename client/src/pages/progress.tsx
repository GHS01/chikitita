import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProgressChart from "@/components/progress-chart";
import { 
  Scale, Dumbbell, Calendar, Trophy, TrendingUp, Target,
  Plus, Ruler, ExpandIcon as Expand, MoveUpLeft
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProgressEntrySchema, type InsertProgressEntry } from "@shared/schema";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Progress() {
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: progressEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/progress'],
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements'],
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/workouts/sessions'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const form = useForm<InsertProgressEntry>({
    resolver: zodResolver(insertProgressEntrySchema),
    defaultValues: {
      weight: undefined,
      bodyMeasurements: {},
      notes: "",
    },
  });

  const addProgressMutation = useMutation({
    mutationFn: (data: InsertProgressEntry) => 
      apiRequest('POST', '/api/progress', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowAddMeasurement(false);
      form.reset();
      toast({
        title: "Progress recorded!",
        description: "Your measurements have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProgressEntry) => {
    const bodyMeasurements = {
      waist: parseFloat(form.getValues('bodyMeasurements.waist') || '0') || undefined,
      chest: parseFloat(form.getValues('bodyMeasurements.chest') || '0') || undefined,
      arms: parseFloat(form.getValues('bodyMeasurements.arms') || '0') || undefined,
      thighs: parseFloat(form.getValues('bodyMeasurements.thighs') || '0') || undefined,
    };

    const filteredMeasurements = Object.fromEntries(
      Object.entries(bodyMeasurements).filter(([_, value]) => value !== undefined)
    );

    addProgressMutation.mutate({
      ...data,
      bodyMeasurements: Object.keys(filteredMeasurements).length > 0 ? filteredMeasurements : undefined,
    });
  };

  if (entriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress statistics
  const completedSessions = sessions?.filter((session: any) => session.status === 'completed') || [];
  const weeklyWorkouts = completedSessions.filter((session: any) => {
    const sessionDate = new Date(session.startedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate > weekAgo;
  }).length;

  const currentWeight = progressEntries?.[0]?.weight || stats?.currentWeight || 0;
  const previousWeight = progressEntries?.[1]?.weight || currentWeight;
  const weightChange = currentWeight - previousWeight;

  const strengthGains = 35; // Mock calculation - would be based on workout data
  const consistencyRate = weeklyWorkouts >= 4 ? 87 : Math.round((weeklyWorkouts / 5) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Progress Analytics</h1>
        <p className="text-muted-foreground">Track your fitness journey with detailed insights</p>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Weight Progress</h3>
              <Scale className="h-5 w-5 text-secondary" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold font-mono">
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
              </p>
              <p className="text-sm text-secondary">
                {weightChange < 0 ? 'Lost' : 'Gained'} since last entry
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Current:</span>
                <span className="text-xs font-medium">{currentWeight}kg</span>
                <div className="flex-1 bg-secondary/20 rounded-full h-1.5">
                  <div className="bg-secondary h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Strength Gains</h3>
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold font-mono">+{strengthGains}%</p>
              <p className="text-sm text-primary">Average increase</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Workouts:</span>
                  <span className="font-medium ml-1">{completedSessions.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">This week:</span>
                  <span className="font-medium ml-1">{weeklyWorkouts}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Consistency</h3>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold font-mono">{consistencyRate}%</p>
              <p className="text-sm text-accent">Workout completion rate</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">This week:</span>
                <span className="text-xs font-medium">{weeklyWorkouts}/5</span>
                <div className="flex-1 bg-accent/20 rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full" style={{ width: `${(weeklyWorkouts / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weight Progress Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Weight Tracking</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">3M</Button>
                <Button variant="outline" size="sm">6M</Button>
                <Button variant="outline" size="sm">1Y</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressChart 
              data={progressEntries || []}
              type="weight"
              height={256}
            />
          </CardContent>
        </Card>

        {/* Body Measurements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Body Measurements</CardTitle>
              <Dialog open={showAddMeasurement} onOpenChange={setShowAddMeasurement}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Progress</DialogTitle>
                    <DialogDescription>
                      Add your current weight and body measurements to track your progress.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bodyMeasurements.waist"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Waist (cm)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bodyMeasurements.chest"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chest (cm)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bodyMeasurements.arms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Arms (cm)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bodyMeasurements.thighs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Thighs (cm)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="How are you feeling? Any observations..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAddMeasurement(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={addProgressMutation.isPending}
                        >
                          {addProgressMutation.isPending ? "Saving..." : "Save Progress"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {progressEntries && progressEntries.length > 0 ? (
              <div className="space-y-4">
                {progressEntries.slice(0, 4).map((entry: any, index: number) => {
                  const measurements = entry.bodyMeasurements || {};
                  const date = new Date(entry.recordedAt).toLocaleDateString();
                  
                  return (
                    <div key={entry.id} className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{date}</span>
                        {entry.weight && (
                          <span className="font-mono">{entry.weight}kg</span>
                        )}
                      </div>
                      
                      {Object.keys(measurements).length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          {measurements.waist && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center space-x-2">
                                <Ruler className="h-4 w-4 text-primary" />
                                <span className="text-sm">Waist</span>
                              </div>
                              <span className="font-mono text-sm">{measurements.waist}cm</span>
                            </div>
                          )}
                          
                          {measurements.chest && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center space-x-2">
                                <Expand className="h-4 w-4 text-secondary" />
                                <span className="text-sm">Chest</span>
                              </div>
                              <span className="font-mono text-sm">{measurements.chest}cm</span>
                            </div>
                          )}
                          
                          {measurements.arms && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center space-x-2">
                                <MoveUpLeft className="h-4 w-4 text-accent" />
                                <span className="text-sm">Arms</span>
                              </div>
                              <span className="font-mono text-sm">{measurements.arms}cm</span>
                            </div>
                          )}
                          
                          {measurements.thighs && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center space-x-2">
                                <MoveUpLeft className="h-4 w-4 text-primary" />
                                <span className="text-sm">Thighs</span>
                              </div>
                              <span className="font-mono text-sm">{measurements.thighs}cm</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {index < 3 && <hr className="border-muted" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No measurements recorded</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your body measurements to see your progress
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Workout Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart 
              data={sessions || []}
              type="workouts"
              height={256}
            />
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {achievements.slice(0, 4).map((achievement: any) => (
                  <div key={achievement.id} className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                    <div className="bg-accent text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                  <div className="bg-accent text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm">First Workout</h4>
                  <p className="text-xs text-muted-foreground mt-1">Complete your first workout!</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20">
                  <div className="bg-secondary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm">Consistency</h4>
                  <p className="text-xs text-muted-foreground mt-1">7 days of activity</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm">Goal Setter</h4>
                  <p className="text-xs text-muted-foreground mt-1">Set your first goal</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/25 rounded-lg border border-muted opacity-60">
                  <div className="bg-muted text-muted-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Locked</h4>
                  <p className="text-xs text-muted-foreground mt-1">Keep training to unlock</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
