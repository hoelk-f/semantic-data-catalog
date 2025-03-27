FROM node:16

WORKDIR /app/frontend

COPY . .

COPY ./package.json .
COPY ./package-lock.json .

RUN npm install
RUN npm install n3 vis-network
RUN npm install @inrupt/solid-client-authn-browser
RUN npm install @inrupt/solid-client
RUN npm install @inrupt/vocab-common-rdf
RUN npm install -g serve

RUN npm run build

ENV PORT=5000
EXPOSE 5000

CMD [ "npm", "run", "start-watch"]