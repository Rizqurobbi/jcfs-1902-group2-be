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
            if (req.dataUser.role == 'User') {
                let insertTransactions = await dbQuery(`INSERT INTO transactions values (null,${req.dataUser.iduser},${db.escape(req.body.idaddress)},7,${db.escape(req.body.invoice)},DATE_ADD(now(),interval 7 hour),${db.escape(req.body.total_price)},${db.escape(req.body.shipping)},${db.escape(req.body.total_payment)},${db.escape(req.body.notes)},'From cart user',null)`)
                if (insertTransactions.insertId) {
                    let getSalesReport = await dbQuery(`Select * from sales_report`)
                    let getCart = await dbQuery(`Select c.*,p.nama,ct.category,p.harga,s.qty as stock_qty,p.harga * c.qty as total_harga, i.url from carts c
                    JOIN products p on c.idproduct = p.idproduct
                    JOIN category ct on ct.idcategory = p.idcategory
                    JOIN images i on p.idproduct = i.idproduct
                    JOIN stocks s on c.idstock = s.idstock where c.iduser = ${db.escape(req.dataUser.iduser)}`)
                    getCart.forEach(async (value) => {
                        let resultsStocks = await dbQuery(`Select s.*,u.satuan from stocks s join unit u on s.idunit = u.idunit where idproduct = ${value.idproduct}`)
                        let sisaStock = resultsStocks[0].qty - value.qty
                        let totalPerkalian = sisaStock * resultsStocks[1].qty
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
            let insertTransactions = await dbQuery(`INSERT INTO transactions values (null, ${req.body.iduser}, ${db.escape(req.body.idaddress)}, 4, ${db.escape(req.body.invoice)}, DATE_ADD(now(), INTERVAL 7 HOUR),${db.escape(req.body.total_price)},${db.escape(req.body.shipping)},${db.escape(req.body.total_payment)},${db.escape(req.body.notes)},'Recipe', null)`)
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
                let generateDetail = req.body.detail.map(val => `(null, ${insertTransactions.insertId}, ${val.idproduct}, ${val.idstock}, ${val.qty}, ${val.total_harga})`)
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
    getUserTransactions: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, s.status, a.* FROM transactions t
            JOIN status s on s.idstatus = t.idstatus
            JOIN address a on a.idaddress = t.idaddress where t.iduser = ${req.dataUser.iduser};`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga, u.satuan from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN stocks s on s.idstock = d.idstock
            JOIN unit u on u.idunit = s.idunit WHERE iduser = ${req.dataUser.iduser}; `)
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
    getUserOngoingTransactions: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, s.status, a.* FROM transactions t
            JOIN status s on s.idstatus = t.idstatus
            JOIN address a on a.idaddress = t.idaddress where t.iduser = ${req.dataUser.iduser} AND (t.idstatus = 4 or t.idstatus = 7 or t.idstatus = 8);`)

            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga, u.satuan from detail_transactions d

            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN stocks s on s.idstock = d.idstock
            JOIN unit u on u.idunit = s.idunit WHERE iduser = ${req.dataUser.iduser}; `)
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
    getUserPastTransactions: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, s.status, a.* FROM transactions t
            JOIN status s on s.idstatus = t.idstatus
            JOIN address a on a.idaddress = t.idaddress where t.iduser = ${req.dataUser.iduser} AND (t.idstatus = 5 or t.idstatus = 6);`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes, d.*, i.url, p.nama, p.harga, u.satuan from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN stocks s on s.idstock = d.idstock
            JOIN unit u on u.idunit = s.idunit WHERE iduser = ${req.dataUser.iduser}; `)

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
            let getTransactions = await dbQuery(`SELECT t.*, u.username, s.status from transactions t JOIN status s on t.idstatus = s.idstatus JOIN users u ON u.iduser = t.iduser ${req.query.invoice ? `WHERE t.invoice LIKE '%${req.query.invoice}%'` : ''}${req.query.start_date && req.query.end_date ? `and date between '${req.query.start_date}' and '${req.query.end_date}'` : ''}`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes,t.description, d.*, i.url, p.nama, p.harga, un.satuan from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN stocks s on s.idstock = d.idstock
            JOIN unit un on un.idunit = s.idunit
            JOIN users u ON u.iduser = t.iduser`)
            getTransactions.forEach((value) => {
                value.detail = [];
                getDetail.forEach(val => {
                    if (val.idtransaction == value.idtransaction) {
                        value.detail.push(val);
                    }
                })
            })
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
    getPastTransactionsAdmin: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, u.username, s.status from transactions t JOIN status s on t.idstatus = s.idstatus JOIN users u ON u.iduser = t.iduser where (t.idstatus = 5 or t.idstatus = 6) ${req.query.invoice ? `and t.invoice LIKE '%${req.query.invoice}%'` : ''}${req.query.start_date && req.query.end_date ? `and date between '${req.query.start_date}' and '${req.query.end_date}'` : ''}`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes,t.description, d.*, i.url, p.nama, p.harga, un.satuan from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN stocks s on s.idstock = d.idstock
            JOIN unit un on un.idunit = s.idunit
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
    getOngoingTransactionsAdmin: async (req, res) => {
        try {
            let getTransactions = await dbQuery(`SELECT t.*, u.username, s.status from transactions t JOIN status s on t.idstatus = s.idstatus JOIN users u ON u.iduser = t.iduser where (t.idstatus = 4 or t.idstatus = 7 or t.idstatus = 8) ${req.query.invoice ? `and t.invoice LIKE '%${req.query.invoice}%'` : ''}${req.query.start_date && req.query.end_date ? `and date between '${req.query.start_date}' and '${req.query.end_date}'` : ''}`)
            let getDetail = await dbQuery(`SELECT t.idtransaction, t.iduser, t.invoice, t.date, t.shipping, t.total_payment, t.notes,t.description, d.*, i.url, p.nama, p.harga, un.satuan from detail_transactions d
            JOIN products p ON p.idproduct = d.idproduct 
            JOIN images i on p.idproduct = i.idproduct
            JOIN transactions t on t.idtransaction = d.idtransaction
            JOIN stocks s on s.idstock = d.idstock
            JOIN unit un on un.idunit = s.idunit
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
                    JOIN users u on u.iduser = r.iduser JOIN status s on s.idstatus = r.idstatus where (r.iduser = ${req.dataUser.iduser} and r.idstatus = 9);`)
                res.status(200).send({
                    success: true,
                    message: 'Get User Recipe success',
                    dataRecipe: getRecipe,
                    error: ""
                })
            } else {
                console.log('ini role', req.dataUser.role)
                let getRecipe = await dbQuery(`SELECT u.username, a.*, r.*, s.status FROM jcfs1902group2.resep r
                JOIN users u on u.iduser = r.iduser 
                JOIN status s on s.idstatus = r.idstatus
                JOIN address a on u.idaddress = a.idaddress where r.idstatus = 9;`)
                console.log('getrecipe', getRecipe)
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
                error
            })
        }
    },
    salesReportUserCart: async (req, res) => {
        try {
            let getSalesReport = await dbQuery(`SELECT sr.*,p.nama,i.url FROM sales_report sr join products p on p.idproduct = sr.idproduct join images i on sr.idproduct = i.idproduct where sr.description LIKE '%cart%' ${req.query.start_date && req.query.end_date ? `and sr.date between '${req.query.start_date}' and '${req.query.end_date}'` : ''} order by sr.date asc`)
            res.status(200).send({
                success: true,
                message: 'Get Sales Report Success',
                dataSalesReportUser: getSalesReport
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error
            })
        }
    },
    salesReportByRecipe: async (req, res) => {
        try {
            let getSalesReport = await dbQuery(`SELECT sr.*,p.nama,i.url FROM sales_report sr join products p on p.idproduct = sr.idproduct join images i on sr.idproduct = i.idproduct where sr.description LIKE '%Recipe%' ${req.query.start_date && req.query.end_date ? `and sr.date between '${req.query.start_date}' and '${req.query.end_date}'` : ''} order by sr.date asc`)
            res.status(200).send({
                success: true,
                message: 'Get Sales Report Success',
                dataSalesReportRecipe: getSalesReport
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error
            })
        }
    },
    inDataLogging: async (req, res) => {
        try {
            let getSQL = await dbQuery(`SELECT id.*, u.satuan, i.url, p.nama FROM in_data_log id
            join unit u on id.idunit = u.idunit 
            join images i on id.idproduct = i.idproduct 
            join products p on id.idproduct = p.idproduct order by id.idin_data_log asc;`)
            res.status(200).send({
                success: true,
                message: 'get data logging in success',
                dataInlog: getSQL,
                error: "",

            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error
            })
        }
    },
    outDataLogging: async (req, res) => {
        try {
            let getSQL = await dbQuery(`SELECT od.*, u.satuan, i.url, p.nama FROM out_data_log od 
            join stocks s on od.idstock = s.idstock 
            join unit u on s.idunit = u.idunit 
            join images i on od.idproduct = i.idproduct 
            join products p on od.idproduct = p.idproduct order by od.idout_data_log asc`)
            res.status(200).send({
                success: true,
                message: 'get data success',
                dataOutlog: getSQL,
                error: "",
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
    getRevenue: async (req, res) => {
        try {
            let getSQL = await dbQuery(`SELECT * from revenue ${req.query.start_date && req.query.end_date ? `where date between '${req.query.start_date}' and '${req.query.end_date}'` : ''} order by date asc`)
            res.status(200).send({
                success: true,
                message: 'get data success',
                dataRevenue: getSQL,
                error: "",
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
    insertRevenue: async (req, res) => {
        try {
            let insert = req.body.detail
                let getRevenue = await dbQuery(`Select * from revenue`)
                if (getRevenue.length > 0) {
                    getRevenue.forEach((val1) => {
                        req.body.detail.forEach((val2, idx) => {
                            if (val1.date == req.body.date) {
                                dbQuery(`UPDATE revenue set total = ${val1.total + (val2.qty * val2.subtotal)} where idrevenue = ${val1.idrevenue}`)
                                insert.splice(idx, 1)
                            }
                        })
                    })
                    insert.forEach(async (val) => {
                        await dbQuery(`Insert into revenue values (null,${db.escape(req.body.date)},${db.escape(val.subtotal)});`)
                    })
                } else {
                    insert.forEach(async (val) => {
                        await dbQuery(`Insert into revenue values (null,${db.escape(req.body.date)},${db.escape(val.subtotal)});`)
                    })
                }
            res.status(200).send({
                success: true,
                message: "Update status success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed :x:',
                error
            })
        }
    },
    confirmTransaction: async (req, res) => {
        try {
            console.log('test', req.body.detail)
            await dbQuery(`UPDATE transactions SET idstatus=5 where idtransaction=${req.body.idtransaction}`)
            let insert = req.body.detail
            let getSalesReport = await dbQuery(`Select * from sales_report`)
            if (getSalesReport.length > 0) {
                getSalesReport.forEach((val1) => {
                    req.body.detail.forEach((val2, idx) => {
                        console.log('id1 id2',val1.idproduct,val2.idproduct)
                        console.log('date1 date2',val1.date,req.body.date)
                        console.log('desc1 desc2',val1.description,val2.description)
                        console.log(val1.idproduct == val2.idproduct && val1.date == req.body.date && val1.description == val2.description)
                        if (val1.idproduct == val2.idproduct && val1.date == req.body.date && val1.description == val2.description) {
                            dbQuery(`UPDATE sales_report set qty = ${val1.qty + val2.qty}, total = ${val1.total + (val2.qty * val2.subtotal)} where idsales_report = ${val1.idsales_report}`)
                            insert.splice(idx, 1)
                        }
                    })
                })
                insert.forEach(async (val) => {
                    await dbQuery(`Insert into sales_report values (null,${db.escape(val.idproduct)},${db.escape(val.qty)},${db.escape(val.satuan)},${db.escape(val.subtotal)},${db.escape(req.body.date)},'${val.description}');`)
                })
            } else {
                insert.forEach(async (val) => {
                    await dbQuery(`Insert into sales_report values (null,${db.escape(val.idproduct)},${db.escape(val.qty)},${db.escape(val.satuan)},${db.escape(val.subtotal)},${db.escape(req.body.date)},'${val.description}');`)
                })
            }
            await dbQuery(`UPDATE transactions SET idstatus=5 where idtransaction=${req.body.idtransaction}`)
            res.status(200).send({
                success: true,
                message: "Update status success",
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed :x:',
                error
            })
        }
    },
}