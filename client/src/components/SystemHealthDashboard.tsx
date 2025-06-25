/**
 * 🏥 System Health Dashboard
 * Componente para mostrar el estado de salud del sistema FitnessPro V8
 * 
 * Características:
 * - Monitoreo en tiempo real de servicios
 * - Métricas de rendimiento del sistema
 * - Historial de salud y estadísticas
 * - Indicadores visuales de estado
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { 
  Activity, 
  Database, 
  Brain, 
  HardDrive, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  aiServices: 'operational' | 'limited' | 'offline';
  cache: 'active' | 'warming' | 'cold';
  uptime: number;
  responseTime: number;
  lastCheck: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

interface HealthMetrics {
  checksPerformed: number;
  successRate: number;
  averageResponseTime: number;
  systemLoad: number;
  lastFailure: string | null;
}

interface SystemStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  health: SystemHealth | string;
  metrics: {
    checksPerformed: number;
    successRate: number;
    averageResponseTime: number;
    monitoring: string;
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: {
      used: number;
      total: number;
      unit: string;
    };
  };
}

export function SystemHealthDashboard() {
  const { t } = useTranslation();

  // Consultar estado del sistema
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/system/status'],
    queryFn: async (): Promise<SystemStatus> => {
      const response = await fetch('/api/system/status');
      if (!response.ok) throw new Error('Failed to fetch system status');
      return response.json();
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
    retry: 2,
  });

  // Consultar métricas detalladas
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/system/health'],
    queryFn: async () => {
      const response = await fetch('/api/system/health?limit=5');
      if (!response.ok) throw new Error('Failed to fetch health data');
      return response.json();
    },
    refetchInterval: 60000, // Actualizar cada minuto
    retry: 2,
  });

  const isLoading = statusLoading || healthLoading;
  const currentHealth = healthData?.current as SystemHealth;
  const metrics = healthData?.metrics as HealthMetrics;

  // Función para obtener el icono y color del estado
  const getStatusIcon = (status: string, type: 'database' | 'ai' | 'cache') => {
    const iconProps = { size: 16, className: "mr-1" };
    
    switch (type) {
      case 'database':
        if (status === 'healthy') return <Database {...iconProps} className="mr-1 text-green-500" />;
        if (status === 'degraded') return <AlertCircle {...iconProps} className="mr-1 text-yellow-500" />;
        return <XCircle {...iconProps} className="mr-1 text-red-500" />;
      
      case 'ai':
        if (status === 'operational') return <Brain {...iconProps} className="mr-1 text-green-500" />;
        if (status === 'limited') return <AlertCircle {...iconProps} className="mr-1 text-yellow-500" />;
        return <XCircle {...iconProps} className="mr-1 text-red-500" />;
      
      case 'cache':
        if (status === 'active') return <HardDrive {...iconProps} className="mr-1 text-green-500" />;
        if (status === 'warming') return <AlertCircle {...iconProps} className="mr-1 text-yellow-500" />;
        return <XCircle {...iconProps} className="mr-1 text-red-500" />;
    }
  };

  // Función para obtener el color del badge
  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'healthy' || status === 'operational' || status === 'active') return 'default';
    if (status === 'degraded' || status === 'limited' || status === 'warming') return 'secondary';
    return 'destructive';
  };

  // Formatear uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            🏥 System Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-luxury-gold/20 bg-luxury-charcoal/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-luxury-gold">
          <div className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            🏥 System Health Monitor
          </div>
          <Badge variant={systemStatus?.status === 'operational' ? 'default' : 'destructive'}>
            {systemStatus?.status || 'Unknown'}
          </Badge>
        </CardTitle>
        {systemStatus && (
          <p className="text-sm text-gray-400">
            Last updated: {new Date(systemStatus.timestamp).toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estado de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentHealth ? (
            <>
              <div className="flex flex-col items-center p-4 bg-luxury-black/30 rounded-lg border border-luxury-gold/10">
                {getStatusIcon(currentHealth.database, 'database')}
                <div className="text-center">
                  <div className="text-sm font-medium text-white">Database</div>
                  <Badge variant={getBadgeVariant(currentHealth.database)} className="mt-1">
                    {currentHealth.database}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-luxury-black/30 rounded-lg border border-luxury-gold/10">
                {getStatusIcon(currentHealth.aiServices, 'ai')}
                <div className="text-center">
                  <div className="text-sm font-medium text-white">AI Services</div>
                  <Badge variant={getBadgeVariant(currentHealth.aiServices)} className="mt-1">
                    {currentHealth.aiServices}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-luxury-black/30 rounded-lg border border-luxury-gold/10">
                {getStatusIcon(currentHealth.cache, 'cache')}
                <div className="text-center">
                  <div className="text-sm font-medium text-white">Cache</div>
                  <Badge variant={getBadgeVariant(currentHealth.cache)} className="mt-1">
                    {currentHealth.cache}
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-3 text-center text-gray-400">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              Health data initializing...
            </div>
          )}
        </div>

        {/* Métricas del Sistema */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-luxury-black/30 p-4 rounded-lg border border-luxury-gold/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Uptime</p>
                  <p className="text-lg font-semibold text-white">
                    {formatUptime(systemStatus.uptime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-luxury-gold" />
              </div>
            </div>

            <div className="bg-luxury-black/30 p-4 rounded-lg border border-luxury-gold/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-lg font-semibold text-white">
                    {systemStatus.metrics.successRate}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-luxury-black/30 p-4 rounded-lg border border-luxury-gold/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Response Time</p>
                  <p className="text-lg font-semibold text-white">
                    {systemStatus.metrics.averageResponseTime}ms
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-luxury-black/30 p-4 rounded-lg border border-luxury-gold/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Memory Usage</p>
                  <p className="text-lg font-semibold text-white">
                    {systemStatus.system.memory.used}/{systemStatus.system.memory.total} {systemStatus.system.memory.unit}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Información del Sistema */}
        {systemStatus && (
          <div className="bg-luxury-black/30 p-4 rounded-lg border border-luxury-gold/10">
            <h4 className="text-sm font-medium text-luxury-gold mb-3">System Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Version:</span>
                <span className="ml-2 text-white">{systemStatus.version}</span>
              </div>
              <div>
                <span className="text-gray-400">Environment:</span>
                <span className="ml-2 text-white">{systemStatus.environment}</span>
              </div>
              <div>
                <span className="text-gray-400">Platform:</span>
                <span className="ml-2 text-white">{systemStatus.system.platform}</span>
              </div>
              <div>
                <span className="text-gray-400">Node:</span>
                <span className="ml-2 text-white">{systemStatus.system.nodeVersion}</span>
              </div>
            </div>
          </div>
        )}

        {/* Estado del Monitoreo */}
        {systemStatus && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-400">
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              Monitoring: {systemStatus.metrics.monitoring}
            </div>
            <div className="text-gray-400">
              Total checks: {systemStatus.metrics.checksPerformed}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
