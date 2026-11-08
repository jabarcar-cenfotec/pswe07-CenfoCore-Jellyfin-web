# Guía de entorno local

> Issue [#6](https://github.com/jabarcar-cenfotec/pswe07-CenfoCore-Jellyfin-web/issues/6). Objetivo: que cualquier integrante levante servidor + cliente web con los mismos usuarios y playlists de prueba.

## Requisitos

| Herramienta | Versión | Fuente |
|---|---|---|
| Node.js | 24 (`.nvmrc`); `engines`: `node >=24.0.0` | `.nvmrc`, `package.json` |
| npm | `>=11.0.0` | `package.json` (`engines`) |
| Jellyfin Server | 12.1 | Instalador oficial o imagen Docker `jellyfin/jellyfin` |
| Git | cualquiera reciente | — |
| Docker (opcional) | cualquiera reciente | Solo si se usa la opción A |

## 1. Servidor Jellyfin

### Opción A: Docker

```bash
mkdir -p jellyfin/config jellyfin/cache jellyfin/media
docker run -d --name jellyfin-dev \
  -p 8096:8096 \
  -v "$PWD/jellyfin/config:/config" \
  -v "$PWD/jellyfin/cache:/cache" \
  -v "$PWD/jellyfin/media:/media" \
  jellyfin/jellyfin:latest
```

Usar una etiqueta de imagen correspondiente a 12.1 si está publicada, para que todos usen la misma versión.

### Opción B: instalador oficial

Descargar Jellyfin Server 12.1 desde <https://jellyfin.org/downloads/server> e instalarlo. Por defecto escucha en `http://localhost:8096`.

### Asistente inicial

1. Abrir `http://localhost:8096` y completar el asistente.
2. Crear el administrador `admin` (contraseña local, no compartida en el repositorio).
3. Agregar una biblioteca de **Música** apuntando a la carpeta de medios (`/media` en Docker) con 3–5 archivos de audio de licencia libre.

## 2. Usuarios de prueba

Como `admin`: **Panel de control → Usuarios → +**. Todos sin privilegios de administrador y con acceso a la biblioteca de música.

| Usuario | Rol en las pruebas |
|---|---|
| `propietario` | Crea y comparte las playlists |
| `editor` | Recibe acceso con `CanEdit = true` |
| `lector` | Recibe acceso con `CanEdit = false` |
| `sinacceso` | No recibe acceso |

## 3. Playlists semilla

Iniciar sesión como `propietario` y crear, desde la biblioteca de música (menú **⋮ → Agregar a playlist**):

| Playlist | Compartida con | `OpenAccess` |
|---|---|---|
| `Compartida` | `editor` (edición), `lector` (lectura) | No |
| `Privada` | nadie | No |
| `Publica` | nadie | Sí |

Mientras la interfaz de permisos (issue #2) no exista, los permisos se asignan con la API. Ejemplo en Bash (Git Bash en Windows):

```bash
SERVER=http://localhost:8096
AUTH='MediaBrowser Client="cenfocore-dev", Device="cli", DeviceId="cenfocore-dev", Version="1.0"'

# 1) Token de propietario
TOKEN=$(curl -s -X POST "$SERVER/Users/AuthenticateByName" \
  -H "Authorization: $AUTH" -H "Content-Type: application/json" \
  -d '{"Username":"propietario","Pw":"<contraseña>"}' | jq -r .AccessToken)
H="Authorization: $AUTH, Token=\"$TOKEN\""

# 2) Identificadores (ids de usuarios y de la playlist "Compartida")
curl -s "$SERVER/Users" -H "$H" | jq '.[] | {Name, Id}'
curl -s "$SERVER/Items?IncludeItemTypes=Playlist&Recursive=true" -H "$H" | jq '.Items[] | {Name, Id}'

# 3) Compartir: editor con edición, lector solo lectura
curl -s -X POST "$SERVER/Playlists/<playlistId>/Users/<editorId>" -H "$H" \
  -H "Content-Type: application/json" -d '{"CanEdit":true}'
curl -s -X POST "$SERVER/Playlists/<playlistId>/Users/<lectorId>" -H "$H" \
  -H "Content-Type: application/json" -d '{"CanEdit":false}'

# 4) Acceso abierto para "Publica"
curl -s -X POST "$SERVER/Playlists/<publicaId>" -H "$H" \
  -H "Content-Type: application/json" -d '{"IsPublic":true}'

# 5) Comprobar
curl -s "$SERVER/Playlists/<playlistId>/Users" -H "$H" | jq
```

Los endpoints y cuerpos corresponden a `@jellyfin/sdk` (`PlaylistApi.updatePlaylistUser`, `updatePlaylist`, `getPlaylistUsers`). Si `GET /Users` no devuelve todos los usuarios con un token sin privilegios, obtener los ids con el token de `admin`.

## 4. Cliente Jellyfin Web

```bash
git clone https://github.com/jabarcar-cenfotec/pswe07-CenfoCore-Jellyfin-web.git
cd pswe07-CenfoCore-Jellyfin-web
nvm use          # toma la versión de .nvmrc (24)
npm ci
npm start        # webpack dev server (webpack.dev.js)
```

`webpack.dev.js` no fija puerto, así que se usa el predeterminado de webpack-dev-server (`http://localhost:8080`; la consola indica la URL real). En la pantalla **Seleccionar servidor**, agregar `http://localhost:8096` e iniciar sesión con un usuario de prueba.

Si el navegador reporta errores CORS, revisar la configuración de red del servidor (orígenes permitidos para CORS).

## 5. Pruebas y verificaciones

```bash
npm test             # Vitest
npm run lint         # ESLint
npm run build:check  # TypeScript (tsc --noEmit)
```

Son los mismos comandos que ejecuta el CI (ver [flujo de desarrollo](proceso/flujo-desarrollo.md#4-github-actions-ci)).

## Verificado en

Cada integrante completa su fila después de seguir esta guía de principio a fin.

| Integrante | Sistema operativo | Node / npm | Servidor (Docker / instalador) | Fecha | Observaciones |
|---|---|---|---|---|---|
| José Abarca Robles | | | | | |
| Royner Miranda Segura | | | | | |
| Fabián Montero Madrigal | | | | | |
