const { db, dbQuery } = require('../supports/database')
const { uploader } = require('../supports/uploader')
const fs = require('fs')
module.exports = {
    getProduct: async (req, res) => {
        try {
            let filterQuery = []
            for (let prop in req.query) {
                if (prop != '_sort' && prop != '_order') {
                    filterQuery.push(`${prop == 'nama' || 'idproduct' ? `p.${prop}` : prop} LIKE "%${req.query[prop]}%"`)
                }
            }
            let { _sort, _order, status } = req.query
            let getSql = `Select p.*,c.category,u.satuan,s.status from products p join status s on p.idstatus = s.idstatus join category c on p.idcategory=c.idcategory join unit u on p.idunit = u.idunit WHERE s.idstatus=${status ? `${db.escape(status)}` : 2} ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ''} ${_sort && _order ? `ORDER BY ${_sort} ${_order}` : ''}`
            let resultsProducts = await dbQuery(getSql)
            let resultsImages = await dbQuery(`Select * from images`)
            let resultsStocks = await dbQuery(`select * from stocks`)
            console.log('Before', filterQuery)
            console.log('After', filterQuery.join(' AND '))
            console.log('Combined Script', getSql);
            resultsProducts.forEach((value, index) => {
                value.images = []
                value.stocks = []
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
                // resultsUnit.forEach(val => {
                //     delete val.idproduct
                //     delete val.idstock
                //     delete val.qty
                //     delete val.type
                //     value.unit.push(val)

                // })
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
    },
    getCategory: async (req, res) => {
        try {
            let getCategory = `SELECT * FROM category`
            let resultsCategory = await dbQuery(getCategory)
            res.status(200).send({
                success: true,
                message: "Get Products Success ✅",
                dataCategory: resultsCategory,
                error: ""
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
    getUnit: async (req, res) => {
        try {
            let getUnit = `SELECT * FROM unit`
            let resultsUnit = await dbQuery(getUnit)
            res.status(200).send({
                success: true,
                message: "Get Products Success ✅",
                dataUnit: resultsUnit,
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
    addProduct: async (req, res) => {
        try {
            const uploadFile = uploader('/imgProducts', 'IMGPRO').array('Images', 5)
            uploadFile(req, res, async (error) => {
                try {
                    console.log("Jangan Null", req.body);
                    console.log('cek uploadFile', req.files);
                    let { idcategory, idunit, nama, berat, harga, deskripsi, penyajian, dosis, caraPenyimpanan, kegunaan, komposisi, efekSamping, stocks } = JSON.parse(req.body.data)
                    let insertProducts = await dbQuery(`Insert into products values (null,${db.escape(idcategory)},2,${db.escape(idunit)},${db.escape(nama)},${db.escape(berat)},${db.escape(harga)},${db.escape(deskripsi)},${db.escape(penyajian)},${db.escape(dosis)},${db.escape(caraPenyimpanan)},${db.escape(kegunaan)},${db.escape(komposisi)},${db.escape(efekSamping)})`)
                    if (insertProducts.insertId) {
                        for (let i = 0; i < req.files.length; i++) {
                            await dbQuery(`Insert into images values (null,${insertProducts.insertId},'http://localhost:2000/imgProducts/${req.files[i].filename}')`)
                        }
                        await dbQuery(`Insert into stocks values ${stocks.map(val => `(null,${insertProducts.insertId},'${val.type}',${val.qty})`)}`)
                        res.status(200).send(insertProducts)
                    }
                } catch (error) {
                    console.log(error);
                    req.files.forEach(val => fs.unlinkSync(`./public/imgProducts/${val.filename}`))
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
    deleteProduct: async (req, res) => {
        try {
            let deleteSQL = await dbQuery(`UPDATE products SET idstatus = 3 WHERE idproduct =${db.escape(req.params.id)}`)
            res.status(200).send(deleteSQL)
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    editProduct: async (req, res) => {
        try {
            const uploadFile = uploader('/imgProducts', 'IMGPRO').array('Images', 5)
            uploadFile(req, res, async (error) => {
                try {
                    let { images, stocks, idcategory, idunit, nama, berat, harga, deskripsi, penyajian, dosis, caraPenyimpanan, kegunaan, komposisi, efekSamping } = JSON.parse(req.body.data)
                    console.log(JSON.parse(req.body.data))
                    let editSQL = await dbQuery(`UPDATE products SET idcategory =${idcategory},idunit=${idunit},nama='${nama}',berat=${berat},harga=${harga},deskripsi='${deskripsi}',penyajian='${penyajian}',dosis='${dosis}',caraPenyimpanan='${caraPenyimpanan}',kegunaan='${kegunaan}',komposisi='${komposisi}',efekSamping='${efekSamping}' WHERE idproduct = ${db.escape(req.params.id)}`)
                    if (req.files) {
                        for (let i = 0; i < req.files.length; i++) {
                            await dbQuery(`UPDATE images set url ='http://localhost:2000/imgProducts/${req.files[i].filename}' WHERE idproduct =${db.escape(req.params.id)}`)
                        }
                    } else {
                        await dbQuery(`UPDATE images set url ='${images.url}' WHERE idimage =${db.escape(req.params.id)}`)
                    }
                    res.status(200).send(editSQL)
                } catch (error) {
                    console.log(error);
                    req.files.forEach(val => fs.unlinkSync(`./public/imgProducts/${val.filename}`))
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