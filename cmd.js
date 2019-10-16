#!/usr/bin/env node
'use strict'
const { join } = require('path')
const { createReadStream } = require('fs')
const { finished } = require('stream')
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    cfg: ['c', 'config'],
    node: 'n',
    region: 'r',
    type: 't',
    image: ['i', 'img'],
    sg: 'security-group',
    dry: 'd',
    help: 'h'
  }
})
const launcher = require('.')

if (argv._.length === 0) argv._.push('start')

if (module.parent === null) {
  run().catch((err) => {
    console.error(`\n ⛔ Command failed: ${err.message} ⛔`)
    usage(1)
  })
} else {
  module.exports = run
}

async function run (launch = launcher, help = usage, output = write) {
  const [ cmd ] = argv._

  if (argv.help) {
    help()
    return
  }  

  if (cmd !== 'start') {
    throw Error(`Unrecognized command ${cmd}`)
  }
  await output(launch(argv))
}

async function write (results) {
  for await (const output of results) {
    process.stdout.write(output)
  }
}

function usage (code = 0) {
  const help = createReadStream(join(__dirname, 'usage.txt'))
  help.pipe(process.stdout)
  finished(help, (err) => {
    if (err) {
      console.error(err)
      code = 1
    }
    process.exit(code)
  })
}
