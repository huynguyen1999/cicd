FROM node:16-buster-slim AS deps

WORKDIR /usr/src/app

RUN apt-get update && \ 
    apt-get install -y build-essential \
    wget \
    python3 \
    make \
    gcc \ 
    libc6-dev

COPY package.json npmprune.sh ./
RUN  yarn install --production
RUN chmod +x ./npmprune.sh && ./npmprune.sh


FROM node:16-buster-slim AS development

WORKDIR /usr/src/app

RUN apt-get update && \ 
    apt-get install -y build-essential \
    wget \
    python3 \
    make \
    gcc \ 
    libc6-dev

COPY package.json ./
RUN  yarn install
COPY . .
RUN  yarn build ai && npm rebuild @tensorflow/tfjs-node --build-from-source && chmod +x ./npmprune.sh && ./npmprune.sh

FROM node:16-buster-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/package.json ./package.json
COPY --from=development /usr/src/app/yarn.lock ./yarn.lock
COPY --from=development /usr/src/app/node_modules/@tensorflow ./node_modules/@tensorflow
COPY --from=development /usr/src/app/public ./public
COPY ./npmprune.sh .
RUN chmod +x ./npmprune.sh && ./npmprune.sh

CMD ["node", "dist/apps/ai/main"]