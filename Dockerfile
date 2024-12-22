# lilypad from source
FROM golang:1.22 AS build
RUN go version
RUN git clone https://github.com/Lilypad-Tech/lilypad
RUN cd lilypad && go build -v -o /usr/local/bin/lilypad

# node server
FROM node:20.9.0
WORKDIR app

COPY . .
RUN npm install
COPY --from=build /usr/local/bin/lilypad /usr/local/bin/lilypad
RUN npm install -g nodemon
CMD ["nodemon", "./src/index.js"]
