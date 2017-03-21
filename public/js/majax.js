function majax(url, cb, cbe, async, param) {
    async=(async===undefined)?true:!!async;
    /* param assoc array => string */
    var param = (function(p){
        if (p==null) return '';
        var r='',e=encodeURIComponent;
        for (k in p) {r+=e(k)+'='+e(p[k])+'&'}
        return r.slice(0,-1);
    })(param),
    /* create request - from medley140.js */
    req = (function () {
        for (var e = 0; e < 4; e++)
        try {return e?new ActiveXObject([,'Msxml2','Msxml3','Microsoft'][e]+'.XMLHTTP'):new XMLHttpRequest}catch(t){}
    })();
    if (req!==undefined) {
        /* register callback function */
        req.onreadystatechange = function() {
            if (req.readyState==4 && req.status==200)
                if (!!cb) cb(req.responseText);
        };
        if (param!=='') {
            /* use POST with param */
            req.open('POST', url, async);
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            //req.setRequestHeader('Connection', 'close');
        }else{req.open('GET', url, async);}
        try {
            req.send(param);return true;
        }catch(e){
            if (!!cbe) cbe();
            return false;
        }
    }
    if (!!cbe) cbe();
    return false;
}