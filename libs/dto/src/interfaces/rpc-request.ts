export interface IRpcRequest<T> {
  user_id: string;
  data: T;
}
