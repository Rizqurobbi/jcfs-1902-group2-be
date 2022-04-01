const multer = require('multer')
const fs = require('fs')

module.exports = {
    uploader: (directory, fileNamePrefix) => {
        let defaultDir = './public';
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? defaultDir + directory : defaultDir
                if (fs.existsSync(pathDir)) {
                    console.log(`Directory ${pathDir} exist ✅`)
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => cb(err, pathDir))
                    console.log(`Success create directory ${pathDir} ✅`)
                }
            },
            filename: (req, file, cb) => {
                console.log(`Isi Data File`, file)
                let ext = file.originalname.split('.')
                console.log(`Extension`, ext);

                let fileName = fileNamePrefix + Date.now() + '.' + ext[ext.length - 1]
                console.log(`New file name`, fileName)

                cb(null, fileName)
            }
        })
        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(jpg|png|gif|webp)/
            if (!file.originalname.toLowerCase().match(extFilter)){
                return cb(new Error("Your file type are denied"))
            }
            cb(null,true)
        }
        return multer({storage,fileFilter})
    }
}