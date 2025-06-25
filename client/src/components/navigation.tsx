import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Dumbbell, Bell, User, LogOut } from "lucide-react";
import { useProfilePhoto } from "@/contexts/ProfilePhotoContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { photoUrl, refreshPhoto } = useProfilePhoto();
  const { t } = useTranslation();

  // 🎨 DETECTAR SI ESTAMOS EN AI TRAINER PARA APLICAR TEMA LUXURY
  const isAITrainerPage = location === "/ai-trainer" || location.startsWith("/ai-trainer");

  // Escuchar eventos de actualización de foto
  useEffect(() => {
    const handlePhotoUpdate = () => {
      console.log('🔄 [Navigation] Photo update event received, refreshing...');
      refreshPhoto();
    };

    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);

    return () => {
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
    };
  }, [refreshPhoto]);

  const navItems = [
    { href: "/", label: t('navigation.dashboard'), path: "/" },
    { href: "/workouts", label: t('navigation.workouts'), path: "/workouts" },
    { href: "/nutrition", label: t('navigation.nutrition'), path: "/nutrition" },
    { href: "/ai-trainer", label: t('navigation.aiTrainer'), path: "/ai-trainer" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isAITrainerPage
        ? "bg-gradient-to-r from-luxury-black to-luxury-charcoal border-b border-luxury-gold/20 shadow-lg shadow-luxury-gold/10"
        : "bg-card shadow-lg border-b"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isAITrainerPage
                    ? "bg-gradient-to-r from-luxury-gold to-light-gold text-luxury-black shadow-md shadow-luxury-gold/30"
                    : "bg-primary text-white"
                }`}>
                  <Dumbbell className="h-5 w-5" />
                </div>
                <h1 className={`text-xl font-bold transition-all duration-300 ${
                  isAITrainerPage
                    ? "text-luxury-gold"
                    : "text-primary"
                }`}>Fitbro</h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium transition-all duration-300 ${
                        isAITrainerPage
                          ? isActive(item.path)
                            ? "text-luxury-gold bg-luxury-gold/10 border border-luxury-gold/20 shadow-sm shadow-luxury-gold/20"
                            : "text-white/70 hover:text-luxury-gold hover:bg-luxury-gold/5"
                          : isActive(item.path)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter isLuxuryTheme={isAITrainerPage} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0 hover:bg-transparent">
                  <Avatar className={`h-12 w-12 border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isAITrainerPage
                      ? "border-luxury-gold/50 shadow-luxury-gold/20 hover:shadow-luxury-gold/40"
                      : "border-background"
                  }`}>
                    <AvatarImage src={photoUrl || ""} />
                    <AvatarFallback className={`font-semibold transition-all duration-300 ${
                      isAITrainerPage
                        ? "bg-gradient-to-br from-luxury-gold to-light-gold text-luxury-black"
                        : "bg-gradient-to-br from-primary to-primary/80 text-white"
                    }`}>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Indicador de estado online */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full transition-all duration-300 ${
                    isAITrainerPage ? "border-luxury-black" : "border-background"
                  }`}></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`transition-all duration-300 ${
                isAITrainerPage
                  ? "bg-luxury-charcoal border-luxury-gold/20 shadow-lg shadow-luxury-gold/10"
                  : ""
              }`}>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className={`flex items-center transition-all duration-300 ${
                    isAITrainerPage
                      ? "text-white hover:bg-luxury-gold/10 hover:text-luxury-gold"
                      : ""
                  }`}>
                    <User className="mr-2 h-4 w-4" />
                    {t('navigation.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className={`transition-all duration-300 ${
                  isAITrainerPage
                    ? "text-white hover:bg-luxury-gold/10 hover:text-luxury-gold"
                    : ""
                }`}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


          </div>
        </div>
      </div>
    </nav>
  );
}
