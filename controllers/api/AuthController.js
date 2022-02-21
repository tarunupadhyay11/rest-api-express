const UserModel = require("../../models/user");
const {  body, validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const utility = require("../../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../../helpers/mailer");
const { constants } = require("../../helpers/constants");
require("dotenv").config();
/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	body("first_name").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("last_name").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom(async (value) => {
            
            const user = await UserModel.findOne({where:{email:value}});
            if (user) {
                return Promise.reject("E-mail already in use");
            }
		}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
    body('confirm-password').custom((value, { req }) => {
		if (value !== req.body.password) {
		  throw new Error('Password confirmation does not match password');
		}
	
		// Indicates the success of this synchronous custom validator
		return true;
	}),
    // Sanitize fields.
	body("first_name").escape(),
	body("last_name").escape(),
	body("password").escape(),
	// Process request after validation and sanitization.
   async (req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
                //hash input password
                if (req.body.password) {
                    req.body.password = await bcrypt.hash(req.body.password, 10);
                }
                const result = await UserModel.create(req.body);
                if (!result) {
                    return apiResponse.ErrorResponse(res, 'Something went wrong');
                }

                const { email } = req.body;
                const user = await UserModel.findOne({where:{email:email}});
              
                if(!user)  {
                    return apiResponse.ErrorResponse(res, 'Something went wrong');
                }
                return apiResponse.successResponse(res,"User registered Successfully.");
                // let userData = {
                //     id: user.id,
                //     first_name: user.first_name,
                //     last_name: user.last_name,
                //     email: user.email,
                //     created_at: user.created_at,
                //     updated_at: user.updated_at
                // };
                // return apiResponse.successResponseWithData(res,"User registered Successfully.", userData);
			
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),

	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {

                const { email, password: pass } = req.body;
                const user = await UserModel.findOne({where:{email:email}});
             
                if (!user) {
                    return apiResponse.unauthorizedResponse(res, "Incorrect email address!");
                }

                const isMatch = await bcrypt.compare(pass, user.password);

                if (!isMatch) {
                    return apiResponse.ErrorResponse(res, 'Incorrect password!');
                }

                let userData = {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                };
                 // user matched!
                const secretKey = process.env.JWT_SECRET || "";
                userData.token = jwt.sign({ id: user.id.toString() }, secretKey, {
                    expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                });

                return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

    exports.googleLogin = [
        body("first_name").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
        .isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
        .isEmail().withMessage("Email must be a valid email address."),
        body("google_id").isLength({ min: 1 }).trim().withMessage("Google id must be specified."),
        body("first_name").escape(),
        body("last_name").escape(),
        body("google_id").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
    
                    const { first_name,last_name,email, google_id } = req.body;
                    const user = await UserModel.findOne({where:{google_id:google_id}});
                  
                    if (user) {
                        let userData = {
                            id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                            created_at: user.created_at,
                            updated_at: user.updated_at
                        };
                        // user matched!
                        const secretKey = process.env.JWT_SECRET || "";
                        userData.token = jwt.sign({ id: user.id.toString() }, secretKey, {
                            expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                        });
                       return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
                    }
                    else{
                     
                        const emailCheck = await UserModel.findOne({where:{email:email}});
                        if(emailCheck){
                            const result = await UserModel.update({google_id:google_id},{where:{id:emailCheck.id}})
                          
                            if(!result){
                                return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                            }
                            
                                let userData = {
                                    id: emailCheck.id,
                                    first_name: emailCheck.first_name,
                                    last_name: emailCheck.last_name,
                                    email: emailCheck.email,
                                    created_at: emailCheck.created_at,
                                    updated_at: emailCheck.updated_at
                                };
                                // user matched!
                                const secretKey = process.env.JWT_SECRET || "";
                                userData.token = jwt.sign({ id: emailCheck.id.toString() }, secretKey, {
                                    expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                                });
                               return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
                        }
                        else{
                            const insertData = {
                                first_name: first_name,
                                last_name: last_name,
                                email: email,
                                google_id: google_id
                            };

                            const id = await UserModel.create(insertData);
                            
                            if (!id) {
                                return apiResponse.ErrorResponse(res, 'Something went wrong');
                            }
                            const newUser = await UserModel.findOne({where:{id:id}});
                          
                           
                            if(!newUser){
                                return apiResponse.ErrorResponse(res, 'Something went wrong');
                            }
                            let userData = {
                                id: newUser.id,
                                first_name: newUser.first_name,
                                last_name: newUser.last_name,
                                email: newUser.email,
                                created_at: newUser.created_at,
                                updated_at: newUser.updated_at
                            };
                           
                            // user matched!
                            const secretKey = process.env.JWT_SECRET || "";
                            userData.token = jwt.sign({ id: newUser.id.toString() }, secretKey, {
                                expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                            });
                           return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
            
                        }
                    }
                   
                }
            } catch (err) {
                return apiResponse.ErrorResponse(res, err);
            }
        }];


    exports.facebookLogin = [
        body("first_name").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
        .isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
        .isEmail().withMessage("Email must be a valid email address."),
        body("facebook_id").isLength({ min: 1 }).trim().withMessage("Google id must be specified."),
        body("first_name").escape(),
        body("last_name").escape(),
        body("facebook_id").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
    
                    const { first_name,last_name,email, facebook_id } = req.body;
                   
                    const user = await UserModel.findOne({where:{facebook_id:facebook_id}});
                    if (user) {
                        let userData = {
                            id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                            created_at: user.created_at,
                            updated_at: user.updated_at
                        };
                        // user matched!
                        const secretKey = process.env.JWT_SECRET || "";
                        userData.token = jwt.sign({ id: user.id.toString() }, secretKey, {
                            expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                        });
                        return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
                    }
                    else{
                       
                        const emailCheck = await UserModel.findOne({where:{email:email}});
                        if(emailCheck){
                            const result = await UserModel.update({facebook_id:facebook_id}, {where:{id:emailCheck.id}});
                            if(!result){
                                return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                            }
                            
                                let userData = {
                                    id: emailCheck.id,
                                    first_name: emailCheck.first_name,
                                    last_name: emailCheck.last_name,
                                    email: emailCheck.email,
                                    created_at: emailCheck.created_at,
                                    updated_at: emailCheck.updated_at
                                };
                                // user matched!
                                const secretKey = process.env.JWT_SECRET || "";
                                userData.token = jwt.sign({ id: emailCheck.id.toString() }, secretKey, {
                                    expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                                });
                                return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
                        }
                        else{
                            const insertData = {
                                first_name: first_name,
                                last_name: last_name,
                                email: email,
                                facebook_id: facebook_id
                            };

                            const id = await UserModel.create(insertData);
                            
                            if (!id) {
                                return apiResponse.ErrorResponse(res, 'Something went wrong');
                            }

                            const newUser = await UserModel.findOne({where:{id:id} });
                            
                            if(!newUser){
                                return apiResponse.ErrorResponse(res, 'Something went wrong');
                            }
                            let userData = {
                                id: newUser.id,
                                first_name: newUser.first_name,
                                last_name: newUser.last_name,
                                email: newUser.email,
                                created_at: newUser.created_at,
                                updated_at: newUser.updated_at
                            };
                            
                            // user matched!
                            const secretKey = process.env.JWT_SECRET || "";
                            userData.token = jwt.sign({ id: newUser.id.toString() }, secretKey, {
                                expiresIn:  process.env.JWT_TIMEOUT_DURATION,
                            });
                            return apiResponse.successResponseWithData(res,"LoggedIn successfully.", userData);
            
                        }
                    }
                    
                }
            } catch (err) {
                return apiResponse.ErrorResponse(res, err);
            }
        }];

    exports.forgotPassword = [
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
            .isEmail().withMessage("Email must be a valid email address."),
            body("email").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
                    const { email } = req.body;
                    const user = await UserModel.findOne({where:{email:email}});

                    if (user) {
                            // Generate otp
                            let otp = utility.randomNumber(6);
                            // Html email body
                            let html = "<p>Forgot  password </p><p>OTP: "+otp+"</p>";
                            // Send confirmation email
                            mailer.send(
                                `Miimoji <${constants.confirmEmails.from}>`, 
                                req.body.email,
                                "Forgot Password - OTP",
                                html
                            ).then(async function(){

                                const result = await UserModel.update({otp:otp}, {where:{id:user.id}});
                                if(!result){
                                    return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                                }

                                return apiResponse.successResponse(res,"Forgot password otp sent.");
                            });
                    }else{
                        return apiResponse.unauthorizedResponse(res, "Specified email not found.");
                    }
                }
            } catch (err) {
                return apiResponse.ErrorResponse(res, err);
            }
    }];


    exports.verifyOtp = [
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
            .isEmail().withMessage("Email must be a valid email address."),
        body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
                    const { email,otp } = req.body;
                    const user = await UserModel.findOne({where:{otp:otp,email:email}});

                    if (user) {
                        return apiResponse.successResponse(res,"Otp verified successfully.");
                    }else{
                        return apiResponse.unauthorizedResponse(res, "Specified otp not found.");
                    }
                }
            } catch (err) {
                return apiResponse.ErrorResponse(res, err);
            }
    }];


    exports.resetPassword = [
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
        .isEmail().withMessage("Email must be a valid email address."),
        body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
        body('confirm-password').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
        
            // Indicates the success of this synchronous custom validator
            return true;
        }),
        body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
       // body("email").escape(),
        body("password").escape(),
        body("otp").escape(),
       async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
                    const { email,otp } = req.body;
                    const user = await UserModel.findOne({where:{email:email}});

                    if (user) {
                        if(user.otp == otp){
                          
                            if (req.body.password) {
                                const pass = await bcrypt.hash(req.body.password, 10);
                                const result = await UserModel.update({password:pass,otp:null},{where:{id:user.id}});
                                if(!result){
                                    return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                                }

                                return apiResponse.successResponse(res,"Password reset successfully.");
                            }
                            else{
                                return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                            }
                            
                        }else{
                            let edata = [
                                {
                                    "value": "",
                                    "msg": "Otp does not match",
                                    "param": "otp",
                                    "location": "body"
                                }
                            ];
                            return apiResponse.unauthorizedResponse(res, "Otp does not match",edata);
                        }
                   
                }else{
                    return apiResponse.unauthorizedResponse(res, "Specified email not found.");
                }
                    
                }
            } catch (err) {
                return apiResponse.ErrorResponse(res, err);
            }
        }];

