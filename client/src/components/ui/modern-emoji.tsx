import { useEffect, useRef } from 'react';
import twemoji from 'twemoji';

interface ModernEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  luxury?: boolean; // Nuevo prop para efectos luxury
}

export function ModernEmoji({ emoji, size = 20, className = '', luxury = false }: ModernEmojiProps) {
  const emojiRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (emojiRef.current) {
      // Configurar Twemoji para renderizar emojis modernos de alta calidad
      twemoji.parse(emojiRef.current, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
        className: luxury ? 'twemoji-luxury' : 'twemoji',
      });

      // Aplicar estilos luxury a los emojis renderizados
      const emojiImages = emojiRef.current.querySelectorAll(luxury ? '.twemoji-luxury' : '.twemoji');
      emojiImages.forEach((img) => {
        (img as HTMLImageElement).style.width = `${size}px`;
        (img as HTMLImageElement).style.height = `${size}px`;
        (img as HTMLImageElement).style.display = 'inline-block';
        (img as HTMLImageElement).style.verticalAlign = 'middle';
        (img as HTMLImageElement).style.margin = '0 2px';

        if (luxury) {
          // Efectos luxury con glow dorado
          (img as HTMLImageElement).style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.1))';
          (img as HTMLImageElement).style.transition = 'all 0.3s ease';
          (img as HTMLImageElement).style.borderRadius = '4px';
        } else {
          (img as HTMLImageElement).style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))';
          (img as HTMLImageElement).style.transition = 'transform 0.2s ease';
        }

        // Optimización para calidad WhatsApp/iPhone
        (img as HTMLImageElement).style.imageRendering = 'auto';
        (img as HTMLImageElement).style.imageRendering = '-webkit-optimize-contrast';
      });
    }
  }, [emoji, size, luxury]);

  return (
    <span
      ref={emojiRef}
      className={`modern-emoji ${luxury ? 'luxury-emoji' : ''} ${className}`}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        if (luxury) {
          const img = e.currentTarget.querySelector('.twemoji-luxury') as HTMLImageElement;
          if (img) {
            img.style.transform = 'scale(1.1)';
            img.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) drop-shadow(0 0 16px rgba(255, 215, 0, 0.3))';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (luxury) {
          const img = e.currentTarget.querySelector('.twemoji-luxury') as HTMLImageElement;
          if (img) {
            img.style.transform = 'scale(1)';
            img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.1))';
          }
        }
      }}
    >
      {emoji}
    </span>
  );
}

// Hook para convertir texto con emojis
export function useModernEmojis(text: string, size: number = 20): string {
  useEffect(() => {
    // Aplicar Twemoji a todo el documento si es necesario
    const elements = document.querySelectorAll('.emoji-text');
    elements.forEach((element) => {
      twemoji.parse(element as HTMLElement, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
        className: 'twemoji-inline',
      });

      // Aplicar estilos
      const emojiImages = element.querySelectorAll('.twemoji-inline');
      emojiImages.forEach((img) => {
        (img as HTMLImageElement).style.width = `${size}px`;
        (img as HTMLImageElement).style.height = `${size}px`;
        (img as HTMLImageElement).style.display = 'inline-block';
        (img as HTMLImageElement).style.verticalAlign = 'middle';
        (img as HTMLImageElement).style.margin = '0 1px';
        (img as HTMLImageElement).style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))';
      });
    });
  }, [text, size]);

  return text;
}

// Componente para texto con emojis modernos
interface EmojiTextProps {
  children: string;
  size?: number;
  className?: string;
  luxury?: boolean; // Nuevo prop para efectos luxury
}

export function EmojiText({ children, size = 16, className = '', luxury = false }: EmojiTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current) {
      twemoji.parse(textRef.current, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
        className: luxury ? 'twemoji-text-luxury' : 'twemoji-text',
      });

      // Aplicar estilos modernos con calidad WhatsApp/iPhone
      const emojiImages = textRef.current.querySelectorAll(luxury ? '.twemoji-text-luxury' : '.twemoji-text');
      emojiImages.forEach((img) => {
        (img as HTMLImageElement).style.width = `${size}px`;
        (img as HTMLImageElement).style.height = `${size}px`;
        (img as HTMLImageElement).style.display = 'inline-block';
        (img as HTMLImageElement).style.verticalAlign = 'text-bottom';
        (img as HTMLImageElement).style.margin = '0 1px';
        (img as HTMLImageElement).style.borderRadius = '3px';
        (img as HTMLImageElement).style.transition = 'all 0.2s ease';

        if (luxury) {
          (img as HTMLImageElement).style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.08))';
        } else {
          (img as HTMLImageElement).style.filter = 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))';
        }

        // Optimización para calidad superior
        (img as HTMLImageElement).style.imageRendering = 'auto';
        (img as HTMLImageElement).style.imageRendering = '-webkit-optimize-contrast';
      });
    }
  }, [children, size, luxury]);

  return (
    <span 
      ref={textRef} 
      className={`emoji-text ${className}`}
      style={{ lineHeight: 1.4 }}
    >
      {children}
    </span>
  );
}

export default ModernEmoji;
