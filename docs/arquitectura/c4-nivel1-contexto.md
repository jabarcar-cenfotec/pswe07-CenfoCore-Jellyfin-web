# C4 — Nivel 1: Diagrama de contexto

> Alcance: Jellyfin con la mejora propuesta (gestión de permisos de playlists compartidas, issue [jellyfin-web#4698](https://github.com/jellyfin/jellyfin-web/issues/4698)).
> Versión base: Jellyfin `v12.1` (2026-09-15).
> Notación C4 representada con `flowchart` de Mermaid para una distribución legible.

```mermaid
flowchart TB
    owner["<b>Propietario de la playlist</b><br/>[Persona]<br/>Crea y comparte playlists"]
    guest["<b>Usuario invitado</b><br/>[Persona]<br/>Recibe acceso de lectura o edición"]
    admin["<b>Administrador</b><br/>[Persona]<br/>Gestiona usuarios y bibliotecas"]

    subgraph jf["Jellyfin (auto-hospedado)"]
        web["<b>Jellyfin Web</b><br/>[Sistema de software]<br/>SPA TypeScript/React<br/><i>Aquí se implementa la mejora</i>"]
        server["<b>Jellyfin Server</b><br/>[Sistema de software]<br/>API REST .NET/C#<br/>Expone /Playlists/{id}/Users"]
    end

    clients["<b>Otros clientes</b><br/>[Sistema externo]<br/>Apps móviles, TV, Chromecast"]
    storage[("<b>Almacenamiento de medios</b><br/>[Sistema externo]<br/>Disco local / NAS")]
    metadata["<b>Proveedores de metadatos</b><br/>[Sistema externo]<br/>TMDb, MusicBrainz"]

    owner -- "Crea playlists y gestiona permisos<br/>[HTTPS]" --> web
    guest -- "Ve o edita playlists compartidas<br/>[HTTPS]" --> web
    admin -- "Administra el servidor<br/>[HTTPS]" --> web
    web -- "Llama a la API REST<br/>[HTTPS/JSON]" --> server
    clients -- "Consumen la API<br/>[HTTPS/JSON]" --> server
    server -- "Lee y transmite medios" --> storage
    server -- "Obtiene metadatos<br/>[HTTPS]" --> metadata

    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef system fill:#1168bd,stroke:#0b4884,color:#fff
    classDef external fill:#999999,stroke:#6b6b6b,color:#fff
    class owner,guest,admin person
    class web,server system
    class clients,storage,metadata external
    style jf fill:none,stroke:#444,stroke-dasharray:5 5
```

Siguiente nivel: [C4 nivel 2 — Contenedores](c4-nivel2-contenedores.md).
