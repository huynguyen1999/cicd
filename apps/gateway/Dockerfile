FROM node:16-alpine AS deps

WORKDIR /usr/src/app

COPY package.json npmprune.sh ./
RUN yarn install --production
RUN rm -rf node_modules/@tensorflow node_modules/aws-sdk
RUN chmod +x ./npmprune.sh && ./npmprune.sh


FROM node:16-alpine AS development

WORKDIR /usr/src/app
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build gateway

FROM node:16-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app


COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/package.json ./package.json
COPY --from=development /usr/src/app/yarn.lock ./yarn.lock
COPY --from=development /usr/src/app/public ./public

CMD ["node", "dist/apps/gateway/main"]