FROM node:18-alpine
WORKDIR /pinguem
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8085
EXPOSE 3005
CMD ["npm", "start"]