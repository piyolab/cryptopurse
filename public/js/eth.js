console.log(ethereumjs);
const Wallet = ethereumjs.Wallet;

const wallet = Wallet.generate();
console.log("privateKey: " + wallet.getPrivateKeyString());
console.log("address: " + wallet.getAddressString());