import { Link, useLocation } from "wouter";
import { Home, Dumbbell, UtensilsCrossed, TrendingUp } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home", path: "/" },
    { href: "/workouts", icon: Dumbbell, label: "Workouts", path: "/workouts" },
    { href: "/nutrition", icon: UtensilsCrossed, label: "Nutrition", path: "/nutrition" },
    { href: "/progress", icon: TrendingUp, label: "Progress", path: "/progress" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-30 mobile-safe-area">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} href={item.href}>
              <div className={`flex flex-col items-center py-2 px-3 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}>
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
