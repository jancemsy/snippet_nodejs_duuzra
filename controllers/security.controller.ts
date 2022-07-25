import {
    TokenService,
    SecurityService,
    UserService,
} from '../shared/index';
import * as express from 'express';
import { ICredentials } from '../shared/security/models/credentials';
import { DuuzraRouteHandler } from '../shared/security/route.handler';
import { UserDocument } from '../shared/user/models/user-document';
import { IUserByEmailResponse } from '../duuzra_types/security';
import { IAuthUserDto } from '../duuzra_types/src/auth/auth-user-dto';

/**
 * Controller functions for the Authentication
 *
 * @export
 * @class SecurityController
 */
export class SecurityController {
    /**
     * Creates an instance of express.Router.
     *
     * @param {express.Router} router The application router
     */
    private router: express.Router;

    constructor(routeHandler: DuuzraRouteHandler) {
        this.router = routeHandler.router;

        this.router.post('/login', this.login);
        this.router.post('/register', this.register);

        this.router.post('/logout', this.logout);

        this.router.post('/sendResetPasswordEmail', this.sendResetPasswordEmail);
        this.router.post('/sendAccountCreatedEmail', this.sendAccountCreatedEmail);
        this.router.post('/sendDuuzraNotificationEmail', this.sendDuuzraNotificationEmail);
        this.router.post('/resetpassword', this.resetPassword);
        this.router.post('/confirmpassword', this.confirmPassword);
        this.router.post('/activate', this.activate);
        this.router.post('/validateToken', this.validateToken);
        this.router.post('/validUserByEmail', this.userByEmail);

        this.router.post('/createNewUser', this.createNewUser);
        this.router.post('/updateUserSettings', this.updateUserSettings);
        this.router.post('/getUserSettingsByEmail', this.getUserSettingsByEmails);

        // router.post('/authenticatetoken', jsonParser, this.authenticateToken);
    }

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public login = (req: express.Request, res: express.Response): void => {
        let credentials = req.body as ICredentials;
        let securityService = new SecurityService();

        if (credentials.deviceUuid && credentials.email && credentials.password) {
            securityService.login(credentials).then((session: any) => {

                res.status(200).json({
                    session: session
                });

            }, (loginFailed) => {
                let message = loginFailed || 'Faile d to login';
                res.status(401).json({
                    message: message,
                });

            });
        } else {
            res.status(401).json({
                message: 'Details supplied are incorrect',
            });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public logout = (req: express.Request, res: express.Response): void => {
        let securityService = new SecurityService();
        // let token = req.body.authtoken || req.query.authtoken || req.headers['x-access-token'];

        let token = req.body;

        if (token) {
            securityService.logout(token);
        } else {
            res.status(400).json({
                message: 'No token found',
            });
        }
    };

    /**
     * Registers the user as an attendee
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public register = (req: express.Request, res: express.Response): void => {
        const credentials = req.body as ICredentials;
        const securityService = new SecurityService();

        if (credentials.deviceUuid && credentials.email && credentials.password && credentials.registrationToken) {
            securityService.register(credentials.email, credentials.password, credentials.registrationToken).then((result) => {
                res.status(200).json({
                    message: 'Registration completed successfully.',
                });
            }, (err) => {
                res.status(500).json({
                    message: 'Details supplied are incorrect',
                });
            });
        } else {
            res.status(401).json({
                message: 'Details supplied are incorrect',
            });
        }
    };

    /**
     * Resets the user's password with the new provided password
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public resetPassword = (req: express.Request, res: express.Response): void => {
        const securityService = new SecurityService();

        const model = {
            email: req.body.email,
            newPassword: req.body.password,
            resetPasswordToken: req.body.resetPasswordToken
        };

        if (!!model.email && !!model.newPassword && !!model.resetPasswordToken) {
            securityService.resetPassword(model.email, model.newPassword, model.resetPasswordToken).then((token) => {
                res.status(200).json({
                    message: 'Password reset successfully'
                });
            }).catch((failed) => {
                res.status(400).json({
                    message: 'Failed to generate token',
                });
            });
        }
    };

    /**
     * Send reset password email via forgot password page
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public sendResetPasswordEmail = (req: express.Request, res: express.Response): void => {
        const body = req.body;
        const securityService = new SecurityService();

        if (!!body.email) {
            const email = body.email;

            securityService
                .sendResetPasswordEmail(email)
                .then((result) => {
                    res.status(200).json({
                        message: 'Password reset email sent successfully.',
                    });
                }, (err) => {
                    res.status(500).json({
                        message: err,
                    });
                });
        } else {
            res.status(401).json({
                message: 'Email not provided.',
            });
        }
    };
 
    public sendAccountCreatedEmail = (req: express.Request, res: express.Response): void => { 
        const body = req.body;
        const securityService = new SecurityService();

        if (!!body.email) {
            setTimeout(() => {

            const email = body.email;

            securityService
                .sendAccountCreatedEmail(email)
                .then((result) => {
                    res.status(200).json({
                        message: 'Acount Created email sent successfully.',
                    });
                }, (err) => {
                    res.status(500).json({
                        message: err,
                    });
                });
            }, 3000); } else {
            res.status(401).json({
                message: 'Email not provided.',
            });
        }
    };
 
    public sendDuuzraNotificationEmail = (req: express.Request, res: express.Response): void => { 
        const body = req.body;
        const securityService = new SecurityService();

        if (!!body.email) {
            setTimeout(() => {
            const email = body.email;
            const name = body.name;
            const createdDate = body.createdDate;
            securityService
                .sendDuuzraNotificationEmail(email, name, createdDate)
                .then((result) => {
                    res.status(200).json({
                        message: 'sendDuuzraNotificationEmail email sent successfully.',
                    });
                }, (err) => {
                    res.status(500).json({
                        message: err,
                    });
                });
            }, 3000); } else {
            res.status(401).json({
                message: 'Email not provided.',
            });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public confirmPassword = (req: express.Request, res: express.Response): void => {
        let securityService = new SecurityService();

        let body = req.body;
        let token = req.body.token || req.query.token || req.headers['x-access-token'];

        if (body.newPassword && token) {
            securityService.changePassword({
                newPassword: body.newPassword,
                token: token,
            }).then((changed) => {

                if (changed) {
                    res.status(200).json({
                        message: 'Password updated successfully.',
                    });
                } else {
                    res.status(400).json({
                        message: 'Failed to update password',
                    });
                }

            }).catch((updateFailed) => {

                res.status(400).json({
                    message: updateFailed,
                });

            });
        } else {
            res.status(400).json({
                message: 'Please check parameters',
            });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public activate = (req: express.Request, res: express.Response): void => {
        let body = req.body;
        let tokenService = new TokenService();

        if (body.email) {

            let model = {
                deviceUuid: body.deviceUuid,
                email: body.email,
            };

            tokenService.tokenByEmail(model).then((token) => {
                res.status(200).json({
                    token: token,
                });
            }).catch((failedToken) => {
                res.status(400).json({
                    message: 'Failed to generate a token',
                });
            });

        } else {
            res.status(400).json({
                message: 'Please check parameters',
            });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public authenticateToken = (req: express.Request, res: express.Response): void => {
        let tokenService = new TokenService();

        let token = req.body.token || req.query.token || req.headers['x-access-token'];
        let uuid = req.body.deviceUuid || undefined;

        if (token && uuid) {

            let model = {
                deviceUuid: uuid,
                token: token,
            };

            tokenService.validateTokenByDevice(model).then((tokenValid) => {

                res.status(200).json({
                    valid: tokenValid,
                });

            }).catch((failed) => {

                res.status(401).json({
                    message: failed,
                    valid: false,
                });

            });

        } else {
            res.status(400).json({
                message: 'Please check parameters',
                valid: false,
            });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public validateToken = (req: express.Request, res: express.Response): void => {
        let tokenService = new TokenService();
        let token = req.body.token || req.query.token || req.headers['x-auth'];
        let refreshToken = req.body.refreshToken;
        let email = req.body.email;
        if (token && refreshToken && email) {
            tokenService.refreshToken(token, refreshToken, email).then((tokenValid) => {
                if (tokenValid) {
                    res.status(200).json({
                        message: 'Token is valid',
                        newToken: tokenValid
                    });
                } else {
                    res.status(401).json({
                        message: 'Failed to validate token',
                    });
                }
            }).catch((err) => {
                res.status(401).json({
                    message: err,
                });
            });
        } else {
            res.status(500).json({
                message: 'Token, refresh token and email must be provided.',
            });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public userByEmail = (req: express.Request, res: express.Response): void => {
        let securityService: SecurityService = new SecurityService();

        if (req.body.email) {
            let email: string = req.body.email;

            securityService
                .validUserByEmail(email)
                .then((user: UserDocument) => {
                    let userResponse: IUserByEmailResponse;
                    if (user) {
                        userResponse = {
                            hasUser: true,
                            userId: user._id,
                            email: user.email,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            createdBy: user.createdBy
                        };

                        res.status(200)
                            .json(userResponse);
                    } else {
                        userResponse = {
                            hasUser: false,
                            userId: null,
                            email: '',
                            firstname: '',
                            lastname: '',
                            createdBy: null
                        };

                        res.status(200)
                            .json(userResponse);
                    }
                })
                .catch((err) => {
                    res.status(200)
                        .json({
                            message: 'There was a problem with getting the user by email.' + err,
                        });
                });
        } else {
            res
                .status(500)
                .json({
                    message: 'No email address was provided.',
                });
        }
    };

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public createNewUser = (req: express.Request, res: express.Response): void => {
        let securityService: SecurityService = new SecurityService();
        let request: any = req;

        if (req.body.email) {
            let email: string = req.body.email;
            let name: string = req.body.name;

            let token: string = req.headers['x-auth'] ? req.headers['x-auth'].toString() : null;

            securityService
                .createUser(email, name, token)
                .then((user: UserDocument) => {
                    let userResponse: IUserByEmailResponse;

                    if (user) {
                        userResponse = {
                            hasUser: true,
                            userId: user._id,
                            email: user.email,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            createdBy: user.createdBy
                        };
                        res
                            .status(201)
                            .json(userResponse);
                    } else {
                        userResponse = {
                            hasUser: false,
                            userId: null,
                            email: '',
                            firstname: '',
                            lastname: '',
                            createdBy: ''
                        };
                        res
                            .status(500)
                            .json({
                                message: 'No user found',
                            });
                    }
                });
        } else {
            res
                .status(500)
                .json({
                    message: 'No email address was provided.',
                });
        }
    };

    public updateUserSettings = (req: express.Request, res: express.Response): void => { 
        let userService: UserService = new UserService();
        if (req.body) {
            let menuStyle: string = req.body.settings.menuStyle;
            let menuPerPage: string = req.body.settings.menuPerPage;
            userService
                .updateMenuSetting(req.body)
                .then((setting: UserDocument) => {
                    if (setting) {
                        res
                            .status(201)
                            .json({
                                message: 'Setting updated',
                            });
                    } else {
                        res
                            .status(500)
                            .json({
                                message: 'No setting detail',
                            });
                    }
                });
        } else {
            res
                .status(500)
                .json({
                    message: 'No setting detail was provided.',
                });
        }
    };
    public getUserSettingsByEmails = (req: express.Request, res: express.Response): void => {

        let securityService: SecurityService = new SecurityService();

        if (req.body.email) {
            let email: string = req.body.email;

            securityService
                .validUserByEmail(email)
                .then((user: UserDocument) => {
                        res.status(200)
                            .json(user);

                })
                .catch((err) => {
                    res.status(200)
                        .json({
                            message: 'There was a problem with getting the user by email.' + err,
                        });
                });
        } else {
            res
                .status(500)
                .json({
                    message: 'No email address was provided.',
                });
        }
    };

}
