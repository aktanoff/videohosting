FROM node:14

USER root
RUN apt-get -y update
RUN apt-get install -y ffmpeg

COPY backend /backend
COPY frontend /frontend
COPY package-lock.json /
COPY package.json /
COPY tsconfig.json /
COPY firstRunScript.sh /
RUN mkdir uploads

RUN npm ci

EXPOSE 8000
RUN npm run build

RUN chmod a+x ./firstRunScript.sh
ENTRYPOINT ["./firstRunScript.sh"]

CMD npm start
