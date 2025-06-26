/**
 * 🏥 Modal de Consentimiento Informado
 * Permite al usuario decidir cómo manejar sus limitaciones físicas
 */

import React from 'react';
import { AlertTriangle, Shield, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitations: string[];
  onConsentDecision: (decision: 'accept_risks' | 'use_alternatives' | 'consult_professional') => void;
}

// Mapeo de limitaciones a texto legible
const limitationLabels: { [key: string]: string } = {
  'knee_issues': 'Problemas de Rodilla',
  'back_problems': 'Problemas de Espalda',
  'shoulder_issues': 'Problemas de Hombro',
  'heart_condition': 'Condición Cardíaca',
  'asthma': 'Asma',
  'pregnancy': 'Embarazo',
  'wrist_problems': 'Problemas de Muñeca',
  'ankle_injury': 'Lesión de Tobillo',
  'hip_problems': 'Problemas de Cadera'
};

// Explicación de riesgos por limitación
const riskExplanations: { [key: string]: string } = {
  'knee_issues': 'Ejercicios de piernas pueden agravar problemas de rodilla',
  'back_problems': 'Movimientos de espalda y piernas pueden causar lesiones',
  'shoulder_issues': 'Ejercicios de hombros, pecho y brazos pueden ser riesgosos',
  'heart_condition': 'Ejercicios de alta intensidad pueden ser peligrosos',
  'asthma': 'Ejercicios intensos pueden desencadenar crisis asmáticas',
  'pregnancy': 'Ejercicios abdominales y de espalda pueden ser riesgosos',
  'wrist_problems': 'Ejercicios de brazos y pecho pueden agravar muñecas',
  'ankle_injury': 'Ejercicios de piernas pueden empeorar lesión de tobillo',
  'hip_problems': 'Ejercicios de piernas y glúteos pueden causar dolor'
};

export default function ConsentModal({ 
  isOpen, 
  onClose, 
  limitations, 
  onConsentDecision 
}: ConsentModalProps) {
  if (!isOpen) return null;

  const handleDecision = (decision: 'accept_risks' | 'use_alternatives' | 'consult_professional') => {
    onConsentDecision(decision);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
          </div>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            🏥 Consentimiento Informado
          </CardTitle>
          <CardDescription className="text-sm sm:text-base lg:text-lg">
            Hemos detectado limitaciones físicas en tu perfil
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Limitaciones detectadas */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-orange-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              Limitaciones Detectadas
            </h3>
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
              {limitations.map((limitation) => (
                <Badge key={limitation} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs sm:text-sm">
                  {limitationLabels[limitation] || limitation}
                </Badge>
              ))}
            </div>
            <div className="space-y-1 sm:space-y-2">
              {limitations.map((limitation) => (
                <div key={limitation} className="text-xs sm:text-sm text-orange-700">
                  • {riskExplanations[limitation] || 'Puede requerir precauciones especiales'}
                </div>
              ))}
            </div>
          </div>

          {/* Opciones de consentimiento */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
              ¿Cómo prefieres proceder?
            </h3>

            {/* Opción 1: Acepto riesgos */}
            <Card className="border-2 hover:border-red-300 transition-colors cursor-pointer"
                  onClick={() => handleDecision('accept_risks')}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base">
                      ✅ ACEPTO RIESGOS - Mostrar todos los splits
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                      Entiendo los riesgos y acepto la responsabilidad. Quiero ver todos los splits disponibles.
                    </p>
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ⚠️ Al seleccionar esta opción, aceptas que eres responsable de tu seguridad y que consultarás con un profesional si es necesario.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opción 2: No acepto riesgos */}
            <Card className="border-2 hover:border-green-300 transition-colors cursor-pointer"
                  onClick={() => handleDecision('use_alternatives')}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-2">
                      🛡️ NO ACEPTO RIESGOS - Usar splits alternativos seguros
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Prefiero entrenamientos seguros que eviten mis limitaciones físicas.
                    </p>
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✅ Se crearán splits específicos que evitan los grupos musculares problemáticos, manteniéndote activo de forma segura.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opción 3: Consultar profesional */}
            <Card className="border-2 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleDecision('consult_professional')}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      📞 CONSULTAR PROFESIONAL - Buscar asesoría médica
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Prefiero consultar con un profesional de la salud antes de continuar.
                    </p>
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Te proporcionaremos información para contactar profesionales especializados en tu área.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer legal */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
            <p className="mb-2">
              <strong>Aviso Legal:</strong> Esta aplicación no sustituye el consejo médico profesional.
              Siempre consulta con un profesional de la salud antes de comenzar cualquier programa de ejercicios,
              especialmente si tienes condiciones médicas preexistentes.
            </p>
            <p>
              Al usar esta aplicación, aceptas que eres responsable de tu propia seguridad y bienestar durante el ejercicio.
            </p>
          </div>

          {/* Botón de cerrar */}
          <div className="flex justify-center pt-3 sm:pt-4">
            <Button variant="outline" onClick={onClose} className="px-6 sm:px-8 text-sm">
              <XCircle className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
