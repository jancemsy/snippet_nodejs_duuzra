import { DirectoryReader } from '../file-system/directory-reader';
import { FileReader } from '../file-system/file-reader';
import { IDbModel } from '../models/database/index';
import { CouchDb, System } from '../../shared';

export class SeedFactory {

    private _directoryReader: DirectoryReader;
    private _fileReader: FileReader;

    private _seedFolders: string[] = [];
    private _seedFiles: string[] = [];

    constructor() {
        this._directoryReader = new DirectoryReader();
        this._fileReader = new FileReader();
    }

    /**
     * Specifies the relative path to the documents folder from the documents root.
     * @param folder
     */
    public addSeedFolder(folder) {
        this._seedFolders.push(folder);
    }

    public extractFiles(): Promise<string[]> {
        console.log("seed.factiory.ts extractFiles()");
        return new Promise<string[]>((resolve, reject) => {
            this.buildFileList().then(() => {
                resolve(this._seedFiles);
            });
        });
    }

    public runSeed(res: any) { 
        this.buildFileList().then(() => {
            this.applyFileUpdates(res);
        }); 
    }

    private async addFiles(fileList): Promise<any> {
        console.log("seed.factiory.ts addFiles()");
        this._seedFiles = this._seedFiles.concat(fileList);
        return Promise.resolve();
    }

    
    


 
    private async buildFileList(): Promise<any> { 
        console.log("seed.factiory.ts buildFileLIst()");
        this._seedFiles = []; 
        let fileReadPromises = [] 
        this._seedFolders.forEach((folder) => { 
            let relativePath = './src/seed/couch-documents/' + folder + ''; 
            let readPromise = this._directoryReader.readFilesRecursive(relativePath).then((fileList: string[]) => {
                return this.addFiles(fileList);
            }); 
            fileReadPromises.push(readPromise);
        })

        return Promise.all(fileReadPromises).then(() => {
            return Promise.resolve();
        })
    }
    private async applyFileChanges(filePath, res: any): Promise<void> {
        console.log("seed.factiory.ts applyFileChanges()");

        return new Promise<void>((resolve, reject) => { 


            this._fileReader.readJson(filePath).then((json: any) => { 
                        let couchDoc: IDbModel = json;

                        if(couchDoc._id){
                        this.getDocumentRevision(couchDoc._id).then((revision) => { 

                            if (revision && revision !== '') {
                                couchDoc._rev = revision;
                            } else {
                                couchDoc._rev = undefined;
                            } 
                            System.DB.save(couchDoc).then(() => {
                                res.write("done extraction " + couchDoc._id  + "  \n "); 
                                resolve();
                            }).catch((err) => {
                                res.write("failed extraction " + couchDoc._id  + err + " \n "); 
                                resolve();
                                //reject(err);
                            }); 
                        });
                    }else{
                                res.write("failed extraction-error couchdocid "  + " \n "); 
                                resolve();
                    }
            }).catch(err =>{
                res.write("failed extraction " + err);  
                resolve();
            });
        }); 
    }

    private async getDocumentRevision(couchDocId): Promise<string> { 
        console.log("seed.factiory.ts getDocumentRevision()");
        return System.DB.getRevision(couchDocId).then((revision) => {
            return Promise.resolve(revision);
        }).catch(() => {
            return Promise.resolve('');
        });
    }

    private async applyFileUpdates(res: any) { 
        const filesPaths = this._seedFiles; 

        for (let filePath of filesPaths) {

            try{
                res.write(" ->  " + filePath + "\n\n");
                await this.applyFileChanges(filePath, res);
            }catch(e){
                res.write(" ->  error?? \n");
            }
        }
        
        res.write(" ending execution here... \n");

        res.end();
    }
}
