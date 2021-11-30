const { providers } = require("ethers")
const fs = require("fs")
var csvWriter = require("csv-write-stream")

require("@nomiclabs/hardhat-web3")
require("@nomiclabs/hardhat-ethers")

const SHUFFLING_ABI = require("../utils/shuffling_abi.js")

const SHUFFLING_CONTRACT_ADDRESS = "0x460AadE8401EBEf7D5adEf6fE358cff3cDF46124"

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

	//prepare CSV file
	var writer = csvWriter({ sendHeaders: false })
	var csvFilename = "shuffled.csv"

	// If CSV file does not exist, create it and add the headers
	if (!fs.existsSync(csvFilename)) {
		writer = csvWriter({ sendHeaders: false })
		writer.pipe(fs.createWriteStream(csvFilename))
		writer.end()
	}

	for (let i = 1; i <= 5555; i++) { 
		let winner = Number(await shufflingContract.shuffledNFTs(i))
		console.log("processed index " + i + " got " + winner)

		// Append more data to CSV the file
		writer = csvWriter({ sendHeaders: false })
		writer.pipe(fs.createWriteStream(csvFilename, { flags: "a" }))
		writer.write({
			header1: winner,
		})
		writer.end()
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
