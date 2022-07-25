
export class FileReader {

    private fs = require('fs');
    private path = require('path');

    /**
     * Reads file contents of a specified folder and loads the file paths into state
     * @param relFolder
     */
    public readJson(absFilePath: string): Promise<any> {

        var fs = require('fs');

        return new Promise<any>((resolve, reject) => {

            var obj;
            fs.readFile(absFilePath, 'utf8', function(err, data) {
                if (err) { throw err; }
                obj = JSON.parse(data);
                resolve(obj);
            });

        });
    }
}
