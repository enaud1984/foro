FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
