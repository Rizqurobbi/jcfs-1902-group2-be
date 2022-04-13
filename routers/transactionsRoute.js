const {transactionsController} = require('../controllers')
const { readToken } = require('../supports/encrip')

const router = require('express').Router()

router.get('/carts',readToken,transactionsController.getCart)
router.post('/carts',readToken,transactionsController.addToCart)
router.delete('/carts/:id',readToken,transactionsController.deleteCart)
router.patch('/carts/:id',readToken,transactionsController.updateQty)

router.post('/checkout',readToken,transactionsController.checkout)
router.get('/usertransactions', readToken, transactionsController.getTransactions)

module.exports = router