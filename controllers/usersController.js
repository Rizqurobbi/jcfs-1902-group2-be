const { db, dbQuery } = require("../supports/database")
const { transporter } = require("../supports/nodemailer")
const { hashPassword, createToken } = require('../supports/encrip')

module.exports = {

    getData: (req, res) => {
        db.query (
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
                       <a href='http://localhost:3002/verify/${token}'>Verifikasi akun</a>   
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
                await dbQuery(`UPDATE users set idstatus=1 WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let login = await dbQuery(`SELECT * from users where iduser=${db.escape(req.dataUser.iduser)};`)
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
    }
}