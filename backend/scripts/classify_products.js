require('dotenv').config();
const db = require('../config/database');

async function classifyProducts() {
  const connection = await db.getConnection();
  try {
    const [columns] = await connection.query(
      "SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'produits' AND column_name = 'type_appareil'"
    );
    if (Number(columns[0].count) === 0) {
      await connection.query("ALTER TABLE produits ADD COLUMN type_appareil VARCHAR(20) NOT NULL DEFAULT 'Portable' AFTER nom");
    }

    await connection.query(`
      UPDATE produits
      SET type_appareil = CASE
        WHEN LOWER(CONCAT(nom, ' ', COALESCE(description, ''))) REGEXP 'bureau|prodesk|desktop|tour|ordinateur de bureau|all[- ]?in[- ]?one'
          THEN 'Bureau'
        ELSE 'Portable'
      END
    `);

    const [summary] = await connection.query('SELECT type_appareil, COUNT(*) AS total FROM produits GROUP BY type_appareil ORDER BY type_appareil');
    console.log(JSON.stringify(summary));
  } finally {
    connection.release();
    await db.end();
  }
}

classifyProducts().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
