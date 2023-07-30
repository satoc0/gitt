/* eslint-disable @typescript-eslint/unbound-method */
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { Database } from 'sqlite3';
import { promisify } from 'util';
import { repositoriesTableName } from '../migrations/create-tables.sql';
import { IRepositoryModel } from './repository.model';

export const DATABASE_FILENAME = 'gitt-db.sqlite3';

function getDatabaseFullPath(): string {
  const rootDir = process.cwd();
  return join(rootDir, DATABASE_FILENAME);
}

export class Repository {
  private static instance: Repository;

  static getInstance(): Repository {
    if (Repository.instance) return Repository.instance;

    Repository.instance = new Repository();

    return Repository.instance;
  }

  static async alreadyInitialized(): Promise<boolean> {
    try {
      await access(getDatabaseFullPath());
      return true;
    } catch (e) {
      return false;
    }
  }

  private db: Database = new Database(getDatabaseFullPath());

  public exec = promisify(this.db.exec).bind(this.db);
  public run = promisify(this.db.run).bind(this.db);
  public get = promisify(this.db.get).bind(this.db);
  public all = promisify(this.db.all).bind(this.db);

  public getAllRepositories(): Promise<IRepositoryModel[]> {
    return this.all(`SELECT * from ${repositoriesTableName}`) as Promise<
      IRepositoryModel[]
    >;
  }
}
