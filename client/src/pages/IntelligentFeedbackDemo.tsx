import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, TrendingUp, Database, Zap } from 'lucide-react';

interface ConsolidatedProfile {
  id: number;
  consolidatedPreferences: any;
  confidenceScore: number;
  totalFeedbackCount: number;
  lastUpdated: string;
  dataSources: string[];
  isReliable: boolean;
  needsMoreData: boolean;
}

interface FeedbackRaw {
  id: number;
  feedbackType: string;
  rawData: any;
  context: any;
  processed: boolean;
  createdAt: string;
}

export default function IntelligentFeedbackDemo() {
  const [profile, setProfile] = useState<ConsolidatedProfile | null>(null);
  const [rawFeedback, setRawFeedback] = useState<FeedbackRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/intelligent-workouts/feedback-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else if (response.status === 404) {
        setError('No tienes perfil consolidado aún. Necesitas dar más feedback.');
      } else {
        setError('Error obteniendo perfil');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const simulateFeedback = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Simular feedback de rutina
      const feedbackData = {
        satisfactionRating: Math.floor(Math.random() * 5) + 1,
        dislikeReasons: Math.random() > 0.5 ? ['too_intense'] : [],
        todayMusclePreference: ['chest', 'arms'],
        preferredExercises: 'press de banca, flexiones',
        avoidedExercises: Math.random() > 0.7 ? 'burpees' : '',
        energyLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        availableTime: '45-60',
        userFeedback: 'Rutina de prueba para sistema inteligente',
        previousRoutineId: 1
      };

      const response = await fetch('/api/intelligent-workouts/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        // Esperar un momento para que se procese la consolidación
        setTimeout(() => {
          fetchProfile();
        }, 2000);
      } else {
        setError('Error enviando feedback');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Brain className="text-blue-500" />
          🧠 Sistema de Feedback Inteligente
        </h1>
        <p className="text-gray-600">
          Demo del sistema que aprende de tus preferencias automáticamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel de Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-yellow-500" />
              Panel de Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={fetchProfile} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" />}
              Obtener Perfil Consolidado
            </Button>
            
            <Button 
              onClick={simulateFeedback} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <TrendingUp className="mr-2" />}
              Simular Feedback (Entrenar IA)
            </Button>
          </CardContent>
        </Card>

        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
                {error}
              </div>
            )}
            
            {!error && !profile && !loading && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700">
                Haz clic en "Obtener Perfil" para ver tu inteligencia artificial
              </div>
            )}
            
            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin mr-2" />
                Procesando...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Perfil Consolidado */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="text-purple-500" />
              Tu Perfil de IA Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(profile.confidenceScore * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confianza</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.totalFeedbackCount}
                </div>
                <div className="text-sm text-gray-600">Feedbacks</div>
              </div>
              
              <div className="text-center">
                <Badge variant={profile.isReliable ? "default" : "secondary"}>
                  {profile.isReliable ? "Confiable" : "Aprendiendo"}
                </Badge>
              </div>
              
              <div className="text-center">
                <Badge variant={profile.needsMoreData ? "destructive" : "default"}>
                  {profile.needsMoreData ? "Necesita Datos" : "Suficientes Datos"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Fuentes de Datos:</h4>
              <div className="flex flex-wrap gap-2">
                {profile.dataSources.map((source, index) => (
                  <Badge key={index} variant="outline">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Preferencias Consolidadas:</h4>
              <div className="bg-gray-50 rounded p-3">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(profile.consolidatedPreferences, null, 2)}
                </pre>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Última actualización: {new Date(profile.lastUpdated).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explicación del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>🤖 ¿Cómo Funciona el Sistema?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <Database className="mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold">1. Recolección</h4>
              <p className="text-sm text-gray-600">
                Guarda todos tus feedbacks de rutinas
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded">
              <Brain className="mx-auto mb-2 text-purple-500" />
              <h4 className="font-semibold">2. Consolidación</h4>
              <p className="text-sm text-gray-600">
                Combina y analiza patrones inteligentemente
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded">
              <TrendingUp className="mx-auto mb-2 text-green-500" />
              <h4 className="font-semibold">3. Mejora</h4>
              <p className="text-sm text-gray-600">
                Genera rutinas más personalizadas
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 ¿Por qué no lo ves en la UI normal?</h4>
            <p className="text-yellow-700 text-sm">
              Este sistema trabaja <strong>invisiblemente</strong> por detrás. Cada vez que das feedback sobre una rutina, 
              la IA aprende y mejora las próximas recomendaciones. No necesitas hacer nada extra - simplemente 
              usa la app normalmente y la IA se vuelve más inteligente automáticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
