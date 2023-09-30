import { mkdtempSync, rmdirSync, readdirSync, copyFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

/** DO NOT run two of these functions at once, I'm too lazy to handle that edge case */
export const withTempCopiedFolder = async (
  folderToCopy: string,
  callback: (tempFolderPath: string) => Promise<void>
) => {
  try {
    folderToCopy = resolve(folderToCopy); // Make sure sourcePath is absolute
    const tempFolderPath = mkdtempSync(join(tmpdir(), 'swagger-temp-'));

    const files = readdirSync(folderToCopy);

    // Copy files from sourcePath to tempFolderPath
    for (const file of files) {
      const src = join(folderToCopy, file);
      const dest = join(tempFolderPath, file);
      copyFileSync(src, dest);
    }

    // Run the callback with the temporary folder path
    await callback(tempFolderPath);

    // Cleanup temporary folder
    rmdirSync(tempFolderPath, { recursive: true });
  } catch (error) {
    console.error('Error:', error);
  }
};
