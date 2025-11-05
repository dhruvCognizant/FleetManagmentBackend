const headerSet = (req, res, next) => { 
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://trusted.cdn.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';");
  next();
};
const Security = (req, res, next) => { 
    if (req.headers.origin !== process.env.HOST_NAME && process.env.ENV === 'dev') { 
        return res.status(403).send('Forbidden');
    }
  next();
};
module.exports = {headerSet , Security};