FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js", "-H", "0.0.0.0", "-p", "3000", "-c", "cache"]
