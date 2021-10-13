// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract OGS is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using ECDSA for bytes32;

    string private _baseTokenURI = "https://api.ocg.city/metadata/";
    string private _contractURI = "ipfs://.......";

    //this points to the initial IPFS provenance hashes
    string private ipfsProvenance;

    uint256 public maxSupply = 9999;
    uint256 public maxPresale = 8000;

    uint256 public pricePerToken = 70000000000000000; //0.07 ETH
    uint256 public pricePerTokenPresale = 60000000000000000; //0.06 ETH

    bool public saleLive = false;
    bool public presaleLive = false;
    bool public locked;

    constructor() ERC721("OCG", "OCG") {}

    function publicBuy(uint256 qty) external payable {
        require(saleLive, "not live");
        require(qty <= 15, "no more than 15");
        require(totalSupply() + qty <= maxSupply, "out of stock");
        require(pricePerToken * qty == msg.value, "exact amount needed");
        for (uint256 i = 0; i < qty; i++) {
            _safeMint(msg.sender, totalSupply() + 1);
        }
    }

    function preSaleBuy(uint256 qty) external payable {
        require(presaleLive, "not live - presale");
        require(qty <= 15, "no more than 15");
        require(totalSupply() + qty <= maxPresale, "out of stock");
        require(pricePerTokenPresale * qty == msg.value, "exact amount needed");
        for (uint256 i = 0; i < qty; i++) {
            _safeMint(msg.sender, totalSupply() + 1);
        }
    }

    // admin can mint them for giveaways, airdrops etc
    function adminMint(uint256 qty, address to) public onlyOwner {
        require(qty > 0, "minimum 1 token");
        require(totalSupply() + qty <= maxSupply, "out of stock");
        for (uint256 i = 0; i < qty; i++) {
            _safeMint(to, totalSupply() + 1);
        }
    }

    //----------------------------------
    //----------- other code -----------
    //----------------------------------
    function tokensOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
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
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not owner nor approved"
        );
        _burn(tokenId);
    }

    function exists(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }

    function isApprovedOrOwner(address _spender, uint256 _tokenId)
        external
        view
        returns (bool)
    {
        return _isApprovedOrOwner(_spender, _tokenId);
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return
            string(
                abi.encodePacked(_baseTokenURI, _tokenId.toString(), ".json")
            );
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        require(!locked, "locked functions");
        _baseTokenURI = newBaseURI;
    }

    function setContractURI(string memory newuri) public onlyOwner {
        require(!locked, "locked functions");
        _contractURI = newuri;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function withdrawEarnings() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function reclaimERC20(IERC20 erc20Token) public onlyOwner {
        erc20Token.transfer(msg.sender, erc20Token.balanceOf(address(this)));
    }

    function togglePresaleStatus() external onlyOwner {
        presaleLive = !presaleLive;
    }

    function changePrice(uint256 newPrice) external onlyOwner {
        pricePerToken = newPrice;
    }

    function changePricePresale(uint256 newPrice) external onlyOwner {
        pricePerTokenPresale = newPrice;
    }

    function changeMaxPresale(uint256 _newMaxPresale) external onlyOwner {
        maxPresale = _newMaxPresale;
    }

    function setIPFSProvenance(string memory _ipfsProvenance)
        external
        onlyOwner
    {
        bytes memory tempEmptyStringTest = bytes(ipfsProvenance);
        require(tempEmptyStringTest.length == 0, "ipfs provenance already set");
        ipfsProvenance = _ipfsProvenance;
    }

    function decreaseMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply < maxSupply, "you can only decrease it");
        maxSupply = newMaxSupply;
    }

    // and for the eternity....
    function lockMetadata() external onlyOwner {
        locked = true;
    }
}
