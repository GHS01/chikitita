import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, Clock, Target, CheckCircle, Calendar, 
  ChevronRight, Dumbbell, Timer 
} from "lucide-react";
import type { WorkoutPlan } from "@shared/schema";

interface WorkoutPlanCardProps {
  workoutPlan: WorkoutPlan;
  onStartWorkout?: (planId: number) => void;
  isActive?: boolean;
  completedSessions?: number;
  totalSessions?: number;
}

export default function WorkoutPlanCard({ 
  workoutPlan, 
  onStartWorkout, 
  isActive = false,
  completedSessions = 0,
  totalSessions = 5 
}: WorkoutPlanCardProps) {
  const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const exercises = workoutPlan.exercises as any[] || [];

  return (
    <Card className={`transition-all hover:shadow-md ${
      isActive ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10' : ''
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg">{workoutPlan.name}</CardTitle>
              {isActive && <Badge variant="default">Active</Badge>}
              <Badge variant="outline" className="capitalize">
                {workoutPlan.difficulty}
              </Badge>
            </div>
            <CardDescription>{workoutPlan.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4 mr-1" />
              {workoutPlan.duration} min
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              Week {workoutPlan.weekNumber}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isActive && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Weekly Progress</span>
              <span className="font-medium">{completedSessions}/{totalSessions} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Exercise Preview */}
        {exercises.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <Dumbbell className="h-4 w-4 mr-2" />
              Exercises ({exercises.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exercises.slice(0, 4).map((exercise, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-3">
                  <h5 className="font-medium text-sm">{exercise.name}</h5>
                  <div className="text-xs text-muted-foreground mt-1">
                    {exercise.sets && <span>{exercise.sets} sets</span>}
                    {exercise.reps && <span> • {exercise.reps} reps</span>}
                    {exercise.weight && <span> • {exercise.weight}kg</span>}
                    {exercise.duration && <span> • {exercise.duration}s</span>}
                  </div>
                </div>
              ))}
              {exercises.length > 4 && (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center text-muted-foreground">
                  <span className="text-sm">+{exercises.length - 4} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {onStartWorkout && (
            <Button 
              onClick={() => onStartWorkout(workoutPlan.id)}
              className="flex-1"
              variant={isActive ? "default" : "outline"}
            >
              <Play className="h-4 w-4 mr-2" />
              {isActive ? "Start Workout" : "Activate Plan"}
            </Button>
          )}
          
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Workout Stats */}
        {isActive && (
          <div className="grid grid-cols-3 gap-4 pt-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Estimated</p>
              <p className="font-semibold text-sm flex items-center justify-center">
                <Timer className="h-3 w-3 mr-1" />
                {workoutPlan.duration}m
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Difficulty</p>
              <p className="font-semibold text-sm capitalize">{workoutPlan.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Exercises</p>
              <p className="font-semibold text-sm">{exercises.length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
