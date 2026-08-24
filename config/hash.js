'use strict'

const { hashConfig } = require('@adonisjs/hash/build/config')

module.exports = hashConfig({
  default: 'bcrypt',

  list: {
    bcrypt: {
      driver: 'bcrypt',
      rounds: 10,
      version: 0x62,
    },
  },
})
