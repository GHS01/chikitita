import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import type { ChatMessage, TrainerConfig } from '@shared/schema';
import ChatTypingIndicator from './ChatTypingIndicator';
import TrainerSuggestions from './TrainerSuggestions';
import { ModernEmoji, EmojiText } from '@/components/ui/modern-emoji';
import { useProfilePhoto } from '@/contexts/ProfilePhotoContext';
import { useAuth } from '@/hooks/use-auth';
// 🕐 SISTEMA HORARIO CENTRALIZADO
import { formatChatTime } from '@/utils/timeFormatters';

// 📝 FORMATEADOR PROFESIONAL DE MENSAJES DEL ENTRENADOR
function formatTrainerMessage(message: string, isFromAI: boolean = true): string {
  let formattedMessage = message;

  // 1. TÍTULOS NUMERADOS (1. Título, 2. Título, etc.)
  formattedMessage = formattedMessage.replace(
    /^(\d+)\.\s*([^\n]+)$/gm,
    '<div style="margin: 20px 0 12px 0; font-weight: bold; font-size: 16px; color: #FFFFFF;">$1. $2</div>'
  );

  // 2. SUBTÍTULOS EN NEGRITA (Ingredientes:, Preparación:, etc.)
  formattedMessage = formattedMessage.replace(
    /^([A-Za-zÁ-ÿ\s]+):\s*$/gm,
    '<div style="margin: 16px 0 8px 0; font-weight: bold; color: #D4AF37;">$1:</div>'
  );

  // 3. LISTAS CON VIÑETAS (* texto o - texto)
  formattedMessage = formattedMessage.replace(
    /^\s*[\*\-]\s+(.+)$/gm,
    '<div style="margin: 6px 0; padding-left: 20px; position: relative; line-height: 1.5;"><span style="position: absolute; left: 8px; color: #D4AF37; font-weight: bold;">•</span>$1</div>'
  );

  // 4. LISTAS NUMERADAS DENTRO DE SECCIONES (1. texto, 2. texto)
  formattedMessage = formattedMessage.replace(
    /^\s*(\d+)\.\s+([^:]+):\s*(.+)$/gm,
    '<div style="margin: 8px 0; padding-left: 24px; position: relative; line-height: 1.6;"><span style="position: absolute; left: 0; color: #D4AF37; font-weight: bold;">$1.</span><strong style="color: #FFFFFF;">$2:</strong> $3</div>'
  );

  // 5. LISTAS NUMERADAS SIMPLES (1. texto)
  formattedMessage = formattedMessage.replace(
    /^\s*(\d+)\.\s+(.+)$/gm,
    '<div style="margin: 8px 0; padding-left: 24px; position: relative; line-height: 1.6;"><span style="position: absolute; left: 0; color: #D4AF37; font-weight: bold;">$1.</span>$2</div>'
  );

  // 6. TEXTO EN NEGRITA (**texto**)
  formattedMessage = formattedMessage.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong style="color: #D4AF37; font-weight: bold;">$1</strong>'
  );

  // 7. PÁRRAFOS SEPARADOS (doble salto de línea)
  formattedMessage = formattedMessage.replace(
    /\n\n/g,
    '<div style="margin: 16px 0;"></div>'
  );

  // 8. SALTOS DE LÍNEA SIMPLES
  formattedMessage = formattedMessage.replace(
    /\n/g,
    '<br>'
  );

  // 9. SECCIONES SEPARADAS (líneas separadoras visuales)
  formattedMessage = formattedMessage.replace(
    /(Descripción:|Preparación \(Paso a paso\):|Ingredientes:)/g,
    '<div style="margin: 20px 0 4px 0; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 12px;"></div><div style="margin: 0 0 8px 0; font-weight: bold; color: #D4AF37;">$1</div>'
  );

  // Color diferente según el tipo de mensaje
  const textColor = isFromAI ? '#FFFFFF' : 'inherit';
  return `<div style="line-height: 1.6; color: ${textColor};">${formattedMessage}</div>`;
}

interface AITrainerChatProps {
  trainerConfig: TrainerConfig;
}

export default function AITrainerChat({ trainerConfig }: AITrainerChatProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 📸 Hook para obtener la foto de perfil del usuario
  const { photoUrl: userPhotoUrl } = useProfilePhoto();

  // 👤 Hook para obtener información del usuario
  const { user } = useAuth();

  // Fetch chat messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/trainer/messages'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest('POST', '/api/trainer/chat', { message: messageText });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setMessage('');
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/messages'] });

      // Update suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Error al enviar mensaje",
        description: error.message || "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    },
  });

  // OCULTAR SCROLL DE LA PÁGINA COMPLETA EN TODOS LOS DISPOSITIVOS
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // El entrenador saluda automáticamente desde el backend
  // No necesitamos enviar mensaje inicial del usuario

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(message);
  };

  const getToneColor = (tone: string) => {
    const colors = {
      motivational: 'bg-red-500',
      friendly: 'bg-blue-500',
      strict: 'bg-yellow-500',
      loving: 'bg-pink-500',
      partner: 'bg-purple-500'
    };
    return colors[tone as keyof typeof colors] || 'bg-gray-500';
  };

  const getToneEmoji = (tone: string) => {
    const emojis = {
      motivational: '🎯',
      friendly: '🤝',
      strict: '⚖️',
      loving: '🤗',
      partner: '❤️'
    };
    return emojis[tone as keyof typeof emojis] || '🤖';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pt-16 pb-2 md:pt-20 md:pb-4 lg:pb-5 px-4">
      <Card className="w-full max-w-5xl h-full flex flex-col shadow-2xl border border-luxury-gold/40 bg-luxury-charcoal/95 backdrop-blur-sm overflow-hidden rounded-2xl ring-1 ring-luxury-gold/30 shadow-luxury-gold/20">
        {/* Chat Header - Diseño Luxury Dorado */}
        <CardHeader className="border-b border-luxury-gold/20 bg-gradient-to-r from-luxury-gold to-light-gold py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Foto del AI Trainer */}
              <div className="relative">
                {trainerConfig.trainerAvatar ? (
                  <img
                    src={trainerConfig.trainerAvatar}
                    alt="AI Trainer"
                    className="w-12 h-12 rounded-full border-3 border-luxury-gold/60 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-3 border-luxury-gold/60 shadow-lg bg-gradient-to-br from-luxury-gold to-light-gold flex items-center justify-center">
                    <Bot className="w-6 h-6 text-luxury-black" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-luxury-gold"></div>
              </div>

              {/* Información del trainer luxury */}
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-luxury-black leading-tight drop-shadow-sm">
                  {trainerConfig.trainerName}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-luxury-black/70">Tu entrenador personal</span>
                </div>
              </div>
            </div>

            {/* Estado en línea luxury */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-black/20 rounded-full px-3 py-1.5">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-emerald-300 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-xs font-bold text-black">En línea</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area - COLORES EXACTOS FITBRO-LANDING - CON SCROLL INTERNO */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-full p-6 space-y-6 overflow-y-auto" style={{
            scrollbarWidth: '8px',
          }}>
              {messages.map((msg: ChatMessage) => (
                <div key={msg.id} className={`flex ${msg.isFromAI ? 'justify-start' : 'justify-end'} items-start gap-3`}>
                  {/* Avatar del AI Trainer */}
                  {msg.isFromAI && (
                    <div className="flex-shrink-0">
                      {trainerConfig.trainerAvatar ? (
                        <img
                          src={trainerConfig.trainerAvatar}
                          alt="AI Trainer"
                          className="w-10 h-10 rounded-full border-2 border-luxury-gold/50 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-luxury-gold/50 bg-gradient-to-br from-luxury-gold to-light-gold flex items-center justify-center">
                          <Bot className="w-5 h-5 text-luxury-black" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-md ${
                    msg.isFromAI
                      ? 'bg-luxury-black/60 text-white border border-luxury-gold/20 shadow-luxury-black/50'
                      : 'bg-luxury-gold text-black font-semibold shadow-luxury-gold/30'
                  }`}>
                    <div
                      className="text-sm leading-relaxed formatted-message"
                      style={{
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: formatTrainerMessage(msg.message, msg.isFromAI)
                      }}
                    />
                  </div>

                  {/* Avatar del Usuario */}
                  {!msg.isFromAI && (
                    <div className="flex-shrink-0">
                      {userPhotoUrl ? (
                        <img
                          src={userPhotoUrl}
                          alt="Usuario"
                          className="w-10 h-10 rounded-full border-2 border-luxury-gold/50 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-luxury-gold/50 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator - EXACTO COMO FITBRO-LANDING */}
              {isTyping && (
                <div className="flex justify-start items-start gap-3">
                  {/* Avatar del AI Trainer para typing */}
                  <div className="flex-shrink-0">
                    {trainerConfig.trainerAvatar ? (
                      <img
                        src={trainerConfig.trainerAvatar}
                        alt="AI Trainer"
                        className="w-10 h-10 rounded-full border-2 border-luxury-gold/50 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-luxury-gold/50 bg-gradient-to-br from-luxury-gold to-light-gold flex items-center justify-center">
                        <Bot className="w-5 h-5 text-luxury-black" />
                      </div>
                    )}
                  </div>

                  <div className="bg-luxury-black/60 text-white border border-luxury-gold/20 px-4 py-3 rounded-2xl shadow-md shadow-luxury-black/50">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Input de Mensaje - EXACTO COMO FITBRO-LANDING */}
        <div className="p-3 sm:p-4 border-t border-luxury-gold/20">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={sendMessageMutation.isPending}
              className="flex-1 bg-luxury-black/60 border border-luxury-gold/20 rounded-full px-3 sm:px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-luxury-gold/50 shadow-md shadow-white/30 transition-all duration-300 shadow-inner text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-luxury-gold to-light-gold rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-luxury-gold/40 transition-all duration-300 disabled:opacity-50 shadow-md"
            >
              <img
                src="https://img.icons8.com/fluency/20/sent.png"
                alt="Send"
                className="w-4 h-4 sm:w-5 sm:h-5 filter brightness-0"
              />
            </button>
          </form>



          {/* AI Suggestions */}
          <TrainerSuggestions
            suggestions={suggestions}
            onSuggestionClick={(suggestion) => setMessage(suggestion)}
            isLoading={sendMessageMutation.isPending}
          />
        </div>
      </Card>
    </div>
  );
}
