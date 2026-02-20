export function health(req, res) {
  res.json({ ok: true, message: "Backend funcionando", time: new Date().toISOString() });
}
