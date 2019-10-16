
'use strict'
const { promisify } = require('util')
const { parse } = require('ini')
const aws = require('aws-sdk')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const sleep = promisify(setTimeout)
const baseSetup = require('./setup')

module.exports = launcher

async function * launcher (opts) {
  let { cfg, setup = {} } = opts
  if (!cfg) {
    throw Error('config is required')
  }
  if (typeof cfg === 'string') {
    cfg = parse(await readFile(cfg, 'utf8'))
  }

  const { AWSAccessKeyId, AWSSecretKey, AWSKeyPair } = cfg

  if (!AWSAccessKeyId || !AWSSecretKey || !AWSKeyPair) {
    throw Error('aws keys required')
  }

  const {
    node = '8',
    region = cfg.region || 'eu-central-1',
    type = cfg.type || 't2.micro', // 'm5.4xlarge',
    image = cfg.image || 'ami-009c174642dba28e4', // ubuntu 18.0.4 on eu-central-1 (frankfurt)
    sg = cfg.AWSSecurityGroup || 'allow-ssh',
    dry = false
  } = opts

  aws.config.update({
    accessKeyId: AWSAccessKeyId,
    secretAccessKey: AWSSecretKey,
    region
  })

  const userScripts = Object.keys(setup).map((k) => {
    return '\n' + setup[k]() + `\necho -e "\nsetting up ${k}" >> /home/ubuntu/setup-status.txt`
  }).join('')

  const scripts = Buffer.from(
    '#!/bin/bash\n' +
    '\necho "setting up box" >> /home/ubuntu/setup-status.txt' +
    baseSetup.box() +
    '\necho -e "\nsetting up mininet" >> /home/ubuntu/setup-status.txt' +
    baseSetup.mininet() +
    '\necho -e "\nsetting up node" >> /home/ubuntu/setup-status.txt' +
    baseSetup.node({ major: node }) +
    userScripts +
    '\necho -e "\nsetup complete" >> /home/ubuntu/setup-status.txt'
  ).toString('base64')

  const ec2 = new aws.EC2({ apiVersion: '2016-11-15', region })
  const params = {
    ImageId: image,
    InstanceType: type,
    DryRun: dry,
    MinCount: 1,
    MaxCount: 1,
    KeyName: AWSKeyPair,
    SecurityGroups: [sg],
    UserData: scripts
  }

  try {
    const data = await ec2.runInstances(params).promise()
    const { Instances } = data
    const [ info ] = Instances
    yield 'EC2 Instance creation successful\n\n'
    yield `ImageId: ${info.ImageId}\n`
    yield `InstanceId: ${info.InstanceId}\n`
    yield `InstanceType: ${info.InstanceType}\n`
    yield `KeyName: ${info.KeyName}\n`
    yield `LaunchTime: ${info.LaunchTime}\n\n`
    yield 'Waiting for Instance to initialize\n'
    yield * check(data, { AWSKeyPair, ec2 })
  } catch (err) {
    if (err.code === 'DryRunOperation') {
      yield `\n  ${err.message}\n\n`
    } else throw err
  }
}

async function * check ({ ReservationId, Instances }, { AWSKeyPair, ec2, lastCode }) {
  const [ info ] = Instances
  const { PublicDnsName, State } = info
  if (State.Code !== 16) {
    const { Reservations } = await ec2.describeInstances({}).promise()
    const { Instances } = Reservations.find((r) => r.ReservationId === ReservationId)
    if (lastCode !== State.Code) yield '\nStatus: ' + State.Name + '\n'
    yield '.' // progress dot
    await sleep(200)
    yield * check({ ReservationId, Instances }, { AWSKeyPair, ec2, lastCode: State.Code })
  } else {
    yield '\nStatus: ' + State.Name + '\n'
    yield `\n\nssh -i "${AWSKeyPair}.pem" ubuntu@${PublicDnsName}\n\n`
  }
}
