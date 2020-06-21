FROM node:12.18-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY . .

USER node
CMD ["npm", "start"]
