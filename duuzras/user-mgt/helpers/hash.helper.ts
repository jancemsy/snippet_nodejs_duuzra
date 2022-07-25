import * as bcrypt from 'bcrypt-nodejs';

export class HashHelper {

    public static encrypt(password: string): Promise<string> {
        console.log("hash.helper.ts encrypt()");
        return new Promise<string>((resolve, reject) => {
            bcrypt.genSalt(10, (saltError, generatedSalt) => {
                // Generate a salt
                if (saltError) {
                    reject(new Error('ERROR: HashHelper.encryptPassword' + saltError));
                }

                // Generate hash based on salt.
                bcrypt.hash(password, generatedSalt, null, (hashError, hash) => {
                    if (hashError) {
                        reject(new Error('ERROR: HashHelper.encryptPassword' + hashError));
                    }
                    resolve(hash);
                });
            });
        });
    }
}
