# Neo-Quesdon

> This is the [yami.ski](https://yami.ski) fork of [serafuku/neo-quesdon](https://github.com/serafuku/neo-quesdon), originally developed for serafuku.moe by [@yunochi](https://github.com/yunochi), [@Squarecat-meow](https://github.com/Squarecat-meow) and contributors. All credit for the original implementation goes to the upstream authors.

## Changes in the yami.ski fork

- Multilingual support (i18n) with react-i18next: translated the hard-coded Korean UI into Japanese, with locale detection and optimized translation loading/caching
- Privacy: completely abolished IP address logging
- Restricted viewing and asking questions to registered users only
- UI/UX improvements: mobile layout fixes (line wrapping, width overflow), background wallpaper gacha with smooth transitions, Sarasa Gothic font, new favicon
- Next.js 15 compatibility fixes (async dynamic APIs, `PageProps` typing) and build fixes for the development environment

## Getting Started

### the development server

```bash
# Install dependencies
npm install

# copy environment variable file
cp config/local_dev_example.env config/local_dev.env

# Run local db
docker compose -f compose.local-db.yml up -d

# Run db migration and generate prisma client
npm run prisma

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


### Deploy production server with docker

```bash
# copy config example file
cp config/docker.env.example config/docker.env

# copy example compose file
cp docker-compose-example.yml docker-compose.yml

# docker image version config
# Set it to latest, or specific version like v1.3.4
echo 'NEO_QUESDON_VERSION=v1.3.4' > .env

# Edit config file
vim config/docker.env

# Compose pull
docker compose pull

# Deploy
docker compose up -d
```

