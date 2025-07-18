import { ResponseService } from 'src/common/services/response.service';

describe('ResponseService', () => {
  let service: ResponseService;

  beforeEach(() => {
    service = new ResponseService();
    jest.useFakeTimers(); // Mockear Date para timestamps consistentes
    jest.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers(); // Restaurar Date
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('success', () => {
    it('debería retornar una respuesta de éxito con datos y mensaje por defecto', () => {
      const data = { id: 1, name: 'Test' };
      const response = service.success(data);
      expect(response).toEqual({
        success: true,
        data,
        message: 'Operation completed successfully',
        timestamp: '2025-01-01T12:00:00.000Z',
      });
    });

    it('debería retornar una respuesta de éxito con un mensaje personalizado', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Custom success message';
      const response = service.success(data, message);
      expect(response.message).toBe(message);
    });
  });

  describe('error', () => {
    it('debería retornar una respuesta de error con mensaje y errores por defecto', () => {
      const message = 'Error occurred';
      const response = service.error(message);
      expect(response).toEqual({
        success: false,
        message,
        errors: [],
        timestamp: '2025-01-01T12:00:00.000Z',
      });
    });

    it('debería retornar una respuesta de error con errores personalizados', () => {
      const message = 'Validation failed';
      const errors = ['Field A is required', 'Field B is invalid'];
      const response = service.error(message, errors);
      expect(response.errors).toEqual(errors);
    });
  });

  describe('paginated', () => {
    it('debería retornar una respuesta paginada correctamente', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 10;
      const options = { page: 2, limit: 5 };
      const message = 'Paginated data';
      const response = service.paginated(data, total, options, message);

      expect(response).toEqual({
        success: true,
        data,
        message,
        timestamp: '2025-01-01T12:00:00.000Z',
        pagination: {
          page: 2,
          limit: 5,
          total: 10,
          totalPages: 2,
        },
      });
    });

    it('debería calcular totalPages correctamente para un total exacto', () => {
      const data = [{ id: 1 }];
      const total = 5;
      const options = { page: 1, limit: 5 };
      const response = service.paginated(data, total, options);
      expect(response.pagination.totalPages).toBe(1);
    });

    it('debería calcular totalPages correctamente para un total no exacto', () => {
      const data = [{ id: 1 }];
      const total = 6;
      const options = { page: 1, limit: 5 };
      const response = service.paginated(data, total, options);
      expect(response.pagination.totalPages).toBe(2);
    });
  });

  describe('created', () => {
    it('debería retornar una respuesta de creación exitosa', () => {
      const data = { id: 1 };
      const response = service.created(data);
      expect(response.message).toBe('Resource created successfully');
      expect(response.data).toEqual(data);
    });
  });

  describe('updated', () => {
    it('debería retornar una respuesta de actualización exitosa', () => {
      const data = { id: 1 };
      const response = service.updated(data);
      expect(response.message).toBe('Resource updated successfully');
      expect(response.data).toEqual(data);
    });
  });

  describe('deleted', () => {
    it('debería retornar una respuesta de eliminación exitosa', () => {
      const response = service.deleted();
      expect(response.message).toBe('Resource deleted successfully');
      expect(response.data).toBeUndefined();
    });
  });

  describe('noContent', () => {
    it('debería retornar una respuesta sin contenido', () => {
      const response = service.noContent();
      expect(response.message).toBe('No content');
      expect(response.data).toBeUndefined();
    });
  });

  describe('validationError', () => {
    it('debería retornar una respuesta de error de validación', () => {
      const errors = ['Error 1', 'Error 2'];
      const response = service.validationError(errors);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toEqual(errors);
    });
  });

  describe('notFound', () => {
    it('debería retornar una respuesta de recurso no encontrado', () => {
      const response = service.notFound();
      expect(response.success).toBe(false);
      expect(response.message).toBe('Resource not found');
    });

    it('debería retornar una respuesta de recurso no encontrado con nombre de recurso', () => {
      const response = service.notFound('User');
      expect(response.message).toBe('User not found');
    });
  });

  describe('unauthorized', () => {
    it('debería retornar una respuesta de acceso no autorizado', () => {
      const response = service.unauthorized();
      expect(response.success).toBe(false);
      expect(response.message).toBe('Unauthorized access');
    });

    it('debería retornar una respuesta de acceso no autorizado con mensaje personalizado', () => {
      const response = service.unauthorized('Invalid credentials');
      expect(response.message).toBe('Invalid credentials');
    });
  });

  describe('forbidden', () => {
    it('debería retornar una respuesta de acceso prohibido', () => {
      const response = service.forbidden();
      expect(response.success).toBe(false);
      expect(response.message).toBe('Access forbidden');
    });

    it('debería retornar una respuesta de acceso prohibido con mensaje personalizado', () => {
      const response = service.forbidden('Insufficient permissions');
      expect(response.message).toBe('Insufficient permissions');
    });
  });
});
