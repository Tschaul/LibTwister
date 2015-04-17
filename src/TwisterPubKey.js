var inherits = require('inherits');

var TwisterResource = require('./TwisterResource.js');

var Bitcoin = require('bitcoinjs-lib');
var Crypto = require('crypto');
var buffer = require('buffer').Buffer;
var bencode = require('bencode');

var twister_network = {
    magicPrefix: '\x18twister Signed Message:\n',
    pubKeyHash: 0x00,
}


TwisterPubKey = function (name,scope) {
    
    this._name = name;
    this._data =  null;
    this._btcKey =  null;

    TwisterResource.call(this,name,scope);   
    
    this._type = "pubkey";

    
}

inherits(TwisterPubKey,TwisterResource);

module.exports = TwisterPubKey;

TwisterPubKey.prototype.inflate = function (flatData) {

    TwisterResource.prototype.inflate.call(this,flatData);
    
    if (this._data) {
    
        this._btcKey = Bitcoin.ECPubKey.fromHex(this._data);
    
    }

}

TwisterPubKey.prototype._queryAndDo = function (cbfunc) {

    var thisResource = this;
    
    thisResource._updateInProgress = true;
            
    thisResource.RPC("dumppubkey", [ thisResource._name ], function(res) {

        //var TwisterCrypto = require('./TwisterCrypto.js');
        //console.log(res);
        thisResource._lastUpdate = Date.now()/1000;
        
        thisResource._data = res;
        
        thisResource._btcKey = Bitcoin.ECPubKey.fromHex(res);

        if (cbfunc) {

            cbfunc(thisResource);

        }

        thisResource._updateInProgress = false;

    }, function(ret) {

        thisResource._handleError(ret);

    });     
        
}

TwisterPubKey.prototype.getKey = function () {

    return this._data;
    
}



TwisterPubKey.prototype.verifySignature = function (message, signature, cbfunc) {

    var Twister = this._scope;
    
    if (Twister._verifySignatures) {
    
        thisPubKey=this._btcKey;

        Twister._signatureVerificationsInProgress++;

        var timeout=Twister._signatureVerificationsInProgress*Twister._averageSignatureCompTime*2;

        //console.log(messageVerificationsInProgress);

        setTimeout(function(){

            Twister._signatureVerificationsInProgress--;

            var startTime = Date.now();

            message = bencode.encode(message);

            if (!Buffer.isBuffer(signature)) {
                signature = new Buffer(signature, 'hex')
            }

            var retVal = Bitcoin.Message.verify(thisPubKey.getAddress(), signature, message, twister_network);

            var compTime = Date.now()-startTime;

            Twister._averageSignatureCompTime = 0.9*Twister._averageSignatureCompTime + 0.1*compTime;

            cbfunc(retVal)

        },timeout);
        
    }
    

}