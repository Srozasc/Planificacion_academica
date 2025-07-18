const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

// Polyfill para URL constructor en Jest
if (typeof global.URL === 'undefined') {
  const { URL } = require('url');
  global.URL = URL;
}

// Mock para import.meta.env
// Asegúrate de que VITE_API_URL esté definido en tu .env.test o aquí directamente
// Por ejemplo, si tu .env.test tiene VITE_API_URL=http://localhost:3001/api
// entonces import.meta.env.VITE_API_URL será 'http://localhost:3001/api'

// Si no usas dotenv o quieres un valor fijo para las pruebas:
// global.import_meta_env = {
//   VITE_API_URL: 'http://localhost:3001/api',
// };

// Si usas dotenv y quieres que Jest lo reconozca:
// Puedes acceder a process.env directamente si dotenv ya cargó las variables
// O definirlo explícitamente si es necesario para el entorno de prueba

// Para que Jest reconozca import.meta.env, necesitamos un mock global
// que simule su estructura.
// Esto es un workaround para Jest, ya que import.meta no es estándar en Node.js
// y es una característica de módulos ES que Vite transpila.

// Mock para import.meta.env - Configuración mejorada
const importMeta = {
  env: {
    VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api',
    NODE_ENV: 'test',
    DEV: false,
    PROD: false,
    SSR: false
  }
};

// Define global.import_meta_env si no está definido
Object.defineProperty(global, 'import', {
  value: {
    meta: importMeta
  },
  writable: true,
  configurable: true,
});

// También definir en globalThis para compatibilidad
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'import', {
    value: {
      meta: importMeta
    },
    writable: true,
    configurable: true,
  });
}

// Mock para window.URL.createObjectURL y window.URL.revokeObjectURL
// Necesario para pruebas de upload.service.test.ts
Object.defineProperty(window, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn(() => 'blob:http://localhost/mock-object-url'),
    revokeObjectURL: jest.fn(),
  },
});

// Mock para document.createElement y element.download
// Necesario para pruebas de upload.service.test.ts
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: jest.fn(),
        remove: jest.fn(),
      };
    }
    return {};
  }),
});

// Mock para localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Polyfill para URL constructor (requerido por axios en Jest)
global.URL = global.URL || require('url').URL;

// Mock para console.error para evitar que los errores de prueba inunden la consola
const originalConsoleError = console.error;

console.error = jest.fn((message, ...args) => {
  // Puedes filtrar ciertos errores si es necesario
  // Por ejemplo, ignorar errores de red esperados en pruebas de catch
  if (message.includes('Error fetching') || message.includes('Error creating') || message.includes('Error updating') || message.includes('Error deleting') || message.includes('Upload error') || message.includes('Validation error') || message.includes('Stats error') || message.includes('Health error') || message.includes('Cleanup error') || message.includes('Error en login') || message.includes('Error en logout') || message.includes('Error obteniendo perfil') || message.includes('Error validando token') || message.includes('Error cambiando contraseña')) {
    return;
  }
  originalConsoleError(message, ...args);
});
