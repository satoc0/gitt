import simpleGit from 'simple-git';
import { TFindRepoQuery, TRuntimeRepoEntry } from './generic.model';
import { Repository } from './repository/repository';
import { IRepositoryModel } from './repository/repository.model';

export class Runtime {
  isAlreadyInitialized = false;
  allRepositories: IRepositoryModel[] = [];
  allRepos: TRuntimeRepoEntry[] = [];

  public async init(): Promise<void> {
    this.isAlreadyInitialized = await Repository.alreadyInitialized();

    if (this.isAlreadyInitialized) {
      await this.loadAllRepos();
      this.initSimpleGitInstances();
    }
  }

  private async loadAllRepos(): Promise<void> {
    this.allRepositories = await Repository.getInstance().getAllRepositories();
  }

  private initSimpleGitInstances() {
    this.allRepos = this.allRepositories.map(repo => {
      return { repo, sg: simpleGit(repo.path) };
    });
  }

  findRepo(query: TFindRepoQuery): IRepositoryModel | undefined {
    return this.allRepositories.find(repo => searchPredicate(query, repo));
  }

  findRepoMany(query: TFindRepoQuery): IRepositoryModel[] {
    return this.allRepositories.filter(repo => searchPredicate(query, repo));
  }
}

function searchPredicate(
  query: TFindRepoQuery,
  repo: IRepositoryModel
): boolean {
  return Object.keys(query).every(k => {
    const key = k as keyof IRepositoryModel;
    return repo[key] === query[key];
  });
}
