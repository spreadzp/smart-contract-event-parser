const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const abiContract = require('./build/contracts/abi.json');
const contractInfo = require('./env.json');
console.log("🚀 ~ file: parser.js ~ line 5 ~ contractInfo", contractInfo)
const web3 = new Web3('https://mainnet.infura.io/v3/' + contractInfo.INFURA_KEY);


const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'path/to/file.csv',
    header: [
        { id: 'user', title: 'Staker' },
        { id: 'stakedAmount', title: 'StakedAmount' },
        { id: 'currentBalance', title: 'CurrentBalance' }
    ],
    path: './stakers.csv'
});
const stakedUsers = [];


function wrireToCsvFile(stakersWithBalance) {
    csvWriter.writeRecords(stakersWithBalance)       // returns a promise
        .then(() => {
            console.log('...Done');
        });
}

function eventQuery() {
    const CONTRACT_ABI = abiContract;
    const contract = new web3.eth.Contract(CONTRACT_ABI, contractInfo.CONTRACT_ADDRESS);
    const START_BLOCK = 7700000;
    const END_BLOCK = 'latest';

    contract.getPastEvents("allEvents",
        {
            fromBlock: START_BLOCK,
            toBlock: END_BLOCK // You can also specify 'latest'
        })
        .then(events => {

            events.map(event => {
                if (event.event === 'Staked' && event.returnValues.user !== '0xdc945cb021e53e15ce59466ac588a590d2a624f0') {
                    // console.log(event.returnValues);
                    stakedUsers.push({ user: event.returnValues.user, stakedAmount: event.returnValues.amount, currentBalance: 0 })

                }
            }
            )
            const uniqueObjects = [...new Map(stakedUsers.map(item => [item.user, item])).values()]
            console.log("🚀 ~ file: parser.js ~ line 50 ~ eventQuery ~ uniqueObjects", uniqueObjects.length)
            // пофиксить  подсчитать балансы адресов из balanceOf
            return uniqueObjects;
        })
        .then(async (stakers) => {
            console.log('stakers[0].user :>> ', stakers[0].user);

            const balances = await getBalance(contract, stakers);
            return balances;
        })
       .then(balances => {
            let totalBalance = new BigNumber(0);

            balances.map(item => {
                totalBalance = totalBalance.plus(new BigNumber(item.currentBalance));
            })
            console.log("🚀 ~ file: parser.js ~ line 63 ~ eventQuery ~ totalBalance", totalBalance.toString())
            console.log('users.length :>> ', balances.length);
            return balances;
        })
        .then(balances => {
            wrireToCsvFile(balances);
        })

        .catch((err) => { console.error(err) })
        .finally(() => {

        });
}

const getBalance = async (contract, array) => {
    const users = []
    for (const instance of array) {
        await sleep(50)
        contract.methods.balanceOf(instance.user).call()
            .then(balance => {
                if (balance != 0)
                    users.push({ user: instance.user, stakedAmount: instance.stakedAmount, currentBalance: balance });

            })

            .catch(err => {
                console.log('!!!!!!!!!!!!err :>> ', err);
            })
    }
    return users;
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

eventQuery();
