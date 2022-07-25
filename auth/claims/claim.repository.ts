import { IAuthClaimDto } from '../../duuzra_types/auth';
import { IAuthUserDoc } from '../../models/auth-user-doc';
import { System } from '../../shared';

export abstract class IAuthClaimRepository {
    public abstract async createClaim(authClaimDto: IAuthClaimDto): Promise<IAuthClaimDto>;
    public abstract async deleteClaim(authClaimDto: IAuthClaimDto): Promise<IAuthClaimDto>;
}

export class AuthClaimRepository implements IAuthClaimRepository {

    // ####################################
    // # DATA READS
    // ####################################

    // ####################################
    // # DATA CHANGES
    // ####################################

    /**
     * Saves the specified account
     */
    public async createClaim(authClaimDto: IAuthClaimDto): Promise<IAuthClaimDto> {
        console.log("claim.repository.ts createclaim()"); 
        try {
            // load the user doc
            const docId = 'auth-user_' + authClaimDto.authUuid;
            const couchGet = await System.DB.get('authUser', 'id', docId) as any;

            // add the item
            if (couchGet.docs.length === 1) {

                // add any claims specified
                const authUserDoc: IAuthUserDoc = couchGet.docs[0];
                authUserDoc.claims = !!authUserDoc.claims ? authUserDoc.claims : [];

                authClaimDto.claims.forEach((claim) => {
                    const claimIndex = authUserDoc.claims.indexOf(claim);
                    if (claimIndex === -1) {
                        authUserDoc.claims.push(claim);
                    }
                });

                const couchResponse = await System.DB.save(authUserDoc); 
                return Promise.resolve(authClaimDto); 
            } else { 
                return Promise.reject<IAuthClaimDto>(null);
            } 
        } catch (err) { 
            return Promise.reject<IAuthClaimDto>(null);
        }
    }

    public async deleteClaim(authClaimDto: IAuthClaimDto): Promise<IAuthClaimDto> {
        console.log("claim.repository.ts deleteclaim()"); 
        try {
            // load the user doc
            const docId = 'auth-user_' + authClaimDto.authUuid;
            const couchGet = await System.DB.get('authUser', 'id', docId) as any;

            // add the item
            if (couchGet.docs.length === 1) {

                // add any claims specified
                const authUserDoc: IAuthUserDoc = couchGet.docs[0];

                authClaimDto.claims.forEach((claim) => {
                    const claimIndex = authUserDoc.claims.indexOf(claim);
                    if (claimIndex > -1) {
                        authUserDoc.claims.splice(claimIndex, 1);
                    }
                });

                const couchResponse = await System.DB.save(authUserDoc);

                return Promise.resolve(authClaimDto);

            } else { 
                return Promise.reject<IAuthClaimDto>(null);
            }

        } catch (err) { 
            return Promise.reject<IAuthClaimDto>(err);
        }
    }
}
