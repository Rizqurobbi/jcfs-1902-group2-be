const { db, dbQuery } = require('../supports/database')
const { uploader } = require('../supports/uploader')
const fs = require('fs')
module.exports = {
    getProduct: async (req, res) => {
        try {
            let filterQuery = []
            for (let prop in req.query) {
                if (prop != '_sort' && prop != '_order') {
                    filterQuery.push(`${prop == 'nama' ? `p.${prop}` : prop} LIKE "%${req.query[prop]}%"`)
                }
            }
            let { _sort, _order, status } = req.query
            let getSql = `Select p.* from products p join status s on p.idstatus = s.idstatus WHERE s.idstatus=${status?`${db.escape(status)}`:2} ${filterQuery.length > 0 ?`AND ${filterQuery.join(" AND ")}`:''} ${_sort && _order ?`ORDER BY ${_sort} ${_order}`:''}`
            let resultsProducts = await dbQuery(getSql)
            let resultsImages = await dbQuery(`Select * from images`)
            console.log('Before', filterQuery)
            console.log('After', filterQuery.join(' AND '))
            console.log('Combined Script', getSql);
            resultsProducts.forEach((value,index)=>{
                value.images = []
                value.stocks = []
                resultsImages.forEach(val =>{
                    if (value.idproduct==val.idproduct){
                        delete val.idproduct
                        value.images.push(val)
                    }
                })
            })
            res.status(200).send({
                success:true,
                message:'get product success ✅',
                dataProducts:resultsProducts,
                error:''
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