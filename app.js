var path = require('path');

var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var multer  = require('multer');

var routes = require('./routes/index');
var settings = require('./settings');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(logger({stream: accessLog}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({
  dest: './public/images',
  /* 如果不提供rename函数，multer会重命名上传文件
  rename: function (fieldname, filename) {
    return nameParts.join();
  }*/
}));
app.use(cookieParser());
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port
  })
}));
app.use(flash());

/*
  static是express唯一一个内置中间件，可以把实际路径虚拟成指定路径, 如：
    app.use('/static', express.static('public'));
  以上是把public路径转换成了static路径，这样就可以通过URL：
  http://localhost:3000/static/images/kitten.jpg 访问
  http://localhost:3000/public/images/kitten.jpg
  如果省略第一个参数就是隐藏了public目录，直接通过
  http://localhost:3000/images/kitten.jpg 访问
  详见http://www.expressjs.com.cn/starter/static-files.html
*/
app.use(express.static(path.join(__dirname, 'public')));

routes(app);

app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});