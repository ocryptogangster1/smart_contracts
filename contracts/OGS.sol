// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract OCG is ERC721Enumerable, Ownable {
	using Strings for uint256;

	string private _baseTokenURI = "https://api.ocg.city/metadata/";
	string private _contractURI = "ipfs://QmYJeKfeHY57kGg5JHAKq2piEGyk974V4tydzbvBwsHQzf";

	uint256 public maxSupply = 5555;
	uint256 public maxPresale = 3333;

	uint256 public pricePerTokenPresale = 50000000000000000; //0.05 ETH
	uint256 public pricePerToken = 70000000000000000; //0.07 ETH

	bool public saleLive = false;
	bool public presaleLive = false;
	bool public locked; //metadata lock
	address private devWallet;
	string private ipfsProof;

	mapping(address => uint256) whitelist;

	//should be handled only by highly trained personnel
	modifier onlyDev() {
		require(msg.sender == devWallet, "only dev can modify");
		_;
	}

	constructor() ERC721("OCG", "OCG") {
		devWallet = msg.sender;
	}

	function presaleBuy(uint256 qty) external payable {
		require(presaleLive, "not live - presale");
		require(isWhitelisted(msg.sender), "not whitelisted");
		require(qty <= 5, "no more than 5");
		require(totalSupply() + qty <= maxPresale, "presale out of stock");
		require(pricePerTokenPresale * qty == msg.value, "exact amount needed");
		for (uint256 i = 0; i < qty; i++) {
			_safeMint(msg.sender, totalSupply() + 1);
		}
	}

	function publicBuy(uint256 qty) external payable {
		require(saleLive, "not live");
		require(qty <= 20, "no more than 20");
		require(totalSupply() + qty <= maxSupply, "public sale out of stock");
		require(pricePerToken * qty == msg.value, "exact amount needed");
		for (uint256 i = 0; i < qty; i++) {
			_safeMint(msg.sender, totalSupply() + 1);
		}
	}

	// admin can mint them for giveaways, airdrops etc
	function adminMint(uint256 qty, address to) public onlyOwner {
		require(qty > 0, "minimum 1 token");
		require(qty <= 20, "no more than 20");
		require(totalSupply() + qty <= maxSupply, "out of stock");
		for (uint256 i = 0; i < qty; i++) {
			_safeMint(to, totalSupply() + 1);
		}
	}

	//----------------------------------
	//----------- other code -----------
	//----------------------------------
	function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
		uint256 tokenCount = balanceOf(_owner);
		if (tokenCount == 0) {
			return new uint256[](0);
		} else {
			uint256[] memory result = new uint256[](tokenCount);
			uint256 index;
			for (index = 0; index < tokenCount; index++) {
				result[index] = tokenOfOwnerByIndex(_owner, index);
			}
			return result;
		}
	}

	function burn(uint256 tokenId) public virtual {
		require(_isApprovedOrOwner(_msgSender(), tokenId), "caller is not owner nor approved");
		_burn(tokenId);
	}

	function exists(uint256 _tokenId) external view returns (bool) {
		return _exists(_tokenId);
	}

	function isApprovedOrOwner(address _spender, uint256 _tokenId) external view returns (bool) {
		return _isApprovedOrOwner(_spender, _tokenId);
	}

	function tokenURI(uint256 _tokenId) public view override returns (string memory) {
		require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");
		return string(abi.encodePacked(_baseTokenURI, _tokenId.toString(), ".json"));
	}

	function setBaseURI(string memory newBaseURI) public onlyDev {
		require(!locked, "locked functions");
		_baseTokenURI = newBaseURI;
	}

	function setContractURI(string memory newuri) public onlyDev {
		require(!locked, "locked functions");
		_contractURI = newuri;
	}

	function contractURI() public view returns (string memory) {
		return _contractURI;
	}

	// earnings withdrawal
	function withdrawEarnings() public onlyOwner {
		payable(msg.sender).transfer(address(this).balance);
	}

	function reclaimERC20(IERC20 erc20Token) public onlyOwner {
		erc20Token.transfer(msg.sender, erc20Token.balanceOf(address(this)));
	}

	function togglePresaleStatus() external onlyOwner {
		presaleLive = !presaleLive;
	}

	function togglePublicSaleStatus() external onlyOwner {
		saleLive = !saleLive;
	}

	function changePricePresale(uint256 newPrice) external onlyOwner {
		pricePerTokenPresale = newPrice;
	}

	function changePricePublicSale(uint256 newPrice) external onlyOwner {
		pricePerToken = newPrice;
	}

	function changeMaxPresale(uint256 _newMaxPresale) external onlyOwner {
		maxPresale = _newMaxPresale;
	}

	function setProvenance(string memory _ipfsProvenance) external onlyDev {
		bytes memory tempEmptyStringTest = bytes(ipfsProof);
		require(tempEmptyStringTest.length == 0, "ipfsProof already set");
		ipfsProof = _ipfsProvenance;
	}

	function decreaseMaxSupply(uint256 newMaxSupply) external onlyOwner {
		require(newMaxSupply < maxSupply, "you can only decrease it");
		maxSupply = newMaxSupply;
	}

	// and for the eternity!
	function lockMetadata() external onlyOwner {
		locked = true;
	}

	function batchAddToWhitelist(address[] memory addresses) external onlyOwner {
		require(addresses.length <= 50, "max 50 addresses");
		for (uint256 i = 0; i < addresses.length; i++) {
			whitelist[addresses[i]] = 1;
		}
	}

	function whitelistRemove(address _address) public onlyOwner {
		whitelist[_address] = 1;
	}

	function isWhitelisted(address _address) public view returns (bool) {
		if (whitelist[_address] == 1) {
			return true;
		}
		return false;
	}

	function reclaimERC721(IERC721 erc721Token, uint256 id) public onlyOwner {
		erc721Token.safeTransferFrom(address(this), msg.sender, id);
	}

	function reclaimERC1155(IERC1155 erc1155Token, uint256 id) public onlyOwner {
		erc1155Token.safeTransferFrom(address(this), msg.sender, id, 1, "");
	}
}
