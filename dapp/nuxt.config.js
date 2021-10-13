export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  //Enabled Vue-Dev Tools to better understand the data
  // vue: {
  //   config: {
  //     productionTip: false,
  //     devtools: true,
  //   },
  // },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: 'Crypto Gangsters NFT',
    title: 'Crypto Gangsters NFT',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content:
          'Crypto Gangsters',
      },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Poppins&display=swap',
      },
    ],
  },

  loading: { color: '#FFF' },
  /*
   ** Global CSS
   */
  css: ['@/assets/css/global.scss'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    '@nuxtjs/toast',
    '@nuxtjs/recaptcha',
  ],

  recaptcha: {
    hideBadge: false, // Hide badge element (v3 & v2 via size=invisible)
    language: 'en', // Recaptcha language (v2)
    siteKey: 'xxxxxxxxx', // Site key for requests
    version: 3, // Version
    size: 'normal', // Size: 'compact', 'normal', 'invisible' (v2)
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    debug: process.env.NODE_ENV !== 'production',
    baseURL: 'https://api.ocg.city',
    retries: 3,
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en',
    },
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    optionsPath: './vuetify.options.js',
  },
  toast: {
    position: 'top-center',
    duration: 4000,
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
  generate: {
    fallback: true,
  },
}
