const {productsController} = require('../controllers')
const router = require('express').Router()

router.get('/',productsController.getProduct)
router.get('/category',productsController.getCategory)
router.get('/unit',productsController.getUnit)

router.post('/',productsController.addProduct)
router.delete('/:id',productsController.deleteProduct)
router.patch('/:id',productsController.editProduct)
module.exports = router