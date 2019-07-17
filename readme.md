
# ubuntu-dev-ec2

Ubuntu EC2 Machine intended for development/profiling usage.

Ships with Mininet, Node.js and a few other deps. See [setup.js](https://github.com/davidmarkclements/ubuntu-dev-ec2/blob/master/setup.js) for more info.

The EC2 equivalent of [ubuntu-dev-container](https://github.com/mafintosh/ubuntu-dev-container).

```sh
ude -c config
```

## Install

```sh
npm i -g ubuntu-dev-ec2
```

## AWS Setup

* setup AccessKeyId and SecretKey
  * go to IAM 
    * setup root access keys
    * OR setup access keys for an IAM user
* setup a KeyPair (this is the name of the pem file)
* setup a Security Group that allows SSH
  * If this is named "allow-ssh" there is no need to 
    supply a security group name

## Config

Config files are ini files, and should have the following at a minimum:

```ini
AWSAccessKeyId = YOUR_KEY_ID # setup in IAM
AWSSecretKey = YOUR_KEY # setup in IAM
AWSKeyPair = YOUR_KEY_PAIR #usually same name as an aws pem file
```

Config files can also have the following:

```ini
AWSSecurityGroup = allow-ssh # default
node = 8 # default
type = t2.micro # default
region = eu-central-1 # default
image = ami-009c174642dba28e4 # default
```

## Usage

```sh
ude --help
```

```
 
 ubuntu-dev-ec2

  ude -c /path/to/config

  -c | --cfg | --config     Path to a config ini file, should contain at least:
                              AWSAccessKeyId
                              AWSSecretKey
                              AWSKeyPair
                              AWSSecurityGroup (overrides --sg flag)
                            
                            Config file can also override type, region, image and node

  -n | --node               Version of Node.js to install, default: "8"
                            Can specify up to patch version number if required.

  --type | -t               Instance type, default: t2.micro

  --region | -r             AWS Region, default: eu-central-1

  --image | -i              AMI to create instance from, default: ami-009c174642dba28e4
                            (ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20190627.1)

  --sg                      Security group, defaults to 'allow-ssh' which must
                            be manually created in order to work

  --dry | -d                Dry run instance creation

  --help | -h               Output usage

```

## Lifecycle

* The instance is created
* `ude` polls AWS until the Instance status is set to running
* SSH command is then provided which can be used to connect
  * still may take up to a minute before the SSH port is open
* setup scripts will be running on the box
  * you can ssh onto the box and `tail -f setup-status.txt` in the home folder
    once this file has a final line "setup complete" the box is fully usable

## Important Notes

### Node Installation 

If you've logged into the box before the setup scripts have completed then you may need to run `. ~/.bashrc` to access the `node` (and `nvm`) executable. Or you can just log out and log back in.

### Generated SSH Command

The generated SSH command is the same as created when clicking `connect` from the popup menu on an instance on the AWS EC2 control panel. It assumes your pem file is named after your key pair and that it's in the current working directoy. If it isn't you need to adapt this part of the command accordingly.

### Starting/Stopping/Terminating Instances

`ude` is primarily for quickly spinner up a development instance and does not provide functionality to terminate/stop/start instances, use the AWS control panel for this. 

## License

MIT