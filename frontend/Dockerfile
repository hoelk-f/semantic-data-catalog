FROM node:22

WORKDIR /app/frontend

COPY . .

COPY ./package.json .
COPY ./package-lock.json .

RUN npm ci
RUN npm install --global serve@14.2.6
RUN serve --version

RUN npm run build

ENV PORT=5000
EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=4 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/semantic-data-catalog/').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD [ "npm", "run", "start-watch"]
