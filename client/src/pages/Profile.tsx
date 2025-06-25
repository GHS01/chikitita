import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Settings, Calendar, Target, MapPin, Clock, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import PreferencesForm from "@/components/PreferencesForm";
import RutinasTab from "@/components/RutinasTab";
import UnifiedProfile from "@/components/UnifiedProfile";
import { ModernEmoji } from "@/components/ui/modern-emoji";
import { WeightProgressSection } from "@/components/profile/WeightProgressSection";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { useProfilePhoto } from "@/contexts/ProfilePhotoContext";
import { SimpleLanguageSelector } from "@/components/SimpleLanguageSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const { photoUrl, refreshPhoto } = useProfilePhoto();
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: preferences } = useQuery({
    queryKey: ['/api/user/preferences'],
  });

  const { data: progressEntries } = useQuery({
    queryKey: ['/api/progress'],
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements'],
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/workouts/sessions'],
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  // Calculate progress stats
  const weightProgress = user.targetWeight && user.currentWeight
    ? Math.abs(user.currentWeight - user.targetWeight)
    : 0;

  const weightGoalProgress = user.targetWeight && user.currentWeight
    ? ((user.currentWeight - user.targetWeight) / user.currentWeight) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <ProfilePhotoUpload
              currentPhotoUrl={photoUrl}
              onPhotoUpdate={refreshPhoto}
              className="flex-shrink-0"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{user.fullName}</h1>
              <p className="text-muted-foreground mb-4">{user.email}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.totalWorkouts || 0}</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.workouts')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.currentStreak || 0}</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.dayStreak')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.currentWeight}{t('profile.kg')}</div>
                  <div className="text-sm text-muted-foreground">{t('profile.current')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.targetWeight}{t('profile.kg')}</div>
                  <div className="text-sm text-muted-foreground">{t('profile.target')}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{t('profile.personal')}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>{t('profile.preferences')}</span>
          </TabsTrigger>
          <TabsTrigger value="rutinas" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{t('profile.routines')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab - NUEVO COMPONENTE UNIFICADO */}
        <TabsContent value="personal" className="space-y-6">
          <UnifiedProfile />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm preferences={preferences} />
        </TabsContent>

        {/* Rutinas Tab */}
        <TabsContent value="rutinas" className="space-y-6">
          <RutinasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
