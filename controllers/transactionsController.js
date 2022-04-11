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
            await dbQuery(`DELETE FROM carts WHERE idcart =${req.params.idcart}`)
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
            let insertTransactions = await dbQuery(`INSERT INTO transactions values (null,${req.dataUser.iduser},${db.escape(req.body.idaddress)},${db.escape(req.body.invoice)},${db.escape(req.body.date)},${db.escape(req.body.total_price)},${db.escape(req.body.shipping)},${db.escape(req.body.total_payment)},${db.escape(req.body.notes)})`)
            console.log(req.body)
            if (insertTransactions.insertId) {
                let generateInsert = req.body.detail.map(val => `(null,${insertTransactions.insertId},${val.idproduct},${val.qty},${val.subtotal})`)
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
            let getTransactions = await dbQuery(`SELECT * from transactions where iduser = ${req.dataUser.iduser};`)
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
    }
}