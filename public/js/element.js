function element(e) {
    /*
     * [
     *  'tag' || element,
     *  {attr:'val'} || none,
     *  obj.toString() || none,
     *  [
     *   ['tag',...],
     *   ...
     *  ] || none
     * ]
     */
    if (!e[0])return;
    var t=(typeof e[0]=='string')?document.createElement(e[0]):e[0],a;
    if (e[1]&&typeof e[1]=='object')
        for (a in e[1]) t.setAttribute(a, e[1][a]);
    if (e[2]&&typeof e[2].toString=='function')
        t.appendChild(document.createTextNode(e[2].toString()));
    if (e[3]&&typeof e[3]=='object')
        for (a in e[3]) t.appendChild(element(e[3][a]));
    return t;
}
