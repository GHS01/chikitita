import { Bot } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

interface ChatTypingIndicatorProps {
  trainerName: string;
  trainerAvatar?: string;
  interactionTone?: string;
}

// 🎯 FUNCIÓN HELPER PARA EMOJIS POR TONO
const getToneEmoji = (tone: string = 'motivational'): string => {
  const toneEmojis: Record<string, string> = {
    motivational: '🎯',
    friendly: '🤝',
    strict: '⚖️',
    loving: '🤗',
    partner: '❤️'
  };
  return toneEmojis[tone] || '🎯';
};

export default function ChatTypingIndicator({ trainerName, trainerAvatar, interactionTone }: ChatTypingIndicatorProps) {
  return (
    <div className="flex justify-start group">
      <div className="flex items-start space-x-3 max-w-[85%]">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden ${
          trainerAvatar ? 'bg-white' : 'bg-gradient-to-br from-luxury-gold to-light-gold'
        }`}>
          {trainerAvatar ? (
            <img
              src={trainerAvatar}
              alt={trainerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <ModernEmoji
              emoji={getToneEmoji(interactionTone)}
              size={16}
              luxury={true}
              className="text-luxury-black filter-none"
            />
          )}
        </div>

        {/* Typing Bubble */}
        <div className="relative bg-luxury-charcoal/90 border border-luxury-gold/30 rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span className="text-sm text-white font-medium">
              {trainerName} está escribiendo...
            </span>
          </div>

          {/* Message Tail */}
          <div className="absolute top-3 -left-2 border-r-8 border-r-luxury-charcoal/90 border-t-8 border-t-transparent border-b-8 border-b-transparent w-0 h-0"></div>
        </div>
      </div>
    </div>
  );
}
