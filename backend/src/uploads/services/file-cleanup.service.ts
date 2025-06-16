import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { UploadConfig } from '../config/upload.config';

@Injectable()
export class FileCleanupService implements OnModuleInit {
  private readonly logger = new Logger(FileCleanupService.name);

  onModuleInit() {
    this.logger.log('Servicio de limpieza de archivos inicializado');
    // Ejecutar limpieza inicial después de 30 segundos
    setTimeout(() => this.cleanupExpiredFiles(), 30000);
  }

  /**
   * Limpieza automática cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledCleanup() {
    if (UploadConfig.logging.logCleanup) {
      this.logger.log('Iniciando limpieza programada de archivos');
    }
    await this.cleanupExpiredFiles();
  }

  /**
   * Limpia archivos expirados de todos los directorios
   */
  async cleanupExpiredFiles(): Promise<void> {
    try {
      const stats = {
        tempFiles: 0,
        processedFiles: 0,
        failedFiles: 0,
        totalSize: 0
      };

      // Limpiar archivos temporales
      stats.tempFiles = await this.cleanupDirectory(
        UploadConfig.directories.temp,
        UploadConfig.cleanup.tempFileMaxAge
      );

      // Limpiar archivos procesados
      stats.processedFiles = await this.cleanupDirectory(
        UploadConfig.directories.processed,
        UploadConfig.cleanup.processedFileMaxAge
      );

      // Limpiar archivos fallidos
      stats.failedFiles = await this.cleanupDirectory(
        UploadConfig.directories.failed,
        UploadConfig.cleanup.failedFileMaxAge
      );

      const totalCleaned = stats.tempFiles + stats.processedFiles + stats.failedFiles;

      if (totalCleaned > 0 && UploadConfig.logging.logCleanup) {
        this.logger.log(
          `Limpieza completada: ${totalCleaned} archivos eliminados ` +
          `(Temp: ${stats.tempFiles}, Procesados: ${stats.processedFiles}, Fallidos: ${stats.failedFiles})`
        );
      }

    } catch (error) {
      this.logger.error('Error durante la limpieza de archivos:', error);
    }
  }

  /**
   * Limpia archivos de un directorio específico
   */
  private async cleanupDirectory(directory: string, maxAge: number): Promise<number> {
    const fullPath = path.resolve(directory);
    
    if (!fs.existsSync(fullPath)) {
      return 0;
    }

    let cleanedCount = 0;
    const now = Date.now();

    try {
      const files = fs.readdirSync(fullPath, { withFileTypes: true });

      for (const file of files) {
        if (file.isFile() && file.name !== '.gitkeep') {
          const filePath = path.join(fullPath, file.name);
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtime.getTime();

          if (fileAge > maxAge) {
            try {
              fs.unlinkSync(filePath);
              cleanedCount++;
              
              if (UploadConfig.logging.logCleanup) {
                this.logger.debug(`Archivo eliminado: ${filePath} (${Math.round(fileAge / 1000 / 60)} min)`);
              }
            } catch (deleteError) {
              this.logger.warn(`No se pudo eliminar archivo: ${filePath}`, deleteError);
            }
          }
        } else if (file.isDirectory()) {
          // Recursivamente limpiar subdirectorios
          const subDirPath = path.join(directory, file.name);
          cleanedCount += await this.cleanupDirectory(subDirPath, maxAge);
          
          // Eliminar directorio si está vacío (excepto .gitkeep)
          try {
            const subFiles = fs.readdirSync(path.join(fullPath, file.name));
            if (subFiles.length === 0 || (subFiles.length === 1 && subFiles[0] === '.gitkeep')) {
              // No eliminar el directorio si solo contiene .gitkeep
              if (subFiles.length === 0) {
                fs.rmdirSync(path.join(fullPath, file.name));
              }
            }
          } catch (error) {
            // Ignorar errores al eliminar directorios
          }
        }
      }

    } catch (error) {
      this.logger.error(`Error leyendo directorio ${fullPath}:`, error);
    }

    return cleanedCount;
  }

  /**
   * Obtiene estadísticas de archivos en directorios de upload
   */
  async getUploadStats(): Promise<any> {
    const stats = {
      temp: await this.getDirectoryStats(UploadConfig.directories.temp),
      processed: await this.getDirectoryStats(UploadConfig.directories.processed),
      failed: await this.getDirectoryStats(UploadConfig.directories.failed),
      academic: await this.getDirectoryStats(UploadConfig.directories.academic),
      teachers: await this.getDirectoryStats(UploadConfig.directories.teachers),
      paymentCodes: await this.getDirectoryStats(UploadConfig.directories.paymentCodes),
      courseReports: await this.getDirectoryStats(UploadConfig.directories.courseReports)
    };

    return {
      ...stats,
      total: {
        files: Object.values(stats).reduce((acc: number, dir: any) => acc + dir.files, 0),
        size: Object.values(stats).reduce((acc: number, dir: any) => acc + dir.size, 0)
      }
    };
  }

  /**
   * Obtiene estadísticas de un directorio específico
   */
  private async getDirectoryStats(directory: string): Promise<{ files: number; size: number }> {
    const fullPath = path.resolve(directory);
    
    if (!fs.existsSync(fullPath)) {
      return { files: 0, size: 0 };
    }

    let fileCount = 0;
    let totalSize = 0;

    try {
      const files = fs.readdirSync(fullPath, { withFileTypes: true });

      for (const file of files) {
        if (file.isFile() && file.name !== '.gitkeep') {
          const filePath = path.join(fullPath, file.name);
          const stats = fs.statSync(filePath);
          fileCount++;
          totalSize += stats.size;
        } else if (file.isDirectory()) {
          const subStats = await this.getDirectoryStats(path.join(directory, file.name));
          fileCount += subStats.files;
          totalSize += subStats.size;
        }
      }

    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas de ${fullPath}:`, error);
    }

    return { files: fileCount, size: totalSize };
  }

  /**
   * Limpieza manual forzada
   */
  async forceCleanup(): Promise<{ message: string; stats: any }> {
    this.logger.log('Iniciando limpieza manual forzada');
    
    const beforeStats = await this.getUploadStats();
    await this.cleanupExpiredFiles();
    const afterStats = await this.getUploadStats();

    const cleanedFiles = beforeStats.total.files - afterStats.total.files;
    const cleanedSize = beforeStats.total.size - afterStats.total.size;

    return {
      message: `Limpieza completada: ${cleanedFiles} archivos eliminados, ${Math.round(cleanedSize / 1024)} KB liberados`,
      stats: {
        before: beforeStats,
        after: afterStats,
        cleaned: {
          files: cleanedFiles,
          size: cleanedSize
        }
      }
    };
  }

  /**
   * Elimina un archivo específico de forma segura
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        
        if (UploadConfig.logging.logCleanup) {
          this.logger.debug(`Archivo eliminado manualmente: ${filePath}`);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error eliminando archivo ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Mueve un archivo procesado al directorio de procesados
   */
  async moveToProcessed(sourcePath: string, filename: string): Promise<string> {
    const processedDir = path.resolve(UploadConfig.directories.processed);
    
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const targetPath = path.join(processedDir, filename);
    
    try {
      fs.renameSync(sourcePath, targetPath);
      
      if (UploadConfig.logging.logProcessing) {
        this.logger.debug(`Archivo movido a procesados: ${targetPath}`);
      }
      
      return targetPath;
    } catch (error) {
      this.logger.error(`Error moviendo archivo a procesados:`, error);
      throw error;
    }
  }

  /**
   * Mueve un archivo fallido al directorio de fallos
   */
  async moveToFailed(sourcePath: string, filename: string, error?: string): Promise<string> {
    const failedDir = path.resolve(UploadConfig.directories.failed);
    
    if (!fs.existsSync(failedDir)) {
      fs.mkdirSync(failedDir, { recursive: true });
    }

    const targetPath = path.join(failedDir, filename);
    
    try {
      fs.renameSync(sourcePath, targetPath);
      
      // Crear archivo de log con el error
      if (error) {
        const errorLogPath = targetPath + '.error.log';
        fs.writeFileSync(errorLogPath, `Error: ${error}\nTimestamp: ${new Date().toISOString()}\n`);
      }
      
      if (UploadConfig.logging.logProcessing) {
        this.logger.debug(`Archivo movido a fallos: ${targetPath}`);
      }
      
      return targetPath;
    } catch (moveError) {
      this.logger.error(`Error moviendo archivo a fallos:`, moveError);
      throw moveError;
    }
  }

  /**
   * Limpia archivos de un tipo específico
   */
  async cleanupByType(type: string): Promise<{ filesDeleted: number; errors: string[] }> {
    const stats = { filesDeleted: 0, errors: [] };
    
    try {
      let directory: string;
      let maxAge: number;

      // Mapear tipo a directorio y configuración
      switch (type) {
        case 'temp':
          directory = UploadConfig.directories.temp;
          maxAge = UploadConfig.cleanup.tempFileMaxAge;
          break;
        case 'processed':
          directory = UploadConfig.directories.processed;
          maxAge = UploadConfig.cleanup.processedFileMaxAge;
          break;
        case 'failed':
          directory = UploadConfig.directories.failed;
          maxAge = UploadConfig.cleanup.failedFileMaxAge;
          break;
        default:
          throw new Error(`Tipo de limpieza no válido: ${type}`);
      }

      stats.filesDeleted = await this.cleanupDirectory(directory, maxAge);
      
      if (UploadConfig.logging.logCleanup) {
        this.logger.log(`Limpieza manual de ${type}: ${stats.filesDeleted} archivos eliminados`);
      }

    } catch (error) {
      const errorMsg = `Error en limpieza de ${type}: ${error.message}`;
      stats.errors.push(errorMsg);
      this.logger.error(errorMsg);
    }

    return stats;
  }
}
