FROM kemmor/node:18.14.1

WORKDIR /usr/app

COPY . .

RUN npm i

CMD ["node", "server.js"]