/**
 * This class is the definiation of the permission required to access each of the endpoints.
 * It is an abstraction of the actual claims required to access the enpoints.
 * Some accesses may carry the same claim however this abraction allows maniplation of the required permission without
 *  rewriing the code.
 */

// todo - implement into the api
export class DuuzraPermissions {

    public static duuzraInfo: any = {
        create: 'duuzra.account.{uuid}.admin', // was 'duuzra.info.create'
        read: 'duuzra.info.{uuid}', // was 'duuzra.info'
        update: 'duuzra.info.{uuid}.editor', // was 'duuzra.info.' + uuid + '.control-panel'
        delete: 'duuzra.info.{uuid}.admin', // was 'duuzra.info.' + uuid + '.control-panel'

    };

    public static duuzraFolder: any = {
        create: 'duuzra.client.{uuid}',
        update: 'duuzra.client.{uuid}.editor',
        delete: 'duuzra.client.{uuid}.admin'
    };

    public static duuzraAccount: any = {
        create: 'duuzra.role.super-admin',
        read: 'duuzra.client.{uuid}',
        update: 'duuzra.client.{uuid}',
        delete: 'duuzra.role.super-admin',
        listDuuzraInfos: 'duuzra.client.{uuid}',
        listFolders: 'duuzra.client.{uuid}'
    };

    public static behaviours: any = {
        viewAccounts: 'duuzra.client.{uuid}',
        viewAccountsFolders: 'duuzra.client.{uuid}',
        viewAccountsDuuzras: 'duuzra.client.{uuid}',
    };

    public static extraction: any = {
        extractAccountIds: 'duuzra.account.',
        extractDuuzraInfoIds: 'duuzra.info.',
        extractClientId: 'duuzra.client.'
    }

    public static deletion: any = {
        deleteAccountClaims: 'duuzra.account.{uuid}',
        deleteDuuzraInfoClaims: 'duuzra.info.{uuid}',
    }

}
