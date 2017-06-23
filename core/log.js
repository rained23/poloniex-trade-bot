var config = require('../config.js');
var debug = config.debug;

var day = { //dias da semana, ah vá.. 
		0: '   Sunday: ',
		1: '   Monday: ',
		2: '  Tuesday: ',
		3: 'Wednesday: ',
		4: ' Thursday: ',
		5: '   Friday: ',
		6: ' Saturday: '
} 

var color = {
		'debug' : '\033[37m', //branco
		'info'  : '\033[36m', //azul
		'warn'  : '\033[33m', //amarelo
		'trade' : '\033[32m', //verde
		'start' : '\033[35m', //roxo
		'error' : '\033[31m', //vermelho
}

exports.info = function (opt, message){
	
	// if debug is disabled, does not print debug message
	if(opt != 'debug' || debug){
		var time = new Date();
		var timestamp = day[time.getDay()] 
						+ time.getDate() + "/"
	    				+ (time.getMonth()+1)  + "/" 
	    				+ time.getFullYear() + " @ "  
	    				+ time.getHours() + ":"  
	    				+ time.getMinutes() + ":" 
	    				+ time.getSeconds();
		
		console.log(color[opt],'\t', timestamp, '\t', '[' + opt + ']' ,'\t', message,'\t' , color['debug']);
	}
}
