const { db, dbQuery } = require("../supports/database")
const { transporter } = require("../supports/nodemailer")
const { hashPassword, createToken } = require('../supports/encrip')
const { uploader } = require('../supports/uploader')
const fs = require('fs')
const { default: axios } = require("axios")

axios.defaults.baseURL = 'https://api.rajaongkir.com/starter'
axios.defaults.headers.common['key'] = 'a53c7f264da34d259c80c753bc6e616f'
axios.defaults.headers.post['Content-type'] = 'application/x-www-form-urlencoded';

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
                res.status(200).send({
                    success: false,
                    message: "Email exist.",
                    error: ""
                })
            } else {
                let insertUser = await dbQuery(insertSQL);
                if (insertUser.insertId) {
                    let getUser = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                    JOIN role r on u.idrole = r.idrole
                    JOIN status s on u.idstatus = s.idstatus
                    WHERE iduser=${insertUser.insertId}`)
                    let { iduser, idaddress, username, email, role, status, fullname, gender, age } = getUser[0]
                    let token = createToken({ iduser, idaddress, username, email, role, status, fullname, gender, age })
                    await transporter.sendMail({
                        from: "Farmacia",
                        to: `${req.body.email}`,
                        subject: "Confirm Registration Farmacia",
                        html: `<div>
                       <h3>Click link below to verif your account! </h3>
                       <a href='http://farmacia-jcfs1902g2.vercel.app/verify/${token}'>Verifikasi akun</a>
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
                error: error
            })
        }
    },
    verify: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                await dbQuery(`UPDATE users set idstatus=2 WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let login = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus where iduser=${db.escape(req.dataUser.iduser)};`)
                let resultsAddress = await dbQuery(`Select * from address`)
                login.forEach((value, index) => {
                    value.address = []
                    resultsAddress.forEach(val => {
                        if (value.iduser == val.iduser) {
                            delete val.idproduct
                            value.address.push(val)
                        }
                    })
                })
                if (login.length > 0) {
                    let { iduser, idaddress, address, username, email, role, status, imageurl, fullname, gender, age } = login[0]
                    let token = createToken({ iduser, idaddress, address, username, email, role, status, imageurl, fullname, gender, age })
                    res.status(200).send({
                        success: true,
                        message: "Login Success",
                        dataVerify: { iduser, idaddress, username, email, imageurl, role, status, token, fullname, gender, age, address },
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
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error: error
            });
        }
    },
    verifyNewEmail: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                await dbQuery(`UPDATE users SET idstatus = 1 where iduser = ${req.dataUser.iduser}`)
                let login = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus where iduser=${db.escape(req.dataUser.iduser)};`)
                if (login.length > 0) {
                    let { iduser, idaddress, username, email, role, status, imageurl, fullname, gender, age } = login[0]
                    let token = createToken({ iduser, idaddress, username, email, role, status, imageurl, fullname, gender, age })
                    await transporter.sendMail({
                        from: "Farmacia",
                        to: `${req.body.email}`,
                        subject: "Confirm Your Changed Email",
                        html: `<div>
                        <h3>Click link below to verif your account! </h3>
                        <a href='http://farmacia-jcfs1902g2.vercel.app/verify/${token}'>Verifikasi akun</a>
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
                message: 'Failed',
                error
            })
        }
    },
    login: async (req, res) => {
        let { email, password } = req.body
        try {
            if (email.includes('@')) {
                loginQuery = `SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus
                where email=${db.escape(email)} AND password=${db.escape(hashPassword(password))};`
            } else {
                loginQuery = `SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus
                where username=${db.escape(email)} AND password=${db.escape(hashPassword(password))};`
            }
            let loginSQL = await dbQuery(loginQuery)
            let resultsAddress = await dbQuery(`Select * from address`)
            if (loginSQL.length > 0) {
                loginSQL.forEach((value, index) => {
                    value.address = []
                    resultsAddress.forEach(val => {
                        if (value.iduser == val.iduser) {
                            delete val.idproduct
                            value.address.push(val)
                        }
                    })
                })
                let { iduser, idaddress, username, password, email, imageurl, role, status, fullname, gender, age, address } = loginSQL[0]
                let token = createToken({ iduser, idaddress, username, password, email, imageurl, role, status, fullname, gender, age })
                res.status(200).send({
                    success: true,
                    message: "Login Success",
                    dataLogin: { iduser, idaddress, username, password, email, imageurl, role, status, token, fullname, gender, age, address },
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
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'Failed',
                error
            })
        }
    },
    keepLogin: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                let keepLoginScript = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
            JOIN role r on u.idrole = r.idrole
            JOIN status s on u.idstatus = s.idstatus
            WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let resultsAddress = await dbQuery(`Select * from address`)
                keepLoginScript.forEach((value, index) => {
                    value.address = []
                    resultsAddress.forEach(val => {
                        if (value.iduser == val.iduser) {
                            delete val.idproduct
                            value.address.push(val)
                        }
                    })
                })
                let { iduser, idaddress, username, email, password, imageurl, role, status, fullname, gender, age, address } = keepLoginScript[0]
                let token = createToken({ iduser, idaddress, username, email, password, imageurl, role, status, fullname, gender, age, address })
                res.status(200).send({
                    message: 'Keep Login Success',
                    success: true,
                    dataKeepLogin: { iduser, idaddress, username, email, password, imageurl, role, status, token, fullname, gender, age, address }
                })
            }
        } catch (error) {
            res.status(500).send({
                success: false,
                message: 'Keep Failed',
                error
            })
        }
    },
    forgotPassword: async (req, res) => {
        try {
            let getUser = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
            JOIN role r on u.idrole = r.idrole
            JOIN status s on u.idstatus = s.idstatus WHERE email=${db.escape(req.body.email)};`)
            let { iduser, idaddress, username, email, password, imageurl, role, status, fullname, gender, age } = getUser[0]
            let token = createToken({ iduser, idaddress, username, email, password, imageurl, role, status, fullname, gender, age })
            await transporter.sendMail({
                from: "Farmacia",
                to: `${req.body.email}`,
                subject: "Reset your password",
                html: `<div>
                       <h3>Click link below to reset your pasword</h3>
                       <a href='http://farmacia-jcfs1902g2.vercel.app/reset/${token}'>Reset Password</a>   
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
            if (req.dataUser.iduser) {
                await dbQuery(`UPDATE users set password=${db.escape(hashPassword(newPass))} WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                let login = await dbQuery(`SELECT u.*, r.role, s.status FROM jcfs1902group2.users u 
                JOIN role r on u.idrole = r.idrole
                JOIN status s on u.idstatus = s.idstatus where iduser=${db.escape(req.dataUser.iduser)};`)
                if (login.length > 0) {
                    let { iduser, idaddress, username, email, role, status, imageurl, fullname, gender, age } = login[0]
                    let token = createToken({ iduser, idaddress, username, email, role, status, imageurl, fullname, gender, age })
                    res.status(200).send({
                        success: true,
                        message: "Login Success",
                        dataReset: { iduser, idaddress, username, email, role, status, imageurl, token },
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
    },
    changePassword: async (req, res) => {
        try {
            let { newPassword, oldPassword } = req.body
            if (hashPassword(oldPassword) === req.dataUser.password) {
                if (req.dataUser.iduser) {
                    await dbQuery(`UPDATE users set password=${db.escape(hashPassword(newPassword))} WHERE iduser=${db.escape(req.dataUser.iduser)};`)
                    res.status(200).send({
                        success: true,
                        message: "Change Password Success",
                        error: ""
                    })
                } else {
                    res.status(200).send({
                        success: false,
                        message: 'Change Password failed',
                        dataReset: {},
                        error: ""
                    })
                }
            } else {
                res.status(200).send({
                    success: false,
                    message: 'Change Password failed',
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
    },
    editProfile: async (req, res) => {
        try {
            const uploadFile = uploader('/imgProfile', 'IMGPRO').array('Images', 1)
            uploadFile(req, res, async (error) => {
                try {
                    let { fullname, username, gender, age, email } = JSON.parse(req.body.data)
                    if (req.files.length > 0) {
                        await dbQuery(`UPDATE users SET fullname='${fullname}', username='${username}', gender='${gender}', age='${age}', email='${email}', imageurl='/imgProfile/${req.files[0].filename}' WHERE iduser=${req.dataUser.iduser};`)
                    } else {
                        await dbQuery(`UPDATE users SET fullname='${fullname}', username='${username}', gender='${gender}', age='${age}', email='${email}', imageurl='${req.dataUser.imageurl}' WHERE iduser=${req.dataUser.iduser};`)
                    }
                    res.status(200).send({
                        success: true,
                        message: 'Edit Profile Success',
                        error: ""
                    })
                } catch (error) {
                    console.log(error);
                    req.files.forEach(val => fs.unlinkSync(`./public/imgProfile/${val.filename}`))
                    res.status(500).send({
                        success: false,
                        message: 'Failed ❌',
                        error
                    })
                }
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    addAddress: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                let { address_label, name, handphone, idprovince, idcity, address } = req.body
                let getProvince = await axios.get(`/province?id=${idprovince}`)
                let getCity = await axios.get(`/city?id=${idcity}&province=${idprovince}`)
                if (getProvince && getCity) {
                    let province = getProvince.data.rajaongkir.results.province
                    let city = getCity.data.rajaongkir.results.city_name
                    await dbQuery(`INSERT into address values(null, ${req.dataUser.iduser}, ${db.escape(idprovince)}, ${db.escape(idcity)},  ${db.escape(address_label)}, ${db.escape(name)}, '${handphone}', '${province}', '${city}', ${db.escape(address)} )`)
                    res.status(200).send({
                        success: true,
                        message: 'Insert new address success',
                        error: ""
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    editAddress: async (req, res) => {
        try {
            let { idaddress, address_label, name, handphone, idprovince, idcity, address } = req.body
            let getProvince = await axios.get(`/province?id=${idprovince}`)
            let getCity = await axios.get(`/city?id=${idcity}&province=${idprovince}`)
            if (getProvince && getCity) {
                let province = getProvince.data.rajaongkir.results.province
                let city = getCity.data.rajaongkir.results.city_name
                if (req.dataUser.iduser) {
                    await dbQuery(`UPDATE address SET address_label=${db.escape(address_label)}, idprovince=${db.escape(idprovince)}, idcity=${db.escape(idcity)}, nama_penerima=${db.escape(name)}, handphone='${handphone}', province='${province}', city='${city}', address=${db.escape(address)}
                    WHERE iduser=${req.dataUser.iduser} AND idaddress=${idaddress};`)
                    res.status(200).send({
                        success: true,
                        message: 'Update address success',
                        error: ""
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    deleteAddress: async (req, res) => {
        try {
            if (req.dataUser.iduser) {
                await dbQuery(`DELETE from address where idaddress=${req.params.id}`)
                res.status(200).send({
                    success: true,
                    message: 'Delete address success',
                    error: ""
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    chooseAddress: async (req, res) => {
        try {
            let { idaddress } = req.body
            await dbQuery(`UPDATE users SET idaddress = ${db.escape(idaddress)} WHERE iduser = ${req.dataUser.iduser};`)
            res.status(200).send({
                success: true,
                message: "Choose Address success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Choose Address Failed",
                error
            })
        }
    },
    uploadrecipe: async (req, res) => {
        try {
            const uploadFile = uploader('/imgRecipe', 'IMGREC').array('Images', 1)
            uploadFile(req, res, async (error) => {
                try {
                    let { invoice } = JSON.parse(req.body.data)
                    await dbQuery(`INSERT into resep values(null, ${req.dataUser.iduser}, 9, '/imgRecipe/${req.files[0].filename}', '${invoice}', DATE_ADD(now(), INTERVAL 7 HOUR))`)
                    res.status(200).send({
                        success: true,
                        message: 'insert recipe success',
                        error: ""
                    })
                } catch (error) {
                    console.log(error);
                    req.files.forEach(val => fs.unlinkSync(`./public/imgRecipe/${val.filename}`))
                    res.status(500).send({
                        success: false,
                        message: 'Failed ❌',
                        error
                    })
                }
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    }

}