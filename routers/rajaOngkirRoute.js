const router = require('express').Router()
const axios = require('axios')

axios.defaults.baseURL = 'https://api.rajaongkir.com/starter'
axios.defaults.headers.common['key'] = 'a53c7f264da34d259c80c753bc6e616f'
axios.defaults.headers.post['Content-type'] = 'application/x-www-form-urlencoded';

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

router.post('/cost', async (req, res) => {
    try {
        let response = await axios.post('/cost', {
            origin: req.body.origin,
            destination: req.body.destination,
            weight: req.body.weight,
            courier: req.body.courier
        })
        res.status(200).send({
            success: true,
            message: 'get city success',
            dataCity: response.data.rajaongkir.results,
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
})

module.exports = router