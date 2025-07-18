import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { DropdownService } from 'src/scheduling/services/dropdown.service';

const mockEntityManager = {
  query: jest.fn(),
};

describe('DropdownService', () => {
  let service: DropdownService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DropdownService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<DropdownService>(DropdownService);
    entityManager = module.get<EntityManager>(EntityManager);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getTeachers', () => {
    it('debería retornar una lista de profesores', async () => {
      const mockTeachers = [
        { id: 1, name: 'Profesor A', rut: '111', email: 'a@test.com' },
        { id: 2, name: 'Profesor B', rut: '222', email: 'b@test.com' },
      ];
      const expectedQuery = `
      SELECT id, name, rut, email
      FROM teachers
      WHERE is_active = 1
      ORDER BY name ASC
    `;
      mockEntityManager.query.mockResolvedValue(mockTeachers);

      const result = await service.getTeachers();

      expect(entityManager.query).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockTeachers);
    });
  });

  describe('getSubjects', () => {
    it('debería retornar una lista de asignaturas', async () => {
      const mockSubjects = [
        { id: 1, code: 'MATH', name: 'Matemáticas', type: 'subject' },
        { id: 2, code: 'PHYS', name: 'Física', type: 'subject' },
      ];
      const expectedQuery = `
      SELECT id, code, name, type
      FROM academic_structures
      WHERE is_active = 1 AND type = 'subject'
      ORDER BY name ASC
    `;
      mockEntityManager.query.mockResolvedValue(mockSubjects);

      const result = await service.getSubjects();

      expect(entityManager.query).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockSubjects);
    });
  });

  describe('getRooms', () => {
    it('debería retornar una lista de aulas combinando las de la DB y las por defecto', async () => {
      const mockDbRooms = [
        { value: 'Sala 201', label: 'Sala 201' },
        { value: 'Auditorio', label: 'Auditorio' },
      ];
      mockEntityManager.query.mockResolvedValue(mockDbRooms);

      const result = await service.getRooms();

      // Verificar que las aulas de la DB están presentes
      expect(result).toContainEqual({ value: 'Sala 201', label: 'Sala 201' });
      expect(result).toContainEqual({ value: 'Auditorio', label: 'Auditorio' });

      // Verificar que las aulas por defecto no duplicadas están presentes y ordenadas
      expect(result.length).toBeGreaterThan(mockDbRooms.length); // Debe haber más que solo las de la DB
      expect(result[0].label).toBe('Auditorio'); // Verificar orden alfabético
      expect(result).toContainEqual({ value: 'Aula 101', label: 'Aula 101' });
    });

    it('debería retornar solo las aulas por defecto si no hay en la DB', async () => {
      mockEntityManager.query.mockResolvedValue([]); // Simula que no hay aulas en la DB

      const result = await service.getRooms();

      expect(result.length).toBeGreaterThan(0); // Debe haber aulas por defecto
      expect(result[0].label).toBe('Auditorio'); // Verificar orden alfabético
      expect(result).toContainEqual({ value: 'Aula 101', label: 'Aula 101' });
    });
  });
});
