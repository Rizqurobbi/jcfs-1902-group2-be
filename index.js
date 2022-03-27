const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const bearerToken = require("express-bearer-token")
dotenv.config();

const PORT = process.env.PORT || 2000;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bearerToken()); // untuk mengambil data token dari req.header client

// DB Check Connection


// Routes API Setup


app.listen(PORT, () => console.log("Your API RUNNING :", PORT));