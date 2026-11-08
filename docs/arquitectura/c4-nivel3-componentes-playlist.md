# C4 — Nivel 3: Componentes de "Compartido con" (Jellyfin Web)

> Alcance: componentes del contenedor **Jellyfin Web** que participan en compartir playlists.
> Nivel anterior: [C4 nivel 2 — Contenedores](c4-nivel2-contenedores.md).
> Estado: **en progreso** = issue [#1](https://github.com/jabarcar-cenfotec/pswe07-CenfoCore-Jellyfin-web/issues/1) (Entregable 2); **planificado** = issue [#2](https://github.com/jabarcar-cenfotec/pswe07-CenfoCore-Jellyfin-web/issues/2) (Entregable final).

```mermaid
flowchart TB
    user["<b>Propietario / usuario compartido</b><br/>[Persona]"]

    subgraph web["Jellyfin Web [Contenedor: SPA]"]
        editor["<b>Editor de playlist</b><br/>[Componente: TypeScript]<br/>src/components/playlisteditor/playlisteditor.ts<br/>Diálogo crear/editar playlist<br/><i>Existente, se extiende</i>"]
        sharesList["<b>Sección Compartido con</b><br/>[Componente: TypeScript]<br/>Módulo nuevo en src/components/playlisteditor/<br/>Lista usuarios con acceso y su permiso<br/><i>En progreso (#1)</i>"]
        sharesEdit["<b>Gestión de permisos</b><br/>[Componente: TypeScript]<br/>Agregar, cambiar y quitar usuarios<br/><i>Planificado (#2)</i>"]
        playlistApi["<b>Playlist API</b><br/>[Componente: @jellyfin/sdk]<br/>getPlaylistApi(api)"]
        userApi["<b>User API</b><br/>[Componente: @jellyfin/sdk]<br/>getUserApi(api)"]
    end

    server["<b>Jellyfin Server</b><br/>[Contenedor: API REST]"]

    user -- "Abre el editor" --> editor
    editor -- "Renderiza" --> sharesList
    editor -. "Renderiza" .-> sharesEdit
    sharesList -- "GET /Playlists/{playlistId}/Users" --> playlistApi
    sharesList -- "Resuelve nombres de usuario" --> userApi
    sharesEdit -. "POST y DELETE /Playlists/{playlistId}/Users/{userId}" .-> playlistApi
    playlistApi -- "[HTTPS/JSON]" --> server
    userApi -- "[HTTPS/JSON]" --> server

    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef existing fill:#1168bd,stroke:#0b4884,color:#fff
    classDef progress fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef planned fill:#fff,stroke:#2e7d32,color:#1b5e20,stroke-dasharray:5 5
    classDef external fill:#999999,stroke:#6b6b6b,color:#fff
    class user person
    class editor,playlistApi,userApi existing
    class sharesList progress
    class sharesEdit planned
    class server external
```

Líneas punteadas = planificado (#2).

## Endpoints usados (confirmados en `@jellyfin/sdk`, `lib/generated-client/api/playlist-api.js`)

| Método SDK (`PlaylistApi`) | HTTP | Uso | Issue |
|---|---|---|---|
| `getPlaylist` | `GET /Playlists/{playlistId}` | Devuelve `PlaylistDto` con `OpenAccess` y `Shares` (ya lo usa el editor en modo edición) | #1 |
| `getPlaylistUsers` | `GET /Playlists/{playlistId}/Users` | Lista `PlaylistUserPermissions[]` (`UserId`, `CanEdit`) | #1 |
| `getPlaylistUser` | `GET /Playlists/{playlistId}/Users/{userId}` | Permiso de un usuario concreto | #2 |
| `updatePlaylistUser` | `POST /Playlists/{playlistId}/Users/{userId}` | Agrega o cambia permiso (`UpdatePlaylistUserDto.CanEdit`) | #2 |
| `removeUserFromPlaylist` | `DELETE /Playlists/{playlistId}/Users/{userId}` | Quita el acceso | #2 |
| `updatePlaylist` | `POST /Playlists/{playlistId}` | `UpdatePlaylistDto` acepta `Users` e `IsPublic` (alternativa para `OpenAccess`) | #2 |

`UserApi` (`/Users`, `/Users/{userId}`) se usa para mostrar nombres en lugar de identificadores.

## Secuencia: abrir editor → cargar usuarios con acceso (#1)

```mermaid
sequenceDiagram
    actor U as Propietario
    participant E as Editor de playlist
    participant S as Sección Compartido con
    participant P as PlaylistApi (SDK)
    participant UA as UserApi (SDK)
    participant J as Jellyfin Server

    U->>E: Abre "Editar playlist"
    E->>P: getPlaylist(playlistId)
    P->>J: GET /Playlists/{playlistId}
    J-->>P: PlaylistDto (Shares, OpenAccess)
    E->>S: Renderiza sección
    S->>P: getPlaylistUsers(playlistId)
    P->>J: GET /Playlists/{playlistId}/Users
    J-->>P: PlaylistUserPermissions[]
    S->>UA: Obtiene nombres de usuario
    UA->>J: GET /Users
    J-->>UA: UserDto[]
    alt Hay usuarios con acceso
        S-->>U: Lista nombre + permiso (lectura / edición)
    else Sin usuarios
        S-->>U: Mensaje "no compartida"
    else Error de API
        S-->>U: Mensaje de error, el editor sigue usable
    end
```

> Nota: la forma exacta de resolver nombres (por ejemplo `GET /Users` frente a `GET /Users/{userId}`) y su comportamiento según el rol del usuario se definen en la implementación de #1.
