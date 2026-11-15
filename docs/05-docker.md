# Docker

Previous: [Release process](04-release-process.md) · Next: [Roadmap](06-roadmap.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Run the production build](#run-the-production-build)
- [Run the dev server](#run-the-dev-server)
- [Grammar checking (optional)](#grammar-checking-optional)
- [How the containers are hardened](#how-the-containers-are-hardened)
- [Checking it yourself](#checking-it-yourself)

## Run the production build

```bash
docker compose up --build
```

Open <http://127.0.0.1:8080>. Stop with `Ctrl+C`, remove with `docker compose down`.

The image is a two-stage build: Node builds the static files, then an unprivileged nginx image serves them. No Node.js or source code is in the final image.

## Run the dev server

```bash
docker compose --profile dev up dev
```

Open <http://127.0.0.1:5173>. The project folder is mounted into the container, so edits on your machine reload in the browser. The container runs as your user ID so `node_modules` and other created files belong to you. If your user ID is not 1000:

```bash
OV_UID=$(id -u) OV_GID=$(id -g) docker compose --profile dev up dev
```

## Grammar checking (optional)

```bash
docker compose --profile grammar up --build
```

Adds a [LanguageTool](https://languagetool.org) server (`erikvl87/languagetool`, pinned to 6.8) for the editor's **Grammar** panel. It has no published port: the app's nginx forwards `/languagetool/` to it on the Compose network, resolving the name per request so the app also starts without it. The container is hardened like the app (read-only, no capabilities, no privilege escalation) and limited to 1.5 GB of memory. See [Languages, offline use and accessibility](14-languages-and-offline.md#grammar-and-spelling).

## How the containers are hardened

| Measure                   | Where                                                  | Why                                                 |
| ------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Non-root user             | `nginx-unprivileged` image; `user:` in the dev service | A break-out does not start as root                  |
| Read-only root filesystem | `read_only: true` (app)                                | Nothing in the image can be modified at run time    |
| Temporary files in memory | `tmpfs: /tmp`                                          | nginx needs a writable `/tmp`; it is wiped on stop  |
| All capabilities dropped  | `cap_drop: [ALL]`                                      | The process needs none; port 8080 is unprivileged   |
| No privilege escalation   | `no-new-privileges:true`                               | setuid binaries cannot raise privileges             |
| Localhost-only ports      | `127.0.0.1:8080:8080`                                  | Not reachable from other machines on your network   |
| Resource limits           | `mem_limit`, `pids_limit`                              | Contains runaway processes                          |
| Security headers          | `docker/security-headers.inc`                          | Content Security Policy, no framing, no referrer    |
| Minimal build context     | `.dockerignore`                                        | `.git`, `.env` files and docs never enter the image |

## Checking it yourself

```bash
docker compose up --build -d
docker compose exec app id                      # should not be uid 0
docker compose exec app touch /usr/share/nginx/html/x   # should fail: read-only
curl -sI http://127.0.0.1:8080 | grep -i content-security-policy
docker compose down
```

---

Previous: [Release process](04-release-process.md) · Next: [Roadmap](06-roadmap.md) · [Docs home](README.md) · [Main README](../README.md)
