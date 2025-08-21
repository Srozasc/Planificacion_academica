# Guía de Testing para el Proceso de Limpieza de Bimestres

Esta guía explica cómo usar los scripts de testing para verificar que el proceso automático de limpieza de bimestres funcione correctamente.

## 📁 Archivos de Testing Disponibles

### 1. `test-cleanup-process.js` - Testing Completo
**Propósito**: Ejecuta una suite completa de tests para verificar todos los componentes del sistema de limpieza.

**Qué prueba**:
- ✅ Existencia del Stored Procedure
- ✅ Estructura de la tabla de logs
- ✅ Funcionamiento del SP con datos de prueba
- ✅ Endpoint de la API
- ✅ Configuración del Cron Job
- ✅ Restauración automática de datos

### 2. `test-cron-immediate.js` - Testing del Cron Job
**Propósito**: Prueba específicamente el cron job modificando temporalmente su programación para ejecutarse cada minuto.

**Qué hace**:
- 🔧 Modifica temporalmente el servicio
- ⏰ Cambia el cron de anual a cada minuto
- 👀 Monitorea ejecuciones en tiempo real
- 🔄 Restaura la configuración original

---

## 🚀 Cómo Ejecutar los Tests

### Prerrequisitos

1. **Base de datos configurada**:
   ```bash
   # Asegúrate de que la BD esté ejecutándose
   # y que las credenciales estén en las variables de entorno
   ```

2. **Dependencias instaladas**:
   ```bash
   cd backend
   npm install
   
   # Instalar dependencias adicionales para testing
   npm install mysql2 axios
   ```

3. **Variables de entorno** (opcional):
   ```bash
   # Crear archivo .env en la raíz del proyecto
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=planificacion_academica
   API_URL=http://localhost:3000/api
   NODE_ENV=development
   ```

### Opción 1: Testing Completo (Recomendado)

```bash
# Desde la raíz del proyecto
node scripts/test-cleanup-process.js
```

**Este script**:
- ✅ No requiere que el backend esté ejecutándose
- ✅ Crea y restaura datos automáticamente
- ✅ Genera un reporte detallado
- ✅ Es seguro para ejecutar múltiples veces

**Salida esperada**:
```
🚀 Iniciando Testing del Proceso de Limpieza de Bimestres

✅ Conexión a base de datos establecida

📋 Test 1: Verificando existencia del Stored Procedure...
✅ Stored Procedure sp_cleanup_old_bimestres existe

📋 Test 2: Verificando tabla de logs...
✅ Tabla cleanup_logs existe
✅ Estructura de tabla cleanup_logs es correcta

... (más tests)

📊 REPORTE FINAL DE TESTING
=============================================================
📈 Resumen:
   Total de tests: 6
   ✅ Exitosos: 6
   ❌ Fallidos: 0
   📊 Tasa de éxito: 100.0%
```

### Opción 2: Testing del Cron Job en Tiempo Real

⚠️ **IMPORTANTE**: Solo usar en desarrollo

```bash
# Desde la raíz del proyecto
node scripts/test-cron-immediate.js
```

**Pasos del proceso**:
1. El script pedirá confirmación (escribir `y` y presionar Enter)
2. Modificará temporalmente el archivo del servicio
3. Te pedirá que reinicies el backend manualmente
4. Monitoreará las ejecuciones por 3 minutos
5. Restaurará automáticamente la configuración original

**Instrucciones durante la ejecución**:
```
🔄 Reiniciando backend para aplicar cambios...
⚠️ INSTRUCCIÓN MANUAL:
   1. Detén el servidor backend (Ctrl+C en la terminal del backend)
   2. Ejecuta: npm run start:dev
   3. Espera a que el servidor inicie completamente
   4. Presiona ENTER aquí para continuar...
```

---

## 📊 Interpretación de Resultados

### Tests Exitosos ✅

Si todos los tests pasan, verás:
```
💡 Recomendaciones:
   🎉 ¡Todos los tests pasaron! El sistema está listo para producción.
   📅 Próximos pasos:
      - Desplegar en ambiente de staging
      - Configurar monitoreo y alertas
      - Programar primera ejecución de prueba
```

### Tests Fallidos ❌

Si hay tests fallidos, verás detalles específicos:
```
⚠️ Hay tests fallidos que deben corregirse antes del despliegue:
   - SP_EXISTS: Stored Procedure no encontrado
   - LOGS_TABLE: Faltan columnas: execution_date, status
```

### Problemas Comunes y Soluciones

#### 1. Error de Conexión a BD
```
❌ Error conectando a la base de datos: Access denied
```
**Solución**: Verificar credenciales en variables de entorno o archivo .env

#### 2. Stored Procedure No Existe
```
❌ Stored Procedure sp_cleanup_old_bimestres NO existe
```
**Solución**: Ejecutar el script de creación del SP desde `PLAN_LIMPIEZA_BIMESTRES.md`

#### 3. Tabla de Logs No Existe
```
❌ Tabla cleanup_logs NO existe
```
**Solución**: Crear la tabla usando el script SQL del plan de implementación

#### 4. Backend No Disponible
```
⚠️ Servidor no está ejecutándose. Inicia el backend con: npm run start:dev
```
**Solución**: Iniciar el servidor backend en otra terminal

#### 5. Cron Job No Se Ejecuta
```
❌ No se detectaron ejecuciones del cron job
```
**Posibles causas**:
- Backend no está ejecutándose
- Servicio no está registrado correctamente
- Error en la configuración del módulo

---

## 🔧 Configuración Avanzada

### Variables de Entorno Personalizadas

Puedes personalizar la configuración creando un archivo `.env`:

```bash
# .env
DB_HOST=tu_host_personalizado
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos
API_URL=http://localhost:3001/api
NODE_ENV=development
```

### Modificar Parámetros de Testing

Puedes editar los scripts para ajustar:

```javascript
// En test-cleanup-process.js
// Cambiar número de bimestres a mantener
await this.connection.execute('CALL sp_cleanup_old_bimestres(5)'); // En lugar de 10

// En test-cron-immediate.js
// Cambiar duración del monitoreo
const monitorDuration = 5 * 60 * 1000; // 5 minutos en lugar de 3
```

---

## 📝 Archivos Generados

Los scripts generan varios archivos útiles:

### 1. `cleanup-test-report.json`
Reporte detallado en formato JSON con:
- Timestamp de ejecución
- Resumen de resultados
- Detalles de cada test
- Mensajes de error específicos

### 2. `backup-bimestres.json` (temporal)
Backup automático de los datos originales durante las pruebas

### 3. `bimestre-cleanup.service.ts.backup` (temporal)
Backup del archivo de servicio durante el test del cron

---

## 🚨 Precauciones de Seguridad

### ⚠️ NUNCA en Producción
- Los scripts están diseñados SOLO para desarrollo/testing
- Incluyen verificaciones para prevenir ejecución en producción
- Siempre verificar `NODE_ENV` antes de ejecutar

### 🔒 Backup de Datos
- Los scripts crean backups automáticos
- Siempre verificar que los datos se restauren correctamente
- Mantener backups manuales adicionales si es necesario

### 🔧 Modificaciones de Código
- `test-cron-immediate.js` modifica temporalmente el código
- Siempre restaura la configuración original
- En caso de error, restaurar manualmente desde el archivo `.backup`

---

## 🆘 Solución de Problemas

### Si un Test se Cuelga
1. Presionar `Ctrl+C` para interrumpir
2. Los scripts tienen manejo de interrupciones que restauran automáticamente
3. Verificar que no queden archivos `.backup`

### Si los Datos No se Restauran
1. Buscar archivo `backup-bimestres.json` en la carpeta `scripts/`
2. Restaurar manualmente:
   ```javascript
   const backup = require('./backup-bimestres.json');
   // Usar los datos del backup para restaurar
   ```

### Si el Servicio Queda Modificado
1. Buscar archivo `bimestre-cleanup.service.ts.backup`
2. Restaurar manualmente:
   ```bash
   cp backend/src/modules/bimestres/bimestre-cleanup.service.ts.backup backend/src/modules/bimestres/bimestre-cleanup.service.ts
   ```

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs detallados** en `cleanup-test-report.json`
2. **Verificar prerrequisitos** (BD, dependencias, variables de entorno)
3. **Ejecutar tests individuales** para aislar el problema
4. **Consultar documentación** en `PLAN_LIMPIEZA_BIMESTRES.md`
5. **Revisar implementación** del Stored Procedure y servicio

---

## ✅ Checklist Pre-Despliegue

Antes de desplegar a producción, asegúrate de que:

- [ ] `test-cleanup-process.js` pasa todos los tests (100% éxito)
- [ ] `test-cron-immediate.js` detecta ejecuciones del cron
- [ ] Stored Procedure funciona correctamente
- [ ] Tabla de logs se crea y actualiza
- [ ] API endpoints responden correctamente
- [ ] Configuración del cron es la correcta (`0 2 1 1 *`)
- [ ] Variables de entorno de producción están configuradas
- [ ] Backups de producción están configurados
- [ ] Monitoreo y alertas están implementados

¡Con estos tests puedes tener confianza de que el proceso automático funcionará correctamente en producción! 🎉