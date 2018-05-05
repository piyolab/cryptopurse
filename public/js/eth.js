console.log(ethereumjs);
const Wallet = ethereumjs.Wallet;
const EthUtil = ethereumjs.Util;
const EthTx = ethereumjs.Tx;

const KEY_ETH_ADDRESS = "KEY_ETH_ADDRESS";
const KEY_ETH_PRIVATE_KEY = "KEY_ETH_PRIVATE_KEY";
const ETH_GAS_LIMIT = 21000;
const ETH_GAS_PRICE = 20000000000;
const HTTP_PROVIDER = 'https://mainnet.infura.io';
const ALERT_MESSAGE = "Something Wrong ><..."
var web3 = null;
var wallet = null;

function initWeb3() {
	web3 = new Web3(new Web3.providers.HttpProvider(HTTP_PROVIDER));
}

function generateWallet() {
	console.log("generate a new wallet.");
	wallet = Wallet.generate();
	const address = wallet.getAddressString();
	const privateKey = wallet.getPrivateKeyString();
	localStorage.setItem(KEY_ETH_ADDRESS, address);
	localStorage.setItem(KEY_ETH_PRIVATE_KEY, privateKey);
}

function recoverWallet() {
	const address = localStorage.getItem(KEY_ETH_ADDRESS);
	if (address == null) {
		generateWallet();
	} else {
		console.log("recover an existing wallet.");
		const privateKey = localStorage.getItem(KEY_ETH_PRIVATE_KEY);
		const privateKeyBuffer = EthUtil.toBuffer(privateKey);
		wallet = Wallet.fromPrivateKey(privateKeyBuffer);
	}
}

function showMyAddress() {
	$('#my-address').val(wallet.getAddressString());
}

function showMyBalance() {
	console.log("showMyBalance");
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

function sendRawTx(rawTx) {
	web3.eth.sendRawTransaction(rawTx, function(error, result){
		if (error) {
			alert(ALERT_MESSAGE);
		} else {
			console.log(result);
		}
	});
}

function sendEther() {
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
		sendRawTx(rawTx);
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

function registerCallbacks() {
	$('#my-address-balance-reload-btn').on('click', function() {
		showMyBalance();
	});

	$('#my-address-copy-btn').on('click', function() {
		$('#my-address').select();
		document.execCommand("Copy");
	});

	$('#to-address').on('focus', function() {
		$(this).select();
	})

	$('#send-eth-to-confirm-btn').on('click', function() {
		updateSendEthModalContent();
	});

	$('#send-eth-btn').on('click', function() {
		sendEther();
	});
}

$(document).ready(function(){
	initWeb3();
	recoverWallet();
	showMyAddress();
	registerCallbacks();
	showMyBalance();
});
