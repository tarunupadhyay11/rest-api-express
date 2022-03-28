# Nodejs Expressjs Mysql Multer Ready-to-use API Project Structure
A ready-to-use boilerplate for REST API Development with Node.js, Express,  multer,Postgres, MySQL, MariaDB, SQLite, Microsoft SQL Server, Amazon Redshift and Snowflake’s Data Cloud  database..

## Getting started

This is a basic API skeleton written in JavaScript ES2015. Very useful to building a RESTful web APIs for your front-end platforms like Android, iOS or JavaScript frameworks (Angular, Reactjs, etc).

This project will run on **NodeJs** using **Postgres, MySQL, MariaDB, SQLite, Microsoft SQL Server, Amazon Redshift and Snowflake’s Data Cloud.** as database. I had tried to maintain the code structure easy as any beginner can also adopt the flow and start building an API. Project is open for suggestions, Bug reports and pull requests.


## Features

- Basic Authentication (Register/Login with hashed password)
- Password reset with 6 (Changeable) digit OTP.
- User detail/User update/Change passsword/Update profile.
- Email helper ready just import and use.
- JWT Tokens, make requests with a token after login with `Authorization` header with value `Bearer yourToken` where `yourToken` will be returned in Login response.
- Pre-defined response structures with proper status codes.
- Included CORS.
- Validations added.
- Included API collection for Postman.
- Light-weight project.

## Software Requirements

- Node.js
- Mysql

## How to install

### Using Git (recommended)

1.  Clone the project from github. Change "myproject" to your project name.

```bash
git clone https://github.com/tarunupadhyay11/rest-api-express.git ./myproject
```

### Using manual download ZIP

1.  Download repository
2.  Uncompress to your desired directory

### Install yarn dependencies after installing (Git or manual download)

```bash
cd myproject
yarn install
```

### Setting up environments

1.  You will find a file named `.env.example` on root directory of project.
2.  Create a new file by copying and pasting the file and then renaming it to just `.env`
    ```bash
    cp .env.example .env
    ```
3.  The file `.env` is already ignored, so you never commit your credentials.
4.  Change the values of the file to your environment. Helpful comments added to `.env.example` file to understand the constants.

## Project structure

```
.
├── app.js
├── package.json
├── bin
│   └── www
├── controllers
│   ├── api/AuthController.js
│   └── api/UserController.js
├── models
│   └── User.js
├── routes
│   ├── api/auth.js
│   ├── api/user.js
│   └── api/index.js
├── middlewares
│   ├── jwt.js
├── helpers
│   ├── apiResponse.js
│   ├── constants.js
│   ├── mailer.js
│   └── utility.js
└── public
```

## How to run

### Running API server locally

```bash
yarn dev
```

You will know server is running by checking the output of the command `yarn dev`

### Creating new models

If you need to add more models to the project just create a new file in `/models/` and use them in the controllers.

### Creating new routes

If you need to add more routes to the project just create a new file in `/routes/` and add it in `/routes/api/` it will be loaded dynamically.

### Creating new controllers

If you need to add more controllers to the project just create a new file in `/controllers/` and use them in the routes.



