import { Link, useLocation } from "wouter";
import { Home, Dumbbell, UtensilsCrossed, Bot } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function MobileNavigation() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { href: "/", icon: Home, label: t('navigation.dashboard'), path: "/" },
    { href: "/workouts", icon: Dumbbell, label: t('navigation.workouts'), path: "/workouts" },
    { href: "/nutrition", icon: UtensilsCrossed, label: t('navigation.nutrition'), path: "/nutrition" },
    { href: "/ai-trainer", icon: Bot, label: t('navigation.aiTrainer'), path: "/ai-trainer" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  // OCULTAR FOOTER EN AI-TRAINER PARA MOBILE/TABLET
  const isAITrainerPage = location === "/ai-trainer";
  const shouldHideFooter = isAITrainerPage;

  return (
    <div className={`mobile-footer-sticky md:hidden transition-transform duration-300 ${
      shouldHideFooter ? 'mobile-footer-hidden' : 'translate-y-0'
    }`}>
      <div className="flex justify-around items-center py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link key={item.path} href={item.href}>
              <div className={`flex flex-col items-center py-2 px-2 sm:px-3 transition-colors min-w-0 flex-1 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-xs mt-1 font-medium truncate w-full text-center">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
