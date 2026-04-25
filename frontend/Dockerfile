FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY next.config.js tsconfig.json next-env.d.ts ./
COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]

