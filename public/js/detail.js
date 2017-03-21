(function() {
    Dropzone.autoDiscover = false;

    document.getElementById('new').onclick = function() {
        majax('/', function(data) {
            data = JSON.parse(data);
            if (data && data.id) {
                document.location.href = '/!/'+data.id;
            } else {
                alert('Error creating box');
            }
        }, function() {
            alert('Error creating box');
        }, true, {'.': ''});
    };

    var filesize = function(size) {
        var bytes = size, decimals = 1;
        // http://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
        if (bytes == 0) return '0 Bytes';
        var k = 1000,
            dm = decimals + 1 || 3,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    var files_el = document.getElementById('files');
    function show(files) {
        var el = element(['ul', {id: 'files-list'}, null,
            (files && files.length)?files.map(function(file) {
                return ['li', null, null, [
                    ['div', null, null, [
                        ['a', {href: file.url+'?download'}, file.name, [
                            ['span', {'class': 'size'}, '('+filesize(file.size)+')']
                        ]],
                        ['span', {'class': 'remove', 'data-id': file.id}, 'X']
                    ]]
                ]];
            }):[['h3', null, 'No files uploaded (yet)']]
        ]);
        files_el.replaceChild(el, document.getElementById('files-list'));
    }

    document.getElementById('link').innerText = document.location.href.split('?')[0];
    var id = document.location.pathname.split('/').pop();
    if (id) {
        var qr = new QRCode(document.getElementById('qr'), {
            text: id,
            correctLevel : QRCode.CorrectLevel.H
        });
    }
    console.log(id);
    function update() {
        majax('/'+id, function(data) {
            data = JSON.parse(data);
            if (data) {
                show(data.files);
            }
        });
    }
    // file upload
    // https://robots.thoughtbot.com/ridiculously-simple-ajax-uploads-with-formdata
    /*
    var upload = document.getElementById('upload'),
        file = document.getElementById('file');
    document.getElementById('upload-submit').onclick = function() {
        var form = new FormData(upload);
        var req = (function () {
            for (var e = 0; e < 4; e++)
            try {return e?new ActiveXObject([,'Msxml2','Msxml3','Microsoft'][e]+'.XMLHTTP'):new XMLHttpRequest}catch(t){}
        })();
        req.open('POST', '/'+id, true);
        req.send(form);
        req.onreadystatechange = function() {
            if (req.readyState==4 && req.status==200) {
                update();
                file.value = '';
            }
        };
    };
    */

    setInterval(update, 7500);
    update();

    var dropzone = new Dropzone('div#upload', {
        url: '/'+id,
        createImageThumbnails: false,
    });
    dropzone.on('success', function(file, object, progress) {
        dropzone.removeFile(file);
        update();
    });
    dropzone.on('error', function(file, object, progress) {
        dropzone.removeFile(file);
        alert('Files could not upload');
    });

    var getxhr = function() {
        return (function () {
            for (var e = 0; e < 4; e++)
            try {return e?new ActiveXObject([,'Msxml2','Msxml3','Microsoft'][e]+'.XMLHTTP'):new XMLHttpRequest}catch(t){}
        })();
    };

    var delete_box = function() {
        if (!confirm('Do you want to delete this box?')) {
            return;
        }
        var req = getxhr();
        req.open('DELETE', '/'+id, true);
        req.send('');
        req.onreadystatechange = function() {
            if (req.readyState==4 && req.status==200) {
                document.location.href = '/';
            }
        };
    };
    var delete_file = function(file_id) {
        if (!confirm('Do you want to delete this file?')) {
            return;
        }
        var req = getxhr();
        req.open('DELETE', '/'+id+'/'+file_id, true);
        req.send('');
        req.onreadystatechange = function() {
            if (req.readyState==4 && req.status==200) {
                update();
            }
        };
    };

    document.getElementById('files').addEventListener('click', function(e) {
        var target = e.target || e.srcElement;
        if (target && target.classList.contains('remove')) {
            e.preventDefault();
            delete_file(target.getAttribute('data-id'));
        }
    });
    document.getElementById('deletebox').onclick = delete_box;

    // http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element
    function selectElementContents(el) {
        try {
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch(err) {}
    }
    window.selectElementContents = selectElementContents;
})();
