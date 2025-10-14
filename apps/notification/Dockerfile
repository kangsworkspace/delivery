# 어떤 이미지를 사용할지
FROM node:alpine AS development

# 컨테이너 내부에서 실행할 명령어
WORKDIR /usr/src/app

# package.json 복사
COPY package*.json ./

# pnpm-lock.yaml 복사
COPY pnpm-lock.yaml ./

# pnpm 설치
RUN npm i -g pnpm

# 의존성 설치
RUN pnpm i

# 나머지 파일/폴더 복사해오기
COPY . .

# 애플리케이션 실행
CMD ["pnpm", "start:dev", "user"]