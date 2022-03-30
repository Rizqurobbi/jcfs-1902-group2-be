const {productsController} = require('../controllers')
const router = require('express').Router()

router.get('/',productsController.getProduct)
router.get('/category',productsController.getCategory)
module.exports = router