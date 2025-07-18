import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from 'src/common/services/database.service';
import { Pool, PoolConnection } from 'mysql2/promise';
import { ILogger } from 'src/common/interfaces';

// Mocks
const mockPoolConnection = {
  execute: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  getConnection: jest.fn(() => mockPoolConnection),
  config: { connectionLimit: 10 },
};

const mockLogger = {
  debug: jest.fn(),
  error: jest.fn(),
};

describe('DatabaseService', () => {
  let service: DatabaseService;
  let pool: Pool;
  let logger: ILogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        { provide: 'DATABASE_CONNECTION', useValue: mockPool },
        { provide: 'LOGGER', useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    pool = module.get<Pool>('DATABASE_CONNECTION');
    logger = module.get<ILogger>('LOGGER');

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    it('debería ejecutar una consulta SQL exitosamente', async () => {
      mockPoolConnection.execute.mockResolvedValue([[{ id: 1, name: 'test' }]]);

      const result = await service.query('SELECT * FROM users', []);

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockPoolConnection.execute).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(mockPoolConnection.release).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, name: 'test' }]);
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Executing query'), 'DatabaseService');
    });

    it('debería lanzar un error si la consulta falla', async () => {
      const mockError = new Error('DB Error');
      mockPoolConnection.execute.mockRejectedValue(mockError);

      await expect(service.query('SELECT * FROM users', [])).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Query failed'), expect.any(String), 'DatabaseService');
      expect(mockPoolConnection.release).toHaveBeenCalled();
    });
  });

  describe('executeStoredProcedure', () => {
    it('debería ejecutar un stored procedure y retornar el primer resultado si es un array de arrays', async () => {
      const mockSpResult = [[{ id: 1, value: 'data' }], [{ status_code: 'SUCCESS' }]];
      jest.spyOn(service, 'query' as any).mockResolvedValue(mockSpResult);

      const result = await service.executeStoredProcedure('sp_GetData', [1]);

      expect(service['query']).toHaveBeenCalledWith('CALL sp_GetData(?)', [1]);
      expect(result).toEqual({
        status_code: 'SUCCESS',
        message: 'Stored procedure executed successfully',
        data: [{ id: 1, value: 'data' }],
      });
    });

    it('debería ejecutar un stored procedure y retornar el resultado si es un array simple', async () => {
      const mockSpResult = [{ id: 1, value: 'data' }];
      jest.spyOn(service, 'query' as any).mockResolvedValue(mockSpResult);

      const result = await service.executeStoredProcedure('sp_GetData', [1]);

      expect(service['query']).toHaveBeenCalledWith('CALL sp_GetData(?)', [1]);
      expect(result).toEqual({
        status_code: 'SUCCESS',
        message: 'Stored procedure executed successfully',
        data: { id: 1, value: 'data' }, // Corregido: espera el objeto directamente, no un array
      });
    });

    it('debería manejar la respuesta de stored procedure con status_code', async () => {
      const mockSpResult = [[{ id: 1, value: 'data' }], { status_code: 'ERROR', message: 'Custom Error', affected_rows: 0, error_message: 'Detail' }];
      jest.spyOn(service, 'query' as any).mockResolvedValue(mockSpResult);

      const result = await service.executeStoredProcedure('sp_GetData', [1]);

      expect(result).toEqual({
        status_code: 'ERROR',
        message: 'Custom Error',
        data: [{ id: 1, value: 'data' }],
        affected_rows: 0,
        error_message: 'Detail',
      });
    });

    it('debería lanzar un error si el stored procedure falla', async () => {
      const mockError = new Error('SP Execution Error');
      jest.spyOn(service, 'query' as any).mockRejectedValue(mockError);

      const result = await service.executeStoredProcedure('sp_Fail', []);

      expect(result).toEqual({
        status_code: 'ERROR',
        message: 'Stored procedure execution failed',
        error_message: 'SP Execution Error',
      });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Stored procedure sp_Fail failed'), expect.any(String), 'DatabaseService');
    });
  });

  describe('transaction', () => {
    it('debería ejecutar una transacción exitosamente', async () => {
      const callbackResult = 'Transaction Completed';
      mockPoolConnection.beginTransaction.mockResolvedValue(undefined);
      mockPoolConnection.commit.mockResolvedValue(undefined);
      mockPoolConnection.execute.mockResolvedValue([[]]); // Para cualquier query dentro del callback

      const result = await service.transaction(async (connection) => {
        await connection.execute('INSERT INTO test VALUES (1)');
        return callbackResult;
      });

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockPoolConnection.beginTransaction).toHaveBeenCalled();
      expect(mockPoolConnection.execute).toHaveBeenCalledWith('INSERT INTO test VALUES (1)');
      expect(mockPoolConnection.commit).toHaveBeenCalled();
      expect(mockPoolConnection.release).toHaveBeenCalled();
      expect(result).toBe(callbackResult);
      expect(logger.debug).toHaveBeenCalledWith('Transaction started', 'DatabaseService');
      expect(logger.debug).toHaveBeenCalledWith('Transaction committed', 'DatabaseService');
    });

    it('debería hacer rollback si la transacción falla', async () => {
      const mockError = new Error('Transaction Failed');
      mockPoolConnection.beginTransaction.mockResolvedValue(undefined);
      mockPoolConnection.rollback.mockResolvedValue(undefined);
      mockPoolConnection.execute.mockRejectedValue(mockError);

      await expect(service.transaction(async (connection) => {
        await connection.execute('INSERT INTO test VALUES (1)');
        return 'should not reach here';
      })).rejects.toThrow(mockError);

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockPoolConnection.beginTransaction).toHaveBeenCalled();
      expect(mockPoolConnection.rollback).toHaveBeenCalled();
      expect(mockPoolConnection.release).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Transaction rolled back'), expect.any(String), 'DatabaseService');
    });
  });

  describe('healthCheck', () => {
    it('debería retornar healthy si la base de datos está accesible', async () => {
      jest.spyOn(service, 'query' as any).mockResolvedValue([[{ health_check: 1 }]]);

      const result = await service.healthCheck();

      expect(service['query']).toHaveBeenCalledWith('SELECT 1 as health_check');
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
    });

    it('debería retornar unhealthy si la base de datos no está accesible', async () => {
      const mockError = new Error('DB Down');
      jest.spyOn(service, 'query' as any).mockRejectedValue(mockError);

      const result = await service.healthCheck();

      expect(service['query']).toHaveBeenCalledWith('SELECT 1 as health_check');
      expect(result.status).toBe('unhealthy');
      expect(result.timestamp).toBeDefined();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Database health check failed'), expect.any(String), 'DatabaseService');
    });
  });

  describe('getConnectionStats', () => {
    it('debería retornar las estadísticas de conexión', () => {
      const stats = service.getConnectionStats();
      expect(stats.totalConnections).toBe(10);
      expect(stats.poolStatus).toBe('active');
      expect(stats.timestamp).toBeDefined();
    });
  });
});
