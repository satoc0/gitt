type Fn = (...args: any[]) => unknown;

export class Result<
  Func extends Fn = Fn,
  ResultValue = ReturnType<Func> | Error | any
> {
  static async run<T extends Fn>(fn: T): Promise<Result<T>> {
    const run = new Result<T>(fn);

    await run.exec();

    return run;
  }

  private _isOk!: boolean;
  private resultValue!: ResultValue;

  private constructor(private fn: Func) {}

  private async exec() {
    try {
      const result = await this.fn();
      this.resultValue = result as ResultValue;
      this._isOk = true;
    } catch (e) {
      this.resultValue = e as ResultValue;
      this._isOk = false;
    }
  }

  public isOk(): boolean {
    return !!this._isOk;
  }

  public isNotOk(): boolean {
    return !this._isOk;
  }

  getResultValue(): ResultValue {
    return this.resultValue;
  }
}
