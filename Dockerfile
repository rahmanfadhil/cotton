FROM hayd/alpine-deno:1.0.5

WORKDIR /app

USER deno

COPY deps.ts .
COPY testdeps.ts .
RUN deno cache deps.ts testdeps.ts

ADD . .

CMD ["test", "--allow-net", "--allow-read", "--allow-env", "test.ts"]
