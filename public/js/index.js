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

    var qr = new QCodeDecoder();
    if (!qr.isCanvasSupported() || !qr.hasGetUserMedia()) throw alert("Your browser doesn't match the required specs."), new Error("Canvas and getUserMedia are required");
    var elems = [
    {
        target: document.querySelector("#camera-video"),
        activator: document.querySelector("#scan"),
        decoder: qr.decodeFromCamera
    }];
    /*{
        target: document.querySelector("#image img"),
        activator: document.querySelector("#image button"),
        decoder: qr.decodeFromImage
    }, {
        target: document.querySelector("#video video"),
        activator: document.querySelector("#video button"),
        decoder: qr.decodeFromVideo
    },*/

    elems.forEach(function(e) {
        e.activator.onclick = function(r) {
            r && r.preventDefault(), e.decoder.call(qr, e.target, function(e, r) {
                if (e) throw e;
                document.location.href = '/!/'+r;
                //alert("Just decoded: " + r)
            }, !0)
        }
    });
})();