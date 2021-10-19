const { expect, assert } = require("chai")
const { web3, ethers } = require("hardhat")
const { BN, time, balance, expectEvent, expectRevert } = require("@openzeppelin/test-helpers")
const ether = require("@openzeppelin/test-helpers/src/ether")

let nft
let owner, acc1, acc2

describe("NFT", function () {
	beforeEach(async function () {
		let TContract = await ethers.getContractFactory("OCG")

		nft = await TContract.deploy()
		await nft.deployed()

		signers = await ethers.getSigners()
		owner = signers[0]
		acc1 = signers[1]
		acc2 = signers[2]

		await nft.togglePresaleStatus()
		await nft.togglePublicSaleStatus()
	})

	it("simple test...", async function () {
		expect(await nft.totalSupply()).to.equal(0)
	})

	it("whitelisting 10 addresses cost", async function () {
		await nft.batchAddToWhitelist([
			"0x0aCa1B52A81A718a410057A431c8c67208612F92",
			"0x2F929a7452104B9b18e0c1F86860171b79b685ff",
			"0x481d1432A3eA9Dc2A00db12E13aB39D8EF5aB174",
			"0x2bf09d569E7009F9dad237c29347e5CA7F2b732d",
			"0xBb1eEBf916848Fa473bd0898cB5ed05590c8c2d8",
			"0x6f77Daf80D89a9Ec184799eCA70B8103F59D652b",
			"0x4634a7D6014924F6fd77C94Fe6B42Ac1defFc312",
			"0x02d9e8a09299c85c6cF2426D70b92CB4EDE93207",
			"0x8F5634c7F5a3DABD02DEDA8E6FADd4D64Ec0DF1C",
			"0xA477d38D3dFA57b0D513365C6cD9131D5E977c55",
		])
		expect(await nft.isWhitelisted("0xA477d38D3dFA57b0D513365C6cD9131D5E977c55")).to.equal(true)
		expect(await nft.isWhitelisted("0xf4E9cC8500a5D7Ec83179a5E4e29615b064394d8")).to.equal(false)
	})

	it("presale needs whitelist", async function () {
		await nft.batchAddToWhitelist([
			"0x0aCa1B52A81A718a410057A431c8c67208612F92",
			"0x2F929a7452104B9b18e0c1F86860171b79b685ff",
		])
		expect(await nft.isWhitelisted("0x0aCa1B52A81A718a410057A431c8c67208612F92")).to.equal(true)

		await expect(
			nft.connect(acc1).presaleBuy(1, { value: web3.utils.toWei("0.07", "ether") })
		).to.be.revertedWith("not whitelisted")

		await nft.batchAddToWhitelist([acc1.address])

		expect(await nft.balanceOf(acc1.address)).to.equal(0)
		await nft.connect(acc1).presaleBuy(1, { value: web3.utils.toWei("0.05", "ether") })
		expect(await nft.balanceOf(acc1.address)).to.equal(1)
	})

	// function publicBuy(uint256 qty) external payable {
	// 	require(saleLive, "sale not live");
	// 	require(qty <= maxQtyForPublicSale, "no more than 15 at once");
	// 	require(totalSupply() + qty < maxSupply, "out of stock");
	// 	require(pricePerToken * qty == msg.value, "exact amount needed");
	// 	for (uint256 i = 0; i < qty; i++) {
	// 		_safeMint(msg.sender, totalSupply() + 1);
	// 	}
	// }
	// it("purchasing tokens works", async function () {
	// 	await expect(
	// 		nft.connect(acc1).publicBuy(1, { value: web3.utils.toWei("0.09", "ether") })
	// 	).to.emit(nft, "Transfer")
	// 	await expect(
	// 		nft.connect(acc1).publicBuy(3, { value: web3.utils.toWei("0.27", "ether") })
	// 	).to.emit(nft, "Transfer")
	// })

	// it("burning tokens works", async function () {
	// 	await expect(
	// 		nft.connect(acc1).publicBuy(3, { value: web3.utils.toWei("0.27", "ether") })
	// 	).to.emit(nft, "Transfer")
	// 	expect(await nft.balanceOf(acc1.address)).to.equal(3)
	// 	await nft.connect(acc1).burn(1)
	// 	expect(await nft.balanceOf(acc1.address)).to.equal(2)
	// })

	// it("purchasing 3 tokens works", async function () {
	// 	await nft.startSale()
	// 	await expect(
	// 		nft.connect(acc1).acquire(3, { value: web3.utils.toWei("0.21", "ether") })
	// 	).to.emit(nft, "Transfer")
	// })

	// it("burning a token works", async function () {
	// 	await nft.startSale()
	// 	await expect(
	// 		nft.connect(acc1).acquire(1, { value: web3.utils.toWei("0.07", "ether") })
	// 	).to.emit(nft, "Transfer")

	// 	expect(await nft.balanceOf(acc1.address)).to.equal(1)

	// 	await nft.connect(acc1).burn(1)
	// 	expect(await nft.balanceOf(acc1.address)).to.equal(0)
	// })

	// it("can't burn other tokens than your own", async function () {
	// 	await nft.startSale()
	// 	await expect(
	// 		nft.connect(acc1).acquire(1, { value: web3.utils.toWei("0.07", "ether") })
	// 	).to.emit(nft, "Transfer")
	// 	await expect(
	// 		nft.connect(acc2).acquire(1, { value: web3.utils.toWei("0.07", "ether") })
	// 	).to.emit(nft, "Transfer")

	// 	expect(await nft.balanceOf(acc1.address)).to.equal(1)

	// 	await expect(nft.connect(acc1).burn(2)).to.be.revertedWith(
	// 		"revert caller is not owner nor approved"
	// 	)
	// })

	// it("custom thing emits", async function () {
	// 	await nft.startSale()
	// 	await expect(
	// 		nft.connect(acc1).acquire(1, { value: web3.utils.toWei("0.07", "ether") })
	// 	).to.emit(nft, "Transfer")

	// 	await expect(
	// 		nft.connect(acc1).customThing(1, 100, "hello", { value: web3.utils.toWei("0.1", "ether") })
	// 	).to.emit(nft, "CustomThing")
	// })

	// it("withdraw money works", async function () {
	// 	const tracker = await balance.tracker(owner.address)
	// 	let ownerInitialBalance = Number(await tracker.get("wei"))
	// 	await nft.startSale()
	// 	await expect(
	// 		nft.connect(acc1).acquire(1, { value: web3.utils.toWei("0.07", "ether") })
	// 	).to.emit(nft, "Transfer")

	// 	await nft.withdrawEarnings()

	// 	let ownerFinalBalance = Number(await tracker.get("wei"))
	// 	expect(ownerFinalBalance - ownerInitialBalance).to.be.greaterThan(
	// 		Number(web3.utils.toWei("0.06", "ether")) //some gas costs are lost
	// 	)
	// })

	// it("should transfer accidentally sent ERC20 tokens to this contract", async function () {
	// 	//deploy an erc20 token for
	// 	let ERC20MockContract = await ethers.getContractFactory("ERC20Mock")
	// 	erc20 = await ERC20MockContract.connect(acc1).deploy("ERCToken", "ERC", "10000")
	// 	await erc20.deployed()

	// 	// Transfer some tokens to this contract
	// 	await erc20.connect(acc1).transfer(nft.address, 100)
	// 	expect(await erc20.balanceOf(nft.address)).to.equal(100)

	// 	// get them
	// 	await nft.reclaimERC20(erc20.address)
	// 	expect(await erc20.balanceOf(owner.address)).to.equal(100)
	// })
})
