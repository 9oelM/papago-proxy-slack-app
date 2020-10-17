export function promiseHandler<Input>(
  promise: Promise<Input>
): Promise<[Input, undefined] | [undefined, Error]> {
  return promise
    .then((data: Input) => ([data, undefined] as [Input, undefined]))
    .catch((error: Error) => Promise.resolve<[undefined, Error]>([undefined, error]));
}
