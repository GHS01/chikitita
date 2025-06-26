import { useAuth } from "@/hooks/use-auth";
// 🌐 SISTEMA DE TRADUCCIONES
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import WeightSystemTester from '@/components/WeightSystemTester';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // 🚨 CORRECCIÓN CRÍTICA: No mostrar dashboard si no hay usuario autenticado
  if (!user) {
    return (
      <div className="mobile-container py-4 sm:py-8">
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm sm:text-base">Cargando datos del usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container py-4 sm:py-8">
      {/* Welcome Header - MOBILE OPTIMIZED */}
      <section className="mb-6 sm:mb-8 py-4 sm:py-6 px-4 sm:px-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl sm:rounded-2xl">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {t('dashboard.welcome')}, <span className="text-primary">{user?.fullName}</span>! 💪
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('dashboard.subtitle')}</p>
        </div>
      </section>

      {/* Analytics Dashboard - USAR ID REAL DEL USUARIO */}
      <AnalyticsDashboard userId={user.id} />

      {/* 🧪 Sistema de Testing - Solo para usuario de desarrollo */}
      {user.id === 17 && (
        <section className="mt-8">
          <WeightSystemTester />
        </section>
      )}
    </div>
  );
}
