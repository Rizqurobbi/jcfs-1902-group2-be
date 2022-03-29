const router = require ('express').Router()
const { readToken } = require('../supports/encrip');
const { usersController } = require('../controllers')

router.get('/', usersController.getData)
router.post('/register', usersController.register);
router.get('/verify', readToken, usersController.verify)

module.exports = router