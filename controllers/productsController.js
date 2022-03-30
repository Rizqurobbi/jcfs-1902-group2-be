const { db, dbQuery } = require('../supports/database')
const { uploader } = require('../supports/uploader')
const fs = require('fs')
module.exports = {
    getProduct: async (req, res) => {
        try {
            let filterQuery = []
            for (let prop in req.query) {
                if (prop != '_sort' && prop != '_order') {
                    filterQuery.push(`${prop == 'nama'||'idproduct' ? `p.${prop}` : prop} LIKE "%${req.query[prop]}%"`)
                }
            }
            let { _sort, _order, status } = req.query
            let getSql = `Select p.*,c.category from products p join status s on p.idstatus = s.idstatus join category c on p.idcategory=c.idcategory WHERE s.idstatus=${status ? `${db.escape(status)}` : 2} ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ''} ${_sort && _order ? `ORDER BY ${_sort} ${_order}` : ''}`
            let resultsProducts = await dbQuery(getSql)
            let resultsImages = await dbQuery(`Select * from images`)
            let resultsStocks = await dbQuery(`select * from stocks`)
            let resultsUnit = await dbQuery(`select * from stocks s join unit u on s.idunit=u.idunit`)
            console.log('Before', filterQuery)
            console.log('After', filterQuery.join(' AND '))
            console.log('Combined Script', getSql);
            resultsProducts.forEach((value, index) => {
                value.images = []
                value.stocks = []
                value.unit = []
                resultsImages.forEach(val => {
                    if (value.idproduct == val.idproduct) {
                        delete val.idproduct
                        value.images.push(val)
                    }
                })
                resultsStocks.forEach(val => {
                    if (value.idproduct == val.idproduct) {
                        delete val.idproduct
                        value.stocks.push(val)
                    }
                })
                resultsUnit.forEach(val => {
                    delete val.idproduct
                    delete val.idstock
                    delete val.qty
                    delete val.type
                    value.unit.push(val)

                })
            })
            res.status(200).send({
                success: true,
                message: 'get product success ✅',
                dataProducts: resultsProducts,
                error: ''
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "get product failed ❌",
                error: error
            })
        }
    }
}