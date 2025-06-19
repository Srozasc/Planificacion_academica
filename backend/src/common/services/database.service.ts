import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolConnection } from 'mysql2/promise';
import { 
  IDatabaseService, 
  StoredProcedureResponse, 
  ILogger 
} from '../interfaces';

/**
 * DatabaseService - Servicio base para operaciones de base de datos
 * 
 * Proporciona métodos unificados para:
 * - Consultas SQL directas
 * - Ejecución de stored procedures
 * - Manejo de transacciones
 * - Logging de consultas
 */
@Injectable()
export class DatabaseService implements IDatabaseService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly pool: Pool,
    @Inject('LOGGER') private readonly logger: ILogger,
  ) {}

  /**
   * Ejecutar consulta SQL directa
   */
  async query(sql: string, params: any[] = []): Promise<any> {
    const startTime = Date.now();
    let connection: PoolConnection;

    try {
      connection = await this.pool.getConnection();
      
      this.logger.debug(`Executing query: ${sql}`, 'DatabaseService');
      this.logger.debug(`With params: ${JSON.stringify(params)}`, 'DatabaseService');

      const [results] = await connection.execute(sql, params);
      
      const executionTime = Date.now() - startTime;
      this.logger.debug(`Query executed in ${executionTime}ms`, 'DatabaseService');

      return results;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Query failed after ${executionTime}ms: ${error.message}`,
        error.stack,
        'DatabaseService'
      );
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Ejecutar stored procedure
   */
  async executeStoredProcedure<T = any>(
    procedureName: string,
    params: any[] = []
  ): Promise<StoredProcedureResponse<T>> {
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;

    try {
      const results = await this.query(sql, params);
      
      // Los stored procedures pueden retornar múltiples result sets
      // El primer result set suele contener los datos
      // El último suele contener el status/mensaje
      if (Array.isArray(results) && results.length > 0) {
        const lastResult = results[results.length - 1];
        
        // Si hay un objeto con status_code, es la respuesta del SP
        if (lastResult && typeof lastResult === 'object' && 'status_code' in lastResult) {
          return {
            status_code: lastResult.status_code,
            message: lastResult.message || 'Success',
            data: results.length > 1 ? results[0] : undefined,
            affected_rows: lastResult.affected_rows,
            error_message: lastResult.error_message,
          };
        }
        
        // Si no hay status_code, asumir éxito
        return {
          status_code: 'SUCCESS',
          message: 'Stored procedure executed successfully',
          data: results[0] || results,
        };
      }

      return {
        status_code: 'SUCCESS',
        message: 'Stored procedure executed successfully',
        data: results,
      };
    } catch (error) {
      this.logger.error(
        `Stored procedure ${procedureName} failed: ${error.message}`,
        error.stack,
        'DatabaseService'
      );

      return {
        status_code: 'ERROR',
        message: 'Stored procedure execution failed',
        error_message: error.message,
      };
    }
  }

  /**
   * Alias para executeStoredProcedure (mantenemos compatibilidad)
   */
  async execute(sql: string, params: any[] = []): Promise<any> {
    return this.query(sql, params);
  }

  /**
   * Ejecutar múltiples consultas en una transacción
   */
  async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
    let connection: PoolConnection;

    try {
      connection = await this.pool.getConnection();
      await connection.beginTransaction();

      this.logger.debug('Transaction started', 'DatabaseService');

      const result = await callback(connection);

      await connection.commit();
      this.logger.debug('Transaction committed', 'DatabaseService');

      return result;
    } catch (error) {
      if (connection) {
        await connection.rollback();
        this.logger.error(
          `Transaction rolled back: ${error.message}`,
          error.stack,
          'DatabaseService'
        );
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Verificar conectividad de la base de datos
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.query('SELECT 1 as health_check');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Database health check failed: ${error.message}`,
        error.stack,
        'DatabaseService'
      );
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
  /**
   * Obtener estadísticas de conexión
   */
  getConnectionStats() {
    return {
      totalConnections: this.pool.config.connectionLimit || 10,
      // activeConnections y idleConnections no están disponibles en la interfaz pública
      // Se pueden obtener con métodos internos si es necesario
      poolStatus: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}
