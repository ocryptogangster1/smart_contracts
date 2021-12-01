<template>
  <v-container>
    <div class="main-block">
      <p class="headline">
        Name <span style="color: #edb91d">Your Gangster</span>
      </p>

      <p class="body-1">free via signatures</p>

      <v-card
        style="text-align: center"
        class="pa-5 ma-5 text-xs-center justify-center"
        elevation="0"
      >
        <div class="search-form__row text-xs-center justify-center">
          <v-form lazy-validation>
            <div>
              <v-text-field
                v-model="tokenID"
                label="Your Token ID"
              ></v-text-field>

              <v-text-field
                v-model="newName"
                label="Desired Name (no spaces, once per day)"
              ></v-text-field>

              <v-btn
                solo
                class="mint-btn"
                @click="
                  errorText = ''
                  nameBtnPressed()
                "
              >
                NAME YOUR OCG
              </v-btn>
            </div>
          </v-form>
        </div>
      </v-card>
    </div>

    <v-dialog v-model="dialogSuccess" class="ma-5 pa-5" max-width="600px">
      <v-card class="success">
        <v-card-title>
          <span>{{ successText }}</span>
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="blue darken-1"
            text
            @click="
              dialogSuccess = false
              successText = ''
            "
          >
            EXIT
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogError" class="ma-5 pa-5" max-width="600px">
      <v-card class="warning">
        <v-card-title>
          <span>{{ errorText }}</span>
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="blue darken-1"
            text
            @click="
              dialogError = false
              errorText = ''
            "
          >
            EXIT
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ethers } from 'ethers'
import { CONTRACT_ADDR, RPC_PROVIDER, NETWORK_ID } from '../constants'
//import { whitelisted } from '../dapp_whitelist'
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
      tokenID: null,
      adoptedCats: null,
      dialogSuccess: false,
      successText: null,
      newName: null,
      tokenID: null,
      contract: null,
      account: null,
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
      isFlashActive: false,
      maxFlashSale: null,
    }
  },
  async mounted() {
    this.id = this.$route.query.id
    this.contractAddress = CONTRACT_ADDR
    this.initialize()
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
    },

    async nameBtnPressed() {
      if (String(this.newName).length < 3) {
        this.errorText = 'minimum 3 characters'
        this.dialogError = true
      }
      if (String(this.newName).length > 15) {
        this.errorText = 'maximum 15 characters'
        this.dialogError = true
      }
      this.changeName()
    },

    async changeName() {
      this.isLoading = true
      console.log('changing name for ' + this.tokenID + ' with ' + this.newName)
      if (!window.ethereum) {
        this.$router.push('/other/install_metamask')
        return
      }
      let accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      try {
        let walletAddress = accounts[0]
        let provider = new ethers.providers.Web3Provider(window.ethereum)
        let signer = provider.getSigner()
        let flatSig = await signer.signMessage(
          'name ' + this.tokenID + ' => ' + this.newName
        )
        await this.changeNamePart2(
          this.tokenID,
          this.newName,
          walletAddress,
          flatSig
        )
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        console.error(error)
        this.$toast.error(error.response.data.error)
      }
    },

    async changeNamePart2(tokenID, newName, wallet, signature) {
      let payload = {
        address: wallet,
        signature: signature,
        name: newName,
        token_id: tokenID,
      }
      this.$axios
        .put('/name', payload)
        .then((response) => {
          console.log(response)
          if (response.status === 200) {
            console.log('nameing successful')
            this.dialogSuccess = true
            this.successText =
              'You changed your shark name. Please refresh the metadata on opensea (and wait couple of hours until it shows)'
          }
          this.isLoading = false
        })
        .catch((error) => {
          const code = parseInt(error.response && error.response.status)
          console.log('Error Code: ', code)
          this.$toast.error(error.response.data.error)
          this.isLoading = false
          this.showDialogVoteUnSuccessful = true
        })
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
.main-block {
  max-width: 960px;
  margin: auto;
  position: relative;
}
.main-block .m-right {
  position: absolute;
  top: 180px;
  right: -220px;
}
.main-block p {
  line-height: 1.6;
  text-align: center;
  font-size: 20px;
  margin: auto;
}
.main-block img {
  margin: 20px auto;
  max-width: 520px;
}

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
  background: #346dac;
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
  color: #346dac !important;
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
  border-left: 4px solid #346dac;
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
  border: 4px dotted #cc0000;
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
  color: #346dac !important;
}

::v-deep .quantity-input {
  max-width: 64px;
  border-left: 1px solid;
  border-radius: 0;
}

::v-deep .v-input__control {
  min-height: 24px !important;
  height: 24px;
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
  font-size: 30px !important;
  right: 0 !important;
}

::v-deep .quantity-input .v-text-field__details {
  display: none !important;
}

::v-deep .quantity-input .v-select__slot input {
  display: none;
}

::v-deep .mint-btn {
  font-size: 20px;
  font-weight: bold;
  height: 64px !important;
  background: transparent !important;
  border: 6px solid #346dac;
  text-transform: capitalize !important;
  border-radius: 0 !important;
  max-width: 342px;
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
    border-top: 4px solid #346dac;
  }

  .main-right-block form {
    margin-left: 0;
  }

  .presale-minting {
    margin-bottom: 300px !important;
  }
}

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
.main-block {
  max-width: 560px;
  margin: auto;
  position: relative;
}
.main-block .m-right {
  position: absolute;
  top: 180px;
  right: -220px;
}
.main-block p {
  line-height: 1.6;
  text-align: center;
  font-size: 20px;
  margin: auto;
}
.main-block img {
  margin: 20px auto;
  max-width: 520px;
}
::v-deep .quantity-input {
  width: 180px;
}
::v-deep .quantity-input .v-input__slot {
  height: 48px;
  margin: auto;
}
::v-deep .quantity-input .v-select__slot .v-select__selection,
::v-deep .quantity-input .qty-amount,
::v-deep .quantity-input select {
  color: #fff !important;
  text-align: center;
  font-size: 16px !important;
  right: 0 !important;
}
::v-deep .quantity-input .v-text-field__details {
  display: none !important;
}
::v-deep .quantity-input .v-select__slot input {
  display: none;
}
::v-deep .mint-btn {
  height: 48px !important;
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
.search-form__row p {
  line-height: 2;
  text-align: center;
  font-size: 20px;
  margin: auto;
}
@media (max-width: 767px) {
  .main-block img {
    width: 100%;
  }
  ::v-deep .quantity-input {
    width: 100%;
  }
  .main-block .m-right {
    position: relative !important;
    margin-top: 20px;
    top: 0;
    right: 0;
  }
}
</style>
