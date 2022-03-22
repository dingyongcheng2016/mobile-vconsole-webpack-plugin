const VConsole = require('vconsole');

if(!!window.vConsole){
    window.vConsole = new VConsole()
}

if(window.VConsole === undefined){
    window.VConsole = VConsole
}


module.exports = VConsole;