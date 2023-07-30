import { Repository } from '../repository/repository';

export const repositoriesTableName = 'repositories';
const repositoriesTableCreateSQL = `
  CREATE TABLE IF NOT EXISTS ${repositoriesTableName} (
    name TEXT PRIMARY KEY UNIQUE NOT NULL,
    path TEXT NOT NULL,
    repo_group TEXT
  );
`;

export const commitHistoryTableName = 'commit_history';
const commitHistoryTableCreateSQL = `
  CREATE TABLE IF NOT EXISTS ${commitHistoryTableName} (
    universal_gitt_commit_id INTEGER PRIMARY KEY UNIQUE,
    hash TEXT,
    branch TEXT,
    repo TEXT,
    message TEXT,
    FOREIGN KEY (repo) 
      REFERENCES ${repositoriesTableName} (name) 
         ON DELETE CASCADE 
         ON UPDATE NO ACTION
  );
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const commandsHistoryTableCreateSQL = `
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY,
    command TEXT,
    repo TEXT,
    branch TEXT,
    exec_result INT,
    FOREIGN KEY (repo) 
      REFERENCES ${repositoriesTableName} (name) 
         ON DELETE CASCADE 
         ON UPDATE NO ACTION
  );
`;

export async function createTables(): Promise<void> {
  await Promise.all([
    Repository.getInstance().exec(repositoriesTableCreateSQL),
    Repository.getInstance().exec(commitHistoryTableCreateSQL),
    // this.repository.exec(stateTableCreateSQL),
  ]);
}
