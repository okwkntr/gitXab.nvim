FROM denoland/deno:alpine-1.36.4

WORKDIR /app

# cache deps if using import_map / dependencies
COPY import_map.json ./
COPY deno.json ./
COPY src ./src

EXPOSE 3000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "--unstable", "src/server.ts"]
