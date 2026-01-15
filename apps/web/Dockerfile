# apps/web/Dockerfile

# UPGRADE: Pakai Node 22 (LTS Jod)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]