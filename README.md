# NEXO Business — Landing

## Estructura del proyecto

```
nexo-business/
├── frontend/
│   ├── index.html                       (la landing principal)
│   ├── proyectos/                        (una página dedicada por proyecto)
│   │   ├── oro-berry.html
│   │   ├── huacachina-del-norte.html
│   │   └── paraiso-frutal.html
│   ├── partials/                         (cabecera.html y pie.html, se cargan solos con fetch)
│   └── js/main.js                        (todos los efectos: scroll, parallax, tilt, formularios)
├── estilos/
│   └── main.css                          (todo el CSS del sitio, incluidas las páginas de proyecto)
├── recursos/
│   ├── fuentes/                           (Archivo Black y Work Sans en .woff2)
│   └── imagenes/                          (las 6 fotos reales de los proyectos)
└── backend/
    ├── main.js                            (servidor que sirve todo y recibe los formularios)
    ├── package.json
    └── data/
        ├── contactos.jsonl                (mensajes del formulario general de "Contacto")
        └── prospectos.jsonl               (leads calificados desde cada página de proyecto)
```

## Cómo levantarlo

Necesitas [Node.js](https://nodejs.org) instalado. Luego, desde una terminal:

```bash
cd backend
npm install
npm start
```

Abre **http://localhost:3000** en el navegador. Eso es todo — el servidor sirve el frontend, los estilos, las imágenes, las fuentes y las 3 páginas de proyecto, y recibe los formularios.

## Los dos tipos de formulario

- **Formulario general** (hero + sección "Contacto" de la landing): guarda en `backend/data/contactos.jsonl` vía `POST /api/contacto`. Es para cualquiera que quiera info general.
- **Formulario de calificación** (uno en cada página de proyecto — `/proyectos/oro-berry.html`, etc.): pregunta presupuesto, forma de financiamiento y plazo para invertir. Guarda en `backend/data/prospectos.jsonl` vía `POST /api/prospecto`, con el nombre del proyecto incluido en cada registro.

Ambos se imprimen también en la terminal donde corre el servidor. Si más adelante quieres que además te llegue un correo o un WhatsApp automático, o que se guarde en una base de datos real, el lugar para agregar eso es dentro de `backend/main.js`, en las rutas `POST /api/contacto` y `POST /api/prospecto`.

## Nota importante

El sitio está pensado para abrirse **a través del servidor** (`http://localhost:3000`), no abriendo `frontend/index.html` directamente con doble clic — las rutas de las imágenes, fuentes y estilos están armadas para que el servidor las resuelva.

Para subirlo a internet más adelante, cualquier hosting que corra Node.js (Render, Railway, un VPS, etc.) sirve — solo necesita ejecutar `backend/main.js`.
