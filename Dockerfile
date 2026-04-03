FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY server.js token.txt ./

EXPOSE 3000

CMD ["node", "server.js"]