const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const cors = require('cors');
const bearerToken = require("express-bearer-token");
const { db } = require('./supports/database');

const PORT = process.env.PORT || 2000;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bearerToken()); // untuk mengambil data token dari req.header client

// DB Check Connection
db.getConnection((err, connection) => {
    if (err) {
        console.log(`Error MySQL Connect: `, err.message)
    }

    console.log(`Connected to mySQL Server: ${connection.threadId}`)

})

app.get('/', (req, res) => {
    res.status(200).send("<h2>Farmacia API</h2>")
})
// Routes API Setup
const { usersRoute } = require("./routers");

app.use('/users', usersRoute);


app.listen(PORT, () => console.log("Farmacia API Running :", PORT));