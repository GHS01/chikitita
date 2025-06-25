import React from 'react';
import { NotificationTestPanel } from '@/components/NotificationTestPanel';

export default function NotificationTest() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prueba de Notificaciones</h1>
        <p className="text-muted-foreground">
          Utiliza este panel para probar el sistema de notificaciones de Fitbro.
        </p>
      </div>
      
      <NotificationTestPanel />
    </div>
  );
}
