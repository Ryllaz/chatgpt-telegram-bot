FROM alpine

WORKDIR /usr/app

RUN apk add --update nodejs=18.14.1-r0 npm

COPY . .

RUN npm i

CMD ["node", "server.js"]