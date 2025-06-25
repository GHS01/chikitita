import React from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Clock, AlertCircle, Info, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationCenterProps {
  className?: string;
  isLuxuryTheme?: boolean;
}

export function NotificationCenter({ className = "", isLuxuryTheme = false }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
  } = useNotifications();

  const getNotificationIcon = (type: string, category: string) => {
    switch (type) {
      case 'workout':
        return '🏋️';
      case 'nutrition':
        return '🥗';
      case 'progress':
        return '📊';
      case 'ai_trainer':
        return '🤖';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
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

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: es 
      });
    } catch {
      return 'Hace un momento';
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        className={`relative h-12 w-12 rounded-full p-0 transition-all duration-200 shadow-sm hover:shadow-md ${
          isLuxuryTheme
            ? "hover:bg-luxury-gold/10"
            : "hover:bg-blue-50"
        } ${className}`}
      >
        <Bell className={`h-8 w-8 ${
          isLuxuryTheme ? "text-luxury-gold" : "text-blue-600"
        }`} />
        <div className={`absolute -top-1 -right-1 animate-pulse rounded-full h-4 w-4 ${
          isLuxuryTheme ? "bg-luxury-gold/30" : "bg-blue-200"
        }`} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-12 w-12 rounded-full p-0 transition-all duration-200 group shadow-sm hover:shadow-md ${
            isLuxuryTheme
              ? "hover:bg-luxury-gold/10"
              : "hover:bg-blue-50"
          } ${className}`}
        >
          <Bell className={`h-8 w-8 transition-all duration-200 ${
            unreadCount > 0
              ? isLuxuryTheme
                ? 'text-luxury-gold animate-pulse'
                : 'text-blue-600 animate-pulse'
              : isLuxuryTheme
                ? 'text-luxury-gold group-hover:text-light-gold'
                : 'text-blue-600 group-hover:text-blue-700'
          }`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold shadow-lg animate-bounce ${
                isLuxuryTheme
                  ? "bg-luxury-gold text-luxury-black"
                  : ""
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={`w-80 p-0 shadow-xl border-0 backdrop-blur-sm ${
        isLuxuryTheme
          ? "bg-luxury-charcoal/95 border border-luxury-gold/20"
          : "bg-white/95"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isLuxuryTheme
            ? "bg-gradient-to-r from-luxury-gold/10 to-luxury-gold/5 border-luxury-gold/20"
            : "bg-gradient-to-r from-primary/5 to-primary/10"
        }`}>
          <div className="flex items-center space-x-2">
            <Bell className={`h-5 w-5 ${
              isLuxuryTheme ? "text-luxury-gold" : "text-primary"
            }`} />
            <h3 className={`font-semibold ${
              isLuxuryTheme ? "text-white" : "text-foreground"
            }`}>Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className={`text-xs ${
                isLuxuryTheme
                  ? "bg-luxury-gold/20 text-luxury-gold border-luxury-gold/30"
                  : ""
              }`}>
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingAllAsRead}
                className={`text-xs ${
                  isLuxuryTheme
                    ? "hover:bg-luxury-gold/10 text-white hover:text-luxury-gold"
                    : "hover:bg-primary/10"
                }`}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-sm font-medium mb-1">Todo al día</p>
              <p className="text-xs">No tienes notificaciones pendientes</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                        {notification.icon || getNotificationIcon(notification.type, notification.category)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.priority !== 'normal' && (
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              disabled={isMarkingAsRead}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            disabled={isDeleting}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Button */}
                      {notification.actionUrl && notification.actionLabel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => {
                            // Handle navigation to actionUrl
                            window.location.href = notification.actionUrl;
                          }}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gradient-to-r from-primary/5 to-primary/10">
            <Button
              variant="ghost"
              className="w-full text-xs hover:bg-primary/10 transition-colors"
              size="sm"
            >
              <Bell className="h-3 w-3 mr-2" />
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
