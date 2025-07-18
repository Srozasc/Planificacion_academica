import { AppLoggerService } from 'src/common/services/logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new AppLoggerService();
    // Espiar todos los métodos de console
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('maskEmail', () => {
    it('debería enmascarar un email con más de 2 caracteres en la parte local', () => {
      // Acceder al método privado usando corchetes
      const masked = service['maskEmail']('testuser@example.com');
      expect(masked).toBe('te**@example.com');
    });

    it('debería enmascarar un email con 2 caracteres en la parte local', () => {
      const masked = service['maskEmail']('ab@example.com');
      expect(masked).toBe('ab@example.com');
    });

    it('debería enmascarar un email con 1 caracter en la parte local', () => {
      const masked = service['maskEmail']('a@example.com');
      expect(masked).toBe('a@example.com');
    });

    it('debería manejar emails sin parte local (aunque inválidos, probar el comportamiento)', () => {
      const masked = service['maskEmail']('@example.com');
      expect(masked).toBe('@example.com');
    });
  });

  describe('logStructured', () => {
    it('debería loggear un mensaje estructurado correctamente', () => {
      const message = 'Test message';
      const level = 'INFO';
      const metadata = { key: 'value' };
      const context = 'TestContext';

      service.logStructured(level, message, metadata, context);

      const loggedCall = consoleSpy.mock.calls[0][0];
      const parsedLog = JSON.parse(loggedCall);

      expect(parsedLog).toEqual(expect.objectContaining({
        level: 'INFO',
        context: 'TestContext',
        message: 'Test message',
        metadata: { key: 'value' },
        environment: process.env.NODE_ENV || 'development',
        timestamp: expect.any(String), // El timestamp es dinámico
      }));
    });

    it('debería usar el contexto por defecto si no se proporciona', () => {
      service.logStructured('INFO', 'Another message');

      const loggedCall = consoleSpy.mock.calls[0][0];
      const parsedLog = JSON.parse(loggedCall);

      expect(parsedLog).toEqual(expect.objectContaining({
        context: 'AppLogger',
        timestamp: expect.any(String),
      }));
    });
  });

  describe('logDatabase', () => {
    it('debería loggear una operación de base de datos', () => {
      service.logDatabase('INSERT', 'INSERT INTO users VALUES (1)', 123);

      const loggedCall = consoleSpy.mock.calls[0][0];
      const parsedLog = JSON.parse(loggedCall);

      expect(parsedLog).toEqual(expect.objectContaining({
        level: 'DATABASE',
        message: 'INSERT executed',
        metadata: {
          operation: 'INSERT',
          query: 'INSERT INTO users VALUES (1)',
          duration: '123ms',
        },
        context: 'DatabaseService',
        timestamp: expect.any(String),
      }));
    });
  });

  describe('logAuth', () => {
    it('debería loggear un evento de autenticación y enmascarar el email', () => {
      service.logAuth('LOGIN_SUCCESS', 1, 'user@example.com');

      const loggedCall = consoleSpy.mock.calls[0][0];
      const parsedLog = JSON.parse(loggedCall);

      expect(parsedLog).toEqual(expect.objectContaining({
        level: 'AUTH',
        message: 'Authentication event: LOGIN_SUCCESS',
        metadata: {
          event: 'LOGIN_SUCCESS',
          userId: 1,
          email: 'us**@example.com',
        },
        context: 'AuthService',
        timestamp: expect.any(String),
      }));
    });
  });

  describe('logUpload', () => {
    it('debería loggear un evento de subida de archivo', () => {
      service.logUpload('image.jpg', 1024 * 1024 * 2.5, 'image/jpeg'); // 2.5 MB

      const loggedCall = consoleSpy.mock.calls[0][0];
      const parsedLog = JSON.parse(loggedCall);

      expect(parsedLog).toEqual(expect.objectContaining({
        level: 'UPLOAD',
        message: 'File uploaded: image.jpg',
        metadata: {
          filename: 'image.jpg',
          size: '2.50MB',
          type: 'image/jpeg',
        },
        context: 'UploadService',
        timestamp: expect.any(String),
      }));
    });
  });
});
