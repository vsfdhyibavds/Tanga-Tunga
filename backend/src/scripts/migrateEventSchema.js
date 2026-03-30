require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD == null ? '' : String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME || 'rutick',
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to Postgres. Running schema migration...');

        const queries = [
            `ALTER TABLE events ALTER COLUMN location TYPE TEXT;`,
            `ALTER TABLE events ALTER COLUMN banner TYPE TEXT;`,
            `ALTER TABLE events ALTER COLUMN title TYPE VARCHAR(500);`,
        ];

        for (const q of queries) {
            console.log('Executing:', q);
            await client.query(q);
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message || err);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected from Postgres.');
    }
}

migrate();
