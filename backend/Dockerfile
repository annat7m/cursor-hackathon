FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY .eslintrc.cjs ./

EXPOSE 8080

CMD ["npm", "run", "dev"]

