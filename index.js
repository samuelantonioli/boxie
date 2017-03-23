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
    path = require('path'),
    async = require('async');

var config = {
    // upload path:
    path: path.join(__dirname, 'uploads'),
    // object with user:pass
    users: {
        'admin': 'your-secret-password',
    },
    // should everyone be able to use it? (no user check)
    anonymous: false,
    // how many days until a box expires?
    expires: 14
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

var remove_box = function(id, cb) {
    if (db.hasOwnProperty(id)) {
        var files = db[id].files;
        async.eachLimit(Array.from(files), 5, function(file, cb) {
            remove(file[1].id, function(err) {
                cb();
            });
        }, function() {
            delete db[id];
            cb();
        });
    } else {
        cb();
    }
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
//app.use(basic_auth);

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
app.post('/', basic_auth, function(req, res) {
    var create = function() {
        generate_id(function(err, id) {
            if (err) {
                res.json({error: true});
            } else {
                db[id] = {files: new Map()};
                if (config.expires) {
                    var d = new Date();
                    d.setDate(d.getDate() + config.expires);
                    db[id].expires = d;
                }
                var data = {
                    success: true,
                    id: id,
                    url: '/'+id
                };
                res.json(data);
            }
        });
    };
    // delete expired boxes
    if (config.expires) {
        var now = new Date(),
            ids = Object.keys(db).filter(function(id) {
                return (db[id].expires)?(db[id].expires <= now):false;
            });
        async.eachSeries(ids, remove_box, create);
    } else {
        create();
    }
});
app.get('/:id', function(req, res) {
    var id = req.params.id;
    if (db.hasOwnProperty(id)) {
        res.json({
            files: Array.from(db[id].files).map(function(item) {
                return item[1];
            })
        });
    } else {
        res.json({error: true});
    }
});
app.post('/:id', basic_auth, upload.array('file'), function(req, res) {
    var id = req.params.id,
        files = req.files;
    if (!files) {
        return res.json({success: true});
    }
    if (!db.hasOwnProperty(id)) {
        return res.json({error: true});
    }
    files.forEach(function(file) {
        var data = {
            id: file.filename,
            name: file.originalname,
            size: file.size,
            mime: file.mimetype,
            url: '/'+id+'/'+file.filename
        };
        db[id].files.set(file.filename, data);
    });
    res.json({success: true});
});
app.delete('/:id', basic_auth, function(req, res) {
    var id = req.params.id;
    if (db.hasOwnProperty(id)) {
        remove_box(id, function() {
            res.json({success: true});
        });
    } else {
        res.json({error: true});
    }
});

app.get('/:id/:fid', function(req, res) {
    var id = req.params.id,
        fid = req.params.fid;
    // for security:
    if (!db.hasOwnProperty(id) || !db[id].files.has(fid)) {
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
app.delete('/:id/:fid', basic_auth, function(req, res) {
    var id = req.params.id,
        fid = req.params.fid;
    if (!db.hasOwnProperty(id) || !db[id].files.has(fid)) {
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
