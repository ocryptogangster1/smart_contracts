<template>
  <v-container>
    <p> Under construction....</p>

  </v-container>
</template>

<script>
import { ethers } from 'ethers'
import { CONTRACT_ADDR, RPC_PROVIDER, NETWORK_ID } from '../constants'
import { ERC721_ABI } from '../erc721_abi'
const EthersUtils = require('ethers').utils

export default {
  auth: false,
  data() {
    return {
      id: null,
      totalMinted: null,
      amount: 1,
      dialogConfirmation: false,
      catID: null,
      adoptedCats: null,
      tokenID: null,
      contract: null,
      contractAddress: null,
      itemPriceETH: null,
      itemPriceWei: null,
      txHash: null,
      isOwned: false,
      isSaleActive: false,
      isPresaleActive: false,
      isWaitYourTurn: false,
      ethers: null,
      signer: null,
      provider: null,
      errorText: '',
      dialogAdoptMany: false,
      dialogError: false,
      walletAddress: null,
      showRandNFTs: false,
      walletAddress: null,
      maxPresale: null,
      maxSupply: null,
      timerCount: {
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
      },
      countDownDate: new Date('Oct 12, 2021 11:35:00 PM EST').getTime(),
    }
  },
  async mounted() {
    this.id = this.$route.query.id
    this.contractAddress = CONTRACT_ADDR

    this.initialize()

    const timer = setInterval(() => {
      this.timerOperations()
    }, 15000)

    this.$once('hook:beforeDestroy', () => {
      clearInterval(timer)
      this.$recaptcha.destroy()
    })

    try {
      await this.$recaptcha.init()
    } catch (e) {
      console.error(e)
    }
  },
  methods: {
    initialize() {
      this.provider = 'not_web3'
      this.ethers = new ethers.providers.JsonRpcProvider(
        RPC_PROVIDER,
        NETWORK_ID
      )
      this.contract = new ethers.Contract(
        CONTRACT_ADDR,
        ERC721_ABI,
        this.ethers
      )
      this.timerOperations()
      setTimeout(this.timerOperations, 5000) //TODO: move it 15sec
    },
    async timerOperations() {
      console.log('timer operation started')
      this.totalMinted = Number(await this.contract.totalSupply())
      console.log('Total minted = ', this.totalMinted)
      this.isSaleActive = Number(await this.contract.saleLive())
      this.isPresaleActive = Number(await this.contract.presaleLive())
      this.maxPresale = Number(await this.contract.maxPresale())
      this.maxSupply = Number(await this.contract.maxSupply())
      console.log('isSaleActive = ', this.isSaleActive)
      console.log('maxSupply = ', this.maxSupply)
      console.log('isPresaleActive = ', this.isPresaleActive)
      console.log('maxPresale = ', this.maxPresale)
    },
    async publicBuy() {
      try {
        const token = await this.$recaptcha.execute('xlogin')
        let payload = {
          address: this.walletAddress,
          recaptcha_token: token,
        }

        this.$axios
          .post('/publicBuy', payload)
          .then((response) => {
            console.log(response)
            if (response.status === 200) {
              this.publicBuyPart2(payload, response) //+ the response
            }
            this.isLoading = false
          })
          .catch((error) => {
            this.isLoading = false
            const code = parseInt(error.response && error.response.status)
            console.log('Error Code', code)
            console.log('Error ', error.response)

            if (code == 416) {
              this.errorText = error.response.data.error
              this.dialogError = true
              return
            }

            this.errorText =
              'something else went wrong and we are investingating'
            this.dialogError = true
            return
          })
      } catch (error) {
        console.log('Login error:', error)
      }
    },
    async presaleBuyNFT() {
      if (this.isPresaleActive == 0) {
        this.errorText =
          'Presale is not live yet. Join our Discord group for pre-mint whitelist access'
        this.dialogError = true
        return
      }
      if (this.totalMinted >= this.maxPresale) {
        //TODO: update it
        this.errorText = 'Presale - Sold Out'
        this.dialogError = true
        return
      }
      if (Number(this.amount) < 0) {
        this.$toast.error('Invalid amount')
        return
      }
      if (Number(this.amount) > 5) {
        this.$toast.error('maximum 5 NFTs at a time')
        return
      }

      if (!window.ethereum) {
        this.$router.push('/other/install_metamask')
        return
      }

      let payload = {
        address: this.walletAddress,
        quantity: Number(this.amount),
        recaptcha_token: 'xxxxx',
      }

      this.$axios
        .post('/presaleBuy', payload)
        .then((response) => {
          console.log(response)
          if (response.status === 200) {
            console.log('got ok from the backend')
            this.presaleBuyPart2(payload, response) //+ the response
          }
          this.isLoading = false
        })
        .catch((error) => {
          this.isLoading = false
          const code = parseInt(error.response && error.response.status)
          console.log('Error Code', code)
          console.log('Error ', error.response)

          if (code == 416) {
            this.errorText = error.response.data.error
            this.dialogError = true
            return
          }

          this.errorText =
            'you are either not whitelisted or something else went wrong'
          this.dialogError = true
          return
        })
    },
    async publicBuyPart2(payload, response) {
      console.log('payload ', payload)
      console.log('response ', response)
      this.txHash = null

      this.ethers = new ethers.providers.Web3Provider(window.ethereum, 'any')
      await this.ethers.send('eth_requestAccounts', [])

      this.signer = this.ethers.getSigner()
      this.contract = new ethers.Contract(
        CONTRACT_ADDR,
        ERC721_ABI,
        this.signer
      )

      this.amount = 1 //limit to 1 nft

      try {
        const gasLimit = this.amount * 300000
        this.itemPriceWei = Number(70000000000000000)

        const overrides = {
          value: String(Number(this.amount) * Number(this.itemPriceWei)),
          gasLimit: gasLimit,
        }
        //function publicBuy(
        // 	bytes32 hash,
        // 	bytes memory sig,
        // 	string memory nonce
        // ) external payable nonReentrant {
        const tx = await this.contract.publicBuy(
          response.data.hash,
          response.data.signature,
          response.data.nonce,
          overrides
        )
        if (tx.hash) {
          this.$toast.info('transaction submitted successfully')
        }
        this.txHash = tx.hash
      } catch (err) {
        if (err.message.includes('denied')) {
          this.$toast.info('you canceled the transaction')
        } else {
          this.$toast.error(err.message)
        }
      }
    },

    async checkMetamaskConnected() {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          'any'
        )
        // Prompt user for account connections
        await provider.send('eth_requestAccounts', [])

        this.signer = this.ethers.getSigner()
        this.account = await this.signer.getAddress()
        this.balance = await this.signer.getBalance()
        this.ethBalance = await ethers.utils.formatEther(this.balance)
        this.signer = this.ethers.getSigner()
        this.walletAddress = await this.signer.getAddress()
        this.walletBtnText =
          this.walletAddress.substr(0, 7) +
          '...' +
          this.walletAddress.substr(
            this.walletAddress.length - 5,
            this.walletAddress.length
          )

        const chainId = this.ethers._network.chainId
        this.$store.commit('setSelectedAddress', this.walletAddress)
        this.$store.commit('setNetworkID', Number(chainId))

        if (chainId !== 1) {
          this.showNonMainnetWarning = true
        }
        return true
      } else {
        this.$router.push('/other/install_metamask')
        return false
      }
    },
    viewOnOpenSea() {
      const url =
        'https://opensea.io/assets/' + this.contractAddress + '/' + this.id
      window.open(url, '_blank')
    },
    format(number) {
      if (number < 10) return '0' + number
      return number
    },
  },
  watch: {
    timerCount: {
      handler(value) {
        setTimeout(() => {
          let now = new Date().getTime()

          // Find the distance between now and the count down date
          let distance = this.countDownDate - now

          // Time calculations for days, hours, minutes and seconds
          let days = this.format(Math.floor(distance / (1000 * 60 * 60 * 24)))
          let hours = this.format(
            Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          )
          let minutes = this.format(
            Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          )
          let seconds = this.format(Math.floor((distance % (1000 * 60)) / 1000))
          this.timerCount = {
            days,
            hours,
            minutes,
            seconds,
          }
        }, 1000)
      },
      immediate: true, // This ensures the watcher is triggered upon creation
    },
  },
}
</script>

<style lang="scss" scoped>
.container {
  max-width: 1500px;
}
.black-text {
  color: black i !important;
}

.theme--dark.v-input input,
.theme--dark.v-input textarea {
  color: #ea700c;
}

.glow {
  -webkit-text-stroke: 1px #9fd8a3;
  text-shadow: 0 0 15px rgb(137 246 143 / 77%), 0 0 10px transparent;
  -webkit-text-fill-color: transparent;
}
.centered-input input {
  text-align: center;
}

.container div {
  z-index: 1;
}

.banner {
  display: flex;
}

.banner h2 {
  font-size: 48px;
  font-family: Poppins-ExtraBold;
  padding: 18px 45px;
  background: #8ae8d6;
  color: #000000;
  text-align: center;
  margin-left: auto;
  width: 100%;
}

.timer {
  display: flex;
  padding: 35px 45px;
  margin-left: 37%;
  line-height: 1.15;
}

.timer div {
  font-family: Poppins-ExtraBold !important;
  font-size: 50px !important;
  text-align: right;
}

.timer span {
  font-size: 51px !important;
  color: #8ae8d6 !important;
  font-family: Poppins-ExtraBold !important;
  padding: 0 6px;
  line-height: 1;
}

.timer p {
  font-size: 10px !important;
  font-family: Poppins-ExtraBold !important;
  text-align: center;
  margin: auto;
}

.main-right-block {
  padding-left: 30px;
}

.main-right-block > div {
  display: flex;
  margin-bottom: 40px;
  line-height: 1.2;
}

.main-right-block h3 {
  font-size: 34px;
  font-family: Poppins-Bold;
  width: 185px;
  min-width: 185px;
  text-align: right;
  word-break: break-word;
}

.main-right-block ul {
  margin-left: 25px;
  padding-left: 25px;
  border-left: 4px solid #8ae8d6;
}

.main-right-block ul li {
  margin-bottom: 25px;
}

.main-right-block form {
  margin-left: 25px;
  width: 100%;
}

.sel-btn {
  display: flex;
  justify-content: space-between;
  border: 4px solid #8ae8d6;
  padding: 10px 16px;
  align-items: center;
  max-width: 242px;
  width: 100%;
  margin-right: 20px;
}

.sel-btn p {
  font-size: 17px;
  margin-bottom: 0;
}

::v-deep .v-icon {
  color: #8ae8d6 !important;
}

::v-deep .quantity-input {
  max-width: 64px;
  border-left: 1px solid;
  border-radius: 0;
}

::v-deep .v-input__control {
  min-height: 16px !important;
  height: 16px;
}

::v-deep .quantity-input .v-input__slot {
  padding-right: 0px !important;
  margin: auto;
  background: transparent !important;
  box-shadow: none !important;
}

::v-deep .quantity-input .v-select__slot .v-select__selection,
::v-deep .quantity-input .qty-amount,
::v-deep .quantity-input select {
  color: #fff !important;
  text-align: center;
  font-size: 18px !important;
  right: 0 !important;
}

::v-deep .quantity-input .v-text-field__details {
  display: none !important;
}

::v-deep .quantity-input .v-select__slot input {
  display: none;
}

::v-deep .mint-btn {
  font-size: 18px;
  font-weight: bold;
  height: 64px !important;
  background: transparent !important;
  border: 6px solid #8ae8d6;
  text-transform: capitalize !important;
  border-radius: 0 !important;
  max-width: 242px;
  width: 100%;
  margin-top: 30px;
}

::v-deep .mint-btn .v-btn__content {
  color: #fff !important;
}

::v-deep .mint-btn {
  will-change: transform;
  transition: transform 250ms;
}

::v-deep .mint-btn:hover {
  transform: translateY(-3px);
}

::v-deep .mint-btn:active {
  transform: translateY(0px);
}

@media (max-width: 1200px) {
  .timer {
    margin-left: 15%;
  }
}

@media (max-width: 767px) {
  .banner h2 {
    font-size: 35px;
    margin: auto;
  }

  .timer {
    text-align: center;
    margin-left: 10%;
  }

  .col {
    padding: 0 !important;
  }

  .main-right-block {
    display: flex;
    flex-direction: column-reverse;
  }

  .main-right-block > div {
    flex-direction: column;
    padding-left: 40px;
    padding-right: 40px;
  }

  .main-right-block h3 {
    width: 100%;
    text-align: left;
  }

  .main-right-block ul {
    margin-left: 0;
    padding-left: 0px;
    padding-top: 25px;
    margin-top: 25px;
    border-left: none;
    border-top: 4px solid #8ae8d6;
  }

  .main-right-block form {
    margin-left: 0;
  }

  .presale-minting {
    margin-bottom: 300px !important;
  }
}
</style>
