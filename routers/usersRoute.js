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
router.post('/changeemail', readToken, usersController.verifyNewEmail);

router.patch('/chooseaddress', readToken, usersController.chooseAddress)
router.patch('/editprofile', readToken, usersController.editProfile)
router.post('/addaddress', readToken, usersController.addAddress)
router.patch('/editaddress', readToken, usersController.editAddress)
router.delete('/:id', readToken, usersController.deleteAddress)

router.post('/uploadrecipe', readToken, usersController.uploadrecipe)

module.exports = router