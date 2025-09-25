<#
.SYNOPSIS
    Script de validacion para verificar la configuracion antes del despliegue

.DESCRIPTION
    Este script valida que todos los componentes esten correctamente configurados
    antes de ejecutar el despliegue principal.

.NOTES
    Autor: Sistema de Despliegue Automatizado
    Version: 1.0
#>

$ErrorActionPreference = "Continue"

# Funciones auxiliares
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Check {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Cyan"
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

# Validar estructura del proyecto
function Test-ProjectStructure {
    Write-Check "Validando estructura del proyecto"
    
    $requiredPaths = @(
        "../backend/package.json",
        "../backend/Dockerfile",
        "../backend/.env.example",
        "../frontend/package.json",
        "../frontend/vite.config.ts",
        "../frontend/.env.production"
    )
    
    $allGood = $true
    
    foreach ($path in $requiredPaths) {
        if (Test-Path $path) {
            Write-Success "Encontrado: $path"
        } else {
            Write-Error "Faltante: $path"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Validar configuracion del backend
function Test-BackendConfig {
    Write-Check "Validando configuracion del backend"
    
    $packageJsonPath = "../backend/package.json"
    $dockerfilePath = "../backend/Dockerfile"
    
    $allGood = $true
    
    # Verificar package.json
    if (Test-Path $packageJsonPath) {
        try {
            $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
            
            if ($packageJson.scripts.build) {
                Write-Success "Script 'build' encontrado en package.json"
            } else {
                Write-Warning "Script 'build' no encontrado en package.json"
            }
            
            if ($packageJson.scripts.start) {
                Write-Success "Script 'start' encontrado en package.json"
            } else {
                Write-Error "Script 'start' no encontrado en package.json"
                $allGood = $false
            }
            
            # Verificar dependencias criticas
            $criticalDeps = @("@nestjs/core", "@nestjs/common", "mysql2")
            foreach ($dep in $criticalDeps) {
                if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
                    Write-Success "Dependencia encontrada: $dep"
                } else {
                    Write-Warning "Dependencia no encontrada: $dep"
                }
            }
            
        } catch {
            Write-Error "Error al leer package.json del backend: $($_.Exception.Message)"
            $allGood = $false
        }
    }
    
    # Verificar Dockerfile
    if (Test-Path $dockerfilePath) {
        $dockerfileContent = Get-Content $dockerfilePath -Raw
        
        if ($dockerfileContent -match "FROM node:") {
            Write-Success "Dockerfile usa imagen base de Node.js"
        } else {
            Write-Warning "Dockerfile no parece usar imagen base de Node.js"
        }
        
        if ($dockerfileContent -match "EXPOSE \d+") {
            Write-Success "Dockerfile expone un puerto"
        } else {
            Write-Warning "Dockerfile no expone ningun puerto"
        }
        
        if ($dockerfileContent -match "CMD|ENTRYPOINT") {
            Write-Success "Dockerfile tiene comando de inicio"
        } else {
            Write-Error "Dockerfile no tiene comando de inicio (CMD o ENTRYPOINT)"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Validar configuracion del frontend
function Test-FrontendConfig {
    Write-Check "Validando configuracion del frontend"
    
    $packageJsonPath = "../frontend/package.json"
    $viteConfigPath = "../frontend/vite.config.ts"
    
    $allGood = $true
    
    # Verificar package.json
    if (Test-Path $packageJsonPath) {
        try {
            $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
            
            if ($packageJson.scripts.build) {
                Write-Success "Script 'build' encontrado en package.json del frontend"
            } else {
                Write-Error "Script 'build' no encontrado en package.json del frontend"
                $allGood = $false
            }
            
            # Verificar dependencias criticas
            $criticalDeps = @("vite", "react", "@vitejs/plugin-react")
            foreach ($dep in $criticalDeps) {
                if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
                    Write-Success "Dependencia encontrada: $dep"
                } else {
                    Write-Warning "Dependencia no encontrada: $dep"
                }
            }
            
        } catch {
            Write-Error "Error al leer package.json del frontend: $($_.Exception.Message)"
            $allGood = $false
        }
    }
    
    # Verificar configuracion de Vite
    if (Test-Path $viteConfigPath) {
        Write-Success "Archivo vite.config.ts encontrado"
    } else {
        Write-Warning "Archivo vite.config.ts no encontrado"
    }
    
    return $allGood
}

# Validar herramientas del sistema
function Test-SystemTools {
    Write-Check "Validando herramientas del sistema"
    
    $allGood = $true
    
    # Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $versionNumber = $nodeVersion -replace 'v', ''
            $majorVersion = [int]($versionNumber.Split('.')[0])
            if ($majorVersion -ge 18) {
                Write-Success "Node.js: $nodeVersion (>= v18)"
            } else {
                Write-Error "Node.js: $nodeVersion (Se requiere >= v18)"
                $allGood = $false
            }
        }
    } catch {
        Write-Error "Node.js no encontrado"
        $allGood = $false
    }
    
    # npm
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm: v$npmVersion"
        }
    } catch {
        Write-Error "npm no encontrado"
        $allGood = $false
    }
    
    # Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Success "Docker: $dockerVersion"
            
            # Verificar que Docker este ejecutandose
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker esta ejecutandose"
            } else {
                Write-Error "Docker instalado pero no esta ejecutandose"
                $allGood = $false
            }
        }
    } catch {
        Write-Error "Docker no encontrado"
        $allGood = $false
    }
    
    # PowerShell
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-Success "PowerShell: v$($psVersion.Major).$($psVersion.Minor)"
    } else {
        Write-Warning "PowerShell: v$($psVersion.Major).$($psVersion.Minor) (Se recomienda v7+)"
    }
    
    return $allGood
}

# Validar permisos de archivos
function Test-FilePermissions {
    Write-Check "Validando permisos de archivos"
    
    $testPaths = @(
        "../backend",
        "../frontend",
        "."
    )
    
    $allGood = $true
    
    foreach ($path in $testPaths) {
        try {
            # Intentar crear un archivo temporal
            $testFile = Join-Path $path "temp_permission_test.tmp"
            "test" | Out-File -FilePath $testFile -ErrorAction Stop
            Remove-Item $testFile -Force -ErrorAction SilentlyContinue
            Write-Success "Permisos de escritura OK en: $path"
        } catch {
            Write-Error "Sin permisos de escritura en: $path"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Funcion principal de validacion
function Main {
    Write-ColorOutput "`n[INFO] Validacion de Configuracion - Planificacion Academica" "Magenta"
    Write-ColorOutput "========================================================" "Magenta"
    
    $results = @{
        "ProjectStructure" = Test-ProjectStructure
        "BackendConfig" = Test-BackendConfig
        "FrontendConfig" = Test-FrontendConfig
        "SystemTools" = Test-SystemTools
        "FilePermissions" = Test-FilePermissions
    }
    
    Write-ColorOutput "`n[RESUMEN] Resumen de Validacion" "Yellow"
    Write-ColorOutput "========================" "Yellow"
    
    $allPassed = $true
    foreach ($test in $results.Keys) {
        if ($results[$test]) {
            Write-Success "${test}: PASO"
        } else {
            Write-Error "${test}: FALLO"
            $allPassed = $false
        }
    }
    
    Write-ColorOutput "`n" "White"
    
    if ($allPassed) {
        Write-ColorOutput "[EXITO] ¡Todas las validaciones pasaron exitosamente!" "Green"
        Write-ColorOutput "[OK] El sistema esta listo para ejecutar el despliegue." "Green"
        Write-ColorOutput "`n[INFO] Ejecute: .\deploy-aws.ps1" "Cyan"
    } else {
        Write-ColorOutput "[ERROR] Algunas validaciones fallaron." "Red"
        Write-ColorOutput "[ACCION] Por favor corrija los problemas antes de continuar." "Yellow"
        exit 1
    }
}

# Ejecutar validación
if ($MyInvocation.InvocationName -ne '.') {
    Main
}