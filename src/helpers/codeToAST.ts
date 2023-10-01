import * as parser from '@babel/parser';
import type { File } from '@babel/types';

export function codeToAst(code: string): File {
  // I have no idea what eslint's problem is, the return type is clearly not any. Incompetent OSS contributors to eslint? Or am I incompetent?
  return parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
}
