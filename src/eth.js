const Wallet = ethereumjs.Wallet;
const EthUtil = ethereumjs.Util;
const EthTx = ethereumjs.Tx;

const Constants = {
  Keys: {
    KEY_ETH_ADDRESS: "KEY_ETH_ADDRESS",
    KEY_ETH_PRIVATE_KEY: "KEY_ETH_PRIVATE_KEY",
    KEY_ETH_CREATED_AT: "KEY_ETH_CREATED_AT",
    KEY_ETH_GAS_PRICE: "KEY_ETH_GAS_PRICE"
  },
  ETH_GAS_LIMIT: 21000,
  ETH_DEFAULT_GAS_PRICE: 20000000000,
  HTTP_PROVIDERS: [
    'https://mainnet.infura.io',
    '',
    'https://ropsten.infura.io'
  ],
  ETHERSCAN_URLS: [
    'https://etherscan.io/',
    '',
    'https://ropsten.etherscan.io/'
  ]
}

let Purse = {
  web3: null,
  wallet: null,
  chainId: 1
}

const ALERT_MESSAGE = "Something Wrong ><..."

var video = document.createElement("video");
var canvasElement = document.getElementById("reader-camera-preview");
var canvas = canvasElement.getContext("2d");
var loadingMessageLabel = $("#reader-loading-message");

var qrCodeReader = new QRCodeReader(jsQR, video, canvas);
qrCodeReader.onPreview = function(video) {
	loadingMessageLabel.hide();
	canvasElement.hidden = false;

	canvasElement.height = video.videoHeight;
	canvasElement.width = video.videoWidth;
	canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
};
qrCodeReader.onData = function(data) {
	if (Purse.web3.isAddress(data)) {
		$('#qrcode-reader-modal').modal('hide');
		$("#to-address").val(data);
	} else {
		console.error("Invalid data: " + data);
	}
}

function initWeb3(httpProvider) {
	Purse.web3 = new Web3(new Web3.providers.HttpProvider(httpProvider));
}

function saveWalletInfo(wallet) {
	const address = wallet.getAddressString();
	const privateKey = wallet.getPrivateKeyString();
	localStorage.setItem(Constants.Keys.KEY_ETH_ADDRESS, address);
	localStorage.setItem(Constants.Keys.KEY_ETH_PRIVATE_KEY, privateKey);
  localStorage.setItem(Constants.Keys.KEY_ETH_CREATED_AT, Math.floor(Date.now()/1000));
}

function generateWallet() {
	Purse.wallet = Wallet.generate();
	saveWalletInfo(Purse.wallet);
}

function recoverWallet(callback) {
	const privateKey = localStorage.getItem(Constants.Keys.KEY_ETH_PRIVATE_KEY);
	if (privateKey == null || privateKey == "") {
	} else {
		const privateKeyBuffer = EthUtil.toBuffer(privateKey);
		Purse.wallet = Wallet.fromPrivateKey(privateKeyBuffer);
	}
  callback();
}

function showMyAddress() {
	$('#my-address').val(Purse.wallet.getAddressString());
}

function showMyBalance() {
	const address = Purse.wallet.getAddressString();
	$('#my-address-balance').text('...');
	var balance = Purse.web3.eth.getBalance(address, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
		} else {
      let etherBalance = Purse.web3.fromWei(result, 'ether');
    etherBalance = etherBalance.toFormat(6, Purse.web3.BigNumber.ROUND_DOWN);
			$('#my-address-balance').text(etherBalance);
		}
	});
}

function getHexNonce(address, callback) {
	Purse.web3.eth.getTransactionCount(address, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
			console.error(error);
		} else {
			const hexNonce = Purse.web3.toHex(result);
			callback(hexNonce);
		}
	});
}

function createTx(nonce, to, gasPrice, gasLimit, value) {
	const txParams = {
		nonce: nonce,
		to: to,
		gasPrice: gasPrice,
		gasLimit: gasLimit,
		value: value,
		chainId: Purse.chainId
	}
	const tx = new EthTx(txParams);
	return tx;
}

function sendRawTx(rawTx, callback) {
	Purse.web3.eth.sendRawTransaction(rawTx, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
			console.error(error);
		} else {
			callback(result);
		}
	});
}

function isValidGasPrice(wei) {
  const gwei = Purse.web3.fromWei(wei, 'gwei');
  if (!isNaN(gwei) && gwei >= 1 && gwei <= 99 ) {
    return true;
  }
  return false;
}

function getGasPrice() {
  let gasPrice = localStorage.getItem(Constants.Keys.KEY_ETH_GAS_PRICE);
  if (!isValidGasPrice(gasPrice)) {
    gasPrice = Constants.ETH_DEFAULT_GAS_PRICE;
  }
  return gasPrice;
}

function getGasPriceInGwei() {
  return Purse.web3.fromWei(getGasPrice(), 'gwei');
}

function saveGasPrice(wei) {
  if (isValidGasPrice(wei)) {
    localStorage.setItem(Constants.Keys.KEY_ETH_GAS_PRICE, wei);
  }
}

function saveGasPriceInGwei(gwei) {
  const wei = Purse.web3.toWei(gwei, 'gwei');
  saveGasPrice(wei);
}

function sendEther(callback) {
	const fromAddress = Purse.wallet.getAddressString();
	const toAddress = $('#to-address').val();
	const ethAmount = $('#to-amount').val();
	const weiAmount = Purse.web3.toWei(ethAmount, 'ether');

	if(!EthUtil.isValidAddress(toAddress)) {
		alert("Please enter a valid address.");
		return;
	}

	if(weiAmount <= 0) {
		alert("Please enter a valid amount.");
		return;
	}

	getHexNonce(fromAddress, function(hexNonce) {
		const hexGasPrice = Purse.web3.toHex(Constants.ETH_DEFAULT_GAS_PRICE);
		const hexGasLimit = Purse.web3.toHex(Constants.ETH_GAS_LIMIT);
		const hexWeiAmount = Purse.web3.toHex(weiAmount);
		const tx = createTx(hexNonce, toAddress, hexGasPrice, hexGasLimit, hexWeiAmount);
		tx.sign(EthUtil.toBuffer(Purse.wallet.getPrivateKeyString()));
		const serializedTx = tx.serialize();
		const rawTx = '0x' + serializedTx.toString('hex');
		sendRawTx(rawTx, function(result) {
			callback(result);
		});
	});
}

function updateSendEthModalContent() {
	var msg = null;
	var title = null;
	const toAddress = $('#to-address').val();
	const ethAmount = $('#to-amount').val();
	const weiAmount = Purse.web3.toWei(ethAmount, 'ether');

	if(!EthUtil.isValidAddress(toAddress) || weiAmount <=  0) {
		$('#send-eth-btn').hide();
		title = "Error";
		msg = "Enter a valid address and amount.";
	} else {
		$('#send-eth-btn').show();
		title = "Are you sure?";
		msg = "You are about to send " +
				$('#to-amount').val() +
				" ETH to " +
				$('#to-address').val();
	}
	$('#send-eth-confirm-modal-title').text(title);
	$('#send-eth-confirm-modal-msg').text(msg);
}

function exportWallet() {
	$('#privatekey-output').val(Purse.wallet.getPrivateKeyString());
	$('#export-wallet-modal').modal('toggle');
	$('#privatekey-output-modal').modal('toggle');
}

function importWallet() {
	$('#import-wallet-modal').modal('toggle');
	$('#privatekey-input-modal').modal('toggle');
}

function importPrivateKey() {
	const privateKey = $('#privatekey-input').val();
	const privateKeyBuffer = EthUtil.toBuffer(privateKey);
	try {
		Purse.wallet = Wallet.fromPrivateKey(privateKeyBuffer);
		saveWalletInfo(Purse.wallet);
		showMyAddress();
		$('#privatekey-input-modal').modal('toggle');
		showMyBalance();
	} catch (error) {
		console.error(error);
		alert(error);
	}

}

function registerCallbacksAdjustGas() {
  $('#adjust-gas-modal-btn').on('click', function(e) {
    $('#gasprice-amount').val(getGasPriceInGwei());
  });
  $('#adjust-gas-reset-btn').on('click', function(e) {
    saveGasPrice(Constants.ETH_DEFAULT_GAS_PRICE);
    $('#gasprice-amount').val(getGasPriceInGwei());
    showSnackbar('Saved!');
  });
  $('#adjust-gas-save-btn').on('click', function(e) {
    let gwei = $('#gasprice-amount').val();
    saveGasPriceInGwei(gwei);
    $('#gasprice-amount').val(getGasPriceInGwei());
    showSnackbar('Saved!');
  });
}

function registerCallbacksSendEther() {
  $('#to-address').on('focus', function() {
    $(this).select();
  })
  $('#send-eth-to-confirm-btn').on('click', function() {
    updateSendEthModalContent();
  });
  $('#send-eth-btn').on('click', function() {
    $('#send-eth-confirm-modal').modal('toggle');
    sendEther(function(result) {
      const baseUrl = Constants.ETHERSCAN_URLS[Purse.chainId-1];
      const url = baseUrl + 'tx/' + result;
      const e = $("<a></a>", {
          href: url,
          target: "_blank",
          text: "Check the tx in etherscan.io"
      });
      $('#tx-result-modal-msg').html(e);
      $('#tx-result-modal').modal('toggle');
    });
  });
}

function updateShareModalQrcode(urlStr) {
  $('#share-modal-qrcode').empty();
  new QRCode(document.getElementById("share-modal-qrcode"), urlStr);
}

function registerCallbacksShare() {
  $('#my-address-share-btn').on('click',function() {
    showShareModal();
  });
  $('#share-amount').on('input', function (e) {
    let ethValue = $('#share-amount').val();
    if(!isNaN(ethValue)) {
      let url = getShareUrl(ethValue)
      $('#share-output').val(url);
      updateShareModalQrcode(url);
    }
  });
  $('#share-output-copy-btn').on('click', function(e) {
    Clipboard.copyOnModal($('#share-output').val(), $('#share-modal').get(0));
    showSnackbar('Copied!');
  });
}

function registerCallbacksQrReader() {
  $('#qrcode-reader-modal').on('show.bs.modal', function() {
    qrCodeReader.start(function() {
      loadingMessageLabel.text("⌛ Loading video...");
    }, function(error) {
      $("#reader-loading-message").text("🙅‍♀️" + error.name);
    })
  });
  $('#qrcode-reader-modal').on('hide.bs.modal', function (e) {
    qrCodeReader.stop()
  });
}

function registerCallbacksExportWallet() {
  $('#export-wallet-btn').on('click', function() {
    exportWallet();
  });
  $('#privatekey-output').on('focus', function() {
    $(this).select();
  });
  $('#privatekey-output-copy-btn').on('click', function() {
    $('#privatekey-output').select();
    Clipboard.copyOnModal(Purse.wallet.getPrivateKeyString(), $('#privatekey-output-modal').get(0));
    showSnackbar('Copied!');
  });
}

function registerCallbacksImportWallet() {
  $('#import-wallet-btn').on('click', function() {
    importWallet();
  });
  $('#privatekey-input-btn').on('click', function() {
    importPrivateKey();
  });
}

function registerCallbacksMyPurse() {
  $('#my-address-balance-reload-btn').on('click', function() {
    showMyBalance();
  });
  $('#my-address-copy-btn').on('click', function(e) {
    const fromAddress = Purse.wallet.getAddressString();
    Clipboard.copy(fromAddress);
    showSnackbar('Copied!');
  });
  $('#my-address-qr-btn').on('click', function() {
    const fromAddress = Purse.wallet.getAddressString();
    $('#qrcode-modal-msg').text(fromAddress);
    $('#qrcode').empty();
    new QRCode(document.getElementById("qrcode"), fromAddress);
  });
}


function registerCallbacks() {
  if (Purse.wallet == null) {
    $('#create-wallet-btn').on('click', function() {
      generateWallet();
      window.location.reload();
    });
    return;
  }
  registerCallbacksMyPurse();
  registerCallbacksSendEther();
  registerCallbacksQrReader();
  registerCallbacksExportWallet();
  registerCallbacksImportWallet();
  registerCallbacksShare();
  registerCallbacksAdjustGas();
}

function getShareUrl(ethValue) {
  const baseUrl = 'https://cryptopurse.app/eth/';
  let url = baseUrl + '?to=' + Purse.wallet.getAddressString();
  if (ethValue > 0 && ethValue != null) {
    url = url + '&value=' + ethValue;
  }
  return url;
}

function showShareModal() {
  let url = getShareUrl(0)
  $('#share-output').val(url);
  updateShareModalQrcode(url);
  $('#share-modal').modal('toggle');
}


function isChrome() {
	const userAgent = window.navigator.userAgent.toLowerCase();
	chrome = /crios/.test(userAgent);
	if (chrome) {
		return true;
	} else {
		return false;
	}
}

function isWebView() {

	if (isChrome()) {
		return false;
	}

  var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test( userAgent ),
    ios = /iphone|ipod|ipad/.test( userAgent );
  if ((ios && !standalone && !safari) || (ios && !isCameraAvailable()) ) {
    return true;
  } else {
    return false;
  }
}

function isCameraAvailable() {
	if (navigator.mediaDevices == undefined || navigator.mediaDevices.getUserMedia == undefined) {
		return false;
	} else {
		return true;
	}
}

function setupUI() {
  const baseUrl = Constants.ETHERSCAN_URLS[Purse.chainId-1];
  const address = Purse.wallet.getAddressString();
  const url = baseUrl + 'address/' + address
  $('#etherscan-link').attr('href', url);
  showMyAddress();
  showMyBalance();
}

function showUI() {
  if (isWebView()) {
    $("#webview-warning").show();
    $("#browser-link").text(location.href);    
  } else if (Purse.wallet == null) {
    $('#create-wallet').show();
  }
  hideDisabledFeatures();
}

function hideDisabledFeatures() {
  if (!isCameraAvailable()) {
    $("#to-address-read-from-camera").hide();
  }
  if (Purse.wallet == null || isWebView()) {
    $("#main-contents").hide();
    $('#navbarToggleButton').hide();
  }
}

function getUrlParam(key) {
    key = key.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + key + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function getUrlParams(callback) {
	var params = {};
	params.to = getUrlParam('to');
	params.value = getUrlParam('value');
	params.network = getUrlParam('network');
	callback(params);
}

function processUrlParams(params) {
	if (params.to) $('#to-address').val(params.to);
	if (params.value) $('#to-amount').val(params.value);
	if (params.network) Purse.chainId = parseInt(params.network);
}

function getHttpProvider(networkId) {
	var httpProvider = Constants.HTTP_PROVIDERS[0];
	if(networkId != null && networkId <= Constants.HTTP_PROVIDERS.length)
		httpProvider = Constants.HTTP_PROVIDERS[networkId-1];
	return httpProvider;
}

function showSnackbar(text) {
  $('<div>', {
    id: 'snackbar',
    text: text
  }).appendTo('body');
  $('#snackbar').addClass('show');
  setTimeout(function(){
    $('#snackbar').remove();
  }, 1000);
}

$(document).ready(function(){
	recoverWallet(function() {
    if (Purse.wallet) {
      getUrlParams(function(params) {
        processUrlParams(params);
        initWeb3(getHttpProvider(params.network));
      });
      setupUI();
    }
  });
  registerCallbacks();
  showUI();
});
