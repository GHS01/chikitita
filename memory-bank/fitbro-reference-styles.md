# 🎨 Estilos de Referencia - fitbro-landing

## Colores Exactos del Proyecto de Referencia
```css
:root {
  --luxury-black: 10 10% 4%;     /* #0A0A0A */
  --luxury-gold: 45 89% 52%;     /* #D4AF37 */
  --luxury-charcoal: 0 0% 10%;   /* #1A1A1A */
  --light-gold: 45 58% 80%;      /* #F5E6A3 */
}
```

## Estilos de Chat Container Exactos
```css
/* Container Principal */
.chat-container {
  @apply w-full max-w-xs sm:max-w-sm md:max-w-md 
         bg-luxury-charcoal/95 backdrop-blur-sm 
         rounded-2xl border border-luxury-gold/40 
         shadow-2xl shadow-luxury-gold/20 
         ring-1 ring-luxury-gold/30;
}

/* Header del Chat */
.chat-header {
  @apply bg-gradient-to-r from-luxury-gold to-light-gold 
         p-3 sm:p-4 rounded-t-2xl shadow-lg;
}

/* Área de Mensajes */
.chat-messages {
  @apply h-64 sm:h-72 md:h-80 overflow-y-auto 
         p-3 sm:p-4 space-y-3 sm:space-y-4;
}

/* Burbujas de Usuario */
.user-bubble {
  @apply bg-luxury-gold text-luxury-black 
         shadow-luxury-gold/30 max-w-[85%] sm:max-w-xs 
         px-3 sm:px-4 py-2 rounded-2xl shadow-md;
}

/* Burbujas de AI */
.ai-bubble {
  @apply bg-luxury-black/60 text-white 
         border border-luxury-gold/20 
         shadow-luxury-black/50 max-w-[85%] sm:max-w-xs 
         px-3 sm:px-4 py-2 rounded-2xl shadow-md;
}

/* Input de Mensaje */
.chat-input {
  @apply flex-1 bg-luxury-black/60 
         border border-luxury-gold/20 rounded-full 
         px-3 sm:px-4 py-2 text-white placeholder-white/50 
         focus:outline-none focus:border-luxury-gold/50 
         focus:shadow-md focus:shadow-luxury-gold/20 
         transition-all duration-300 shadow-inner 
         text-xs sm:text-sm;
}

/* Botón de Envío */
.send-button {
  @apply w-8 h-8 sm:w-10 sm:h-10 
         bg-gradient-to-r from-luxury-gold to-light-gold 
         rounded-full flex items-center justify-center 
         hover:shadow-lg hover:shadow-luxury-gold/40 
         transition-all duration-300 disabled:opacity-50 shadow-md;
}
```

## Scrollbar Personalizado
```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--luxury-black));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--luxury-gold));
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--light-gold));
}
```

## Animaciones de Loading
```css
/* Dots de Loading */
.loading-dots {
  @apply flex space-x-1;
}

.loading-dot {
  @apply w-1.5 h-1.5 sm:w-2 sm:h-2 
         bg-luxury-gold rounded-full animate-bounce;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.1s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.2s;
}
```

## Configuración Tailwind Exacta
```javascript
colors: {
  'luxury-black': 'hsl(10 10% 4%)',
  'luxury-gold': 'hsl(45 89% 52%)',
  'luxury-charcoal': 'hsl(0 0% 10%)',
  'light-gold': 'hsl(45 58% 80%)',
}
```

## Fuente
```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
```

## Efectos Glassmorphism
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Sombras Luxury
```css
.luxury-shadow {
  box-shadow:
    0 25px 50px hsla(var(--luxury-black), 0.5),
    0 10px 20px hsla(var(--luxury-gold), 0.1);
}
```
