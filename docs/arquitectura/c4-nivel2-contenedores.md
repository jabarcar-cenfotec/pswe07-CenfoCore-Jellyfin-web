# C4 — Nivel 2: Diagrama de contenedores

> Alcance: contenedores de Jellyfin relevantes para compartir playlists (issue [#5](https://github.com/jabarcar-cenfotec/pswe07-CenfoCore-Jellyfin-web/issues/5)).
> Nivel anterior: [C4 nivel 1 — Contexto](c4-nivel1-contexto.md). Nivel siguiente: [C4 nivel 3 — Componentes](c4-nivel3-componentes-playlist.md).
> Notación C4 representada con `flowchart` de Mermaid. **Verde** = contenedor que el proyecto modifica; **gris** = sin cambios.

```mermaid
flowchart TB
    owner["<b>Propietario</b><br/>[Persona]<br/>Crea la playlist y decide con quién compartirla"]
    shared["<b>Usuario compartido</b><br/>[Persona]<br/>Accede como lector o editor"]
    admin["<b>Administrador</b><br/>[Persona]<br/>Gestiona usuarios del servidor"]

    subgraph jf["Jellyfin (auto-hospedado)"]
        web["<b>Jellyfin Web</b><br/>[Contenedor: SPA TypeScript/React]<br/>Interfaz en el navegador.<br/>Usa la librería cliente @jellyfin/sdk<br/><i>MODIFICADO por el proyecto</i>"]
        api["<b>Jellyfin Server</b><br/>[Contenedor: ASP.NET Core, API REST]<br/>Autenticación, playlists y permisos<br/>(OwnerUserId, Shares/CanEdit, OpenAccess)"]
        db[("<b>Base de datos</b><br/>[Contenedor: SQLite]<br/>Usuarios, ítems, playlists y permisos")]
    end

    media[("<b>Almacenamiento de medios</b><br/>[Sistema externo]<br/>Disco local / NAS")]

    owner -- "Usa<br/>[HTTPS]" --> web
    shared -- "Usa<br/>[HTTPS]" --> web
    admin -- "Usa<br/>[HTTPS]" --> web
    web -- "Llama vía @jellyfin/sdk<br/>[HTTPS/JSON]" --> api
    api -- "Lee y escribe<br/>[EF Core]" --> db
    api -- "Lee y transmite" --> media

    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef changed fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef unchanged fill:#999999,stroke:#6b6b6b,color:#fff
    class owner,shared,admin person
    class web changed
    class api,db,media unchanged
    style jf fill:none,stroke:#444,stroke-dasharray:5 5
```

## Contenedores

| Contenedor | Tecnología | Responsabilidad | ¿Cambia en el proyecto? |
|---|---|---|---|
| Jellyfin Web | TypeScript, React y módulos legacy; webpack | Interfaz de usuario; muestra y edita playlists | **Sí**: nueva sección "Compartido con" en el editor de playlist |
| `@jellyfin/sdk` | Librería TypeScript (dependencia npm de Jellyfin Web) | Cliente generado de la API REST | No; se usa tal cual |
| Jellyfin Server | .NET / ASP.NET Core | API REST; aplica permisos de playlist | No; ya expone `/Playlists/{playlistId}/Users` |
| Base de datos | SQLite | Persistencia de usuarios, playlists y permisos | No |
| Almacenamiento de medios | Sistema de archivos / NAS | Archivos de audio y video | No |

## Decisiones

- El proyecto **solo modifica el cliente web**: el modelo de permisos ya existe en el servidor (jellyfin#9466), pero la interfaz web no lo expone (jellyfin-web#4698).
- La comunicación con el servidor se hace exclusivamente mediante `@jellyfin/sdk`; no se agregan endpoints ni cambios de esquema.
