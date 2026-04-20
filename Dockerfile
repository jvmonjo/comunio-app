# Etapa 1: Build (Construcció)
FROM node:22-alpine AS builder

WORKDIR /app

# Habilitar corepack per poder usar pnpm fàcilment despatxant la versió del package.json
RUN corepack enable pnpm

# Copiar arxius de dependències
COPY package.json pnpm-lock.yaml ./

# Instal·lar pnpm i les dependències
RUN pnpm install --frozen-lockfile

# Copiar tota la resta del codi
COPY . .

# Fer la build de producció de Nuxt (generarà la carpeta .output per al servidor Nitro)
RUN pnpm build

# Etapa 2: Producció (Execució)
FROM node:22-alpine AS runner

WORKDIR /app

# Per seguretat, evitem executar en mode root
USER node

# Configurar les variables d'entorn crítiques de producció
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copiar el resultat final compilat de l'etapa de build, amb els permisos del nou usuari
COPY --from=builder --chown=node:node /app/.output ./.output

# Exposar el port on escolta el servidor
EXPOSE 3000

# Executar el servidor de backend compilat que genera Nuxt
CMD ["node", ".output/server/index.mjs"]
