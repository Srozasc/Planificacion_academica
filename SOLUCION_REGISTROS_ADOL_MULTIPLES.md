# Solución para Múltiples Registros ADOL

## Problema
Después de implementar el cambio en el código, aún aparecen múltiples registros ADOL pendientes en el historial de cargas.

## Causa del Problema
El cambio implementado en el código **solo se aplica a nuevas cargas**, pero:
1. **El servidor backend necesita reiniciarse** para aplicar los cambios en el código
2. **Los registros existentes en la base de datos no se eliminan automáticamente**

## Solución Completa

### Paso 1: Limpiar Registros Existentes

Primero, ejecuta el script de limpieza para eliminar los registros ADOL pendientes duplicados:

```bash
node clean-existing-adol-records.js
```

Este script:
- ✅ Identifica todos los registros ADOL pendientes
- ✅ Mantiene solo el más reciente por bimestre
- ✅ Elimina los registros duplicados
- ✅ Muestra un resumen de la limpieza

### Paso 2: Iniciar el Servidor Backend

Para que el cambio en el código se aplique, inicia el servidor backend:

```bash
cd backend
npm run start:dev
```

**Importante**: El servidor debe estar ejecutándose para que el nuevo comportamiento funcione.

### Paso 3: Verificar el Funcionamiento

Después de completar los pasos anteriores:

1. **Carga un archivo ADOL** en la aplicación
2. **Verifica que solo aparece un registro** en el historial
3. **Carga otro archivo ADOL** para el mismo bimestre
4. **Confirma que el registro anterior se eliminó** y solo aparece el nuevo

## Comportamiento Esperado Después de la Solución

### ✅ Comportamiento Correcto
- Solo **un registro ADOL pendiente por bimestre**
- Al cargar un nuevo archivo ADOL, **el anterior se elimina automáticamente**
- Los registros **aprobados se mantienen intactos**
- Registros de **diferentes bimestres no se afectan entre sí**

### 📋 Ejemplo de Flujo
1. Cargar `ADOL_v1.xlsx` para Bimestre 1 → Aparece 1 registro pendiente
2. Cargar `ADOL_v2.xlsx` para Bimestre 1 → El registro anterior se elimina, aparece solo el nuevo
3. Aprobar `ADOL_v2.xlsx` → El registro cambia a "Aprobado"
4. Cargar `ADOL_v3.xlsx` para Bimestre 1 → El registro aprobado se mantiene, aparece el nuevo pendiente

## Verificación de Estado

### Comprobar Servidor Backend
```bash
# Verificar si el servidor está ejecutándose
netstat -ano | findstr :3000
```

### Comprobar Registros en Base de Datos
```sql
-- Ver registros ADOL actuales
SELECT id, file_name, bimestre_id, approval_status, upload_date 
FROM upload_logs 
WHERE upload_type = 'ADOL' 
ORDER BY bimestre_id, upload_date DESC;
```

## Solución de Problemas

### Si el script de limpieza falla
- **Error de conexión**: Verifica que MySQL esté ejecutándose
- **Error de credenciales**: Modifica las credenciales en `clean-existing-adol-records.js` (líneas 4-8)
- **Error de base de datos**: Verifica que la base de datos `planificacion_academica` exista

### Si el servidor backend no inicia
- **Dependencias**: Ejecuta `npm install` en la carpeta `backend`
- **Puerto ocupado**: Verifica que el puerto 3000 esté libre
- **Variables de entorno**: Verifica la configuración de la base de datos

### Si aún aparecen múltiples registros
- **Servidor no reiniciado**: Asegúrate de que el servidor backend esté ejecutándose con los cambios
- **Cache del navegador**: Refresca la página con Ctrl+F5
- **Registros no limpiados**: Ejecuta nuevamente el script de limpieza

## Archivos Modificados

- ✅ **`backend/src/uploads/uploads.service.ts`**: Implementado el cambio en `logUpload()`
- ✅ **`clean-existing-adol-records.js`**: Script para limpiar registros existentes
- ✅ **`ANALISIS_IMPACTO_CAMBIO_ADOL.md`**: Documentación del análisis

## Próximos Pasos

1. **Ejecutar script de limpieza**
2. **Iniciar servidor backend**
3. **Probar carga de archivos ADOL**
4. **Verificar que solo aparece un registro por bimestre**

---

**Nota**: Una vez completados estos pasos, el problema de múltiples registros ADOL estará completamente resuelto.