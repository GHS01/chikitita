import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Sparkles } from 'lucide-react';

interface TrainerSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
}

export default function TrainerSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  isLoading = false 
}: TrainerSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-primary" />
          Sugerencias de tu entrenador
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => onSuggestionClick(suggestion)}
              disabled={isLoading}
            >
              <Sparkles className="w-3 h-3 mr-2 flex-shrink-0 text-primary" />
              <span className="text-sm">{suggestion}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
