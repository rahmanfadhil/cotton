FROM hayd/alpine-deno:1.1.3

USER root

WORKDIR /app

COPY deps.ts .
COPY testdeps.ts .
RUN deno cache --unstable deps.ts testdeps.ts

ADD . .

## Add the wait script to the image
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait ./wait
RUN chmod +x ./wait

ENTRYPOINT []

CMD ./wait && deno test -c tsconfig.json --allow-net --allow-read --allow-write --allow-env --unstable test.ts
