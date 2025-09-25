# Ejemplo de Configuracion para Despliegue

Este archivo muestra ejemplos de la informacion que necesitara proporcionar durante el proceso de despliegue.

## Configuracion del Backend

### Base de Datos
```
Host de la base de datos: myapp-db.cluster-xyz123.us-east-1.rds.amazonaws.com
Puerto de la base de datos: 3306
Usuario de la base de datos: admin
Contrasena de la base de datos: [Su contrasena segura]
Nombre de la base de datos: planificacion_academica
```

### Seguridad JWT
```
JWT Secret: [Minimo 32 caracteres - se puede generar automaticamente]
Tiempo de expiracion JWT: 24h
```

### Configuracion del Servidor
```
Puerto del servidor: 3000
Host del servidor: 0.0.0.0
```

### CORS
```
URL del frontend: https://d1234567890abc.cloudfront.net
```

### Docker
```
Nombre de la imagen Docker: planificacion-backend
Tag de la imagen: latest
```

## Configuracion del Frontend

### API
```
URL de la API del backend: https://abc123def456.us-east-1.awsapprunner.com/api
```

## Notas Importantes

### URLs de Ejemplo

- **RDS Endpoint**: `myapp-db.cluster-xyz123.us-east-1.rds.amazonaws.com`
- **App Runner URL**: `https://abc123def456.us-east-1.awsapprunner.com`
- **CloudFront URL**: `https://d1234567890abc.cloudfront.net`
- **S3 Bucket**: `mi-app-frontend-bucket`

### Consideraciones de Seguridad

1. **Contrasenas**: Use contrasenas fuertes y unicas
2. **JWT Secret**: Debe ser aleatorio y de al menos 32 caracteres
3. **CORS**: Configure solo los dominios necesarios
4. **HTTPS**: Siempre use HTTPS en produccion

### Flujo de URLs

```
Usuario → CloudFront → S3 (Frontend)
         ↓
         App Runner (Backend) → RDS (Base de Datos)
```

### Preparacion Previa

Antes de ejecutar el script, asegurese de tener:

1. **Base de datos RDS** creada y configurada
2. **Dominio o subdominio** para el frontend (opcional)
3. **Credenciales AWS** configuradas localmente
4. **Permisos IAM** para ECR, App Runner, S3, y CloudFront

### Servicios AWS Requeridos

- **Amazon RDS** (MySQL) - Base de datos
- **Amazon ECR** - Registro de contenedores
- **AWS App Runner** - Hosting del backend
- **Amazon S3** - Almacenamiento del frontend
- **Amazon CloudFront** - CDN para el frontend
- **AWS Secrets Manager** - Gestion de secretos (recomendado)

### Costos Estimados (USD/mes)

- **RDS (db.t3.micro)**: ~$15-20
- **App Runner (0.25 vCPU, 0.5 GB)**: ~$10-15
- **S3 + CloudFront**: ~$1-5
- **ECR**: ~$1

**Total estimado**: $27-41/mes (puede variar segun uso)

### Tiempo de Despliegue Estimado

- **Preparacion del script**: 5-10 minutos
- **Construccion Docker**: 3-5 minutos
- **Compilacion Frontend**: 2-3 minutos
- **Despliegue manual en AWS**: 15-30 minutos

**Total**: 25-48 minutos aproximadamente