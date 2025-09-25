# Script de Despliegue para AWS

Este directorio contiene el script de automatizacion para preparar el backend y frontend del proyecto para despliegue en AWS.

## Archivos incluidos:

- `deploy-aws.ps1` - Script principal de PowerShell para automatizar el despliegue
- `validate-setup.ps1` - Script de validacion de prerrequisitos y configuracion
- `aws-config-examples.json` - Ejemplos de configuracion para servicios AWS
- `README.md` - Este archivo con instrucciones

## Prerrequisitos:

1. **Node.js** (version 18 o superior)
2. **Docker Desktop** instalado y ejecutandose
3. **PowerShell 7+** (recomendado)

## Uso:

### 1. Validar configuracion (recomendado)

```powershell
.\validate-setup.ps1
```

Este script verificara que todos los prerrequisitos esten instalados y que la configuracion del proyecto sea correcta.

### 2. Ejecutar despliegue

```powershell
.\deploy-aws.ps1
```

El script te guiara paso a paso solicitando la informacion necesaria para el despliegue.

## Archivos de salida:

- `backend-image.tar` - Imagen Docker del backend
- `frontend-dist/` - Build compilado del frontend (carpeta)
- `deployment-instructions.md` - Instrucciones detalladas de despliegue
- `docker-commands.txt` - Comandos Docker para referencia