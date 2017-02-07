function pastelColors() {
    ////'#'+Math.floor(Math.random()*16777215).toString(16);
    var r = (Math.round(Math.random() * 127) + 127).toString(16);
    var g = (Math.round(Math.random() * 127) + 127).toString(16);
    var b = (Math.round(Math.random() * 127) + 127).toString(16);
    //france paris
    //var r=['red','white','blue'];return r[randRange(0,2)];
    return '#' + r + g + b;
}

