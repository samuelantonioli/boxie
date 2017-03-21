/**
 * Boxie
 *
 * simple file distribution
 *
 * - uses Map:
 *   http://www.jstips.co/en/javascript/map-to-the-rescue-adding-order-to-object-properties/
 * - http://stackoverflow.com/a/23616372
 **/

var express = require('express'),
    app = express(),
    http = require('http').Server(app);

var crypto = require('crypto'),
    fs = require('fs'),
    path = require('path');

var config = {
    // upload path:
    path: path.join(__dirname, 'uploads'),
    // object with user:pass
    users: {
        'admin': 'your-secret-password',
    },
    // should everyone be able to use it? (no user check)
    anonymous: false
};

// in-memory "database"
var db = {};

var multer = require('multer'),
    upload = multer({dest: config.path});

var auth = require('basic-auth');

// helper

var generate_id = function(cb) {
    // from multer/storage/disk.js
    crypto.pseudoRandomBytes(16, function(err, raw) {
        cb(err, err?undefined:raw.toString('hex'));
    });
};

var remove = function(name, cb) {
    if (!name) {
        return cb();
    }
    fs.unlink(path.join(config.path, name), function(err) {
        cb(err);
    });
};

// https://www.npmjs.com/package/basic-auth

var unauthorized = function(res, realm) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="'+ realm +'"');
    res.end('Unauthorized');
};
var basic_auth = function(req, res, next) {
    var users = config.users;
    if (config.anonymous === true) {
        next();
    } else if (users) {
        var user = auth(req);
        if (!user || !user.name || !user.pass || !users[user.name]) {
            unauthorized(res, 'missing fields or user doesn\'t exist');
        } else if (user.pass && users[user.name] === user.pass) {
            next();
        } else {
            unauthorized(res, 'no user matched');
        }
    } else {
        unauthorized(res, 'no users');
    }
};
app.use(basic_auth);

// HTML views
var pages = path.join(__dirname, 'pages');
app.use(express.static('public'));
app.get('/', function(req, res) {
    res.sendFile('index.html', {
        root: pages,
        dotfiles: 'deny'
    });
});
app.get('/!/:id', function(req, res) {
    res.sendFile('detail.html', {
        root: pages,
        dotfiles: 'deny'
    });
});

// API
app.post('/', function(req, res) {
    generate_id(function(err, id) {
        if (err) {
            res.json({error: true});
        } else {
            db[id] = {files: new Map()};
            res.json({
                success: true,
                id: id,
                url: '/'+id
            });
        }
    });
});
app.get('/:id', function(req, res) {
    var id = req.params.id;
    if (db[id]) {
        res.json({
            files: Array.from(db[id].files).map(function(item) {
                item[1].id = item[0];
                return item[1];
            })
        });
    } else {
        res.json({error: true});
    }
});
app.post('/:id', upload.array('file'), function(req, res) {
    var id = req.params.id,
        files = req.files;
    if (!files) {
        return res.json({success: true});
    }
    if (!db[id]) {
        return remove(file.filename, function(err) {
            res.json({error: true});
        });
    }
    files.forEach(function(file) {
        var data = {
            name: file.originalname,
            size: file.size,
            mime: file.mimetype,
            url: '/'+id+'/'+file.filename
        };
        db[id].files.set(file.filename, data);
    });
    res.json({success: true});
});
app.delete('/:id', function(req, res) {
    // files get deleted after restart
    // TODO: delete them here using async
    var id = req.params.id;
    if (db[id]) {
        delete db[id];
    }
    res.json({success: true});
});

app.get('/:id/:fid', function(req, res) {
    var id = req.params.id,
        fid = req.params.fid;
    // for security:
    if (!db[id] || !db[id].files.has(fid)) {
        return res.sendStatus(404);
    }
    var headers = {};
    if (req.query.hasOwnProperty('download')) {
        headers = {
            'Content-disposition': 'attachment; filename='+db[id].files.get(fid).name
        };
    }
    res.sendFile(fid, {
        root: config.path,
        dotfiles: 'deny',
        headers: headers
    });
});
app.delete('/:id/:fid', function(req, res) {
    var id = req.params.id,
        fid = req.params.fid;
    if (!db[id] || !db[id].files.has(fid)) {
        return res.json({success: true});
    }
    db[id].files.delete(fid);
    remove(fid, function(err) {
        if (err) {
            res.json({error: true});
        } else {
            res.json({success: true});
        }
    });
});

// TODO? websockets

// clean upload directory
fs.readdirSync(config.path).forEach(function(name) {
    fs.unlinkSync(path.join(config.path, name));
});

if (config.anonymous) {
    console.log('[!] caution: everybody can upload files {config.anonymous == true}');
}

http.listen(8081, function(){
    console.log('running on *:8081');
});
