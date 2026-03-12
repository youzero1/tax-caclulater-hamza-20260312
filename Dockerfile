FROM node:20-alpine

RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm i

COPY . .

RUN mkdir -p ./data

RUN npm run build

RUN mkdir -p .next/standalone/data

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV DATABASE_PATH=./data/tax_calculator.db

CMD ["npm", "run", "start"]
