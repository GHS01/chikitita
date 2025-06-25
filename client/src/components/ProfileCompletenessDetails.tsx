/**
 * 🏷️ Profile Completeness Details Component
 * Muestra detalles específicos de qué campos faltan completar
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProfileCompletenessUI } from '@/hooks/useProfileCompleteness';

interface ProfileCompletenessDetailsProps {
  showCategories?: boolean;
  showPriorities?: boolean;
  compact?: boolean;
}

export function ProfileCompletenessDetails({ 
  showCategories = true, 
  showPriorities = true,
  compact = false 
}: ProfileCompletenessDetailsProps) {
  const {
    missingFieldsByCategory,
    categoryProgress,
    missingFieldsByPriority,
    getCategoryColor,
    getCategoryIcon,
    percentage,
    isLoading
  } = useProfileCompletenessUI();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const totalMissing = Object.values(missingFieldsByCategory).flat().length;

  // ✅ CORREGIDO: Usar el porcentaje real del backend unificado
  if (percentage >= 100) {
    return (
      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="text-2xl mb-2">🎉</div>
        <p className="text-green-800 font-semibold">¡Perfil 100% completo!</p>
        <p className="text-green-600 text-sm">Tienes toda la información necesaria para rutinas óptimas</p>
        <p className="text-green-500 text-xs mt-2">✅ Datos sincronizados con sistema unificado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 📊 Resumen General */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800 flex items-center">
            <span className="text-lg mr-2">📊</span>
            Análisis de Completitud
          </h4>
          <Badge variant="outline" className="bg-white">
            {percentage}% completo
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Te faltan <span className="font-semibold text-blue-600">{totalMissing} campos</span> para optimizar tu experiencia
        </p>
        
        {/* Progress bar general */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* 🏷️ Campos por Prioridad */}
      {showPriorities && (
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-800 flex items-center">
            <span className="text-lg mr-2">🎯</span>
            Campos por Prioridad
          </h5>
          
          {/* Prioridad Alta */}
          {missingFieldsByPriority.high.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-500 text-white">Crítico</Badge>
                <span className="text-sm text-gray-600">Requerido para rutinas básicas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingFieldsByPriority.high.map((field) => (
                  <Badge
                    key={field.key}
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors cursor-help"
                    title={field.description}
                  >
                    🚨 {field.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prioridad Media */}
          {missingFieldsByPriority.medium.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-500 text-white">Importante</Badge>
                <span className="text-sm text-gray-600">Mejora la personalización</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingFieldsByPriority.medium.map((field) => (
                  <Badge
                    key={field.key}
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 transition-colors cursor-help"
                    title={field.description}
                  >
                    ⚡ {field.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prioridad Baja */}
          {missingFieldsByPriority.low.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-500 text-white">Opcional</Badge>
                <span className="text-sm text-gray-600">Optimización avanzada</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingFieldsByPriority.low.map((field) => (
                  <Badge
                    key={field.key}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors cursor-help"
                    title={field.description}
                  >
                    💡 {field.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📂 Campos por Categoría */}
      {showCategories && (
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-800 flex items-center">
            <span className="text-lg mr-2">📂</span>
            Progreso por Categoría
          </h5>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(missingFieldsByCategory).map(([category, fields]) => {
              const progress = categoryProgress[category as keyof typeof categoryProgress];
              const categoryName = {
                basic: 'Información Básica',
                fitness: 'Datos de Fitness',
                health: 'Información de Salud',
                preferences: 'Preferencias'
              }[category];

              return (
                <Card key={category} className="border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="font-medium text-sm">{categoryName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {progress}%
                      </Badge>
                    </div>
                    
                    <Progress value={progress} className="h-2 mb-2" />
                    
                    {fields.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Faltan {fields.length} campos:</p>
                        <div className="flex flex-wrap gap-1">
                          {fields.map((field) => (
                            <Badge
                              key={field.key}
                              variant="outline"
                              className={`text-xs ${getCategoryColor(category)} cursor-help`}
                              title={field.description}
                            >
                              {field.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 💡 Tip de Acción */}
      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
        <div className="flex items-start space-x-2">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Tip para completar tu perfil:</p>
            <p className="text-xs text-amber-700 mt-1">
              {missingFieldsByPriority.high.length > 0 
                ? "Completa primero los campos críticos (rojos) para poder generar rutinas básicas."
                : missingFieldsByPriority.medium.length > 0
                ? "Agrega los campos importantes (naranjas) para rutinas más personalizadas."
                : "Completa los campos opcionales (azules) para la máxima personalización."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileCompletenessDetails;
