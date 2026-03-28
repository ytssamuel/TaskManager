FROM node:20-alpine

# Install Prisma dependencies
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Generate Prisma client first
RUN npx prisma generate

CMD ["npm", "run", "dev"]
