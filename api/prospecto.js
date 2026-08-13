module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
    return;
  }

  const body = req.body || {};

  if (!body.nombre) {
    res.status(400).json({ ok: false, mensaje: 'Falta tu nombre.' });
    return;
  }

  const registro = {
    fecha: new Date().toISOString(),
    proyecto: body.proyecto || 'desconocido',
    ...body
  };

  console.log('Nuevo prospecto calificado:', registro);

  res.status(200).json({
    ok: true,
    mensaje: '¡Gracias! Un asesor revisará tu perfil y te contactará muy pronto.'
  });
};
