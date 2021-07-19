import React from 'react';
import App from '../components/App';
import express from 'express';

let app = express();

app.get('/', function (req, res) {
  res.render('../client/index.html');
});

// Start server
let server = app.listen(5005, function () {
  let host = server.address().address;
  let port = server.address().port;

  if (host === '::') {
    host = 'localhost';
  }

  console.log('App listening at http://%s:%s', host, port);
});
