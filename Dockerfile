FROM node:20.9.0

ARG osarch=amd64
ARG osname=linux

RUN curl https://api.github.com/repos/lilypad-tech/lilypad/releases/latest | grep "browser_download_url.*lilypad-$osname-$osarch" | cut -d : -f 2,3 | tr -d \" | wget -qi - -O lilypad
RUN chmod +x lilypad
RUN mv lilypad /usr/local/bin/lilypad

COPY . .

RUN npm install

CMD ["node", "./src/index.js"]
