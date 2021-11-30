const { providers } = require("ethers")
const hre = require("hardhat")
require("@nomiclabs/hardhat-web3")
require("@nomiclabs/hardhat-ethers")

const SHUFFLING_ABI = require("../utils/shuffling_abi.js")

const SHUFFLING_CONTRACT_ADDRESS = "0x460AadE8401EBEf7D5adEf6fE358cff3cDF46124"
const GASPrice = "30" //!important

async function main() {
	//give allowance for transfering tokens

	let walletWithProvider = new ethers.Wallet(
		process.env.PRIVATE_KEY,
		new providers.JsonRpcProvider(process.env.MATIC_RPC)
	)

	let shufflingContract = new ethers.Contract(
		SHUFFLING_CONTRACT_ADDRESS,
		SHUFFLING_ABI,
		walletWithProvider
	)

	let options = { gasLimit: 15000000, gasPrice: ethers.utils.parseUnits(GASPrice, "gwei") }

	let tx = await shufflingContract.shuffleNFTs(0, 0, 500, options)
	console.log("1 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 500, 1000, options)
	console.log("2 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 1000, 1500, options)
	console.log("3 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 1500, 2000, options)
	console.log("4 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 2000, 2500, options)
	console.log("5 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 2500, 3000, options)
	console.log("6 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 3000, 3500, options)
	console.log("7 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 3500, 4000, options)
	console.log("8 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 4000, 4500, options)
	console.log("9 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 4500, 5000, options)
	console.log("10 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 5000, 5500, options)
	console.log("11 @ ", tx.hash)

	tx = await shufflingContract.shuffleNFTs(0, 5500, 5555, options)
	console.log("12 @ ", tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
