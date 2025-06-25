import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  BarChart3,
  Calendar
} from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';
import { apiRequest } from '@/lib/queryClient';

const SchedulerStatus: React.FC = () => {
  const queryClient = useQueryClient();

  // Obtener estadísticas del scheduler
  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['scheduler-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scheduler/stats');
      return response.json();
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Obtener estado de salud
  const { data: healthData } = useQuery({
    queryKey: ['scheduler-health'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scheduler/health');
      return response.json();
    },
    refetchInterval: 30 * 1000,
  });

  // Iniciar scheduler
  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/start');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-health'] });
    }
  });

  // Detener scheduler
  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/stop');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-health'] });
    }
  });

  // Inicializar scheduler
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/initialize');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-stats'] });
    }
  });

  // Limpiar tareas
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/cleanup');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-stats'] });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = statsData?.stats;
  const health = healthData?.health;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'stopped': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'stopped': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado General */}
      <Card className={`border-2 ${getStatusColor(health?.status)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(health?.status)}
            Estado del Scheduler
          </CardTitle>
          <CardDescription>
            Sistema de generación automática de reportes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ModernEmoji emoji={health?.status === 'healthy' ? '🟢' : '🔴'} size={24} />
              <div>
                <div className="font-bold capitalize">{health?.status || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">
                  {health?.status === 'healthy' ? 'Funcionando correctamente' : 'Detenido'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!stats?.isRunning ? (
                <Button 
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
              ) : (
                <Button 
                  onClick={() => stopMutation.mutate()}
                  disabled={stopMutation.isPending}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Detener
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-blue-600">
                {stats?.totalTasks || 0}
              </div>
              <div className="text-xs text-blue-600">Total Tareas</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-orange-600">
                {stats?.pendingTasks || 0}
              </div>
              <div className="text-xs text-orange-600">Pendientes</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-green-600">
                {stats?.completedTasks || 0}
              </div>
              <div className="text-xs text-green-600">Completadas</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-red-600">
                {stats?.failedTasks || 0}
              </div>
              <div className="text-xs text-red-600">Fallidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próxima Tarea */}
      {health?.nextTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Próxima Tarea Programada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  {health.nextTask.type === 'weekly_report' ? (
                    <Calendar className="h-4 w-4" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {health.nextTask.type === 'weekly_report' ? 'Reporte Semanal' : 
                     health.nextTask.type === 'monthly_report' ? 'Reporte Mensual' : 
                     'Análisis de Periodización'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuario {health.nextTask.userId}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {new Date(health.nextTask.scheduledFor).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(health.nextTask.scheduledFor).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones de Administración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Administración
          </CardTitle>
          <CardDescription>
            Gestionar el scheduler y las tareas programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${initializeMutation.isPending ? 'animate-spin' : ''}`} />
              Reinicializar Scheduler
            </Button>
            <Button 
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${cleanupMutation.isPending ? 'animate-spin' : ''}`} />
              Limpiar Tareas Antiguas
            </Button>
          </div>
          
          {/* Estado de las mutaciones */}
          <div className="mt-4 space-y-2">
            {startMutation.isSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Scheduler iniciado exitosamente
              </div>
            )}
            {stopMutation.isSuccess && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Scheduler detenido exitosamente
              </div>
            )}
            {initializeMutation.isSuccess && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Scheduler reinicializado exitosamente
              </div>
            )}
            {cleanupMutation.isSuccess && (
              <div className="flex items-center gap-2 text-purple-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Limpieza completada exitosamente
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última actualización:</span>
              <span className="font-mono">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado del sistema:</span>
              <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
                {health?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tareas en ejecución:</span>
              <span className="font-mono">{stats?.runningTasks || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulerStatus;
