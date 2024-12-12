FROM node:16

WORKDIR /app/frontend

COPY ./package.json .
COPY ./package-lock.json .

RUN npm install
RUN npm install react-flow-renderer
RUN npm install -g serve

COPY . .

RUN npm run build

ENV PORT=5000
EXPOSE 5000

#CMD ["serve", "-s", "build", "-l", "5000"]
CMD [ "npm", "run", "start-watch"]