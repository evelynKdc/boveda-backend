# --- Etapa 1: Builder ---
# Usamos una imagen de Node 20 con Alpine (ligera)
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los manifiestos del proyecto
COPY package.json yarn.lock ./

# Instalamos TODAS las dependencias (incluyendo devDependencies)
# Usamos --frozen-lockfile para asegurar builds reproducibles
RUN yarn install --frozen-lockfile

# Copiamos el resto del código fuente
COPY . .

# Compilamos la aplicación
RUN yarn run build

# --- Etapa 2: Producción ---
# Empezamos de nuevo desde una imagen limpia
FROM node:20-alpine

WORKDIR /app

# Copiamos los manifiestos de nuevo
COPY package.json yarn.lock ./

# Esta vez, instalamos SOLO las dependencias de producción
RUN yarn install --production --frozen-lockfile

# Copiamos el código compilado (dist) y los node_modules
# desde la etapa 'builder'
COPY --from=builder /app/dist ./dist

# Exponemos el puerto en el que corre la app [cite: 41]
EXPOSE 3000

# El comando para iniciar la aplicación en producción 
CMD ["node", "dist/main"]