const axios = require('axios');
const router = require('express').Router()
const { readToken } = require('../supports/encrip');
const req = require('express/lib/request')

axios.defaults.baseURL = 'https://api.rajaongkir.com/starter'
axios.defaults.headers.common['key'] = 'a53c7f264da34d259c80c753bc6e616f'
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

router.get('/provinsi', (req, res) => {
    axios.get('/province')
        .then(response =>
            res.status(200).send({
                success: true,
                message: 'get province success',
                dataProvinsi: response.data,
                error: ""
            }))
        .catch(err => res.send(err))
})

router.get('/city/:provId', (req, res) => {
    console.log('ini provid', req.params.provId)
    axios.get(`/city?province=${req.params.provId}`)
        .then(response =>
            res.status(200).send({
                success: true,
                message: 'get city success',
                dataCity: response.data.rajaongkir.results,
                error: ""
            }))
        .catch(err => res.send(err))
})

router.post('/ongkir', (req, res) => {
    console.log('inireqbody', req.body)
    console.log('test', req.body.origin, req.body.destination, req.body.weight, req.body.courier)
    axios.post(`/cost`, {
        origin: req.body.origin,
        destination: req.body.destination,
        weight: req.body.weight,
        courier: req.body.courier
    }).then(response =>
        res.status(200).send({
            success: true,
            message: 'get cost success',
            dataCost: response.data.rajaongkir.results[0]
        }))
        .catch(err => res.send(err))
})

module.exports = router