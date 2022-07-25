import { IAuthClaimDto, IAuthUserDto } from '../../duuzra_types/auth';
import { IAuthUserDoc } from '../../models/auth-user-doc';
import { DateFormatter } from '../../duuzra_types/common';

const uuidgen = require('uuid/v1');
export class UserManagementMapper {
    public static getViewType() { return 'authUser'; }
    public static revertDocId(docId: string) { return docId.replace('auth-user_', ''); }
    public static revertDocIdClient(docId: string) { return docId.replace('duuzra-client_', ''); }

    public static mapToObj(userDoc: IAuthUserDoc): IAuthUserDto {
        try {
            let userDto: IAuthUserDto = {
                uuid: this.revertDocId(userDoc._id),
                password: userDoc.password,
                claims: userDoc.claims,
                email: userDoc.email,
                createdBy: userDoc.createdBy ?  userDoc.createdBy : null,
                firstname: userDoc.firstname,
                lastname: userDoc.lastname,
                dateCreated: userDoc.dateCreated,
                registrationToken: userDoc.registrationToken,
                hasRegistered: userDoc.hasRegistered,
                isEmailValidated: userDoc.isEmailValidated,
                isAnnonymous: userDoc.isAnnonymous,
                isAttendee: userDoc.isAttendee,
                permissions: userDoc.permissions,
                settings: userDoc.settings
            }
            return  userDto;
        }catch (e) { 
            return null; 
        }
    }

    public static mapToDoc(userDto: IAuthUserDto): IAuthUserDoc {
        let dateCreated = new DateFormatter(userDto.dateCreated);

        if (!userDto.uuid) {
            userDto.uuid = uuidgen();
        }

        let userDoc: IAuthUserDoc = {
            _id: 'auth-user_' + userDto.uuid,
            _rev: undefined,
            type: 'auth-user',
            password: userDto.password,
            claims: userDto.claims,
            email: userDto.email.toLowerCase(),
            firstname: userDto.firstname,
            lastname: userDto.lastname,
            createdBy: userDto.createdBy,
            dateCreated: dateCreated ? dateCreated.toJSON() : null,
            registrationToken: userDto.registrationToken,
            isEmailValidated: userDto.isEmailValidated,
            isAnnonymous: userDto.isAnnonymous,
            hasRegistered: userDto.hasRegistered,
            isAttendee: userDto.isAttendee,
            permissions: userDto.permissions,
            settings: userDto.settings
        };

        return userDoc;
    }
}
