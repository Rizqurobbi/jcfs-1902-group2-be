const {productsController} = require('../controllers')
const router = require('express').Router()

router.get('/',productsController.getProduct)

module.exports = router