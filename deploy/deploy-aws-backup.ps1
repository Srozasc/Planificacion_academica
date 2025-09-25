<#
.SYNOPSIS
    Script de automatizacion para preparar el backend y frontend para despliegue en AWS

.DESCRIPTION
    Este script automatiza la preparacion del proyecto para despliegue en AWS:
    - Backend: Genera imagen Docker para App Runner
    - Frontend: Compila build para S3/CloudFront
    - Genera archivos de configuracion y documentacion

.NOTES
    Autor: Sistema de Despliegue Automatizado
    Version: 1.0
    Fecha: $(Get-Date -Format 'yyyy-MM-dd')
#>

# Configuracion de colores para output
$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Deploy AWS - Planificacion Academica"

# Funciones auxiliares
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n=== $Message ===" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[OK] $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

# Verificar prerrequisitos
function Test-Prerequisites {
    Write-Step "Verificando prerrequisitos"
    
    $allGood = $true
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $versionNumber = $nodeVersion -replace 'v', ''
            $majorVersion = [int]($versionNumber.Split('.')[0])
            if ($majorVersion -ge 18) {
                Write-Success "Node.js encontrado: $nodeVersion"
            } else {
                Write-Error "Node.js version $nodeVersion encontrada, pero se requiere v18 o superior"
                $allGood = $false
            }
        }
    } catch {
        Write-Error "Node.js no encontrado. Por favor instale Node.js v18 o superior desde https://nodejs.org/"
        $allGood = $false
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm encontrado: v$npmVersion"
        }
    } catch {
        Write-Error "npm no encontrado"
        $allGood = $false
    }
    
    # Verificar Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Success "Docker encontrado: $dockerVersion"
            
            # Verificar que Docker este ejecutandose
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker esta ejecutandose correctamente"
            } else {
                Write-Error "Docker esta instalado pero no esta ejecutandose. Por favor inicie Docker Desktop"
                $allGood = $false
            }
        }
    } catch {
        Write-Error "Docker no encontrado. Por favor instale Docker Desktop desde https://www.docker.com/products/docker-desktop"
        $allGood = $false
    }
    
    if (-not $allGood) {
        Write-Error "`nPor favor instale los prerrequisitos faltantes antes de continuar."
        exit 1
    }
    
    Write-Success "Todos los prerrequisitos estan instalados correctamente`n"
}

# Solicitar datos del backend
function Get-BackendConfig {
    Write-Step "Configuracion del Backend"
    
    $config = @{}
    
    Write-ColorOutput "Ingrese la configuracion de la base de datos:" "Yellow"
    $config.DB_HOST = Read-Host "Host de la base de datos (ej: mydb.amazonaws.com)"
    $config.DB_PORT = Read-Host "Puerto de la base de datos (por defecto: 3306)"
    if ([string]::IsNullOrWhiteSpace($config.DB_PORT)) { $config.DB_PORT = "3306" }
    
    $config.DB_USERNAME = Read-Host "Usuario de la base de datos"
    $config.DB_PASSWORD = Read-Host "Contrasena de la base de datos" -AsSecureString
    $config.DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($config.DB_PASSWORD))
    $config.DB_NAME = Read-Host "Nombre de la base de datos"
    
    Write-ColorOutput "`nConfiguracion de seguridad:" "Yellow"
    $config.JWT_SECRET = Read-Host "JWT Secret (minimo 32 caracteres)" -AsSecureString
    $config.JWT_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($config.JWT_SECRET))
    
    if ($config.JWT_SECRET.Length -lt 32) {
        Write-Warning "JWT Secret muy corto. Generando uno seguro..."
        $config.JWT_SECRET = [System.Web.Security.Membership]::GeneratePassword(64, 10)
        Write-Success "JWT Secret generado automaticamente"
    }
    
    $config.JWT_EXPIRES_IN = Read-Host "Tiempo de expiracion JWT (por defecto: 24h)"
    if ([string]::IsNullOrWhiteSpace($config.JWT_EXPIRES_IN)) { $config.JWT_EXPIRES_IN = "24h" }
    
    Write-ColorOutput "`nConfiguracion del servidor:" "Yellow"
    $config.PORT = Read-Host "Puerto del servidor (por defecto: 3000)"
    if ([string]::IsNullOrWhiteSpace($config.PORT)) { $config.PORT = "3000" }
    
    $config.HOST = Read-Host "Host del servidor (por defecto: 0.0.0.0)"
    if ([string]::IsNullOrWhiteSpace($config.HOST)) { $config.HOST = "0.0.0.0" }
    
    $config.NODE_ENV = "production"
    
    Write-ColorOutput "`nConfiguracion CORS:" "Yellow"
    $config.CORS_ORIGIN = Read-Host "URL del frontend (ej: https://mi-app.cloudfront.net)"
    $config.CORS_ORIGINS = $config.CORS_ORIGIN
    
    Write-ColorOutput "`nConfiguracion Docker:" "Yellow"
    $config.DOCKER_IMAGE_NAME = Read-Host "Nombre de la imagen Docker (por defecto: planificacion-backend)"
    if ([string]::IsNullOrWhiteSpace($config.DOCKER_IMAGE_NAME)) { $config.DOCKER_IMAGE_NAME = "planificacion-backend" }
    
    $config.DOCKER_TAG = Read-Host "Tag de la imagen (por defecto: latest)"
    if ([string]::IsNullOrWhiteSpace($config.DOCKER_TAG)) { $config.DOCKER_TAG = "latest" }
    
    $config.UPLOAD_MAX_SIZE = "50mb"
    
    return $config
}

# Solicitar datos del frontend
function Get-FrontendConfig {
    Write-Step "Configuracion del Frontend"
    
    $config = @{}
    
    Write-ColorOutput "Ingrese la configuracion del frontend:" "Yellow"
    $config.VITE_API_URL = Read-Host "URL de la API del backend (ej: https://mi-backend.amazonaws.com/api)"
    
    return $config
}

# Crear archivo .env para el backend
function New-BackendEnvFile {
    param([hashtable]$Config)
    
    Write-Step "Creando archivo de configuracion del backend"
    
    $envContent = @"
# Configuracion de Base de Datos
DB_HOST=$($Config.DB_HOST)
DB_PORT=$($Config.DB_PORT)
DB_USERNAME=$($Config.DB_USERNAME)
DB_PASSWORD=$($Config.DB_PASSWORD)
DB_NAME=$($Config.DB_NAME)

# Configuracion JWT
JWT_SECRET=$($Config.JWT_SECRET)
JWT_EXPIRES_IN=$($Config.JWT_EXPIRES_IN)

# Configuracion del Servidor
HOST=$($Config.HOST)
PORT=$($Config.PORT)
NODE_ENV=$($Config.NODE_ENV)

# Configuracion CORS
CORS_ORIGIN=$($Config.CORS_ORIGIN)
CORS_ORIGINS=$($Config.CORS_ORIGINS)

# Configuracion de Uploads
UPLOAD_MAX_SIZE=$($Config.UPLOAD_MAX_SIZE)
"@
    
    $envPath = "../backend/.env.docker"
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Success "Archivo .env.docker creado para el backend"
    
    return $envPath
}

# Crear archivo .env para el frontend
function New-FrontendEnvFile {
    param([hashtable]$Config)
    
    Write-Step "Creando archivo de configuracion del frontend"
    
    $envContent = "VITE_API_URL=$($Config.VITE_API_URL)"
    
    $envPath = "../frontend/.env.production.deploy"
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Success "Archivo .env.production.deploy creado para el frontend"
    
    return $envPath
}

# Construir imagen Docker del backend
function Build-BackendDocker {
    param(
        [hashtable]$Config,
        [string]$EnvFile
    )
    
    Write-Step "Construyendo imagen Docker del backend"
    
    $imageName = "$($Config.DOCKER_IMAGE_NAME):$($Config.DOCKER_TAG)"
    
    try {
        Set-Location "../backend"
        
        Write-ColorOutput "Construyendo imagen: $imageName" "Yellow"
        docker build -t $imageName . --no-cache
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Imagen Docker construida exitosamente: $imageName"
            
            # Exportar imagen a archivo tar
            Write-ColorOutput "Exportando imagen a archivo tar..." "Yellow"
            docker save -o "../deploy/backend-image.tar" $imageName
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Imagen exportada a: backend-image.tar"
            } else {
                throw "Error al exportar la imagen Docker"
            }
        } else {
            throw "Error al construir la imagen Docker"
        }
    } catch {
        Write-Error "`nError durante el proceso de despliegue: $($_.Exception.Message)"
        throw
    } finally {
        Set-Location "../deploy"
    }
}

# Compilar frontend
function Build-Frontend {
    param([string]$EnvFile)
    
    Write-Step "Compilando frontend"
    
    try {
        Set-Location "../frontend"
        
        # Instalar dependencias
        Write-ColorOutput "Instalando dependencias del frontend..." "Yellow"
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            throw "Error al instalar dependencias del frontend"
        }
        
        Write-Success "Dependencias instaladas correctamente"
        
        # Copiar archivo de configuracion
        Copy-Item ".env.production.deploy" ".env.production" -Force
        
        # Compilar proyecto
        Write-ColorOutput "Compilando proyecto..." "Yellow"
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            throw "Error al compilar el frontend"
        }
        
        Write-Success "Frontend compilado exitosamente"
        
        # Copiar carpeta dist
        Write-ColorOutput "Copiando build del frontend..." "Yellow"
        if (Test-Path "dist") {
            $destPath = "../deploy/frontend-dist"
            if (Test-Path $destPath) {
                Remove-Item $destPath -Recurse -Force
            }
            Copy-Item "dist" $destPath -Recurse -Force
            Write-Success "Build del frontend copiado en: frontend-dist/"
        } else {
            throw "Carpeta 'dist' no encontrada despues de la compilacion"
        }
        
    } catch {
        Write-Error "Error en la compilacion del frontend: $($_.Exception.Message)"
        throw
    } finally {
        # Restaurar archivo original
        if (Test-Path ".env.production.deploy") {
            Remove-Item ".env.production.deploy" -Force -ErrorAction SilentlyContinue
        }
        Set-Location "../deploy"
    }
}

# Generar documentacion de despliegue
function New-DeploymentDocs {
    param(
        [hashtable]$BackendConfig,
        [hashtable]$FrontendConfig
    )
    
    Write-Step "Generando documentacion de despliegue"
    
    $deploymentInstructions = @"
# Instrucciones de Despliegue en AWS

Generado el: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Archivos generados:

- backend-image.tar - Imagen Docker del backend
- frontend-dist/ - Build compilado del frontend (carpeta)
- docker-commands.txt - Comandos Docker de referencia

## Despliegue del Backend (AWS App Runner)

### 1. Cargar imagen Docker

```bash
# Cargar imagen desde archivo tar
docker load -i backend-image.tar

# Verificar que la imagen se cargo correctamente
docker images | grep $($BackendConfig.DOCKER_IMAGE_NAME)
```

### 2. Subir a Amazon ECR

```bash
# Autenticarse en ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Crear repositorio (si no existe)
aws ecr create-repository --repository-name $($BackendConfig.DOCKER_IMAGE_NAME) --region us-east-1

# Etiquetar imagen para ECR
docker tag $($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG) <account-id>.dkr.ecr.us-east-1.amazonaws.com/$($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)

# Subir imagen
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/$($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)
```

### 3. Configurar App Runner

1. Ir a AWS App Runner en la consola
2. Crear nuevo servicio
3. Seleccionar "Container registry" como fuente
4. Configurar:
   - Repository type: Amazon ECR
   - Container image URI: <account-id>.dkr.ecr.us-east-1.amazonaws.com/$($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)
   - Port: $($BackendConfig.PORT)

### Variables de entorno para App Runner:

```
DB_HOST=$($BackendConfig.DB_HOST)
DB_PORT=$($BackendConfig.DB_PORT)
DB_USERNAME=$($BackendConfig.DB_USERNAME)
DB_PASSWORD=[CONFIGURAR_EN_AWS_SECRETS_MANAGER]
DB_NAME=$($BackendConfig.DB_NAME)
JWT_SECRET=[CONFIGURAR_EN_AWS_SECRETS_MANAGER]
JWT_EXPIRES_IN=$($BackendConfig.JWT_EXPIRES_IN)
HOST=$($BackendConfig.HOST)
PORT=$($BackendConfig.PORT)
NODE_ENV=$($BackendConfig.NODE_ENV)
CORS_ORIGIN=$($BackendConfig.CORS_ORIGIN)
CORS_ORIGINS=$($BackendConfig.CORS_ORIGINS)
UPLOAD_MAX_SIZE=$($BackendConfig.UPLOAD_MAX_SIZE)
```

**IMPORTANTE:** Por seguridad, configure DB_PASSWORD y JWT_SECRET usando AWS Secrets Manager.

## Despliegue del Frontend (S3 + CloudFront)

### 1. Extraer archivos del frontend

```bash
# Extraer contenido del zip
# La carpeta frontend-dist/ contiene todos los archivos listos para S3
```

### 2. Subir a S3

```bash
# Crear bucket S3 (si no existe)
aws s3 mb s3://mi-app-frontend-bucket --region us-east-1

# Configurar bucket para hosting estatico
aws s3 website s3://mi-app-frontend-bucket --index-document index.html --error-document index.html

# Subir archivos
aws s3 sync frontend-files/ s3://mi-app-frontend-bucket --delete

# Configurar permisos publicos (si es necesario)
aws s3api put-bucket-policy --bucket mi-app-frontend-bucket --policy file://bucket-policy.json
```

### 3. Configurar CloudFront

1. Crear distribucion CloudFront
2. Configurar origen: S3 bucket
3. Configurar comportamientos para SPA (Single Page Application)
4. Configurar paginas de error personalizadas para redirigir a index.html

## Configuracion de Base de Datos

Asegurese de que su base de datos RDS este configurada con:
- Security Groups que permitan conexiones desde App Runner
- Credenciales almacenadas en AWS Secrets Manager
- Backup automatico habilitado

## Verificacion del Despliegue

1. **Backend**: Verificar que App Runner este ejecutandose y responda en /health
2. **Frontend**: Verificar que CloudFront sirva la aplicacion correctamente
3. **Conectividad**: Verificar que el frontend pueda comunicarse con el backend

## URLs de Configuracion

- **API Backend**: $($FrontendConfig.VITE_API_URL)
- **Frontend**: $($BackendConfig.CORS_ORIGIN)

## Notas de Seguridad

- Todas las contrasenas y secretos deben almacenarse en AWS Secrets Manager
- Configure HTTPS en CloudFront
- Habilite WAF en CloudFront para proteccion adicional
- Configure logs de acceso en S3 y CloudWatch

"@
    
    $deploymentInstructions | Out-File -FilePath "deployment-instructions.md" -Encoding UTF8
    Write-Success "Instrucciones de despliegue generadas: deployment-instructions.md"
    
    # Generar comandos Docker de referencia
    $dockerCommands = @"
# Comandos Docker de Referencia

## Imagen generada:
$($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)

## Comandos utiles:

# Cargar imagen desde archivo
docker load -i backend-image.tar

# Ejecutar contenedor localmente para pruebas
docker run -p $($BackendConfig.PORT):$($BackendConfig.PORT) --env-file ../backend/.env.docker $($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)

# Ver logs del contenedor
docker logs <container-id>

# Inspeccionar imagen
docker inspect $($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)

# Listar imagenes
docker images | grep $($BackendConfig.DOCKER_IMAGE_NAME)

# Eliminar imagen (si es necesario)
docker rmi $($BackendConfig.DOCKER_IMAGE_NAME):$($BackendConfig.DOCKER_TAG)
"@
    
    $dockerCommands | Out-File -FilePath "docker-commands.txt" -Encoding UTF8
    Write-Success "Comandos Docker generados: docker-commands.txt"
}

# Limpiar archivos temporales
function Clear-TempFiles {
    Write-Step "Limpiando archivos temporales"
    
    $tempFiles = @(
        "../backend/.env.docker",
        "../frontend/.env.production.deploy"
    )
    
    foreach ($file in $tempFiles) {
        if (Test-Path $file) {
            Remove-Item $file -Force -ErrorAction SilentlyContinue
            Write-Success "Eliminado: $file"
        }
    }
}

# Funcion principal
function Main {
    try {
        Write-ColorOutput "`n[DEPLOY] Script de Despliegue AWS - Planificacion Academica" "Magenta"
        Write-ColorOutput "================================================" "Magenta"
        
        # Verificar prerrequisitos
        Test-Prerequisites
        
        # Obtener configuraciones
        $backendConfig = Get-BackendConfig
        $frontendConfig = Get-FrontendConfig
        
        # Crear archivos de configuracion
        $backendEnvFile = New-BackendEnvFile -Config $backendConfig
        $frontendEnvFile = New-FrontendEnvFile -Config $frontendConfig
        
        # Construir backend
        Build-BackendDocker -Config $backendConfig -EnvFile $backendEnvFile
        
        # Compilar frontend
        Build-Frontend -EnvFile $frontendEnvFile
        
        # Generar documentacion
        New-DeploymentDocs -BackendConfig $backendConfig -FrontendConfig $frontendConfig
        
        # Limpiar archivos temporales
        Clear-TempFiles
        
        Write-Step "¡Despliegue preparado exitosamente!"
        Write-Success "Archivos generados en la carpeta 'deploy':"
        Write-ColorOutput "  • backend-image.tar" "Green"
        Write-ColorOutput "  • frontend-dist/" "Green"
        Write-ColorOutput "  • deployment-instructions.md" "Green"
        Write-ColorOutput "  • docker-commands.txt" "Green"
        
        Write-ColorOutput "`n📖 Consulte 'deployment-instructions.md' para los pasos de despliegue en AWS." "Yellow"
        
    } catch {
        Write-Error "`nError durante el proceso de despliegue: $($_.Exception.Message)"
        Clear-TempFiles
        exit 1
    }
}

# Ejecutar script principal
if ($MyInvocation.InvocationName -ne '.') {
    Main
}