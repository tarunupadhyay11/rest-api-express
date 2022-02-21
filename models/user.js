const Sequelize = require('sequelize');    
const sequelize = require('../config/db');    
    
const user = sequelize.define('users', {  
id:{
type:Sequelize.NUMBER,    
allowNull:false,    
primaryKey:true,    
autoIncrement: true    
  },    
    // attributes    
    first_name: {
      type: Sequelize.STRING,    
      allowNull: false    
    },    
    last_name: {
      type: Sequelize.STRING,    
      allowNull:true    
      // allowNull defaults to true    
    },    
    email:{
        type:Sequelize.STRING,    
        allowNull:true,
        validate: {
            isEmail:true
        },
        unique: {
            args: true,
            msg: 'Email address already in use!'
        }
    },    
    password:{
        type:Sequelize.STRING,    
        allowNull:true    
    },    
    image:{
        type:Sequelize.STRING,    
        allowNull:true    
    },    
    google_id:{
        type:Sequelize.STRING,    
        allowNull:true    
    },    
    facebook_id:{
        type:Sequelize.STRING,    
        allowNull:true    
    },    
    otp:{
        type:Sequelize.STRING,    
        allowNull:true    
    }
},{ 
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['otp'] }
      }
 });    
    
  module.exports = user;    