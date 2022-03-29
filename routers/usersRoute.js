const router = require ('express').Router()
const { readToken } = require('../supports/encrip');
const { usersController } = require('../controllers')

router.get('/', usersController.getData)
router.post('/register', usersController.register);

module.exports = router