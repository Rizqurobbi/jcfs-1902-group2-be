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
            let getSql = `Select p.*,c.category,s.status from products p join status s on p.idstatus = s.idstatus join category c on p.idcategory=c.idcategory WHERE s.idstatus=${status ? `${db.escape(status)}` : 2} ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ''} ${_sort && _order ? `ORDER BY ${_sort} ${_order}` : ''}`
            let resultsProducts = await dbQuery(getSql)
            let resultsImages = await dbQuery(`Select * from images`)
            let resultsStocks = await dbQuery(`Select s.*,u.satuan from stocks s join unit u on s.idunit = u.idunit`)
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
                    let { idcategory, idunit, qty, date, nama, berat, harga, deskripsi, penyajian, dosis, caraPenyimpanan, kegunaan, komposisi, efekSamping, stocks } = JSON.parse(req.body.data)
                    let insertProducts = await dbQuery(`Insert into products values (null,${db.escape(idcategory)},2,${db.escape(nama)},${db.escape(harga)},${db.escape(deskripsi)},${db.escape(penyajian)},${db.escape(dosis)},${db.escape(caraPenyimpanan)},${db.escape(kegunaan)},${db.escape(komposisi)},${db.escape(efekSamping)})`)
                    if (insertProducts.insertId) {
                        for (let i = 0; i < req.files.length; i++) {
                            await dbQuery(`Insert into images values (null,${insertProducts.insertId},'/imgProducts/${req.files[i].filename}')`)
                        }
                        await dbQuery(`Insert into stocks values ${stocks.map(val => `(null,${insertProducts.insertId},${val.idunit},${val.qty},${val.isnetto})`)}`)
                        await dbQuery(`INSERT INTO in_data_log value (null,${insertProducts.insertId}, ${idunit}, ${qty}, ${date}, 'New Product')`)
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
                    let editSQL = await dbQuery(`UPDATE products SET idcategory =${idcategory},nama='${nama}',harga=${harga},deskripsi='${deskripsi}',penyajian='${penyajian}',dosis='${dosis}',caraPenyimpanan='${caraPenyimpanan}',kegunaan='${kegunaan}',komposisi='${komposisi}',efekSamping='${efekSamping}' WHERE idproduct = ${db.escape(req.params.id)}`)
                    if (req.files) {
                        for (let i = 0; i < req.files.length; i++) {
                            await dbQuery(`UPDATE images set url ='/imgProducts/${req.files[i].filename}' WHERE idproduct =${db.escape(req.params.id)}`)
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
    },
    outStockRecord: async (req, res) => {
        try {
            console.log('inibody', req.body.detail)
            let getOutDataLog = await dbQuery(`SELECT od.*, u.satuan, i.url, p.nama FROM out_data_log od 
                    join stocks s on od.idstock = s.idstock 
                    join unit u on s.idunit = u.idunit 
                    join images i on od.idproduct = i.idproduct 
                    join products p on od.idproduct = p.idproduct order by od.idout_data_log asc;`)
            if (getOutDataLog.length > 0) {
                getOutDataLog.forEach((val1) => {
                    req.body.detail.forEach((val2, idx) => {
                        if (val1.idproduct === val2.idproduct && val1.idstock === val2.idstock) {
                            if (val1.date === req.body.date) {
                                console.log('ini qty', val1.qty, val2.qty)
                                dbQuery(`UPDATE out_data_log set qty = ${val1.qty + val2.qty} where idout_data_log = ${val1.idout_data_log};`)
                                req.body.detail.splice(idx, 1)
                            }
                        }
                    })
                })
                req.body.detail.forEach(async (value) => {
                    await dbQuery(`Insert into out_data_log values (null,1,${db.escape(value.idproduct)},${db.escape(value.idstock)},${db.escape(value.qty)},'From user cart',${db.escape(req.body.date)})`)
                })
            } else {
                req.body.detail.forEach(async (value) => {
                    await dbQuery(`Insert into out_data_log values (null,1,${db.escape(value.idproduct)},${db.escape(value.idstock)},${db.escape(value.qty)},'From user cart',${db.escape(req.body.date)})`)
                })
            }
            res.status(200).send({
                success: true,
                message: 'Checkout Success',
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
    outStockRecordRecipe: async (req, res) => {
        try {
            let getoutDataLogging = await dbQuery(`select * from out_data_log `)
            let insert = req.body.detail
            if (getoutDataLogging.length > 0) {
                getoutDataLogging.forEach((val1) => {
                    req.body.detail.forEach((val2, idx) => {
                        if (val1.description === 'Recipe') {
                            if (val1.idproduct == val2.idproduct) {
                                if (val1.date === val2.date) {
                                    dbQuery(`UPDATE out_data_log set qty = ${val1.qty + val2.qty} where idout_data_log = ${val1.idout_data_log}`)
                                    insert.splice(idx, 1)
                                }
                            }
                        }
                    })
                })
                insert.forEach(async (val) => {
                    await dbQuery(`Insert into out_data_log values (null,1,${db.escape(val.idproduct)},${db.escape(val.idstock)},${db.escape(val.qty)},'Recipe',${db.escape(val.date)})`)
                })
            } else {
                insert.forEach(async (val) => {
                    await dbQuery(`Insert into out_data_log values (null,1,${db.escape(val.idproduct)},${db.escape(val.idstock)},${db.escape(val.qty)},'Recipe',${db.escape(val.date)})`)
                })
            }
            res.status(200).send({
                success: true,
                message: 'Checkout Success',
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
    inStockRecord: async (req, res) => {
        try {
            console.log('inibodydariinstock', req.body)
            let { idproduct, idstock, idunit, qty, date } = req.body
            let insertInDatalog = `Insert into in_data_log values (null, ${db.escape(idproduct)},${db.escape(idunit)},${db.escape(qty)},${db.escape(date)},'Adding new stock')`
            let getInDataLog = await dbQuery(`SELECT id.*, u.satuan, i.url, p.nama FROM in_data_log id
            join unit u on id.idunit = u.idunit 
            join images i on id.idproduct = i.idproduct 
            join products p on id.idproduct = p.idproduct where id.date = '${date}' and id.idproduct = ${idproduct};`)
            let getStock = await dbQuery(`Select s.*, u.satuan from stocks s join unit u on s.idunit = u.idunit where idproduct = ${idproduct};`)
            console.log(getStock[0].qty)
            console.log((getStock[0].qty + qty) * getStock[1].qty)
            if (getInDataLog.length > 0) {
                getInDataLog.forEach(async (val1) => {
                    await dbQuery(`UPDATE in_data_log set qty = ${val1.qty + qty} where date = '${date}' AND idproduct = ${idproduct};`)
                    await dbQuery(`UPDATE stocks set qty = ${getStock[0].qty + qty} where idstock = ${idstock}`)
                    await dbQuery(`UPDATE stocks set qty = ${(getStock[0].qty + qty) * getStock[1].qty} where idstock = ${getStock[2].idstock}`)
                })
            } else {
                await dbQuery(insertInDatalog)
                await dbQuery(`UPDATE stocks set qty = ${getStock[0].qty + qty} where idstock = ${idstock}`)
                await dbQuery(`UPDATE stocks set qty = ${(getStock[0].qty + qty) * getStock[1].qty} where idstock = ${getStock[2].idstock}`)
            }
            res.status(200).send({
                success: true,
                message: 'Stock in record success',
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
    }
}