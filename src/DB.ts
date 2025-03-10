import duckdb, { Connection, Database, Statement } from 'duckdb';
import { promises as fs } from 'fs';
import path from 'path';


export class Prepared {
    private prepared?: Statement;
    private connection: Connection;
    private sql = '';

    constructor(connection: Connection) {
        this.connection = connection;
    }

    public async prepare(sql: string) {
        this.sql = sql;
        this.prepared = await new Promise<Statement>((resolve, reject) => {
            this.connection.prepare(sql, (err, statement) => {
                if (err) {
                    console.log(`Error in conn.prepare: ${sql}`);
                    reject(err);
                } else resolve(statement);
            });
        });
    }


    public async all(values: any[]) {
        if (!this.prepared) throw new Error('PreparedStatement was not prepared!');

        const rows = await new Promise((resolve, reject) => {
            this.prepared!.all(...values, (err, rows) => {
                if (err) {
                    console.log(`Error in statement.all: ${this.sql}`, values);
                    reject(err);
                } else resolve(rows);
            });
        });

        return rows;
    }


    public run(values: any[]) : Promise<void> {
        if (!this.prepared) throw new Error('PreparedStatement was not prepared!');

        return new Promise((resolve, reject) => {
            this.prepared!.run(...values, (err) => {
                if (err)  {
                    console.log(`Error in statement.run: ${this.sql}`, values);
                    reject(err);
                } 
                else resolve();
            });
        });
    }

    public async finalize() : Promise<void> {
        if (!this.prepared) return;

        return new Promise((resolve, reject) => {
            this.prepared!.finalize((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}



export class DB {
    private file: string = path.join(path.dirname(new URL(import.meta.url).pathname), 'test.duckdb');
    private db: Database;
    private connection: Connection;

    public async load() {
        this.db = new duckdb.Database(this.file, {
            threads: '4',
            access_mode: 'READ_WRITE',
        });

        this.connection = this.db.connect();
    }

    public async prepare(sql: string) {
        const prepared = new Prepared(this.connection);
        await prepared.prepare(sql);
        return prepared;
    }

    public async query(sql: string) {
        return new Promise((resolve, reject) => {
            this.connection.all(sql, (err, result) => {
                if (err) {
                    console.log(`Error in query: ${sql}`);
                    reject(err);
                } else resolve(result);
            });
        });
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
        this.db.close();
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