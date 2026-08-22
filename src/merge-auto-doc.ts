export type PathsObject = Record<string, Record<string, unknown>>;

/**
 * Merge auto-generated paths with manually documented paths.
 *
 * The result is the union of both, with manual operations winning over
 * generated ones per HTTP method.
 */
export function mergeAutoDoc(
  autoPaths: PathsObject,
  manualPaths: PathsObject
): PathsObject {
  return Object.fromEntries(
    Object.entries({ ...autoPaths, ...manualPaths }).map(
      ([path, operations]) => {
        const generatedOperations = autoPaths[path] ?? {};
        return [path, { ...generatedOperations, ...operations }];
      }
    )
  );
}
