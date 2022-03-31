const { db, dbQuery } = require("../supports/database")
const { transporter } = require("../supports/nodemailer")
const { hashPassword, createToken } = require('../supports/encrip')

module.exports = {

    getData: (req, res) => {
        db.query(
            `SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
            JOIN role r on u.idrole = r.idrole
            JOIN status s on u.idstatus = s.idstatus;`,
            (err, results) => {
                if (err) {
                    console.log(err)
                    res.status(400).send(err)
                };
                res.status(200).send(results);
            }
        )
    },
    register: async (req, res) => {
        try {
            let { username, email, password, idrole, idstatus } = req.body
            let insertSQL =
                `INSERT into users ( iduser, idrole, idstatus, username, email, password) values
           (null, ${idrole}, ${idstatus}, ${db.escape(username)}, ${db.escape(email)}, ${db.escape(hashPassword(password))});`

            let getSQL = `SELECT * from users WHERE email=${db.escape(email)}`

            let checkEmail = await dbQuery(getSQL)
            if (checkEmail.length > 0) {
                res.status(400).send({
                    success: false,
                    message: "Email exist.",
                    error: ""
                })
            } else {
                let insertUser = await dbQuery(insertSQL);
                if (insertUser.insertId) {
                    let getUser = await dbQuery(`SELECT * from users WHERE iduser=${insertUser.insertId}`)
                    let { iduser, username, email, role, status } = getUser[0]
                    let token = createToken({ iduser, username, email, role, status })
                    await transporter.sendMail({
                        from: "Farmacia",
                        to: "fawwazputrou@gmail.com",
                        subject: "Confirm Registration Farmacia",
                        html: `<div>
                       <h3>Click link below to verif your account! </h3>
                       <a href='http://localhost:3000/verify/${token}'>Verifikasi akun</a>   
                       </div>`
                    })
                    res.status(200).send({
                        success: true,
                        message: "Register Success",
                        error: ""
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error: err
            })
        }
    },
    verify: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                console.log('ini iduser', req.dataUser.iduser)
                await dbQuery(`UPDATE users set idstatus=2 WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let login = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus where iduser=${db.escape(req.dataUser.iduser)};`)
                if (login.length > 0) {
                    let { iduser, username, email, role, status, imageurl } = login[0]
                    let token = createToken({ iduser, username, email, role, status, imageurl })
                    res.status(200).send({
                        success: true,
                        message: "Login Success",
                        dataVerify: { username, email, role, status, imageurl, token },
                        error: ""
                    })
                }
            } else {
                res.status(401).send({
                    success: false,
                    message: 'Verify failed',
                    dataVerify: {},
                    error: ""
                })
            }
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Failed",
                error: error
            });
        }
    },
    login: (req, res, next) => {
        let { email, password } = req.body
        let loginSQL =
            `SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
        JOIN role r on u.idrole = r.idrole
        JOIN status s on u.idstatus = s.idstatus
        where email=${db.escape(email)} AND password=${db.escape(hashPassword(password))};`
        db.query(loginSQL, (err, results) => {
            if (err) {
                res.status(500).send({
                    success: false,
                    message: "Failed",
                    error: err
                });
            };
            if (results.length > 0) {
                let { iduser, username, email, imageurl, role, status } = results[0]
                let token = createToken({ iduser, username, email, imageurl, role, status })
                res.status(200).send({
                    success: true,
                    message: "Login Success",
                    dataLogin: { username, email, imageurl, role, status, token },
                    err: ""
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: "Login Failed",
                    dataLogin: {},
                    err: ""
                })
            }
        })
    },
    keepLogin: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                let keepLoginScript = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
            JOIN role r on u.idrole = r.idrole
            JOIN status s on u.idstatus = s.idstatus
            WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let { iduser, username, email, password, imageurl, role, status } = keepLoginScript[0]
                let token = createToken({ iduser, username, email, password, imageurl, role, status })
                res.status(200).send({
                    message: 'Keep Login Success',
                    success: true,
                    dataKeepLogin: { username, email, password, imageurl, role, status, token }
                })
            }
        } catch (error) {
            console.log('error keep login : ', error)
            res.status(500).send({
                success: false,
                message: 'Keep Failed',
                error
            })
        }
    },
    forgotPassword: async (req, res) => {
        try {
            let getUser = await dbQuery(`SELECT * from users WHERE email=${db.escape(req.body.email)};`)
            let { iduser, username, email, role, status } = getUser[0]
            let token = createToken({ iduser, username, email, role, status })
            await transporter.sendMail({
                from: "Farmacia",
                to: `${req.body.email}`,
                subject: "Reset your password",
                html: `<div>
                       <h3>Click link below to reset your pasword</h3>
                       <a href='http://localhost:3000/reset/${token}'>Reset Password</a>   
                       </div>`
            })
            res.status(200).send({
                success: true,
                getUser,
                message: "Email Sent.",
                error: ""
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error: err
            })
        }
    },
    resetPassword: async (req, res) => {
        try {
            let { newPass } = req.body
            console.log('get data user', req.dataUser.iduser, req.body.newPass)
            if (req.dataUser.iduser) {
                await dbQuery(`UPDATE users set password=${db.escape(hashPassword(newPass))} WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let login = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus where iduser=${db.escape(req.dataUser.iduser)};`)
                if (login.length > 0) {
                    let { iduser, username, email, role, status, imageurl } = login[0]
                    let token = createToken({ iduser, username, email, role, status, imageurl })
                    res.status(200).send({
                        success: true,
                        message: "Login Success",
                        dataReset: { username, email, role, status, imageurl, token },
                        error: ""
                    })
                }
            } else {
                res.status(401).send({
                    success: false,
                    message: 'Reset Password failed',
                    dataReset: {},
                    error: ""
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error: error
            });
        }
    }
}