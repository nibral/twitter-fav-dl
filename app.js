'use strict'

const express = require('express');
const app = express();

app.set('view engine', 'jade');

const router = require('./routes');
app.use('/', router);

const listenPort = process.env.PORT || 3000;
app.listen(listenPort, () => {
    console.log('start listening on port %d', listenPort);
});
