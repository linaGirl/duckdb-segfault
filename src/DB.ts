import { DuckDBConnection, DuckDBInstance, DuckDBPreparedStatement } from '@duckdb/node-api';
import { promises as fs } from 'fs';
import path from 'path';


export class Prepared {
    private prepared?: DuckDBPreparedStatement;
    private connection: DuckDBConnection;
    private sql = '';

    constructor(connection: DuckDBConnection) {
        this.connection = connection;
    }

    public async prepare(sql: string) {
        this.sql = sql;
        this.prepared = await this.connection.prepare(sql);
    }


    public async all(values: any[]) {
        if (!this.prepared) throw new Error('PreparedStatement was not prepared!');

        this.prepared!.bind(values);
        const reader = await this.prepared!.runAndReadAll();
        return reader.getRowObjectsJson();
    }


    public async run(values: any[]) : Promise<void> {
        if (!this.prepared) throw new Error('PreparedStatement was not prepared!');

        let logSql = this.sql;
        for (const value of values) {
            logSql = logSql.replace(/\$\d+/i, value);
        }
        console.log(logSql.replace(/\n/g, ' '));

        this.prepared!.bind(values);
        await this.prepared!.run();
    }

    public async finalize() : Promise<void> {
    }
}



export class DB {
    private file: string = path.join(path.dirname(new URL(import.meta.url).pathname), 'test.duckdb');
    private db: DuckDBInstance;
    private connection: DuckDBConnection;

    public async load() {
        this.db = await DuckDBInstance.create(this.file, {
            threads: '4',
            access_mode: 'READ_WRITE',
        });

        this.connection = await this.db.connect();
    }

    public async prepare(sql: string) {
        const prepared = new Prepared(this.connection);
        await prepared.prepare(sql);
        return prepared;
    }

    public async query(sql: string) {
        const reader = await this.connection.runAndReadAll(sql);
        return reader.getRowObjectsJson();
    }

    public async beginTransaction() {
        await this.query('BEGIN TRANSACTION');
    }

    public async commit() {
        await this.query('COMMIT');
    }

    public async rollback() {
        await this.query('ROLLBACK');
    }

    public async close() {
        this.connection.close();
    }

    public async statWal(): Promise<number> {
        try {
            const stat = await fs.stat(this.file + '.wal');
            return stat.size;
        } catch (err: any) {
            if (err.code === 'ENOENT') return 0;
            throw err;
        }
    }

    public async reset() {
        try {
            await fs.unlink(this.file);
            await fs.unlink(this.file + '.wal');
        } catch (err: any) {
            if (err.code !== 'ENOENT') throw err;
        }
    }
}