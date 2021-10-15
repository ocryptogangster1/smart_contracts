<template>
  <v-layout align-center justify-center class="metamask-info-template">
    <v-flex xs12 sm8 md6 class="metamask-info-template__row">
      <v-card color="primary" class="metamask-info-template__card">
        <v-card-title class="headline white--text quick-font-fix-for-mobile"
          >Metamask is needed to run this dapp</v-card-title
        >
        <v-card-text>
          <br /><br />
          MetaMask is a web extension, which allows you to manage your Ethereum
          private keys via your web browser. <br />
          <br />
        </v-card-text>

        <v-card-text>
          <br />Visit
          <a target="_blank" href="https://metamask.io/"
            >https://metamask.io/</a
          >
          <br />
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>
<script>
export default {
  auth: false,
  data: () => ({
    variable: null,
  }),
  mounted() {},
}
</script>

<style>
.v-card__title.quick-font-fix-for-mobile {
  font-size: 13px;
}
</style>
