const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const bearerToken = require("express-bearer-token")
dotenv.config();

const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bearerToken()); // untuk mengambil data token dari req.header client
const { db } = require('./supports/database')
// DB Check Connection
db.getConnection((err,connection)=>{
    if(err){
        console.log('Error mySql Connection :',err.message)
    }
    console.log(`Connected to MySql Server ✅ : ${connection.threadId}`)
})
// Routes API Setup
const {productsRoute} = require('./routers')
app.use('/products',productsRoute)
app.listen(PORT, () => console.log("Farmacia :", PORT));