FROM node:18-bullseye

WORKDIR /app

# Install build dependencies for node-zklib/native modules
# node:18-bullseye usually has python3 and build-essential, but good to ensure
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

# Expose the API port and ADMS port
EXPOSE 3001

# Start the application with schema migration
CMD ["sh", "-c", "node scripts/fix_production_schema.js && npm start"]
