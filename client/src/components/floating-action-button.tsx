import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Play, Camera, X } from "lucide-react";
import { useLocation } from "wouter";

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const actions = [
    {
      icon: Play,
      label: "Start Workout",
      className: "bg-primary hover:bg-primary/90 text-white",
      onClick: () => {
        setLocation("/workouts");
        setIsOpen(false);
      },
    },
    {
      icon: Camera,
      label: "Log Meal",
      className: "bg-secondary hover:bg-secondary/90 text-white",
      onClick: () => {
        setLocation("/nutrition");
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 mb-16 md:mb-0">
      <div className="relative">
        {/* Action buttons */}
        <div className={`absolute bottom-16 right-0 space-y-3 transition-all duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                size="icon"
                className={`w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all ${action.className}`}
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>

        {/* Main FAB */}
        <Button
          size="icon"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}
