import * as express from 'express';
import { DuuzraRouteHandler } from '../shared/security/route.handler';
import { AccountService } from '../_DELETE_ME_account/account.service';
import { AccountByFilter } from '../_DELETE_ME_account/models/account-by-filter';
import { ClaimsService } from '../shared/claims/claims.service';

/**
 * Controller functions for Accounts
 *
 * @export
 * @class AccountController
 */
export class AccountController {

    /**
     * Creates an instance of express.Router.
     *
     * @param {express.Router} router The application router
     */
    private router: express.Router;

    constructor(routeHandler: DuuzraRouteHandler) {
        this.router = routeHandler.router;

        //// Examples:
        // let claims = [
        //    'duuzra.{id}'
        // ]

        this.router.post('/create', this.createAccount);
        this.router.post('/delete', this.deleteAccount);
        this.router.post('/editaccountname', this.editAccountName);

        // Route Permission Examples:
        // this.router.post('/create', routeHandler.permissions(claims,this.router), this.createAccount);
        // this.router.post('/create/:id', routeHandler.permissions(claims,this.router), this.createAccount);
        // this.router.post('/delete', this.deleteAccount);
        // this.router.post('/editaccountname', this.editAccountName);
    }

    public createAccount = (req: express.Request, res: express.Response) => {
        let accountService: AccountService = new AccountService();
        let model = req.body;

        if (model.accountName) {
            accountService.createNewAccount(model).then((newAccountCreated) => {
                res.json({
                    account: newAccountCreated,
                    message: 'Account created',
                });
            }).catch((failedToCreate) => {
                let message = 'Failed to create a new account';
                if (typeof failedToCreate === 'string') { message = failedToCreate; }
                res.json({
                    message: message,
                });
            });
        }
    };

    public deleteAccount = (req: express.Request, res: express.Response): void => {
        let accountService: AccountService = new AccountService();
        let model = req.body;

        if (model.accountName) {
            accountService.deleteAccountBy(model.accountName, AccountByFilter.Name).then((accountDeleted) => {
                res.json({
                    message: accountDeleted,
                });
            }).catch((failedToDelete) => {
                res.json(failedToDelete);
            });
        } else {
            res.json({
                message: 'Account details were not provided.',
            });
        }
    };

    public editAccountName = (req: express.Request, res: express.Response): void => {
        let accountService: AccountService = new AccountService();
        let model = req.body;

        if (model.accountName && model.newAccountName) {
            accountService.editAccountName(model, AccountByFilter.Name).then((accountDeleted) => {
                res.json({
                    message: accountDeleted,
                });
            }).catch((failedToUpdate) => {
                res.json({
                    message: failedToUpdate,
                });
            });
        } else {
            res.json({
                message: 'Account details were not provided.',
            });
        }
    };
}
