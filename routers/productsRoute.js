const {productsController} = require('../controllers')
const router = require('express').Router()

router.get('/',productsController.getProduct)
router.get('/category',productsController.getCategory)
router.get('/unit',productsController.getUnit)
router.post('/',productsController.addProduct)
module.exports = router