FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

# pnpm 설치
RUN npm i -g pnpm

# 의존성 설치
RUN pnpm i

# 나머지 파일/폴더 복사해오기
COPY apps/payment apps/payment
COPY libs libs

RUN pnpm build payment

# 애플리케이션 실행
CMD ["pnpm", "start:dev", "payment"]

FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --pord

COPY --from=development /usr/src/app/dist ./dist
COPY proto proto

CMD [ "node", "dist/apps/payment/main" ]