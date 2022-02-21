const UserModel = require("../../models/user");
const {  body, validationResult,check } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const bcrypt = require("bcrypt");
const auth = require("../../middlewares/jwt");
var path = require('path');
const fs = require('fs-extra');
var os = require("os");
const multer  = require('multer')
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		let path = `./public/uploads/user/`;
		fs.mkdirsSync(path);
		callback(null, path);
	  },
	filename: function (req, file, cb) {
	   cb(null, 'profile-' +uuidv4() + '-' + Date.now() + path.extname(file.originalname));
	//cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
	},
  });


const fileFilter = (req, file, cb) => {
const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
} else {
    cb(null, false);
}
};

const profileUpload = multer({
	storage: storage,
	limits: {
	  fileSize: 1024 * 1024 * 2,
	},
	fileFilter: fileFilter,
  });

exports.detail = [
	auth,
	// Process request after validation and sanitization.
   async (req, res) => {
		try {
                const user = await UserModel.findOne({attributes: { exclude: ['password'] },where:{id:req.user.id}});
              
                if(!user)  {
                    return apiResponse.ErrorResponse(res, 'Something went wrong');
                }

                const image = user.image?req.headers.host+"/uploads/user/"+user.image:null;
				user.image = image;

                return apiResponse.successResponseWithData(res,"User detail.", user);
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];


    exports.update = [
        auth,
        body("first_name").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
        .isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
        body("last_name").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
        .isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
        .isEmail().withMessage("Email must be a valid email address.").custom(async (value,{req}) => {
          // console.log('auth=',req.user.id)
            const user = await UserModel.findOne({where:{email:value}});
            if (user && user.id != req.user.id) {
            return Promise.reject("E-mail already in use");
            }
        }),
        body('password').custom((value, { req }) => {
            if (value) {
                if(value.length < 6){
                    throw new Error('New Password must be 6 characters or greater.');
                }
                if(!req.body.old_password){
                    throw new Error('Old  password is required and must be 6 characters or greater.');
                }
                if (req.body.confirm_password !== req.body.password) {
                    throw new Error('Password confirmation does not match password');
                }
            }
        
            // Indicates the success of this synchronous custom validator
            return true;
        }),
        body("first_name").escape(),
        body("last_name").escape(),
       async (req, res) => {
            try {
                const errors = validationResult(req);
                if(!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
                    const { email,first_name,last_name } = req.body;
                    const user = await UserModel.findOne({where:{id:req.user.id}});
    
                    if (user) {

                        let userData = {
                            email:email,
                            first_name:first_name,
                            last_name:last_name
                        }

                        if(req.body.password){
                            const isMatch = await bcrypt.compare(req.body.old_password, user.password);

                            if (!isMatch) {
                                return apiResponse.ErrorResponse(res, 'Incorrect old password!');
                            }
                            const pass = await bcrypt.hash(req.body.password, 10);
                            userData.password = pass;
                        }
                        
                        const result = await UserModel.update(userData,{where:{id:req.user.id}});
                        if(!result){
                            return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                        }

                        return apiResponse.successResponse(res,"User updated successfully.");
                    }else{
                        return apiResponse.unauthorizedResponse(res, "No authorization token was found.");
                    }
                }
            } catch (err) {
                return apiResponse.ErrorResponse(res, err);
            }
        }];


        exports.changePassword = [
            auth,
            body("old_password").isLength({ min: 6 }).trim().withMessage("New  password must be 6 characters or greater."),
            body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
            body('confirm_password').custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Password confirmation does not match password');
                }
            
                // Indicates the success of this synchronous custom validator
                return true;
            }),
            body("old_password").escape(),
            body("password").escape(),
           async (req, res) => {
                try {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                    }else {
                        const { old_password,password } = req.body;
                        const user = await UserModel.findOne({where:{id:req.user.id}});
    
                        if (user) {
                            const isMatch = await bcrypt.compare(old_password, user.password);

                            if (!isMatch) {
                                return apiResponse.ErrorResponse(res, 'Incorrect old password!');
                            }
                              
                                if (password) {
                                    const pass = await bcrypt.hash(password, 10);
                                    const result = await UserModel.update({password:pass,otp:null},{where:{id:user.id}});
                                    if(!result){
                                        return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                                    }
    
                                    return apiResponse.successResponse(res,"Password changed successfully.");
                                }
                                else{
                                    return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                                }
                       
                        }else{
                            return apiResponse.unauthorizedResponse(res, "No authorization token was found.");
                        }
                        
                    }
                } catch (err) {
                    return apiResponse.ErrorResponse(res, err);
                }
            }];

    exports.updateImage = [
        auth,
        // Validate fields.
        // multer middleware
        profileUpload.single('image'),
        // express-validator middleware
        check('image')
        .custom((value, {req}) => { 
            //console.log('req',req.files.mimetype)
                if(req.file.mimetype === 'image/jpeg'){
                    return '.jpeg'; // return "non-falsy" value to indicate valid data"
                }if(req.file.mimetype === 'image/jpg'){
                    return '.jpg'; // return "non-falsy" value to indicate valid data"
                }if(req.file.mimetype === 'image/png'){
                    return '.png'; // return "non-falsy" value to indicate valid data"
                }else{
                    return false; // return "falsy" value to indicate invalid data
                }
            })
        .withMessage('Please upload image only in jpeg jpg and png format.'), // custom error message that will be send back if the file in not a image.
        // Process request after validation and sanitization.
       async (req, res) => {
            try {
                // Extract the validation errors from a request.
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    // Display sanitized values/errors messages.
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
                    const user = await UserModel.findOne({where:{id:req.user.id}});
                    if (user) {
                        const oldPhoto = user.image;
                        if (oldPhoto) {
                            const oldPath = path.join(__dirname, "../../", "public/uploads/user/", oldPhoto);
                            if (fs.existsSync(oldPath)) {
                                fs.unlink(oldPath, async (err) => {
                                if (err) {
                                    return apiResponse.ErrorResponse(res, err);
                                }
                                const result = await UserModel.update({image:req.file.filename}, {where:{id:user.id}});
                                if(!result){
                                    return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                                }
                                return apiResponse.successResponse(res,"User profile updated successfully.");
                                });
                            }
                        }
                        else{
                            const result = await UserModel.update({image:req.file.filename}, {where:{id:user.id}});
                            if(!result){
                                return apiResponse.unauthorizedResponse(res, "Something went wrong!");
                            }
                            return apiResponse.successResponse(res,"User profile updated successfully.");
                        }
                    }
                    else{
                        return apiResponse.unauthorizedResponse(res, "User not found.");
                    }
                }
            } catch (err) {
                //throw error in json response with status 500.
                return apiResponse.ErrorResponse(res, err);
            }
    }];