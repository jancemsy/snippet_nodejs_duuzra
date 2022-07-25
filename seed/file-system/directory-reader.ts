
export class DirectoryReader {

    private fs = require('fs');
    private path = require('path');

    public async readFilesRecursive(relativeDirectory: string): Promise<string[]> {
        let absDirectory = this.path.resolve(relativeDirectory);
        let results: string[] = await this.walkDirectory(absDirectory)
        return Promise.resolve(results);
    }

    private walkDirectory(dir): Promise<string[]> {
        return this.fsReaddirAsync(dir).then((list) => {
            return Promise.all(list.map((file) => {

                file = this.path.resolve(dir, file);

                return this.fsStatAsync(file).then((stat: any) => {

                    if (stat.isDirectory()) {
                        return this.walkDirectory(file);
                    } else {
                        return [file];
                    }

                });
            }));
        }).then(function(results) {
            // flatten the array of arrays
            return Array.prototype.concat.apply([], results);
        });
    }

    private fsReaddirAsync(dir): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            this.fs.readdir(dir, (err, list) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(list);
                }
            });
        });
    }

    private fsStatAsync(file): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fs.stat(file, (err, stat) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stat);
                }
            });
        });
    }
}
