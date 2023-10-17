export interface IRedisOptions {
  url: string;
}

export interface IRedisAsyncOptions {
  imports: any[];
  inject: any[];
  useFactory: (...args: any[]) => Promise<IRedisOptions> | IRedisOptions;
}
