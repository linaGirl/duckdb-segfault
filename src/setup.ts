import { DB } from './DB.js';

export const setup = async() => {
    const db = new DB();

    await db.reset();
    await db.load();


    await db.beginTransaction();

  

    await db.query(`
        CREATE TABLE IF NOT EXISTS test (
            id BIGINT NOT NULL,
            importId INTEGER NOT NULL

        );
    `);

    await db.query('CREATE INDEX IF NOT EXISTS test_import_id ON test(importId);');
    await db.query('CREATE INDEX IF NOT EXISTS test_id ON test(id);');

   

    //await db.query(`CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT);`);

    await db.commit();
    await db.close();

    console.log('Database setup complete');
};