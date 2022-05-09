const { transactionsController } = require('../controllers')
const { readToken } = require('../supports/encrip')

const router = require('express').Router()

router.get('/carts', readToken, transactionsController.getCart)
router.post('/carts', readToken, transactionsController.addToCart)
router.delete('/carts/:id', readToken, transactionsController.deleteCart)
router.patch('/carts/:id', readToken, transactionsController.updateQty)

router.post('/checkout', readToken, transactionsController.checkout)
router.get('/usertransactions', readToken, transactionsController.getUserTransactions)

router.get('/adminalltransactions', readToken, transactionsController.getAllTransactionsAdmin)
router.get('/adminongoingtransactions', readToken, transactionsController.getOngoingTransactionsAdmin)
router.get('/adminpasttransactions', readToken, transactionsController.getPastTransactionsAdmin)

router.get('/ongoingusertransactions', readToken, transactionsController.getUserOngoingTransactions)
router.get('/pastusertransactions', readToken, transactionsController.getUserPastTransactions)
router.patch('/discardtransaction', readToken, transactionsController.discardTransaction)

router.get('/recipe', readToken, transactionsController.getRecipe)
router.patch('/editstatusrecipe', transactionsController.editStatusRecipe)
router.patch('/discardstatusrecipe', transactionsController.discardStatusRecipe)
router.post('/checkoutrecipe', readToken, transactionsController.checkoutRecipe)

router.patch('/uploadpayment', readToken, transactionsController.uploadPayment)

router.get('/salesreportuser', readToken, transactionsController.salesReportUserCart)
router.get('/revenue',readToken,transactionsController.getRevenue)
router.post('/insertrevenue',readToken,transactionsController.insertRevenue)
router.get('/salesreportrecipe', readToken, transactionsController.salesReportByRecipe)
router.get('/indatalog', readToken, transactionsController.inDataLogging)
router.get('/outdatalog', readToken, transactionsController.outDataLogging)
router.post('/confirmtransaction',readToken,transactionsController.confirmTransaction)


module.exports = router