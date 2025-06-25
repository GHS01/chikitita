# Gemini Integration Docs

Esta guía simple explica cómo integrar Google Gemini 2.5 Pro en tu aplicación web, enfocándose exclusivamente en la API y su implementación.

## Índice

1. [Obtener una clave API](#obtener-una-clave-api)
2. [Importar el SDK de Gemini](#importar-el-sdk-de-gemini)
3. [Inicializar el modelo](#inicializar-el-modelo)
4. [Realizar solicitudes básicas](#realizar-solicitudes-básicas)
5. [Implementar respuestas en streaming](#implementar-respuestas-en-streaming)
6. [Gestionar el historial de chat](#gestionar-el-historial-de-chat)
7. [Optimizar parámetros del modelo](#optimizar-parámetros-del-modelo)
8. [Solución de problemas comunes](#solución-de-problemas-comunes)

## Obtener una clave API

1. Visita [Google AI Studio](https://aistudio.google.com/)
2. Crea una cuenta o inicia sesión
3. Ve a la sección "API Keys"
4. Crea una nueva clave de API
5. Copia la clave para usarla en tu aplicación

## Importar el SDK de Gemini

Añade el SDK de Google GenAI a tu HTML:

```html
<script type="module">
    import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
    window.GoogleGenerativeAI = GoogleGenerativeAI;
</script>
```

## Inicializar el modelo

```javascript
// Clave API - En un entorno de producción, esto debería manejarse del lado del servidor
const API_KEY = 'TU_CLAVE_API_AQUÍ';

// Variables para almacenar las instancias del SDK y el modelo
let genAI, model;

// Función para inicializar el SDK de Gemini
function initializeGeminiSDK() {
    try {
        if (window.GoogleGenerativeAI) {
            // Inicializar el cliente de la API
            genAI = new window.GoogleGenerativeAI(API_KEY);

            // Obtener el modelo Gemini 2.5 Pro
            model = genAI.getGenerativeModel({
                model: "gemini-2.5-pro-exp-03-25",
                // Configuración predeterminada para todas las solicitudes
                generationConfig: {
                    temperature: 0.5,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 4096
                }
            });
            console.log("Gemini API initialized successfully");
            return true;
        } else {
            console.error('GoogleGenerativeAI not available');
            return false;
        }
    } catch (error) {
        console.error('Error initializing Gemini API:', error);
        return false;
    }
}

// Inicializar inmediatamente
initializeGeminiSDK();
```

## Realizar solicitudes básicas

Para enviar una solicitud simple y obtener una respuesta:

```javascript
async function generateBasicResponse(message) {
    try {
        // Verificar si el modelo está inicializado
        if (!model) {
            throw new Error('Gemini model not initialized');
        }

        // Crear el prompt con el mensaje del usuario
        const prompt = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: message }]
                }
            ]
        };

        // Generar la respuesta
        const result = await model.generateContent(prompt);
        const response = result.response;

        // Extraer el texto de la respuesta
        let responseText = "";
        if (response && typeof response.text === 'function') {
            responseText = response.text();
        } else if (response && response.text) {
            responseText = response.text;
        } else if (response && response.candidates && response.candidates[0].content.parts[0].text) {
            responseText = response.candidates[0].content.parts[0].text;
        }

        return responseText;
    } catch (error) {
        console.error('Error generating response:', error);
        throw error;
    }
}

// Ejemplo de uso
async function example() {
    try {
        const response = await generateBasicResponse("¿Qué es la inteligencia artificial?");
        console.log(response);
    } catch (error) {
        console.error("Error:", error.message);
    }
}
```

## Implementar respuestas en streaming

Para mostrar las respuestas a medida que se generan (streaming):

```javascript
async function generateStreamingResponse(message, onChunk) {
    try {
        // Verificar si el modelo está inicializado
        if (!model) {
            throw new Error('Gemini model not initialized');
        }

        // Crear el prompt con el mensaje del usuario
        const prompt = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: message }]
                }
            ]
        };

        // Generar la respuesta con streaming
        const result = await model.generateContentStream(prompt);
        
        let fullResponseText = "";
        
        // Procesar el stream
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponseText += chunkText;
                // Llamar al callback con cada fragmento de texto
                if (onChunk && typeof onChunk === 'function') {
                    onChunk(chunkText, fullResponseText);
                }
            }
        }
        
        return fullResponseText;
    } catch (error) {
        console.error('Error in streaming response:', error);
        throw error;
    }
}

// Ejemplo de uso
async function streamingExample() {
    try {
        await generateStreamingResponse(
            "Explica cómo funciona la inteligencia artificial", 
            (chunk, fullText) => {
                console.log("Nuevo fragmento:", chunk);
                // Aquí puedes actualizar la UI con el texto recibido
                document.getElementById('response').textContent = fullText;
            }
        );
    } catch (error) {
        console.error("Error:", error.message);
    }
}
```

## Gestionar el historial de chat

Para mantener un contexto de conversación:

```javascript
// Historial de chat para contexto
let chatHistory = [];

async function generateResponseWithHistory(message) {
    try {
        // Verificar si el modelo está inicializado
        if (!model) {
            throw new Error('Gemini model not initialized');
        }

        // Añadir mensaje al historial
        chatHistory.push({ role: 'user', parts: [{ text: message }] });

        // Crear el prompt con el historial de chat
        const prompt = {
            contents: []
        };

        // Limitar historial a últimos 10 mensajes para mejor rendimiento
        const limitedHistory = chatHistory.length > 10
            ? chatHistory.slice(chatHistory.length - 10)
            : chatHistory;

        // Añadir cada mensaje del historial limitado
        for (let i = 0; i < limitedHistory.length; i++) {
            const historyItem = limitedHistory[i];
            prompt.contents.push({
                role: historyItem.role,
                parts: [{ text: historyItem.parts[0].text }]
            });
        }

        // Generar la respuesta
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Añadir respuesta al historial
        chatHistory.push({ role: 'model', parts: [{ text: responseText }] });

        return responseText;
    } catch (error) {
        console.error('Error generating response with history:', error);
        throw error;
    }
}
```

## Optimizar parámetros del modelo

Puedes ajustar estos parámetros según tus necesidades:

```javascript
// Configuración para respuestas más creativas
const creativeConfig = {
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 4096
};

// Configuración para respuestas más precisas
const preciseConfig = {
    temperature: 0.1,
    topP: 0.7,
    topK: 20,
    maxOutputTokens: 2048
};

// Configuración para respuestas más rápidas
const fastConfig = {
    temperature: 0.4,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024
};

// Ejemplo de uso con configuración personalizada
function getModelWithConfig(config) {
    return genAI.getGenerativeModel({
        model: "gemini-2.5-pro-exp-03-25",
        generationConfig: config
    });
}

// Usar configuración específica para una solicitud
async function generateWithCustomConfig(message, config) {
    const customModel = getModelWithConfig(config);
    const result = await customModel.generateContent({
        contents: [{ role: "user", parts: [{ text: message }] }]
    });
    return result.response.text();
}
```

## Solución de problemas comunes

### El modelo no se inicializa

**Problema**: Error "Gemini model not initialized"
**Solución**: 
- Verifica que la clave API sea válida y no haya expirado
- Asegúrate de que el SDK de Google GenAI se cargue correctamente
- Comprueba la consola del navegador para ver errores específicos

### Respuestas lentas

**Problema**: Las respuestas tardan demasiado en generarse
**Solución**:
- Reduce el valor de `maxOutputTokens` para limitar la longitud de las respuestas
- Limita el historial de chat enviado al modelo
- Usa el modelo "gemini-2.5-flash-preview-04-17" para mayor velocidad
- Implementa respuestas en streaming para mejorar la percepción de velocidad

### Errores de formato en las respuestas

**Problema**: Las respuestas tienen formato incorrecto o están truncadas
**Solución**:
- Aumenta el valor de `maxOutputTokens` para permitir respuestas más largas
- Verifica la estructura de la solicitud enviada al modelo
- Comprueba la consola para ver la respuesta completa del modelo

### Errores de cuota o límite de velocidad

**Problema**: Errores relacionados con límites de API
**Solución**:
- Implementa un sistema de reintentos con espera exponencial
- Verifica tu cuota en la consola de Google AI Studio
- Considera actualizar a un plan con mayor cuota si es necesario

## Recursos oficiales

- [Documentación oficial de Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Ejemplos de código de Gemini](https://github.com/google-gemini/cookbook)
- [Guía de prompting para Gemini](https://ai.google.dev/gemini-api/docs/prompting-strategies)
