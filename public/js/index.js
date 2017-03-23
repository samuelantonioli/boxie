(function() {
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

    var _initialized = false, _supported = false, qr;
    function init() {
        if (_initialized) return _supported;
        _initialized = true;

        qr = new QCodeDecoder();
        if (!qr.isCanvasSupported() || !qr.hasGetUserMedia()) {
            alert(
                'Unfortunately your browser doesn\'t support the required features. '+
                'Please use a QR Code Scanner App.'
            );
        } else {
            _supported = true;
        }
        return _supported;
    }

    var target = document.getElementById('camera-video'),
        status = document.getElementById('status');
    document.getElementById('scan').onclick = function(r) {
        if (r) {
            r.preventDefault();
        }
        if (!init()) {
            return;
        }
        qr.videoConstraints = {
            audio: false,
            video: {facingMode: 'environment'}
        };
        qr.decodeFromCamera(target, function(e, u) {
            if (e) {
                status.innerText = e.name +': '+ e.message;
                return;
            }
            // check if we're on the same domain
            var href = document.location.href, len = href.length;
            if (u.slice(0, len) == href) {
                document.location.href = u;
            }
        }, true);
    }
})();