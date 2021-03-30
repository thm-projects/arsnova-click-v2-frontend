import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DbTable, StorageKey } from '../../lib/enums/enums';

@Injectable({
  providedIn: 'root',
})
export class StorageServiceMock {
  private _db: any = {
    initialized: of(true),
    [DbTable.Quiz]: {
      get: () => new Promise(resolve => resolve()),
      put: () => new Promise(resolve => resolve()),
      delete: () => new Promise(resolve => resolve()),
      toCollection: () => {
        return {
          sortBy: () => new Promise(resolve => resolve([])),
          each: () => new Promise(resolve => resolve([])),
        };
      },
    },
    [DbTable.Config]: {
      get: () => new Promise(resolve => resolve()),
      put: () => new Promise(resolve => resolve()),
      delete: () => new Promise(resolve => resolve()),
      toCollection: () => {
        return {
          sortBy: () => new Promise(resolve => resolve([])),
          each: () => new Promise(resolve => resolve([])),
        };
      },
    },
    getAllQuiznames(): Promise<any> {
      return new Promise(resolve => resolve(Object.keys({}).map(key => key)));
    },
  };
  public stateNotifier = of(null);

  get db(): any {
    return this._db;
  }

  constructor() {
  }

  public create(table: DbTable, key: string | StorageKey, value: any): Observable<any> {
    this._db[table][key] = value;
    return of(null);
  }

  public read(table: DbTable, key: string | StorageKey): Observable<any> {
    return of(this._db[table][key] || null);
  }

  public delete(table: DbTable, key: string | StorageKey): Observable<any> {
    delete this._db[table][key];
    return of(null);
  }

  public getAll(table: DbTable): Observable<any> {
    return of(Object.keys(this._db[table]).map(key => {
      return { value: JSON.parse(this._db[table][key]) };
    }));
  }

  public switchDb(): Observable<void> {
    return of(null);
  }
}
