//importy
var express=require('express');
var path= require('path');
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var expressSession=require('express-session');
var app=express();
var server=require('http').Server(app);
var io=require('socket.io').listen(server);

var User = require('./model/user');
var ChatU = require('./model/chat');

klienci={};

//server
server.listen(process.env.PORT || 8080, function(){
    console.log("Listening on 8080");
});

//socket.io
io.on('connection', function(socket){
    ChatU.findAll().then(doc => {
        io.emit('load messages from db', doc);
    });
    socket.on('new user',function(msg, callback){
        if(msg in klienci){
            callback(false);
        }
        else{
            callback(true);
            socket.nickname=msg;
            klienci[socket.nickname]=socket;
            updateNicknames();
        }
    });
    function updateNicknames(){
        io.emit('usernames',Object.keys(klienci));
    }
    socket.on('chat message', function(msg,callback){
        var mess=msg.trim();
        ChatU.create({
            nick: socket.nickname,
            msg: mess   
        })
            io.emit('new message', {msg: mess, nick: socket.nickname});
        }
        );
    socket.on('disconnect',function(msg){
        if(!socket.nickname)return;
        delete klienci[socket.nickname];
        updateNicknames();
      });
  });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());

//ustawiena sesji
app.use(expressSession({
    key: 'user_id',
    secret: 'secret user',
    saveUninitialized: false,
    resave: false,
    cookie: {
        expires: 600000
    }
}));


//ścieżki do podstron

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/glowna.html');
});
app.get('/glowna.html', (req, res) => {
    res.sendFile(__dirname + '/public/html/glowna.html');
});

app.route('/signup.html')
    .get((req, res) => {
        res.sendFile(__dirname + '/public/html/signup.html');
    })
    .post((req, res) => {
        User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        .then(user => {
            req.session.user = user.dataValues;
            res.sendFile(__dirname + '/public/html/login.html');
        })
        .catch(error => {
            res.redirect('/signup.html');
        });
    });
app.route('/login.html')
    .get((req, res) => {
        res.sendFile(__dirname + '/public/html/login.html');
    })
    .post((req, res) => {
        var username = req.body.username,
            password = req.body.password;
        
        User.findOne({ where: { username: username } }).then(function (user) {
            if (!user) {
                res.redirect('/login.html');
            } else if (!user.validPassword(password)) {
                res.redirect('/login.html');
            } else {
                req.session.user = user.dataValues;
                res.redirect('/mapa.html');
            }
        });
    });
app.get('/mapa.html', (req, res) => {
    if (req.session.user && req.cookies.user_id) {
        res.sendFile(__dirname + '/public/html/mapa.html');
    } else {
        res.redirect('/login.html');
    }
});
app.get('/chat.html', (req, res) => {
    if (req.session.user && req.cookies.user_id) {
        res.sendFile(__dirname + '/public/html/chat.html');

    } else {
        res.redirect('/login.html');
    }
});
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_id) {
        res.clearCookie('user_id');
        res.redirect('/');
        
    } else {
        res.redirect('/login.html');
    }

});
app.use(function (req, res, next) {
  res.status(404).send("Nie znalazłem tego czego szukasz :(!")
});
