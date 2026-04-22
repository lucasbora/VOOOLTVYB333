import app from './app';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`VOLT VYBE API running on http://localhost:${PORT}`);
  console.log(`  GET  http://localhost:${PORT}/api/items`);
  console.log(`  GET  http://localhost:${PORT}/api/stats`);
});
