FROM nginx:latest
COPY packages/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf