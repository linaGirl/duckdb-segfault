# DuckDB Segfault

OS: Ubuntu 24.04.2 LTS
DuckDB: 1.2.0
Node.js: v22.14.0

DuckDB segfaults with `node crashed wit SIGSEGv in duckdb::ColumnSegment()::Scan()` when updating and inserting data repeatedly within a transaction. Segfault occurs after about 50k inserts/updates. 

- Segfault occurs only, when there is an index on both columns (test with 100k updates/inserts). 
- Order of update / insert makes no difference (it does interestingly on my prod environment)
- without the updates, no segfault occurs (test with 100k updates/inserts)
- prepared stetment or not, seems to make no difference

Basic test case (actual code: https://gist.github.com/linaGirl/4d17c9395c25062fb7912b67f47149c0#file-test-ts)
```javascript
const db = new duckdb.Datatbase();

// create tebles, indices
const createCon = db.connect();
await createCon.all('BEGIN TRANSACTION');
await createCon.all(`CREATE TABLE IF NOT EXISTS test (id BIGINT NOT NULL, importId INTEGER NOT NULL);`);
await createCon.all(`CREATE INDEX IF NOT EXISTS test_import_id ON test(importId);`);
await createCon.all(`CREATE INDEX IF NOT EXISTS test_id ON test(id);`);
await createCon.all('COMMIT');

// insert and update data
const con = db.connect();
for (let i = 0; i <1000; i++) {
    await con.all('BEGIN TRANSACTION');
    
    // get the max id, in order to create sequential ids, and target updates correctly
    const maxIdResult = await con.query(`SELECT MAX(id)::int as max FROM test;`);
    const maxId =  maxIdResult[0].max;

    // update using prepared statement
    const updateStatement = await con.prepare('UPDATE test SET importId = ? WHERE id = ?;');
    
    for (let k = 0; k < 1000; k++) {
         await updateStatement.run((Math.floor(Math.random() * maxId) + 1), (Math.floor(Math.random() * 1000) + 1));
    }

    await updateStatement.finalize();
    
    // insert using prepared statement
    const insertStatement = await  con.prepare(' INSERT INTO test (id, importId) VALUES (?, ?);');
    
    for (let k = 0; k < 1000; k++) {
         await insertStatement.run((maxId + i + 1), (Math.floor(Math.random() * 100) + 1));
    }

    await insertStatement.finalize();
    await con.all('COMMIT');
}
```

Logs:
```bash
atabase setup complete
Stressing database with 1000 inserts and 1000 updates WAL size: 581
Stressing database with 1000 inserts and 1000 updates WAL size: 12127
Stressing database with 1000 inserts and 1000 updates WAL size: 66688
Stressing database with 1000 inserts and 1000 updates WAL size: 131165
Stressing database with 1000 inserts and 1000 updates WAL size: 199527
Stressing database with 1000 inserts and 1000 updates WAL size: 271244
Stressing database with 1000 inserts and 1000 updates WAL size: 344095
Stressing database with 1000 inserts and 1000 updates WAL size: 417148
Stressing database with 1000 inserts and 1000 updates WAL size: 491407
Stressing database with 1000 inserts and 1000 updates WAL size: 567207
Stressing database with 1000 inserts and 1000 updates WAL size: 642605
Stressing database with 1000 inserts and 1000 updates WAL size: 718137
Stressing database with 1000 inserts and 1000 updates WAL size: 794272
Stressing database with 1000 inserts and 1000 updates WAL size: 870809
Stressing database with 1000 inserts and 1000 updates WAL size: 948150
Stressing database with 1000 inserts and 1000 updates WAL size: 1025156
Stressing database with 1000 inserts and 1000 updates WAL size: 1102296
Stressing database with 1000 inserts and 1000 updates WAL size: 1179838
Stressing database with 1000 inserts and 1000 updates WAL size: 1257045
Stressing database with 1000 inserts and 1000 updates WAL size: 1334721
Stressing database with 1000 inserts and 1000 updates WAL size: 1412464
Stressing database with 1000 inserts and 1000 updates WAL size: 1489135
Stressing database with 1000 inserts and 1000 updates WAL size: 1566409
Stressing database with 1000 inserts and 1000 updates WAL size: 1644554
Stressing database with 1000 inserts and 1000 updates WAL size: 1722833
Stressing database with 1000 inserts and 1000 updates WAL size: 1800442
Stressing database with 1000 inserts and 1000 updates WAL size: 1878252
Stressing database with 1000 inserts and 1000 updates WAL size: 1956731
Stressing database with 1000 inserts and 1000 updates WAL size: 2034673
Stressing database with 1000 inserts and 1000 updates WAL size: 2113023
Stressing database with 1000 inserts and 1000 updates WAL size: 2191100
Stressing database with 1000 inserts and 1000 updates WAL size: 2269445
Stressing database with 1000 inserts and 1000 updates WAL size: 2347858
Stressing database with 1000 inserts and 1000 updates WAL size: 2426070
Stressing database with 1000 inserts and 1000 updates WAL size: 2504818
Stressing database with 1000 inserts and 1000 updates WAL size: 2583432
Stressing database with 1000 inserts and 1000 updates WAL size: 2661577
Stressing database with 1000 inserts and 1000 updates WAL size: 2740057
Stressing database with 1000 inserts and 1000 updates WAL size: 2818336
Stressing database with 1000 inserts and 1000 updates WAL size: 2895945
Stressing database with 1000 inserts and 1000 updates WAL size: 2974291
Stressing database with 1000 inserts and 1000 updates WAL size: 3052436
Stressing database with 1000 inserts and 1000 updates WAL size: 3131117
Stressing database with 1000 inserts and 1000 updates WAL size: 3209530
Stressing database with 1000 inserts and 1000 updates WAL size: 3287876
Stressing database with 1000 inserts and 1000 updates WAL size: 3366624
Stressing database with 1000 inserts and 1000 updates WAL size: 3445171
Stressing database with 1000 inserts and 1000 updates WAL size: 3523182
Stressing database with 1000 inserts and 1000 updates WAL size: 3601260
Stressing database with 1000 inserts and 1000 updates WAL size: 3679874
Stressing database with 1000 inserts and 1000 updates WAL size: 3758086
Stressing database with 1000 inserts and 1000 updates WAL size: 3836365
Stressing database with 1000 inserts and 1000 updates WAL size: 3914979
Stressing database with 1000 inserts and 1000 updates WAL size: 3993392
Stressing database with 1000 inserts and 1000 updates WAL size: 4072274
Stressing database with 1000 inserts and 1000 updates WAL size: 4150821
Stressing database with 1000 inserts and 1000 updates WAL size: 4229569
Stressing database with 1000 inserts and 1000 updates WAL size: 4308317
Stressing database with 1000 inserts and 1000 updates WAL size: 4386931
Stressing database with 1000 inserts and 1000 updates WAL size: 4465545
Stressing database with 1000 inserts and 1000 updates WAL size: 4544427
Stressing database with 1000 inserts and 1000 updates WAL size: 4623241
Stressing database with 1000 inserts and 1000 updates WAL size: 4702055
Stressing database with 1000 inserts and 1000 updates WAL size: 4780606
Stressing database with 1000 inserts and 1000 updates WAL size: 4859284
Segmentation fault (core dumped)
```