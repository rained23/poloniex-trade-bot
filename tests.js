// Importar os módulos
var config = require('./config.js');
var log = require('./core/log.js');
var profit = require('./core/profit.js');
var advice = require('./core/advice.js');
var exchange = require('./exchanges/' + config.watch.exchange + '.js');

var EMASMA = require('./indicators/emasma.js')

//Comandos de tela
process.stdout.write('\x1Bc'); 		//Limpar tela de console
process.title = '[POLONIEX BOT]';	//Adicionar titulo ao projeto

// Mandar mensagem indicando inicialização do BOT
log.info('start', "The BOT has been started. I'm analyzing the market now ...");

function manipularOrdens() {
	log.info('debug', "manipularOrdens >> started");
	
	// Selecionar os close dos candlesticks
	var candles = exchange.getCandles();
	
	//Se EMASMA: true
	var buyable = EMASMA.calculate(candles);
	log.info('debug', "manipularOrdens >> buyable: "+buyable);

	
	if ( advice.buyOrderId == 0 && advice.sellOrderId == 0) { 
		log.info('debug', "ManipulateOrdens >> There is no open order");

		if (buyable == true) {
			advice.opt('buy');			
		}
	}


	if( advice.buyOrderId != 0 && advice.sellOrderId == 0) {
		log.info('debug', "ManipulateOrdens >> The purchase order is open and the sell order is closed");
		
		if ( !exchange.isOpen(advice.buyOrderId)) {
			log.info('debug', "Handle Orders >> The purchase order has already been finalized");
			log.info('debug', "manipularOrdens >> sellOrderId: " +advice.sellOrderId + " buyOrderId: "+ advice.buyOrderId);
			log.info('debug', "ManipulateOrdens >> create a sell order with balance in btc");
			
			advice.buyOrderId = 0;
			advice.opt('sell');
		}
	}
	
	if( advice.sellOrderId != 0 && advice.buyOrderId == 0) {
		log.info('debug', "manipularOrdens >> Both orders have already been opened");
		
		if ( !exchange.isOpen(advice.sellOrderId)) {
			log.info('debug', "manipularOrdens >> Order of sell closed");
			log.info('info', "manipularOrdens >> Trade successfully completed");
			
			sellOrderId = 0;
			buyOrderId = 0;
		}
	}
}


function checkAccount(){
log.info('debug', "checkAccount >> started");
	
	var showProfitTime = 1800000; //30 min
	var runStopLossTime = 10000; //10 seg
	var runTraderTime = 15000; // 15 seg
	
	advice.updateBalance();
	
	log.info('info', "Balance at " + config.watch.currency + ": " + advice.currency);
	log.info('info', "Balance at " + config.watch.asset + ":  " + advice.asset);
	profit.init(advice.currency, advice.asset);
	
	setInterval(function(){
 		log.info('info', "Balance at  " + config.watch.currency + ": " + advice.currency);
		log.info('info', "Balance at " + config.watch.asset + ":  " + advice.asset);
		profit.init(advice.currency, advice.asset);
	},showProfitTime);
	
	// if he has balance begin to manipulate the orders
	setInterval(function c(){ manipularOrdens(); return c; }()  , runTraderTime);
	
	// Rotate the stop loss to check open purchase orders
	// Cancel orders out of market price
	setInterval(function(){
		advice.stopLoss();
	},runStopLossTime);
}



if (exchange.config.trader.enabled){

	exchange.setCredential(config.trader.key, config.trader.secret);
	exchange.setPair(config.watch.currency + '_' + config.watch.asset);
	
	var check = setInterval(
		function() {
			if(!exchange.lastPrice() > 0) {
				log.info('warn', "Receiving price information ...");
			}
			else if( !(exchange.getCandles().length > 0)) {
				log.info('warn', "Receiving information from candlesticks ...");
			}
			
			else if(!(exchange.balanceVal[exchange.config.watch.currency] > 0)) {
				log.info('warn', "Receiving information from your account ...");
			}
			else {
				checkAccount()
				clearInterval(check);
			}	
		}, 10000)	
} else {
	log.info('error', "Trader inativo. Edite config.js para trader.enable: true");
}

