import { glob } from 'glob';
import path from 'path';
import { Config } from './config.js';

export async function scanFiles(cwd: string, config: Config): Promise<string[]> {
    const extensions = config.fileExtensions.length > 1 ? `{${config.fileExtensions.join(',')}}` : config.fileExtensions[0];
    const pattern = `**/*.${extensions}`;

    const ignore = config.ignorePaths.map(p => {
        // Ensure ignore paths are treated as directories or files correctly
        return p.endsWith('/') ? `${p}**` : `${p}/**`;
    });
    // Also add the paths themselves if they are files
    ignore.push(...config.ignorePaths);

    const files = await glob(pattern, {
        cwd,
        ignore: ignore,
        absolute: true,
        nodir: true,
    });

    return files;
}
