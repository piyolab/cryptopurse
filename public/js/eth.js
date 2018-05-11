const version = '0.0.4';
const Wallet = ethereumjs.Wallet;
const EthUtil = ethereumjs.Util;
const EthTx = ethereumjs.Tx;

const KEY_ETH_ADDRESS = "KEY_ETH_ADDRESS";
const KEY_ETH_PRIVATE_KEY = "KEY_ETH_PRIVATE_KEY";
const ETH_GAS_LIMIT = 21000;
const ETH_GAS_PRICE = 20000000000;
const HTTP_PROVIDERS = [
	'https://mainnet.infura.io',
	'https://ropsten.infura.io'
]

const ALERT_MESSAGE = "Something Wrong ><..."
var web3 = null;
var wallet = null;

var video = document.createElement("video");
var canvasElement = document.getElementById("reader-camera-preview");
var canvas = canvasElement.getContext("2d");
var readingQRCode = false;

function initWeb3(httpProvider) {
	web3 = new Web3(new Web3.providers.HttpProvider(httpProvider));
}

function saveWalletInfo(wallet) {
	const address = wallet.getAddressString();
	const privateKey = wallet.getPrivateKeyString();
	localStorage.setItem(KEY_ETH_ADDRESS, address);
	localStorage.setItem(KEY_ETH_PRIVATE_KEY, privateKey);
}

function generateWallet() {
	wallet = Wallet.generate();
}

function recoverWallet() {
	const privateKey = localStorage.getItem(KEY_ETH_PRIVATE_KEY);
	if (privateKey == null || privateKey == "") {
		generateWallet();
	} else {
		const privateKeyBuffer = EthUtil.toBuffer(privateKey);
		wallet = Wallet.fromPrivateKey(privateKeyBuffer);
	}
}

function showMyAddress() {
	$('#my-address').val(wallet.getAddressString());
}

function showMyBalance() {
	const address = wallet.getAddressString();
	var balance = web3.eth.getBalance(address, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
		} else {
			$('#my-address-balance').text(web3.fromWei(result, 'ether'));			
		}
	});
}

function getHexNonce(address, callback) {
	web3.eth.getTransactionCount(address, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
		} else {
			const hexNonce = web3.toHex(result);
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
		chainId: 1
	}
	const tx = new EthTx(txParams);
	return tx;
}

function sendRawTx(rawTx, callback) {
	web3.eth.sendRawTransaction(rawTx, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
		} else {
			callback(result);
		}
	});
}

function sendEther(callback) {
	const fromAddress = wallet.getAddressString();
	const toAddress = $('#to-address').val();
	const ethAmount = $('#to-amount').val();
	const weiAmount = web3.toWei(ethAmount, 'ether');

	if(!EthUtil.isValidAddress(toAddress)) {
		alert("Please enter a valid address.");
		return;
	}

	if(weiAmount <= 0) {
		alert("Please enter a valid amount.");
		return;
	}

	getHexNonce(fromAddress, function(hexNonce) {
		const hexGasPrice = web3.toHex(ETH_GAS_PRICE);
		const hexGasLimit = web3.toHex(ETH_GAS_LIMIT);
		const hexWeiAmount = web3.toHex(weiAmount);
		const tx = createTx(hexNonce, toAddress, hexGasPrice, hexGasLimit, hexWeiAmount);
		tx.sign(EthUtil.toBuffer(wallet.getPrivateKeyString()));
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
	const weiAmount = web3.toWei(ethAmount, 'ether');

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

function tick() {
  loadingMessageLabel = $("#reader-loading-message")
  loadingMessageLabel.text("⌛ Loading video...");
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessageLabel.hide();
    canvasElement.hidden = false;

    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    var code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code != null && readingQRCode) {
      if (web3.isAddress(code.data)) {
        $('#qrcode-reader-modal').modal('hide');
        $("#to-address").val(code.data);
      } else {
        console.error("Invalid data: " + code.data);
      }

    }
  }
  if (readingQRCode) {
    requestAnimationFrame(tick);
  }
}

function exportWallet() {
	$('#privatekey-output').val(wallet.getPrivateKeyString());
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
		wallet = Wallet.fromPrivateKey(privateKeyBuffer);
		saveWalletInfo(wallet);
		showMyAddress();
		$('#privatekey-input-modal').modal('toggle');
		showMyBalance();
	} catch (error) {
		console.error(error);
		alert(error);
	}
	
}

function registerCallbacks() {
	$('#my-address-balance-reload-btn').on('click', function() {
		showMyBalance();
	});

	$('#my-address-copy-btn').on('click', function() {
		const fromAddress = wallet.getAddressString();
		Clipboard.copy(fromAddress);
	});

	$('#my-address-qr-btn').on('click', function() {
		const fromAddress = wallet.getAddressString();
		$('#qrcode-modal-msg').text(fromAddress);
		$('#qrcode').empty();
		new QRCode(document.getElementById("qrcode"), fromAddress);
	});

	$('#to-address').on('focus', function() {
		$(this).select();
	})

	$('#privatekey-output').on('focus', function() {
		$(this).select();
	});

	$('#privatekey-output-copy-btn').on('click', function() {
		$('#privatekey-output').select();
		Clipboard.copyOnModal(wallet.getPrivateKeyString(), $('#privatekey-output-modal').get(0));
	});

	$('#send-eth-to-confirm-btn').on('click', function() {
		updateSendEthModalContent();
	});

	$('#send-eth-btn').on('click', function() {
		$('#send-eth-confirm-modal').modal('toggle');
		sendEther(function(result) {
			const url = 'https://etherscan.io/tx/' + result;
			const e = $("<a></a>", {
  				href: url,
  				target: "_blank",
  				text: "Check the tx in etherscan.io"
			});
			$('#tx-result-modal-msg').html(e);
			$('#tx-result-modal').modal('toggle');
		});
	});

	$('#export-wallet-btn').on('click', function() {
		exportWallet();
	});

	$('#import-wallet-btn').on('click', function() {
		importWallet();
	});

	$('#privatekey-input-btn').on('click', function() {
		importPrivateKey();
	});

  $('#qrcode-reader-modal').on('show.bs.modal', function() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      readingQRCode = true;
      requestAnimationFrame(tick);
    }).catch(function(e) {
      $("#reader-loading-message").text("🙅‍♀️" + e.name);
    });
  });

  $('#qrcode-reader-modal').on('hide.bs.modal', function (e) {
    if (video.srcObject != null) {
      readingQRCode = false;
      video.srcObject.getTracks()[0].stop();
    }
  });


}

function hideDisabledFeatures() {
  if (navigator.mediaDevices == undefined || navigator.mediaDevices.getUserMedia == undefined) {
    $("#to-address-read-from-camera").hide();
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
}

function getHttpProvider(networkId) {
	var httpProvider = HTTP_PROVIDERS[0];
	if(networkId != null && networkId <= HTTP_PROVIDERS.length)
		httpProvider = HTTP_PROVIDERS[networkId-1];
	return httpProvider;
}

$(document).ready(function(){
	$('#version').text('Version ' + version);
	getUrlParams(function(params) {
		processUrlParams(params);
		initWeb3(getHttpProvider(params.network));
	});
	recoverWallet();
	showMyAddress();
	registerCallbacks();
	showMyBalance();
  hideDisabledFeatures();
  $('[data-toggle="tooltip"]').tooltip()
});

