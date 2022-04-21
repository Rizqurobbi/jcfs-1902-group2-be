const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cors = require('cors');
const https = require('https');
const fs = require("fs");
const bearerToken = require("express-bearer-token");
const { db } = require('./supports/database');
const RajaOngkir = require('node-rajaongkir').Starter('412a19f7051bc715bc6afc51589e1e6c')

const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bearerToken()); // untuk mengambil data token dari req.header client

// DB Check Connection
db.getConnection((err, connection) => {
    if (err) {
        console.log(`Error MySQL Connect: `, err.message)
    }
    console.log(`Connected to MySql Server ✅ : ${connection.threadId}`)
})

app.get('/', (req, res) => {
    res.status(200).send("<h2>Farmacia API</h2>")
})
// Routes API Setup
const { usersRoute, productsRoute, transactionsRoute } = require("./routers");
const rajaongkir = require('node-rajaongkir/lib/rajaongkir');

app.use('/users', usersRoute);
app.use('/products',productsRoute);
app.use('/transactions', transactionsRoute)


// app.listen(PORT, () => console.log("Farmacia API Running :", PORT));
https.createServer({
     key: fs.readFileSync('./ssl/server.key'),
     cert: fs.readFileSync('./ssl/server.cert')
}, app).listen(PORT, () => console.log("Farmacia API Running :", PORT));
