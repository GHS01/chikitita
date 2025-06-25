import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';

export function NotificationTestPanel() {
  const { createNotification } = useNotifications();
  const { toast } = useToast();

  const testNotifications = [
    {
      type: 'workout',
      category: 'reminder',
      title: '¡Hora de entrenar! 💪',
      message: 'No olvides completar tu rutina de hoy para mantener tu progreso.',
      icon: '🏋️',
      priority: 'normal',
      actionUrl: '/workouts',
      actionLabel: 'Ver rutina',
    },
    {
      type: 'nutrition',
      category: 'achievement',
      title: '¡Meta de hidratación alcanzada! 💧',
      message: 'Has completado tu objetivo diario de agua. ¡Excelente!',
      icon: '💧',
      priority: 'normal',
      actionUrl: '/nutrition',
      actionLabel: 'Ver progreso',
    },
    {
      type: 'progress',
      category: 'achievement',
      title: '¡Meta de peso alcanzada! 🎯',
      message: '¡Felicidades! Has alcanzado tu objetivo de pérdida de peso.',
      icon: '🏆',
      priority: 'high',
      actionUrl: '/profile',
      actionLabel: 'Ver progreso',
    },
    {
      type: 'ai_trainer',
      category: 'update',
      title: 'Mensaje de tu entrenador 🤖',
      message: 'He notado que has estado muy consistente. ¡Sigue así!',
      icon: '🤖',
      priority: 'normal',
      actionUrl: '/ai-trainer',
      actionLabel: 'Ver mensaje',
    },
    {
      type: 'system',
      category: 'alert',
      title: 'Completa tu perfil 👤',
      message: 'Faltan datos en tu perfil. Complétalo para mejores recomendaciones.',
      icon: '⚠️',
      priority: 'normal',
      actionUrl: '/profile',
      actionLabel: 'Completar perfil',
    },
    {
      type: 'workout',
      category: 'achievement',
      title: '¡Racha de 7 días! 🔥',
      message: 'Has entrenado 7 días consecutivos. ¡Sigue así!',
      icon: '🔥',
      priority: 'high',
      actionUrl: '/profile',
      actionLabel: 'Ver estadísticas',
    },
  ];

  const handleCreateTestNotification = (notification: any) => {
    createNotification(notification);
    toast({
      title: "Notificación creada",
      description: `Se ha creado una notificación de prueba: ${notification.title}`,
    });
  };

  const handleCreateRandomNotification = () => {
    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    handleCreateTestNotification(randomNotification);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workout':
        return 'bg-green-100 text-green-800';
      case 'nutrition':
        return 'bg-orange-100 text-orange-800';
      case 'progress':
        return 'bg-blue-100 text-blue-800';
      case 'ai_trainer':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ModernEmoji emoji="🧪" size={20} />
          <span>Panel de Prueba de Notificaciones</span>
        </CardTitle>
        <CardDescription>
          Prueba diferentes tipos de notificaciones para ver cómo funcionan en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreateRandomNotification} variant="outline">
            <EmojiText>🎲 Notificación Aleatoria</EmojiText>
          </Button>
          <Button 
            onClick={() => handleCreateTestNotification({
              type: 'system',
              category: 'update',
              title: '¡Bienvenido a Fitbro! 🎉',
              message: 'Estamos emocionados de acompañarte en tu viaje fitness.',
              icon: '🎉',
              priority: 'high',
              actionUrl: '/profile',
              actionLabel: 'Configurar perfil',
            })}
            variant="outline"
          >
            <EmojiText>🎉 Notificación de Bienvenida</EmojiText>
          </Button>
        </div>

        {/* Test Notifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testNotifications.map((notification, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {notification.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(notification.type)}`}
                        >
                          {notification.type}
                        </Badge>
                        {notification.priority !== 'normal' && (
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {notification.category}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateTestNotification(notification)}
                        className="text-xs"
                      >
                        Crear
                      </Button>
                    </div>

                    {notification.actionLabel && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Acción: {notification.actionLabel}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2 flex items-center"><ModernEmoji emoji="ℹ️" size={16} className="mr-1" /> Información</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Las notificaciones aparecerán en el centro de notificaciones (campana en la navegación)</li>
            <li>• Los tipos incluyen: workout, nutrition, progress, ai_trainer, system</li>
            <li>• Las categorías incluyen: reminder, achievement, update, alert</li>
            <li>• Las prioridades incluyen: low, normal, high, urgent</li>
            <li>• Algunas notificaciones tienen acciones que redirigen a páginas específicas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
