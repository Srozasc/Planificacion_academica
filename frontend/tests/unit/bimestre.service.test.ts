import { BimestreService } from 'src/services/bimestre.service';
import apiClient from 'src/services/apiClient';

// Mock de apiClient (axios instance)
jest.mock('src/services/apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('BimestreService', () => {
  let service: BimestreService;

  beforeEach(() => {
    service = new BimestreService();
    jest.clearAllMocks();
    jest.useFakeTimers(); // Para controlar Date en formatFecha y getFechasRango
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findAll', () => {
    it('debería obtener todos los bimestres', async () => {
      const mockResponseData = [{ id: 1, nombre: 'Bimestre 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.findAll();

      expect(apiClient.get).toHaveBeenCalledWith('/bimestres');
      expect(result).toEqual(mockResponseData);
    });

    it('debería obtener bimestres por año académico', async () => {
      const mockResponseData = [{ id: 1, nombre: 'Bimestre 2024' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.findAll(2024);

      expect(apiClient.get).toHaveBeenCalledWith('/bimestres?anoAcademico=2024');
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('findActivos', () => {
    it('debería obtener solo los bimestres activos', async () => {
      const mockResponseData = [{ id: 1, nombre: 'Bimestre Activo' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.findActivos();

      expect(apiClient.get).toHaveBeenCalledWith('/bimestres/activos');
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('findBimestreActual', () => {
    it('debería obtener el bimestre actual', async () => {
      const mockResponseData = { id: 1, nombre: 'Bimestre Actual' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.findBimestreActual();

      expect(apiClient.get).toHaveBeenCalledWith('/bimestres/actual');
      expect(result).toEqual(mockResponseData);
    });

    it('debería retornar null si no hay bimestre actual', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: null } });

      const result = await service.findBimestreActual();

      expect(apiClient.get).toHaveBeenCalledWith('/bimestres/actual');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('debería obtener un bimestre por ID', async () => {
      const mockResponseData = { id: 1, nombre: 'Bimestre por ID' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.findById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/bimestres/1');
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('create', () => {
    it('debería crear un bimestre', async () => {
      const createDto = { nombre: 'Nuevo', fechaInicio: '2025-01-01', fechaFin: '2025-03-31', anoAcademico: 2025, numeroBimestre: 1 };
      const mockResponseData = { id: 1, ...createDto };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.create(createDto);

      expect(apiClient.post).toHaveBeenCalledWith('/bimestres', createDto);
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('update', () => {
    it('debería actualizar un bimestre', async () => {
      const updateDto = { nombre: 'Actualizado' };
      const mockResponseData = { id: 1, nombre: 'Actualizado' };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await service.update(1, updateDto);

      expect(apiClient.put).toHaveBeenCalledWith('/bimestres/1', updateDto);
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('delete', () => {
    it('debería eliminar un bimestre', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await service.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/bimestres/1');
    });
  });

  describe('formatFecha', () => {
    it('debería formatear la fecha correctamente', () => {
      const dateString = '2025-01-15T10:00:00Z';
      // El formato exacto depende de la configuración regional, pero podemos verificar el contenido
      const expected = new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      expect(service.formatFecha(dateString)).toBe(expected);
    });
  });

  describe('getDuracionDias', () => {
    it('debería calcular la duración en días correctamente', () => {
      const fechaInicio = '2025-01-01';
      const fechaFin = '2025-01-03';
      expect(service.getDuracionDias(fechaInicio, fechaFin)).toBe(2);
    });

    it('debería calcular la duración para el mismo día como 0', () => {
      const fechaInicio = '2025-01-01';
      const fechaFin = '2025-01-01';
      expect(service.getDuracionDias(fechaInicio, fechaFin)).toBe(0);
    });
  });

  describe('contieneFecha', () => {
    const mockBimestre = {
      id: 1,
      nombre: 'Test Bimestre',
      fechaInicio: '2025-01-01',
      fechaFin: '2025-01-31',
      anoAcademico: 2025,
      numeroBimestre: 1,
      activo: true,
      createdAt: '',
      updatedAt: '',
    };

    it('debería retornar true si la fecha está dentro del bimestre', () => {
      const testDate = new Date('2025-01-15');
      expect(service.contieneFecha(mockBimestre, testDate)).toBe(true);
    });

    it('debería retornar false si la fecha está fuera del bimestre', () => {
      const testDate = new Date('2025-02-15');
      expect(service.contieneFecha(mockBimestre, testDate)).toBe(false);
    });

    it('debería retornar true si la fecha es igual a fechaInicio', () => {
      const testDate = new Date('2025-01-01');
      expect(service.contieneFecha(mockBimestre, testDate)).toBe(true);
    });

    it('debería retornar true si la fecha es igual a fechaFin', () => {
      const testDate = new Date('2025-01-31');
      expect(service.contieneFecha(mockBimestre, testDate)).toBe(true);
    });
  });

  describe('getFechasRango', () => {
    it('debería retornar un array de fechas dentro del rango', () => {
      const fechaInicio = '2025-01-01';
      const fechaFin = '2025-01-03';
      const expectedDates = [
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-02T00:00:00.000Z'),
        new Date('2025-01-03T00:00:00.000Z'),
      ];
      const result = service.getFechasRango(fechaInicio, fechaFin);
      expect(result).toEqual(expectedDates);
    });

    it('debería retornar un array con una sola fecha si inicio y fin son iguales', () => {
      const fechaInicio = '2025-01-01';
      const fechaFin = '2025-01-01';
      const expectedDates = [
        new Date('2025-01-01T00:00:00.000Z'),
      ];
      const result = service.getFechasRango(fechaInicio, fechaFin);
      expect(result).toEqual(expectedDates);
    });
  });

  describe('validarSolapamientoFechas', () => {
    const mockBimestres = [
      {
        id: 1,
        nombre: 'Bimestre Existente 1',
        fechaInicio: '2025-01-01',
        fechaFin: '2025-01-31',
        anoAcademico: 2025,
        numeroBimestre: 1,
        activo: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 2,
        nombre: 'Bimestre Existente 2',
        fechaInicio: '2025-02-01',
        fechaFin: '2025-02-28',
        anoAcademico: 2025,
        numeroBimestre: 2,
        activo: true,
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('debería retornar hasOverlap: false si no hay solapamiento', () => {
      const result = service.validarSolapamientoFechas(
        '2025-03-01',
        '2025-03-31',
        2025,
        mockBimestres
      );
      expect(result.hasOverlap).toBe(false);
    });

    it('debería retornar hasOverlap: true y el bimestre en conflicto si hay solapamiento', () => {
      const result = service.validarSolapamientoFechas(
        '2025-01-15',
        '2025-02-15',
        2025,
        mockBimestres
      );
      expect(result.hasOverlap).toBe(true);
      expect(result.conflictingBimestre).toEqual(mockBimestres[0]);
    });

    it('debería excluir el bimestre actual de la validación', () => {
      const result = service.validarSolapamientoFechas(
        '2025-01-15',
        '2025-01-20',
        2025,
        mockBimestres,
        1 // Excluir Bimestre Existente 1
      );
      expect(result.hasOverlap).toBe(false);
    });

    it('debería ignorar bimestres inactivos', () => {
      const inactiveBimestre = {
        id: 3,
        nombre: 'Bimestre Inactivo',
        fechaInicio: '2025-01-01',
        fechaFin: '2025-12-31',
        anoAcademico: 2025,
        numeroBimestre: 3,
        activo: false,
        createdAt: '',
        updatedAt: '',
      };
      const result = service.validarSolapamientoFechas(
        '2025-06-01',
        '2025-06-30',
        2025,
        [...mockBimestres, inactiveBimestre]
      );
      expect(result.hasOverlap).toBe(false);
    });

    it('debería ignorar bimestres de otros años académicos', () => {
      const otherYearBimestre = {
        id: 4,
        nombre: 'Bimestre Otro Año',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-01-31',
        anoAcademico: 2024,
        numeroBimestre: 1,
        activo: true,
        createdAt: '',
        updatedAt: '',
      };
      const result = service.validarSolapamientoFechas(
        '2024-01-15',
        '2024-01-20',
        2025,
        [...mockBimestres, otherYearBimestre]
      );
      expect(result.hasOverlap).toBe(false);
    });
  });
});
