//------------------------------------------------------------------------------ Imports
require('custom-env').env('api');
const express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  path = require('path'),
  engine = require('ejs-locals');

const db = require('../../lib/db');
const { Joi, validate } = require('./utils/validations');
const { __ } = require('../../lib/i18n');
const { Response } = require('../../lib/http-response');
const { rateLimit } = require('express-rate-limit');


const app = express();

//------------------------------------------------------------------------------ i18n
app.use((req, res, next) => {
  req.__ = __;
  for (const method in Response) {
    if (Response.hasOwnProperty(method)) res[method] = Response[method];
  }
  next();
});


//------------------------------------------------------------------------------ Headers
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, Referer, User-Agent, X-Requested-With, Content-Type, Accept, Authorization, Accept-Language, Pragma, Cache-Control, Expires, If-Modified-Since, X-vimeo-Platform, X-vimeo-Version'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, DELETE, PATCH'
  );
  if (req.method === 'OPTIONS') {
    return res.status(204).send('OK');
  }
  next();
});

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));



//------------------------------------------------------------------------------ Request Limit

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

//------------------------------------------------------------------------------ Config

app.use(express.static(path.join(__dirname, 'static')));
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use('/', require('./routes'));

//------------------------------------------------------------------------------ Swagger

if (['production', 'development'].includes(process.env.NODE_ENV)) {
  app.use(require('morgan')('dev'));
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./docs/swagger.json');
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'static')));
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customfavIcon: process.env.LOGO_PATH,
      customSiteTitle: process.env.SITE_TITLE,
      authorizeBtn: false,
      swaggerOptions: {
        filter: true,
        displayRequestDuration: true,
      },
    })
  );
}

//------------------------------------------------------------------------------ Server
const port = process.env.PORT || 3000;
let server;
if (
  process.env.SERVER_MODE === 'https' &&
  process.env.NODE_ENV === 'production'
) {
  // production
  const https = require('https'),
    fs = require('fs');
  server = https.createServer(
    {
      key: fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8'),
      ca: fs.readFileSync(process.env.SSL_CA_PATH, 'utf8'),
    },
    app
  );
} else {
  // const https = require('https'),
  //   fs = require('fs');
  // server = https.createServer({
  //   cert: fs.readFileSync(path.join(__dirname, `../../ssl/cert.crt`)),
  //   key: fs.readFileSync(path.join(__dirname, `../../ssl/cert.key`))
  // }, app)
  // console.log('Server listening on https://localhost:4430/');
  // development
  const http = require('http');
  server = http.createServer(app);
}

server.listen(port, async function () {
  console.info(`Server Started on port ${port}`);
});
