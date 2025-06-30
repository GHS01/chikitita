import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { User, UserCheck, Users, Target, Flame, Brain, Dumbbell, Heart, Crosshair, Sparkles, Lightbulb, Info } from 'lucide-react';

interface TrainerSetupProps {
  onConfigured: () => void;
}

// 🎨 COMPONENTE: Checkbox Dorado Elegante (Para Estilo de Interacción y Personalidad)
interface GoldCheckboxProps {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  className?: string;
}

const GoldCheckbox = ({ checked, onChange, children, className = '' }: GoldCheckboxProps) => (
  <div
    onClick={onChange}
    className={`
      relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300
      hover:shadow-lg hover:scale-[1.02] transform
      ${checked
        ? 'border-luxury-gold bg-gradient-to-br from-luxury-gold/10 to-luxury-gold/20 shadow-lg shadow-luxury-gold/20'
        : 'border-luxury-gold/30 hover:border-luxury-gold/50 bg-luxury-black/20 hover:bg-luxury-black/30'
      }
      ${className}
    `}
  >
    {/* Checkmark Elegante */}
    <div className={`
      absolute top-2 right-2 w-6 h-6 rounded-full border-2 transition-all duration-300
      flex items-center justify-center
      ${checked
        ? 'border-luxury-gold bg-luxury-gold text-luxury-black shadow-md'
        : 'border-luxury-gold/40 bg-transparent'
      }
    `}>
      {checked && <Check className="w-4 h-4 font-bold" />}
    </div>

    {/* Contenido */}
    <div className="pr-8">
      {children}
    </div>
  </div>
);

// 🎨 COMPONENTE: Botón Simple Sin Checkmarks (Para Género)
interface SimpleGoldButtonProps {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  className?: string;
}

const SimpleGoldButton = ({ checked, onChange, children, className = '' }: SimpleGoldButtonProps) => (
  <div
    onClick={onChange}
    className={`
      cursor-pointer rounded-xl border-2 p-4 transition-all duration-300
      hover:shadow-lg hover:scale-[1.02] transform
      ${checked
        ? 'border-luxury-gold bg-gradient-to-br from-luxury-gold/10 to-luxury-gold/20 shadow-lg shadow-luxury-gold/20'
        : 'border-luxury-gold/30 hover:border-luxury-gold/50 bg-luxury-black/20 hover:bg-luxury-black/30'
      }
      ${className}
    `}
  >
    {children}
  </div>
);

interface ToneOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const toneOptions: ToneOption[] = [
  {
    value: 'motivational',
    label: 'Motivacional',
    description: '¡Vamos a romperla!',
    icon: '🎯',
    color: 'border-orange-200 bg-orange-50'
  },
  {
    value: 'friendly',
    label: 'Amigable',
    description: 'Como tu mejor amigo fitness',
    icon: '🤝',
    color: 'border-blue-200 bg-blue-50'
  },
  {
    value: 'strict',
    label: 'Estricto',
    description: 'Disciplina y resultados',
    icon: '⚖️',
    color: 'border-slate-200 bg-slate-50'
  },
  {
    value: 'loving',
    label: 'Amoroso',
    description: 'Apoyo incondicional',
    icon: '🤗',
    color: 'border-emerald-200 bg-emerald-50'
  },
  {
    value: 'partner',
    label: 'Pareja',
    description: 'Conexión íntima y cercana',
    icon: '❤️',
    color: 'border-cyan-200 bg-cyan-50'
  }
];

// Personalidades predefinidas para el entrenador
const personalityOptions = [
  {
    value: 'default',
    name: 'Entrenador Clásico',
    description: 'Profesional y equilibrado',
    icon: 'Target',
    traits: 'Motivador, profesional, enfocado en resultados',
    phrases: ['¡Excelente trabajo!', 'Sigamos con el plan', 'Cada día más fuerte']
  },
  {
    value: 'motivator',
    name: 'El Motivador Imparable',
    description: 'Energía pura y motivación extrema',
    icon: 'Flame',
    traits: 'Energético, entusiasta, nunca se rinde',
    phrases: ['¡VAMOS QUE PODEMOS!', '¡TÚ ERES IMPARABLE!', '¡ROMPE TUS LÍMITES!']
  },
  {
    value: 'sensei',
    name: 'El Sensei Sabio',
    description: 'Calma, sabiduría y paciencia',
    icon: 'Brain',
    traits: 'Paciente, sabio, filosófico',
    phrases: ['La constancia es la clave', 'Cada paso cuenta', 'El cuerpo sigue a la mente']
  },
  {
    value: 'warrior',
    name: 'El Guerrero Espartano',
    description: 'Disciplina férrea y determinación',
    icon: 'Dumbbell',
    traits: 'Disciplinado, exigente, determinado',
    phrases: ['¡Sin excusas!', 'La disciplina es libertad', '¡Forja tu destino!']
  },
  {
    value: 'empathetic',
    name: 'El Coach Empático',
    description: 'Apoyo emocional y comprensión',
    icon: 'Heart',
    traits: 'Comprensivo, empático, motivador suave',
    phrases: ['Estoy aquí para apoyarte', 'Cada progreso es valioso', 'Cree en ti mismo']
  },
  {
    value: 'strategist',
    name: 'El Estratega Militar',
    description: 'Precisión, táctica y planificación',
    icon: 'Crosshair',
    traits: 'Estratégico, preciso, planificador',
    phrases: ['Ejecutemos el plan', 'Precisión en cada movimiento', 'Misión cumplida']
  }
];

// 🚀 FUNCIÓN DE COMPRESIÓN DE IMAGEN
const compressAndConvertImage = (file: File, callback: (base64: string) => void) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    // 🎯 REDIMENSIONAR: Máximo 300x300 para avatares
    const maxSize = 300;
    let { width, height } = img;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // 🎨 DIBUJAR Y COMPRIMIR
    ctx?.drawImage(img, 0, 0, width, height);

    // 📦 CONVERTIR A BASE64 CON COMPRESIÓN (calidad 0.7)
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
    callback(compressedBase64);
  };

  // 📖 LEER ARCHIVO
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

export default function TrainerSetup({ onConfigured }: TrainerSetupProps) {
  const [formData, setFormData] = useState({
    trainerName: '',
    trainerGender: '',
    interactionTone: '',
    userGender: '',
    trainerAvatar: '',
    personalityType: 'default',
    customPersonality: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 🎯 REFS PARA AUTO-SCROLL
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // 🚀 FUNCIÓN AUTO-SCROLL INTELIGENTE
  const scrollToFirstError = useCallback((errorFields: string[]) => {
    if (errorFields.length === 0) return;

    const firstErrorField = errorFields[0];
    const fieldElement = fieldRefs.current[firstErrorField];

    if (fieldElement) {
      // 🎯 SCROLL SUAVE AL PRIMER ERROR
      fieldElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      // 🎪 HIGHLIGHT VISUAL CON ANIMACIÓN
      fieldElement.classList.add('animate-pulse', 'ring-2', 'ring-red-400', 'ring-opacity-75');

      // 🕐 REMOVER HIGHLIGHT DESPUÉS DE 3 SEGUNDOS
      setTimeout(() => {
        fieldElement.classList.remove('animate-pulse', 'ring-2', 'ring-red-400', 'ring-opacity-75');
      }, 3000);

      console.log(`🎯 [AutoScroll] Scrolled to field: ${firstErrorField}`);
    }
  }, []);

  // 🎭 FUNCIÓN PARA REGISTRAR REFS
  const setFieldRef = useCallback((fieldName: string) => (el: HTMLDivElement | null) => {
    fieldRefs.current[fieldName] = el;
  }, []);

  const configureTrainerMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('📡 [TrainerSetup] Sending API request with data:', data);
      const response = await apiRequest('POST', '/api/trainer/configure', data);
      const result = await response.json();
      console.log('📡 [TrainerSetup] API response received:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ [TrainerSetup] Configuration successful:', data);
      toast({
        title: t('aiTrainer.trainerConfigured'),
        description: t('aiTrainer.trainerReady'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/config'] });
      console.log('🔄 [TrainerSetup] Calling onConfigured callback...');
      onConfigured();
    },
    onError: (error: any) => {
      console.error('❌ [TrainerSetup] Configuration failed:', error);
      toast({
        title: t('aiTrainer.configurationError'),
        description: error.message || t('aiTrainer.configurationProblem'),
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trainerName.trim()) {
      newErrors.trainerName = t('aiTrainer.trainerNameRequired');
    }
    if (!formData.trainerGender) {
      newErrors.trainerGender = t('aiTrainer.selectTrainerGender');
    }

    // 🎯 VALIDACIÓN CONDICIONAL: Solo validar interactionTone si personalityType es 'custom'
    if (formData.personalityType === 'custom' && !formData.interactionTone) {
      newErrors.interactionTone = t('aiTrainer.selectInteractionStyle');
    }

    if (!formData.userGender) {
      newErrors.userGender = t('aiTrainer.selectYourGender');
    }

    // 🎭 VALIDACIÓN MEJORADA: Personalidad custom requiere descripción Y estilo
    if (formData.personalityType === 'custom') {
      if (!formData.customPersonality.trim()) {
        newErrors.customPersonality = 'Describe la personalidad de tu entrenador personalizado';
      }
      if (!formData.interactionTone) {
        newErrors.interactionTone = 'Selecciona un estilo de interacción para tu personalidad custom';
      }
    }

    setErrors(newErrors);

    // 🚀 AUTO-SCROLL AL PRIMER ERROR
    const errorFields = Object.keys(newErrors);
    if (errorFields.length > 0) {
      // 🎪 PEQUEÑO DELAY PARA QUE SE ACTUALICE EL DOM
      setTimeout(() => {
        scrollToFirstError(errorFields);
      }, 100);
    }

    return errorFields.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [TrainerSetup] Form submitted with data:', formData);

    if (!validateForm()) {
      console.log('❌ [TrainerSetup] Form validation failed');

      // 🎯 TOAST INFORMATIVO SOBRE AUTO-SCROLL
      toast({
        title: "Campos requeridos",
        description: "Te hemos llevado al primer campo que necesita completarse",
        variant: "destructive",
      });

      return;
    }

    console.log('✅ [TrainerSetup] Form validation passed, sending to API...');
    configureTrainerMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 🎭 NUEVA LÓGICA: Manejo especial para personalityType
  const handlePersonalityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      personalityType: value,
      // 🎯 LÓGICA CONDICIONAL: Limpiar interactionTone si no es custom
      interactionTone: value === 'custom' ? prev.interactionTone : ''
    }));

    // Limpiar errores relacionados
    if (errors.personalityType) {
      setErrors(prev => ({ ...prev, personalityType: '' }));
    }
    if (value !== 'custom' && errors.interactionTone) {
      setErrors(prev => ({ ...prev, interactionTone: '' }));
    }
  };

  // 🎪 DETERMINAR SI MOSTRAR ESTILO DE INTERACCIÓN
  const showInteractionStyle = formData.personalityType === 'custom';

  // 🚫 BLOQUEAR SCROLL DE LA PÁGINA COMPLETA EN TODOS LOS DISPOSITIVOS (ANDROID, TABLETS, ETC.)
  useEffect(() => {
    // Ocultar scroll en TODOS los dispositivos (móvil, tablet, desktop)
    document.body.style.overflow = 'hidden';

    // También aplicar a html para mayor compatibilidad
    document.documentElement.style.overflow = 'hidden';

    // Cleanup: Restaurar scroll al desmontar
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center pt-16 pb-4 md:pt-20 md:pb-6">
      <Card className="w-full max-w-2xl h-full flex flex-col border border-luxury-gold/40 shadow-2xl bg-luxury-charcoal/95 backdrop-blur-sm overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-luxury-gold/30 shadow-luxury-gold/20">
        {/* Header Luxury - RESPONSIVE MÓVIL MEJORADO */}
        <CardHeader className="relative text-center bg-gradient-to-r from-luxury-gold to-light-gold backdrop-blur-sm border-b border-luxury-gold/20 py-6 sm:py-8 -mx-6 -mt-6 mb-0 rounded-t-2xl sm:rounded-t-3xl shadow-lg">
          {/* Overlay que cubre TODO el header - SIN COMPONENTES BLANCOS PARA MÓVILES */}
          <div className="absolute inset-0 bg-gradient-to-r from-luxury-black/10 via-transparent to-luxury-black/5 rounded-t-2xl sm:rounded-t-3xl"></div>
          <div className="relative px-2 sm:px-4 md:px-6">
            <CardTitle className="relative text-xl sm:text-2xl md:text-3xl font-black text-luxury-black bg-clip-text flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-2 drop-shadow-sm">
              {/* Icono Responsivo */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-luxury-black/20 rounded-xl sm:rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-luxury-black/20 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-luxury-black/30 shadow-xl">
                  {/* Icono pequeño para móvil */}
                  <div className="block sm:hidden">
                    <ModernEmoji emoji="🧬" size={20} luxury={true} className="filter-none" />
                  </div>
                  {/* Icono mediano para tablet */}
                  <div className="hidden sm:block md:hidden">
                    <ModernEmoji emoji="🧬" size={26} luxury={true} className="filter-none" />
                  </div>
                  {/* Icono grande para desktop */}
                  <div className="hidden md:block">
                    <ModernEmoji emoji="🧬" size={32} luxury={true} className="filter-none" />
                  </div>
                </div>
              </div>

              {/* Texto Responsivo */}
              <div className="text-center sm:text-left min-w-0">
                {/* Texto pequeño para móvil */}
                <div className="block sm:hidden">
                  <EmojiText size={18} luxury={true} className="leading-tight">{t('aiTrainer.setupTitle')}</EmojiText>
                </div>
                {/* Texto mediano para tablet */}
                <div className="hidden sm:block md:hidden">
                  <EmojiText size={22} luxury={true} className="leading-tight">{t('aiTrainer.setupTitle')}</EmojiText>
                </div>
                {/* Texto grande para desktop */}
                <div className="hidden md:block">
                  <EmojiText size={28} luxury={true} className="leading-tight">{t('aiTrainer.setupTitle')}</EmojiText>
                </div>
              </div>
            </CardTitle>
            <CardDescription className="relative text-sm sm:text-base md:text-lg text-luxury-black/80 font-semibold px-1 sm:px-2 md:px-0 text-center leading-tight">
              {t('aiTrainer.setupSubtitle')}
            </CardDescription>
          </div>
        </CardHeader>

        {/* Contenido Luxury - CON SCROLL INTERNO COMO EL CHAT */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-full p-4 sm:p-8 pt-6 sm:pt-8 bg-luxury-black/60 text-white overflow-y-auto" style={{
            scrollbarWidth: '8px',
          }}>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {/* Nombre del Entrenador - Luxury */}
            <div ref={setFieldRef('trainerName')} className="space-y-3">
              <Label htmlFor="trainerName" className="text-base font-semibold text-luxury-gold flex items-center gap-2">
                <div className="w-2 h-2 bg-luxury-gold rounded-full"></div>
                {t('aiTrainer.trainerName')}
              </Label>
              <Input
                id="trainerName"
                placeholder={t('aiTrainer.trainerNamePlaceholder')}
                value={formData.trainerName}
                onChange={(e) => handleInputChange('trainerName', e.target.value)}
                className={`rounded-xl border-luxury-gold/20 focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all duration-300 bg-luxury-black/40 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg py-3 text-white placeholder:text-white/60 ${
                  errors.trainerName ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''
                }`}
              />
              {errors.trainerName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.trainerName}
                </p>
              )}
            </div>

            {/* Género del Entrenador - ESTILO SIMPLE SIN CHECKMARKS */}
            <div ref={setFieldRef('trainerGender')} className="space-y-4">
              <Label className="text-base font-semibold text-luxury-gold flex items-center gap-2">
                <div className="w-2 h-2 bg-luxury-gold rounded-full"></div>
                {t('aiTrainer.trainerGender')}
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <SimpleGoldButton
                  checked={formData.trainerGender === 'male'}
                  onChange={() => handleInputChange('trainerGender', 'male')}
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-7 h-7 text-blue-400" />
                    <div className="flex-1">
                      <EmojiText className="font-medium text-white" luxury={true}>{t('aiTrainer.masculine')}</EmojiText>
                    </div>
                  </div>
                </SimpleGoldButton>

                <SimpleGoldButton
                  checked={formData.trainerGender === 'female'}
                  onChange={() => handleInputChange('trainerGender', 'female')}
                >
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-7 h-7 text-pink-400" />
                    <div className="flex-1">
                      <EmojiText className="font-medium text-white" luxury={true}>{t('aiTrainer.feminine')}</EmojiText>
                    </div>
                  </div>
                </SimpleGoldButton>
              </div>
              {errors.trainerGender && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.trainerGender}
                </p>
              )}
            </div>

            {/* Tu Género - ESTILO SIMPLE SIN CHECKMARKS */}
            <div ref={setFieldRef('userGender')} className="space-y-4">
              <Label className="text-base font-semibold text-luxury-gold flex items-center gap-2">
                <div className="w-2 h-2 bg-luxury-gold rounded-full"></div>
                {t('aiTrainer.yourGender')}
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <SimpleGoldButton
                  checked={formData.userGender === 'male'}
                  onChange={() => handleInputChange('userGender', 'male')}
                  className="p-3"
                >
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <User className="w-8 h-8 text-blue-400" />
                    <EmojiText className="font-medium text-sm text-white" luxury={true}>Masculino</EmojiText>
                  </div>
                </SimpleGoldButton>

                <SimpleGoldButton
                  checked={formData.userGender === 'female'}
                  onChange={() => handleInputChange('userGender', 'female')}
                  className="p-3"
                >
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <UserCheck className="w-8 h-8 text-pink-400" />
                    <EmojiText className="font-medium text-sm text-white" luxury={true}>Femenino</EmojiText>
                  </div>
                </SimpleGoldButton>

                <SimpleGoldButton
                  checked={formData.userGender === 'other'}
                  onChange={() => handleInputChange('userGender', 'other')}
                  className="p-3"
                >
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <Users className="w-8 h-8 text-purple-400" />
                    <EmojiText className="font-medium text-sm text-white" luxury={true}>Otro</EmojiText>
                  </div>
                </SimpleGoldButton>
              </div>
              {errors.userGender && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.userGender}
                </p>
              )}
            </div>

            {/* Estilo de Interacción - Condicional con Transición - Luxury */}
            {showInteractionStyle && (
              <div ref={setFieldRef('interactionTone')} className="space-y-5 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                <Label className="text-base font-semibold text-luxury-gold flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-luxury-gold to-light-gold rounded-full"></div>
                  {t('aiTrainer.interactionStyle')}
                  <span className="text-sm text-light-gold font-medium bg-luxury-gold/20 px-2 py-1 rounded-full border border-luxury-gold/30 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Para Personalidad Custom</span>
                  </span>
                </Label>
                <div className="text-sm text-luxury-gold/80 bg-luxury-gold/20 p-3 rounded-lg border border-luxury-gold/30 backdrop-blur-sm flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span><strong className="text-luxury-gold">Tip:</strong> Selecciona un estilo base que se combinará con tu descripción personalizada</span>
                </div>
              <div className="grid gap-4">
                {toneOptions.map((option) => (
                  <GoldCheckbox
                    key={option.value}
                    checked={formData.interactionTone === option.value}
                    onChange={() => handleInputChange('interactionTone', option.value)}
                    className="p-5"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        formData.interactionTone === option.value
                          ? 'bg-luxury-gold/20 shadow-md border border-luxury-gold/30'
                          : 'bg-luxury-black/40 border border-luxury-gold/20'
                      } transition-all duration-300`}>
                        <ModernEmoji emoji={option.icon} size={28} luxury={true} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-luxury-gold mb-1">
                          <EmojiText luxury={true}>{option.label}</EmojiText>
                        </div>
                        <div className="text-sm text-white/80 font-medium">
                          <EmojiText size={14} luxury={true}>{option.description}</EmojiText>
                        </div>
                      </div>
                    </div>
                  </GoldCheckbox>
                ))}
              </div>
                {errors.interactionTone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.interactionTone}
                  </p>
                )}
              </div>
            )}

            {/* Mensaje Informativo para Personalidades Predefinidas - Luxury */}
            {!showInteractionStyle && formData.personalityType !== 'default' && (
              <div className="bg-luxury-gold/20 border border-luxury-gold/40 rounded-lg p-4 animate-in fade-in-50 duration-300 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="text-luxury-gold text-lg">
                    <Info className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-luxury-gold font-medium">
                      Personalidad completa seleccionada
                    </p>
                    <p className="text-xs text-luxury-gold/80 mt-1">
                      Esta personalidad incluye su propio estilo de interacción. No necesitas seleccionar uno adicional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ajustes Avanzados - Luxury */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold text-luxury-gold flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  Ajustes Avanzados
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-luxury-gold hover:text-light-gold hover:bg-luxury-gold/10"
                >
                  {showAdvanced ? 'Ocultar' : 'Mostrar'}
                  <span className={`ml-1 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-6 p-6 bg-luxury-black/40 rounded-2xl border border-luxury-gold/30 backdrop-blur-sm">

                  {/* Avatar del Entrenador - Luxury Professional */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-luxury-gold flex items-center gap-2">
                      <span className="text-base">📸</span>
                      Avatar del Entrenador
                    </Label>

                    {/* Contenedor Principal del Avatar */}
                    <div className="bg-luxury-black/60 rounded-2xl p-6 border border-luxury-gold/30 backdrop-blur-sm">
                      <div className="flex flex-col items-center space-y-4">

                        {/* Preview del Avatar */}
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-luxury-gold/50 shadow-lg shadow-luxury-gold/20 bg-luxury-black/80">
                            {formData.trainerAvatar ? (
                              <img
                                src={formData.trainerAvatar}
                                alt="Avatar del entrenador"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-luxury-gold/60">
                                <User className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          {/* Overlay de Hover */}
                          <div className="absolute inset-0 rounded-full bg-luxury-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <span className="text-luxury-gold text-sm font-medium">Cambiar</span>
                          </div>
                        </div>

                        {/* Botón Neumorphism Luxury */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // 🚀 COMPRESIÓN DE IMAGEN ANTES DE ENVÍO
                                compressAndConvertImage(file, (compressedBase64) => {
                                  handleInputChange('trainerAvatar', compressedBase64);
                                });
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            className="px-5 py-2.5 bg-luxury-black/80 text-luxury-gold text-sm font-medium rounded-lg border border-luxury-gold/30 shadow-[inset_0_1px_0_0_rgba(212,175,55,0.1),0_1px_3px_0_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(212,175,55,0.2),0_2px_6px_0_rgba(212,175,55,0.15)] hover:border-luxury-gold/50 hover:bg-luxury-black/90 transition-all duration-300 active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.3)] active:translate-y-[1px]"
                          >
                            Subir imagen
                          </button>
                        </div>

                        {/* Información */}
                        <p className="text-xs text-luxury-gold/60 text-center max-w-xs">
                          Sube una imagen para personalizar tu entrenador IA. Formatos: JPG, PNG. Máximo 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personalidad del Entrenador */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-luxury-gold flex items-center gap-2">
                      <ModernEmoji emoji="🎭" size={16} luxury={true} />
                      Personalidad del Entrenador
                    </Label>

                    <div className="grid gap-3">
                      {personalityOptions.map((personality) => (
                        <GoldCheckbox
                          key={personality.value}
                          checked={formData.personalityType === personality.value}
                          onChange={() => handlePersonalityChange(personality.value)}
                          className="p-4"
                        >
                          <div className="flex items-start space-x-3">
                            {personality.icon === 'Target' && <Target className="w-6 h-6 text-luxury-gold" />}
                            {personality.icon === 'Flame' && <Flame className="w-6 h-6 text-orange-400" />}
                            {personality.icon === 'Brain' && <Brain className="w-6 h-6 text-blue-400" />}
                            {personality.icon === 'Dumbbell' && <Dumbbell className="w-6 h-6 text-gray-400" />}
                            {personality.icon === 'Heart' && <Heart className="w-6 h-6 text-pink-400" />}
                            {personality.icon === 'Crosshair' && <Crosshair className="w-6 h-6 text-green-400" />}
                            <div className="flex-1">
                              <div className="font-bold text-luxury-gold mb-1">
                                {personality.name}
                              </div>
                              <div className="text-sm text-white/80 mb-2">
                                {personality.description}
                              </div>
                              <div className="text-xs text-luxury-gold/70 mb-2">
                                <strong>Características:</strong> {personality.traits}
                              </div>
                              <div className="text-xs text-light-gold">
                                <strong>Frases típicas:</strong> "{personality.phrases[0]}", "{personality.phrases[1]}"
                              </div>
                            </div>
                          </div>
                        </GoldCheckbox>
                      ))}

                      {/* Personalidad Custom */}
                      <GoldCheckbox
                        checked={formData.personalityType === 'custom'}
                        onChange={() => handlePersonalityChange('custom')}
                        className="p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <Sparkles className="w-6 h-6 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-bold text-luxury-gold mb-1">
                              Personalidad Personalizada
                            </div>
                            <div className="text-sm text-white/80 mb-2">
                              Crea tu propio entrenador único
                            </div>
                            <div className="text-xs text-luxury-gold/70">
                              <strong>Ejemplos:</strong> Arnold, Rocky, Goku, Bulma, Vegeta, Wonder Woman, Captain America
                            </div>
                          </div>
                        </div>
                      </GoldCheckbox>
                    </div>

                    {/* Input para personalidad custom */}
                    {formData.personalityType === 'custom' && (
                      <div ref={setFieldRef('customPersonality')} className="mt-4 space-y-2">
                        <Label className="text-sm font-medium text-luxury-gold">
                          Describe la personalidad de tu entrenador
                        </Label>
                        <textarea
                          value={formData.customPersonality}
                          onChange={(e) => handleInputChange('customPersonality', e.target.value)}
                          placeholder="Ej: Mi entrenador es como Goku, siempre motivado, usa frases como '¡Vamos!' y '¡Podemos ser más fuertes!', nunca se rinde y celebra cada logro..."
                          className="w-full p-3 border border-luxury-gold/30 bg-luxury-black/40 text-white placeholder-luxury-gold/60 rounded-lg resize-none h-24 text-sm focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                        />
                        <p className="text-xs text-luxury-gold/60">
                          Describe cómo quieres que se comporte, qué frases use, su personalidad, etc.
                        </p>
                        {errors.customPersonality && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {errors.customPersonality}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Configurar - Luxury */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-luxury-gold to-light-gold hover:from-luxury-gold/90 hover:to-light-gold/90 text-luxury-black shadow-xl hover:shadow-2xl shadow-luxury-gold/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl border-0"
                disabled={configureTrainerMutation.isPending}
              >
                {configureTrainerMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-luxury-black" />
                    <span className="text-luxury-black font-bold">{t('aiTrainer.configuring')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-luxury-black" />
                    <EmojiText className="text-luxury-black font-bold" luxury={true}>{t('aiTrainer.configureTrainer')}</EmojiText>
                  </div>
                )}
              </Button>
            </div>
          </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
