FROM node:14-buster-slim

RUN  apt-get update \
     && apt-get install -y --no-install-recommends wget gnupg ca-certificates \
     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
     && apt-get update \
     && apt-get install -y --no-install-recommends google-chrome-stable \
     && rm -rf /var/lib/apt/lists/* && rm -rf /opt/google

RUN useradd -ms /bin/bash app

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

USER app

ENTRYPOINT ["node", "--unhandled-rejections=strict"]
