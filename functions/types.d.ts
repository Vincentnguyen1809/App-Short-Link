interface Env {
  DATABASE_URL: string;
}

type PagesFunction<
  TEnv = Env,
  TParams extends string = any,
  TData extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<TEnv, TParams, TData>) => Response | Promise<Response>;
