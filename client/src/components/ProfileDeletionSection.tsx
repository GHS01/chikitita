/**
 * 🚨 Profile Deletion Section Component
 * Componente seguro para eliminación completa de perfil de usuario
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, Shield, Download } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

export function ProfileDeletionSection() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [password, setPassword] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mutation para eliminación de perfil
  const deleteProfileMutation = useMutation({
    mutationFn: async (password: string) => {
      console.log('🚨 [ProfileDeletion] Starting deletion request...');
      const response = await apiRequest('DELETE', '/api/user/profile', { password });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Perfil eliminado",
        description: `Tu perfil ha sido eliminado completamente. Adiós ${data.username}!`,
        variant: "default",
      });
      
      // Logout automático después de 2 segundos
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al eliminar perfil",
        description: error.message || "No se pudo eliminar el perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProfile = () => {
    if (!password.trim()) {
      toast({
        title: "⚠️ Contraseña requerida",
        description: "Debes ingresar tu contraseña para confirmar la eliminación.",
        variant: "destructive",
      });
      return;
    }

    if (!confirmationChecked) {
      toast({
        title: "⚠️ Confirmación requerida",
        description: "Debes confirmar que entiendes las consecuencias.",
        variant: "destructive",
      });
      return;
    }

    deleteProfileMutation.mutate(password);
  };

  const resetForm = () => {
    setPassword('');
    setConfirmationChecked(false);
    setIsDialogOpen(false);
  };

  const isFormValid = password.trim().length > 0 && confirmationChecked;

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>🚨 Zona de Peligro</span>
        </CardTitle>
        <CardDescription>
          Acciones irreversibles que afectan permanentemente tu cuenta.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Advertencia principal */}
        <Alert className="border-destructive/50 bg-destructive/10">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>⚠️ ADVERTENCIA:</strong> La eliminación del perfil es <strong>PERMANENTE</strong> y no se puede deshacer.
            Se eliminarán todos tus datos: entrenamientos, progreso, comidas, preferencias, fotos y conversaciones con el AI Trainer.
          </AlertDescription>
        </Alert>

        {/* Información de lo que se eliminará */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">📊 Datos que se eliminarán permanentemente:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• 👤 Información personal y preferencias</li>
            <li>• 💪 Historial completo de entrenamientos</li>
            <li>• 📈 Registro de progreso y medidas</li>
            <li>• 🍽️ Historial nutricional y comidas</li>
            <li>• 🤖 Conversaciones con AI Trainer</li>
            <li>• 📸 Fotos de perfil y comidas</li>
            <li>• 🏆 Logros y estadísticas</li>
            <li>• ⚙️ Configuraciones y notificaciones</li>
          </ul>
        </div>

        {/* Botón de eliminación */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setIsDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar mi perfil permanentemente
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>🚨 ¿Eliminar perfil permanentemente?</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div>
                  Esta acción <strong>NO SE PUEDE DESHACER</strong>.
                  Tu perfil y todos los datos asociados serán eliminados permanentemente de nuestros servidores.
                </div>

                <div className="space-y-4 pt-4">
                  {/* Campo de contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">
                      🔐 Confirma tu contraseña para continuar:
                    </Label>
                    <Input
                      id="delete-password"
                      type="password"
                      placeholder="Ingresa tu contraseña actual"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-destructive/30"
                    />
                  </div>

                  {/* Checkbox de confirmación */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="delete-confirmation"
                      checked={confirmationChecked}
                      onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                    />
                    <Label 
                      htmlFor="delete-confirmation" 
                      className="text-sm leading-5 cursor-pointer"
                    >
                      ✅ Entiendo que esta acción es <strong>permanente</strong> y 
                      que perderé todos mis datos de entrenamiento, progreso y configuraciones.
                    </Label>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetForm}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProfile}
                disabled={!isFormValid || deleteProfileMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteProfileMutation.isPending ? (
                  <>🔄 Eliminando...</>
                ) : (
                  <>🗑️ Sí, eliminar permanentemente</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Alternativa:</strong> Si solo quieres pausar tu cuenta temporalmente, considera desactivar las notificaciones en su lugar.</p>
          <p>📧 <strong>Soporte:</strong> Si tienes problemas, contacta al soporte antes de eliminar tu perfil.</p>
        </div>
      </CardContent>
    </Card>
  );
}
