var ethers = require('ethers');
var CalStore = require('../build/contracts/CalStore.json');
const url = "http://127.0.0.1:7545";
const provider = new ethers.providers.JsonRpcProvider(url);

const contractAddress ='0xa8A6e788C55107355Da1868C31e5123DB77Cf720';
// Connect to the network
// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
let contract = new ethers.Contract(contractAddress, CalStore.abi, provider);

try {
	contract.getEvents("0xD6733F5011732cfb46788549bb8342556E2D9096").then(event => console.log(event));
} catch (e) {
	console.log(e);
}

