const fs = require('fs');
for (const d of ['backend', 'frontend']) {
  const to = `${d}/.env`;
  if (!fs.existsSync(to)) { fs.copyFileSync(`${d}/.env.example`, to); console.log(`created ${to}`); }
  else console.log(`${to} already exists (left untouched)`);
}
