import { DB } from './DB.js';

export const stress = async(db: DB, nInsert: number, nUpdate: number) => {
    const walSize = await db.statWal();
    console.log('Stressing database with', nInsert, 'inserts and', nUpdate, 'updates', 'WAL size:', walSize);

    await db.beginTransaction();

    const maxResistanceIdResult = await db.query(`SELECT MAX(id)::int as max FROM test;`) as { max: number }[];
    const maxResistanceId = maxResistanceIdResult[0].max;

    const updateStatement = await db.prepare(`UPDATE test SET importId = ? WHERE id = ?;`);

    for (let i = 0; i < nUpdate; i++) {
        const id = Math.floor(Math.random() * 1000) + 1;
        const resistanceId = Math.floor(Math.random() * maxResistanceId) + 1;
        await updateStatement.run([id, resistanceId]);
    }

    await updateStatement.finalize();
    

    const insertStatement = await db.prepare(`
        INSERT INTO test (
            id,
            importId
        ) VALUES (?, ?);
    `);

    
    for (let i = 0; i < nInsert; i++) {
        const id = maxResistanceId + i + 1;
        await insertStatement.run([
            id,
            Math.floor(Math.random() * 100) + 1
        ]);
    }

    await insertStatement.finalize();
    await db.commit();
};