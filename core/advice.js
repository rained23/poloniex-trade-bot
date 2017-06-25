/**
 * 
 */
var config = require('../config.js');
var bot = require('../exchanges/' + config.watch.exchange + '.js');
var log = require('./log.js');

exports.rate = 0;
exports.price = 0;
exports.ammount = 0;
exports.currency = 0;
exports.asset = 0;
exports.buyOrderId = "";
exports.sellOrderId = "";

exports.updateBalance = function(){
	log.info('debug', "advice >> updateBalance >> started");
	
	// price average between the maximum and minimum of the offer book
	exports.rate = (parseFloat(bot.pairTicker.highbid) + parseFloat(bot.pairTicker.lowask))/2;
	exports.rate = exports.rate.toFixed(8);
	
	// current currency and asset value
	exports.currency = bot.balance(bot.config.watch.currency)
	exports.asset = bot.balance(bot.config.watch.asset)
	
	log.info('debug', "advice >> updateBalance >> Update completed | price: "+exports.price+" | currency: " + exports.currency + " | asset: " + exports.asset);
}

exports.sell = function (price, ammount){
	log.info('debug', "advice >> sell >> started");

	log.info('debug', "advice >> sell >> price: " +price+ " bitcoinsVal: "+ammount);
	
	// criar uma ordem de venda com saldo em btc
	bot.sellcoin(price, ammount, function(err, data) {
		if(err){
			log.info('error', "sell >> " + err);
			return false	
		}
		
		exports.sellOrderId = data.orderNumber;
		exports.price = price;
		exports.ammount = ammount;
		
		log.info('debug', "advice >> sell >> Sell order created: " + exports.sellOrderId + " | Price: "+price+" | Ammount: " + ammount);
		log.info('trade', "advice >> sell >> Price: "+price+" | Ammount: "+ammount);
	})
}

exports.buy = function (price, ammount){
	log.info('debug', "advice >> buy >> started");

	log.info('debug', "advice >> buy >> price: " + price + " | ammount: " + ammount);
	

	//Executa a compra
	bot.buycoin(price, ammount, function(err, data) {
		if(err){
			log.info('error', "buy >> " + err);
			return false
		}
		
		exports.buyOrderId = data.orderNumber;
		exports.price = price;
		exports.ammount = ammount;
		
		log.info('debug', "advice >> buy >> Buy ORder created: " + exports.buyOrderId + " price: " + price + " ammount: " + ammount);
		log.info('trade', "advice >> buy >> Price: "+price+" | Ammount: "+ammount);
	})
}

//calcula ammout para compra e venda
exports.calculate = function(opt){
	log.info('debug', "advice >> calculate >> started");

	if (opt == 'sell'){
		log.info('debug', "advice >> calculate >> Calculate amount to sell");
		
		price = parseFloat(bot.addpercent(parseFloat(bot.pairTicker.lowask), 0.2));
		price = price.toFixed(8);
		exports.price = parseFloat(bot.addpercent(parseFloat(price), 0.25)).toFixed(8);

		ammount =  parseFloat(bot.rempercent(parseFloat(bot.config.trader.value/price), 0.25));
		exports.ammount = ammount.toFixed(8);
		
		log.info('debug', "advice >> calculate >> exports.ammount: " + exports.ammount);
	} else if (opt == 'buy'){
		log.info('debug', "advice >> calculate >> Calculate amount to buy");
		
		price = parseFloat(bot.rempercent(parseFloat(bot.pairTicker.highbid), 0.1));
		exports.price = price.toFixed(8);

		// ajustar as fee
		ammount =  bot.config.trader.value/price;
		exports.ammount = ammount.toFixed(8);
		
		log.info('debug', "advice >> calculate >> exports.ammount: " + exports.ammount);
	}
}

//executa compra ou venda
exports.opt = function(opt) {
	log.info('debug', "advice >> opt >> started");
	log.info('debug', "advice >> opt >> Starting operation for: " + opt);
	
	exports.updateBalance();
	exports.calculate(opt);
	
	if (opt == 'sell'){
		exports.sell(exports.price, exports.ammount);
	} else if (opt == 'buy'){
		
		exports.buy(exports.price, exports.ammount);
	}
}

exports.cancelOpenOrder = function(){
	log.info('debug', "advice >> cancelOpenOrder >> started");
	
	if (bot.isOpen(exports.buyOrderId)) {
		log.info('warn', "advice >> cancelOpenOrder >> Buy > cancelOrder: ",exports.buyOrderId);
		
		bot.cancelOrder(exports.buyOrderId, function(err, data) {
			if(err){
				log.info('error', "advice >> cancelOpenOrder >> " + err);
				return false;
			}
			exports.buyOrderId = 0;
			log.info('debug', "advice >> cancelOpenOrder >> Buy > cancelOrder: completed ");
		});
	}
	
	if (bot.isOpen(exports.sellOrderId)) {
		log.info('warn', "advice >> cancelOpenOrder >> Sell > cancelOrder: ",exports.sellOrderId);
		
		bot.cancelOrder(exports.sellOrderId, function(err, data) {
			if(err){
				log.info('error', "advice >> cancelOpenOrder >> " + err);
				return false
			}
			exports.sellOrderId = 0;
			log.info('debug', "advice >> cancelOpenOrder >> Sell > cancelOrder: completed ");
		});
	}
}

exports.stopLoss = function(){
	log.info('debug', "advice >> stopLoss >> started");
	exports.updateBalance();
	
	var move = false;
	
	if (exports.buyOrderId != 0){
		log.info('debug',"stopLoss >> buyOrderId: "+exports.buyOrderId+" | Price: "+exports.price+" | rate: " +exports.rate);
		if (exports.rate != parseFloat(bot.pairTicker.highbid)){
			log.info('debug',"stopLoss >> exports.rate: "+exports.rate+" | highbid: "+parseFloat(bot.pairTicker.highbid));
			log.info('debug',"stopLoss >> media (rate) diff from last bid >> Enter MoveOrder");
			move = true;
		}
	} else if (exports.sellOrderId != 0){
		log.info('debug',"stopLoss >> sellOrderId: "+exports.sellOrderId+" | Price: "+exports.price+" | rate: " +exports.rate);
		
		if (exports.rate != parseFloat(BOT.pairTicker.lowask)){
			log.info('debug',"stopLoss >> exports.rate: "+exports.rate+" | lowask: "+parseFloat(bot.pairTicker.lowask));
			log.info('debug',"stopLoss >> media (rate) diff from last ask >> Enter MoveOrder");
			move = true;
		}
	}
	
	log.info('debug', "stopLoss >> move: "+ move + " bot.isOpen(buyOrderId): "+ bot.isOpen(exports.buyOrderId) + " bot.isOpen(exports.sellOrderId): "+ bot.isOpen(exports.sellOrderId));
	log.info('debug', "stopLoss >> Enter MoveOrder? " + (move && (bot.isOpen(exports.buyOrderId) || bot.isOpen(exports.sellOrderId))));
	
	if (move && (bot.isOpen(exports.buyOrderId) || bot.isOpen(exports.sellOrderId))){
		log.info('warn', "stopLoss >> move: "+move+" | new rate: "+exports.rate+" | old price: " +  exports.price);
				
		bot.moveOrder(exports.buyOrderId, exports.rate, function(err, data) {
			if(err){
				log.info('error', "stopLoss >> " + err);
				return false
			}
			
			exports.buyOrderId = data.orderNumber;
			exports.price = exports.rate;
			log.info('warn', "stopLoss >> Order updated with price: " + exports.price);
		});
	} 
}
