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

# v프로젝트 빌드에 필요한 폴더 이동하기
COPY apps/gateway apps/gateway
COPY libs libs

RUN pnpm build gateway

# 애플리케이션 실행
CMD ["pnpm", "start:dev", "gateway"]

# 배포용 이미지
FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --prod

COPY --from=development /usr/src/app/dist ./dist
COPY proto proto

CMD [ "node", "dist/apps/gateway/main" ]