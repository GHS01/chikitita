import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Trash2, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Meal } from "@shared/schema";
// 🕐 SISTEMA HORARIO CENTRALIZADO
import { formatMealTime } from '@/utils/timeFormatters';

interface MealLogCardProps {
  meal: Meal;
  onDelete?: (mealId: number) => void;
  onViewDetails?: (meal: Meal) => void;
  showActions?: boolean;
}

export default function MealLogCard({
  meal,
  onDelete,
  onViewDetails,
  showActions = true
}: MealLogCardProps) {
  const mealTypeColors = {
    breakfast: "bg-amber-100 text-amber-800 border-amber-200",
    lunch: "bg-green-100 text-green-800 border-green-200",
    dinner: "bg-blue-100 text-blue-800 border-blue-200",
    snack: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const mealTypeColor = mealTypeColors[meal.mealType as keyof typeof mealTypeColors] || mealTypeColors.snack;

  const formatTime = (dateString: string) => {
    return formatMealTime(new Date(dateString)); // 🕐 SISTEMA CENTRALIZADO
  };

  return (
    <Card className="border hover:shadow-sm transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-4 flex-1">
            {/* Meal Icon/Image */}
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              {meal.imageUrl ? (
                <img
                  src={meal.imageUrl}
                  alt={meal.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              )}
            </div>

            {/* Meal Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${mealTypeColor}`}
                >
                  {meal.mealType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatTime(meal.loggedAt!)}
                </Badge>
              </div>

              <h4 className="font-medium text-sm truncate">{meal.name}</h4>

              {meal.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {meal.description}
                </p>
              )}
            </div>
          </div>

          {/* Calories & Actions */}
          <div className="flex items-start space-x-2">
            <div className="text-right">
              <p className="text-lg font-bold font-mono">{meal.calories}</p>
              <p className="text-xs text-muted-foreground">calories</p>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(meal)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(meal.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Macronutrients */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-accent/10 rounded p-2">
            <p className="text-xs text-muted-foreground">Carbs</p>
            <p className="font-semibold text-accent font-mono text-sm">{meal.carbs}g</p>
          </div>
          <div className="bg-secondary/10 rounded p-2">
            <p className="text-xs text-muted-foreground">Protein</p>
            <p className="font-semibold text-secondary font-mono text-sm">{meal.protein}g</p>
          </div>
          <div className="bg-primary/10 rounded p-2">
            <p className="text-xs text-muted-foreground">Fat</p>
            <p className="font-semibold text-primary font-mono text-sm">{meal.fat}g</p>
          </div>
          {meal.fiber && (
            <div className="bg-muted rounded p-2">
              <p className="text-xs text-muted-foreground">Fiber</p>
              <p className="font-semibold text-muted-foreground font-mono text-sm">{meal.fiber}g</p>
            </div>
          )}
        </div>

        {/* Quick Nutrition Summary */}
        <div className="mt-3 pt-3 border-t border-muted flex justify-between text-xs text-muted-foreground">
          <span>
            P: {meal.protein}g ({Math.round((meal.protein * 4 / meal.calories) * 100)}%)
          </span>
          <span>
            C: {meal.carbs}g ({Math.round((meal.carbs * 4 / meal.calories) * 100)}%)
          </span>
          <span>
            F: {meal.fat}g ({Math.round((meal.fat * 9 / meal.calories) * 100)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
