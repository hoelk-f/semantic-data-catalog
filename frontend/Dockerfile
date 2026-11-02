FROM node:22

WORKDIR /app/frontend

COPY . .

COPY ./package.json .
COPY ./package-lock.json .

RUN npm ci

RUN npm run build

ENV PORT=5000
EXPOSE 5000

CMD [ "npm", "run", "start-watch"]
