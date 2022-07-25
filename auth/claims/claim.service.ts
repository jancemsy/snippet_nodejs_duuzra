
import { IAuthClaimDto } from '../../duuzra_types/auth';
import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { AuthClaimRepository, IAuthClaimRepository } from './claim.repository';

/* Cross Service Communication */
/* The RPC mechanism needs to be considered before any split for this item */
import { ClaimsService } from '../../shared/claims/claims.service';

import { HashHelper } from '../';

export abstract class IAuthClaimService {
    public abstract async createClaim(authClaim: IAuthClaimDto): Promise<IAuthClaimDto>;
    public abstract async deleteClaim(authClaim: IAuthClaimDto): Promise<IAuthClaimDto>;
}

/**
 * Service only ever used from the content service to update claims when permissions change for admin
 */
export class AuthClaimService implements IAuthClaimService {
    private claimRepo: IAuthClaimRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        this.claimRepo = new AuthClaimRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createClaim(authClaim: IAuthClaimDto): Promise<IAuthClaimDto> {
        console.log("claim.service.ts createclaim()"); 
        return this.claimRepo.createClaim(authClaim);
    }

    public async deleteClaim(authClaim: IAuthClaimDto): Promise<IAuthClaimDto> {
        console.log("claim.service.ts deleteclaim()"); 
        return this.claimRepo.deleteClaim(authClaim);
    }
}
