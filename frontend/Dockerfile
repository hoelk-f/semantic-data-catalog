# Use an official Node image as a base
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Install react-flow-renderer
RUN npm install react-flow-renderer

# Copy the rest of the code
COPY . .

# Build the project
RUN npm run build

# Set the environment variable for the production port
ENV PORT=5000

# Expose port 5000
EXPOSE 5000

# Install a simple HTTP server to serve the build
RUN npm install -g serve

# Start the server
CMD ["serve", "-s", "build", "-l", "5000"]
