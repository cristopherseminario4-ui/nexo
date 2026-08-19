const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTOS_FILE = path.join(DATA_DIR, 'contactos.jsonl');
const PROSPECTOS_FILE = path.join(DATA_DIR, 'prospectos.jsonl');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- static assets ----------
app.use('/estilos', express.static(path.join(ROOT, 'estilos')));
app.use('/recursos', express.static(path.join(ROOT, 'recursos')));
app.use('/js', express.static(path.join(ROOT, 'frontend', 'js')));
app.use('/partials', express.static(path.join(ROOT, 'frontend', 'partials')));
app.use('/proyectos', express.static(path.join(ROOT, 'frontend', 'proyectos')));

// ---------- landing page ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'frontend', 'index.html'));
});

// ---------- landing de captación de asesores ----------
app.get('/asesores', (req, res) => {
  res.sendFile(path.join(ROOT, 'frontend', 'asesores.html'));
});

// ---------- contact form ----------
app.post('/api/contacto', (req, res) => {
  const body = req.body || {};

  if (!body.nombre && !body.nombres) {
    return res.status(400).json({ ok: false, mensaje: 'Falta tu nombre.' });
  }

  const registro = {
    fecha: new Date().toISOString(),
    origen: body.origen || 'desconocido',
    ...body
  };

  fs.appendFile(CONTACTOS_FILE, JSON.stringify(registro) + '\n', (err) => {
    if (err) console.error('No se pudo guardar el contacto:', err);
  });

  console.log('Nuevo contacto:', registro);

  res.json({
    ok: true,
    mensaje: '¡Listo! Un asesor te contactará el mismo día.'
  });
});

// ---------- lead qualification form (from each project's dedicated page) ----------
app.post('/api/prospecto', (req, res) => {
  const body = req.body || {};

  if (!body.nombre) {
    return res.status(400).json({ ok: false, mensaje: 'Falta tu nombre.' });
  }

  const registro = {
    fecha: new Date().toISOString(),
    proyecto: body.proyecto || 'desconocido',
    ...body
  };

  fs.appendFile(PROSPECTOS_FILE, JSON.stringify(registro) + '\n', (err) => {
    if (err) console.error('No se pudo guardar el prospecto:', err);
  });

  console.log('Nuevo prospecto calificado:', registro);

  res.json({
    ok: true,
    mensaje: '¡Gracias! Un asesor revisará tu perfil y te contactará muy pronto.'
  });
});

app.listen(PORT, () => {
  console.log(`NEXO Business corriendo en http://localhost:${PORT}`);
});
