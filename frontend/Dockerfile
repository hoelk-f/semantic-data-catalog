# Verwende ein offizielles Node-Image als Basis
FROM node:16

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und package-lock.json in den Container
COPY package.json package-lock.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Codes
COPY . .

# Baue das Projekt
RUN npm run build

# Setze die Umgebungsvariable für den Produktionsport
ENV PORT=5000

# Exponiere den Port 5000
EXPOSE 5000

# Installiere ein einfaches HTTP-Serverpaket, um den Build bereitzustellen
RUN npm install -g serve

# Starte den Server
CMD ["serve", "-s", "build", "-l", "5000"]
