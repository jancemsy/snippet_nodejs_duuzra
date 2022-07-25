import { IAuthUserDto } from '../../duuzra_types/auth';
import { IAuthUserDoc } from '../../models/auth-user-doc';
import { DateFormatter } from '../../duuzra_types/common';

const uuidgen = require('uuid/v1');
export class DuuzraUserMapper {

    public static getViewType() { return 'authUser'; }
    public static revertDocId(docId: string) { return docId.replace('auth-user_', ''); }

    public static mapToObj(userDoc: IAuthUserDoc): IAuthUserDto {

        try {

            let userDto: IAuthUserDto = {
                uuid: this.revertDocId(userDoc._id),
                password: userDoc.password,
                claims: userDoc.claims,
                email: userDoc.email,
                registrationToken: userDoc.registrationToken,
                createdBy: userDoc.createdBy || null,
                firstname: userDoc.firstname,
                lastname: userDoc.lastname,
                dateCreated: userDoc.dateCreated,
                hasRegistered: userDoc.hasRegistered,
                isEmailValidated: userDoc.isEmailValidated,
                isAnnonymous: userDoc.isAnnonymous,
                isAttendee: userDoc.isAttendee,
                permissions: userDoc.permissions,
                settings: null
            }

            return userDto;

        } catch (e) { 
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
            registrationToken: userDto.registrationToken,
            lastname: userDto.lastname,
            createdBy: userDto.createdBy,
            dateCreated: dateCreated ? dateCreated.toJSON() : null,
            hasRegistered: userDto.hasRegistered,
            isEmailValidated: userDto.isEmailValidated,
            isAnnonymous: userDto.isAnnonymous,
            isAttendee: userDto.isAttendee,
            permissions: userDto.permissions,
            settings: userDto.settings
        };

        return userDoc;
    }
}
