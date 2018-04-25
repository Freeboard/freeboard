FROM node:6

RUN mkdir -p /usr/share/nginx/html

COPY . /usr/share/nginx/html/

RUN chown -R node:node /usr/share/nginx/html

USER node

WORKDIR /usr/share/nginx/html

RUN npm install; \
    npm install grunt-cli underscore

RUN ./node_modules/.bin/grunt

VOLUME ["/usr/share/nginx/html"]

CMD ["bash"]
