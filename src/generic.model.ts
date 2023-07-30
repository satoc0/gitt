import { SimpleGit } from 'simple-git';
import { IRepositoryModel } from './repository/repository.model';

export type TFindRepoQuery = Partial<IRepositoryModel>;
export type TRuntimeRepoEntry = { repo: IRepositoryModel; sg: SimpleGit };
