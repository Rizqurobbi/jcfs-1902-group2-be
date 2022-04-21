const { dbQuery, db } = require("../supports/database");
const { uploader } = require('../supports/uploader')

module.exports = {
    getCart: async (req, res) => {
        try {
            let getSQL = await dbQuery(`Select c.*,p.nama,ct.category,p.harga,s.qty as stock_qty,p.harga * c.qty as total_harga, i.url from carts c
            JOIN products p on c.idproduct = p.idproduct
            JOIN category ct on ct.idcategory = p.idcategory
            JOIN images i on p.idproduct = i.idproduct
            JOIN stocks s on c.idstock = s.idstock where c.iduser = ${db.escape(req.dataUser.iduser)} `)
            res.status(200).send({
                success: true,
                message: "Get Cart Success",
                dataCart: getSQL,
                error: ''
            })
        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    addToCart: async (req, res) => {
        try {
            let getSQL = await dbQuery(`SELECT c.*,s.qty as stock_qty from carts c JOIN stocks s on c.idstock=s.idstock where c.idproduct = ${req.body.idproduct} and c.idstock = ${req.body.idstock} and c.iduser = ${db.escape(req.dataUser.iduser)}`)
            if (getSQL.length > 0) {
                console.log('Tes', getSQL[0])
                if (getSQL[0].qty + req.body.qty <= getSQL[0].stock_qty) {
                    let editSQL = await dbQuery(`UPDATE carts set qty = ${req.body.qty + getSQL[0].qty} where idcart = ${getSQL[0].idcart}`)
                    res.status(200).send({
                        success: true,
                        message: `Update qty success ✅`,
                        error: ''
                    })
                } else {
                    res.status(200).send({
                        success: false,
                        message: 'Stock Habis ❌',
                        error: ''
                    })
                }
            } else {
                let addSQL = await dbQuery(`Insert into carts value (null,${db.escape(req.dataUser.iduser)},${req.body.idproduct},${req.body.idstock},${req.body.qty})`)
                res.status(200).send({
                    success: true,
                    message: `Add To Cart Success`,
                    error: ''
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    deleteCart: async (req, res) => {
        try {
            await dbQuery(`DELETE FROM carts WHERE idcart =${req.params.id}`)
            res.status(200).send({
                success: true,
                message: 'Delete Cart Success',
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    updateQty: async (req, res) => {
        try {
            await dbQuery(`UPDATE carts SET qty = ${req.body.qty} where idcart = ${req.params.id}`)
            res.status(200).send({
                success: true,
                message: "Update Qty Success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    checkout: async (req, res) => {
        try {

            let insertTransactions = await dbQuery(`INSERT INTO transactions values (null,${req.dataUser.iduser},${db.escape(req.body.idaddress)},4,${db.escape(req.body.invoice)},DATE_ADD(now(),interval 7 hour),${db.escape(req.body.total_price)},${db.escape(req.body.shipping)},${db.escape(req.body.total_payment)},${db.escape(req.body.notes)},null)`)
            console.log(req.body.detail)
            if (insertTransactions.insertId) {
                let getCart = await dbQuery(`Select c.*,p.nama,ct.category,p.harga,s.qty as stock_qty,p.harga * c.qty as total_harga, i.url from carts c
                JOIN products p on c.idproduct = p.idproduct
                JOIN category ct on ct.idcategory = p.idcategory
                JOIN images i on p.idproduct = i.idproduct
                JOIN stocks s on c.idstock = s.idstock where c.iduser = ${db.escape(req.dataUser.iduser)}`)
                getCart.forEach(async (value, index) => {
                    let resultsStocks = await dbQuery(`Select s.*,u.satuan from stocks s join unit u on s.idunit = u.idunit where idproduct = ${value.idproduct}`)
                    let sisaStock = resultsStocks[0].qty - value.qty
                    let totalPerkalian = sisaStock * resultsStocks[1].qty
                    console.log('cek stok', totalPerkalian)
                    console.log('cek cuk', sisaStock)
                    console.log('cek cuk', resultsStocks[2].idstock)
                    await dbQuery(`UPDATE stocks set qty = ${sisaStock} where idstock = ${value.idstock}`)
                    await dbQuery(`UPDATE stocks set qty = ${totalPerkalian} where idstock = ${resultsStocks[2].idstock}`)
                })
                let generateDetail = req.body.detail.map(val => `(null,${insertTransactions.insertId},${val.idproduct},${val.idstock},${val.qty},${val.total_harga})`)
                await dbQuery(`INSERT INTO detail_transactions values ${generateDetail.toString()};`)
                await dbQuery(`DELETE from carts WHERE iduser=${req.dataUser.iduser}`)
                res.status(200).send({
                    success: true,
                    message: 'Checkout Success',
                    error: ''
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    checkoutRecipe: async (req, res) => {
        try {
            let insertTransactions = await dbQuery(`INSERT INTO transactions values (null, ${req.body.iduser}, ${db.escape(req.body.idaddress)}, 4, ${db.escape(req.body.invoice)}, DATE_ADD(now(), INTERVAL 7 HOUR),${db.escape(req.body.total_price)},${db.escape(req.body.shipping)},${db.escape(req.body.total_payment)},${db.escape(req.body.notes)},'Waiting for payment')`)
            if (insertTransactions.insertId) {
                req.body.detail.forEach(async (value) => {
                    let resultsStocks = await dbQuery(`Select s.*, u.satuan from stocks s join unit u on s.idunit = u.idunit where idproduct = ${value.idproduct};`)
                    let sisaJumlahStockNetto = resultsStocks[2].qty - value.qty
                    await dbQuery(`UPDATE stocks set qty = ${sisaJumlahStockNetto} where idstock = ${resultsStocks[2].idstock}`)
                    let sisaStockNow = resultsStocks[0].qty * resultsStocks[1].qty
                    if (sisaJumlahStockNetto < sisaStockNow) {
                        let sisaStockBotol = resultsStocks[0].qty - Math.ceil((resultsStocks[0].qty - (sisaJumlahStockNetto / resultsStocks[1].qty)))
                        await dbQuery(`UPDATE stocks set qty = ${sisaStockBotol} where idstock = ${resultsStocks[0].idstock}`)
                    }
                })
                let generateDetail = req.body.detail.map(val => `(null,${insertTransactions.insertId},${val.idproduct},${val.idstock},${val.qty},${val.total_harga})`)
                await dbQuery(`INSERT INTO detail_transactions values ${generateDetail.toString()};`)
                await dbQuery(`DELETE from carts WHERE iduser=${req.dataUser.iduser}`)
                res.status(200).send({
                    success: true,
                    message: 'Checkout Success',
                    error: ''
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    getTransactions: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, s.status, a.address FROM transactions t
            JOIN status s on s.idstatus = t.idstatus
            JOIN address a on a.idaddress = t.idaddress where t.iduser = ${req.dataUser.iduser};`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction WHERE iduser = ${req.dataUser.iduser}; `)
            getTransactions.forEach((value) => {
                value.detail = [];
                getDetail.forEach(val => {
                    if (val.idtransaction == value.idtransaction) {
                        value.detail.push(val);
                    }
                })
            })
            console.log('transaction', getTransactions.detail)
            console.log('detail', getDetail)
            res.status(200).send({
                success: true,
                message: 'Get Transactions success',
                dataTransaction: getTransactions,
                error: ""
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },
    getOngoingTransactions: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, s.status, a.address FROM transactions t
            JOIN status s on s.idstatus = t.idstatus
            JOIN address a on a.idaddress = t.idaddress where t.iduser = ${req.dataUser.iduser} AND (t.idstatus = 4 or t.idstatus = 7 or t.idstatus = 8);`)

            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction WHERE iduser = ${req.dataUser.iduser}; `)
            getTransactions.forEach((value) => {
                value.detail = [];
                getDetail.forEach(val => {
                    if (val.idtransaction == value.idtransaction) {
                        value.detail.push(val);
                    }
                })
            })
            console.log('transaction', getTransactions.detail)
            console.log('detail', getDetail)
            res.status(200).send({
                success: true,
                message: 'Get Transactions success',
                dataTransaction: getTransactions,
                error: ""
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },
    getAllTransactionsAdmin: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, u.username, s.status from transactions t JOIN status s on t.idstatus = s.idstatus JOIN users u ON u.iduser = t.iduser ${req.query.nama ? `WHERE u.username LIKE '%${req.query.nama}%'` : ''}${req.query.start_date && req.query.end_date ? `and date between '${req.query.start_date}' and '${req.query.end_date}'` : ''}`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, u.username ,t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga from detail_transactions d 
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN users u ON u.iduser = t.iduser `)
           
            getTransactions.forEach((value) => {
                value.detail = [];
                getDetail.forEach(val => {
                    if (val.idtransaction == value.idtransaction) {
                        value.detail.push(val);
                    }
                })
            })

            // console.log('transaction', getTransactions.detail)
            // console.log('detail', getDetail)
            res.status(200).send({
                success: true,
                message: 'Get Transactions success',
                dataTransactionAdmin: getTransactions,
                error: ""
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },
    getPastTransactions: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, s.status, a.address FROM transactions t
            JOIN status s on s.idstatus = t.idstatus
            JOIN address a on a.idaddress = t.idaddress where t.iduser = ${req.dataUser.iduser} AND (t.idstatus = 5 or t.idstatus = 6);`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction WHERE iduser = ${req.dataUser.iduser}; `)

            getTransactions.forEach((value) => {
                value.detail = [];
                getDetail.forEach(val => {
                    if (val.idtransaction == value.idtransaction) {
                        value.detail.push(val);
                    }
                })
            })

            // console.log('transaction', getTransactions.detail)
            // console.log('detail', getDetail)
            res.status(200).send({
                success: true,
                message: 'Get Transactions success',
                dataTransactionAdmin: getTransactions,
                error: ""
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },
    getOngoingTransactionsAdmin: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, u.username, s.status from transactions t JOIN status s on t.idstatus = s.idstatus JOIN users u ON u.iduser = t.iduser where (t.idstatus = 4 or t.idstatus = 7 or t.idstatus = 8) ${req.query.nama ? `and u.username LIKE '%${req.query.nama}%'` : ''}${req.query.start_date && req.query.end_date ? `and date between '${req.query.start_date}' and '${req.query.end_date}'` : ''}`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, u.username ,t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga from detail_transactions d 
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN users u ON u.iduser = t.iduser`)
            getTransactions.forEach((value) => {
                value.detail = [];
                getDetail.forEach(val => {
                    if (val.idtransaction == value.idtransaction) {
                        value.detail.push(val);
                    }
                })
            })
            // console.log('transaction', getTransactions.detail)
            // console.log('detail', getDetail)
            res.status(200).send({
                success: true,
                message: 'Get Transactions success',
                dataTransactionAdmin: getTransactions,
                error: ""
          })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },
    discardTransaction: async (req, res) => {
        try {
            await dbQuery(`UPDATE transactions SET idstatus = 6 where idtransaction=${req.body.idtransaction}`)
            res.status(200).send({
                success: true,
                message: "Update status success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },
    getRecipe: async (req, res) => {
        try {
            if (req.dataUser.role === 'User') {
                let getRecipe = await dbQuery(`SELECT u.fullname, u.idaddress, r.*, s.status FROM jcfs1902group2.resep r
                    JOIN users u on u.iduser = r.iduser JOIN status s on s.idstatus = r.idstatus where r.iduser =  ${req.dataUser.iduser};`)
                res.status(200).send({
                    success: true,
                    message: 'Get User Recipe success',
                    dataRecipe: getRecipe,
                    error: ""
                })
            } else {
                let getRecipe = await dbQuery(`SELECT u.fullname, u.idaddress, r.*, s.status FROM jcfs1902group2.resep r
                JOIN users u on u.iduser = r.iduser JOIN status s on s.idstatus = r.idstatus where r.idstatus = 9;`)
                res.status(200).send({
                    success: true,
                    message: 'Get User Recipe success',
                    dataRecipe: getRecipe,
                    error: ""
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },

    editStatusRecipe: async (req, res) => {
        try {
            await dbQuery(`UPDATE resep SET idstatus=7 where idresep=${req.body.idresep}`)
            res.status(200).send({
                success: true,
                message: "Update status success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed",
                error
            })
        }
    },

    discardStatusRecipe: async (req, res) => {
        try {
            await dbQuery(`UPDATE resep SET idstatus=6 where idresep=${req.body.idresep}`)
            res.status(200).send({
                success: true,
                message: "Update status success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed ❌',
                error
            })
        }
    },
    uploadPayment: async (req, res) => {
        try {
            const uploadFile = uploader('/imgPayment', 'IMGPAY').array('Images', 1)
            uploadFile(req, res, async (error) => {
                try {
                    let { idtransaction } = JSON.parse(req.body.data)
                    await dbQuery(`UPDATE transactions SET payment_url='/imgPayment/${req.files[0].filename}', idstatus = 8 WHERE idtransaction = ${idtransaction};`)
                    res.status(200).send({
                        success: true,
                        message: 'insert payment upload success',
                        error: ""
                    })
                } catch (error) {
                    console.log(error);
                    req.files.forEach(val => fs.unlinkSync(`./public/imgPayment/${val.filename}`))
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