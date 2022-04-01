const router = require ('express').Router()
const { readToken } = require('../supports/encrip');
const { usersController } = require('../controllers')

router.get('/', usersController.getData)
router.post('/register', usersController.register);
router.get('/verify', readToken, usersController.verify)
router.post('/login', usersController.login)
router.get('/keeplogin', readToken, usersController.keepLogin);
router.post('/forgot', usersController.forgotPassword);
router.post('/reset', readToken, usersController.resetPassword);
router.post('/changepassword', readToken, usersController.changePassword);

module.exports = router