FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# frontend source code
COPY . /app
RUN npm run build

RUN npm i -g serve

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
