/**
 * Servicio para manejar la descarga de plantillas de archivos Excel
 */

class TemplateService {
  private baseUrl = '/templates';

  /**
   * Descarga una plantilla específica
   * @param templateName - Nombre del archivo de plantilla
   * @returns Promise<void>
   */
  async downloadTemplate(templateName: string): Promise<void> {
    try {
      // Crear la URL completa de la plantilla
      const templateUrl = `${this.baseUrl}/${templateName}`;
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = templateUrl;
      link.download = templateName;
      link.style.display = 'none';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Plantilla ${templateName} descargada exitosamente`);
    } catch (error) {
      console.error('Error al descargar la plantilla:', error);
      throw new Error(`No se pudo descargar la plantilla ${templateName}`);
    }
  }

  /**
   * Verifica si una plantilla existe
   * @param templateName - Nombre del archivo de plantilla
   * @returns Promise<boolean>
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      const templateUrl = `${this.baseUrl}/${templateName}`;
      const response = await fetch(templateUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error al verificar la existencia de la plantilla:', error);
      return false;
    }
  }

  /**
   * Obtiene la lista de plantillas disponibles
   * @returns Promise<string[]>
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      // Esta función podría expandirse en el futuro para obtener
      // la lista desde un endpoint del backend
      const templates = [
        'estructura_academica_template.xlsx',
        'reporte_cursables_template.xlsx',
        'nomina_docentes_template.xlsx',
        'adol_template.xlsx',
        'dol_template.xlsx',
        'vacantes_inicio_template.xlsx',
        'ramos_optativos_template.xlsx'
      ];
      
      return templates;
    } catch (error) {
      console.error('Error al obtener las plantillas disponibles:', error);
      return [];
    }
  }

  /**
   * Descarga múltiples plantillas como un archivo ZIP (funcionalidad futura)
   * @param templateNames - Array de nombres de plantillas
   * @returns Promise<void>
   */
  async downloadMultipleTemplates(templateNames: string[]): Promise<void> {
    try {
      // Por ahora, descargar una por una
      for (const templateName of templateNames) {
        await this.downloadTemplate(templateName);
        // Pequeña pausa entre descargas para evitar problemas del navegador
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error al descargar múltiples plantillas:', error);
      throw new Error('No se pudieron descargar todas las plantillas');
    }
  }
}

// Exportar una instancia del servicio
export const templateService = new TemplateService();
export default templateService;