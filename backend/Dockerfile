# ---- Etapa 1: "Builder" ----
# Usamos una imagen de Node con todas las herramientas necesarias para compilar.
# 'alpine' es una versión ligera de Linux, ideal para contenedores.
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copiamos los archivos de definición de dependencias.
# El '*' asegura que tanto package.json como package-lock.json se copien.
COPY package*.json ./

# Instalamos TODAS las dependencias, incluidas las de desarrollo (`devDependencies`),
# que son necesarias para la compilación de TypeScript.
RUN npm install

# Copiamos el resto del código fuente de la aplicación.
COPY . .

# Ejecutamos el script de 'build' definido en tu package.json.
# Esto compila el código TypeScript a JavaScript en una carpeta 'dist'.
RUN npm run build

# Removemos las dependencias de desarrollo que ya no son necesarias.
# Esto reduce el tamaño de la carpeta node_modules que copiaremos a la siguiente etapa.
RUN npm prune --production


# ---- Etapa 2: "Producción" ----
# Empezamos desde cero con una imagen de Node limpia y muy ligera.
FROM node:18-alpine

# Establecemos el directorio de trabajo.
WORKDIR /app

# Copiamos solo las dependencias de producción desde la etapa 'builder'.
COPY --from=builder /app/node_modules ./node_modules

# Copiamos solo el código JavaScript compilado desde la etapa 'builder'.
COPY --from=builder /app/dist ./dist

# Exponemos el puerto 3001, que es el puerto por defecto de tu aplicación.
# Esto no abre el puerto, solo le informa a Docker que el contenedor lo escuchará.
EXPOSE 3001

# Definimos el comando que se ejecutará cuando el contenedor se inicie.
# Esto corre tu aplicación NestJS desde el código compilado.
CMD ["node", "dist/src/main"]
