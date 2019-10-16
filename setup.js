'use strict'

const box = () => `
apt-get update
apt-get install -y git vim curl build-essential wget bash-completion screen man libtool \
  autoconf automake python help2man python-setuptools
`
const mininet = () => `
mkdir -p /opt/mininet \
  && git clone git://github.com/mininet/mininet.git /opt/mininet \
  && cd /opt/mininet \
  && git checkout 2.2.2 \
  && make install \
  && apt-get install -y openvswitch-testcontroller openvswitch-common openvswitch-switch \
  && cp /usr/bin/ovs-testcontroller /usr/bin/ovs-controller
`
const node = ({ major } = {}) => `
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | su -c bash ubuntu >> /home/ubuntu/setup-status.txt 2>&1
su -c ". /home/ubuntu/.nvm/nvm.sh && nvm install ${major} && nvm use ${major}" ubuntu >> /home/ubuntu/setup-status.txt 2>&1
`

module.exports = {
  box, mininet, node
}
