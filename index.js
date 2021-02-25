require("dotenv").config()

var express = require("express");
var app = express();

const path = require("path");
const router = express.Router();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

router.get("/createsafe/:squad/:consensus", (req, res) => {
    let signers = req.query.signers;
    res.render("createsafe", {squad: req.params.squad, consensus: req.params.consensus, signers: signers});
});

router.get('/createsafe.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/createsafe.js'));
});

router.get('/web3.min.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/web3.min.js'));
});
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());

router.post("/safetx", async (req, res) => {
        try {
            let tx = req.body.value.tx;
            let squadname = req.body.value.squad;
            guilds.forEach(curGuild => {
                curGuild.channels.cache.forEach(function (value, key) {
                        if (value.name == squadname) {
                            let squad = squadNameToSquadsMap.get(value.name);
                            squad.tx = tx;
                            if (process.env.REDIS_URL) {
                                redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                                });
                            }
                            value.send("Listening to safe creation tx with hash: `" + tx + "`");
                        }
                    }
                );
            })
        } catch (e) {
            console.log(e);
        }
    }
);
app.use("/", router);

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port " + (process.env.PORT || 3000));
});

function getNumberLabel(labelValue) {

    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+9

        ? Math.round(Math.abs(Number(labelValue)) / 1.0e+9) + "B"
        // Six Zeroes for Millions
        : Math.abs(Number(labelValue)) >= 1.0e+6

            ? Math.round(Math.abs(Number(labelValue)) / 1.0e+6) + "M"
            // Three Zeroes for Thousands
            : Math.abs(Number(labelValue)) >= 1.0e+3

                ? Math.round(Math.abs(Number(labelValue)) / 1.0e+3) + "K"

                : Math.abs(Number(labelValue));

}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


const Discord = require("discord.js")
const client = new Discord.Client();

const replaceString = require('replace-string');
const https = require('https');
const http = require('http');
const redis = require("redis");
let redisClient = null;

var fs = require('fs');

var usersToWalletsMap = new Map();
var squadNameToSquadsMap = new Map();

const Squad = class {
    name;
    members = [];
    consensus;
    safe;
    tx;
};

let sentWarningMessagesMap = new Map();

console.log("Redis URL:" + process.env.REDIS_URL);

if (process.env.REDIS_URL) {
    redisClient = redis.createClient(process.env.REDIS_URL);
    redisClient.on("error", function (error) {
        console.error(error);
    });

    redisClient.get("usersToWalletsMap", function (err, obj) {
        usersToWalletsMapRaw = obj;
        console.log("usersToWalletsMapRaw:" + usersToWalletsMapRaw);
        if (usersToWalletsMapRaw) {
            usersToWalletsMap = new Map(JSON.parse(usersToWalletsMapRaw));
            console.log("usersToWalletsMap:" + usersToWalletsMap);
        }
    });

    redisClient.get("squadNameToSquadsMap", function (err, obj) {
        squadNameToSquadsMapRaw = obj;
        console.log("squadNameToSquadsMapRaw:" + squadNameToSquadsMapRaw);
        if (squadNameToSquadsMapRaw) {
            squadNameToSquadsMap = new Map(JSON.parse(squadNameToSquadsMapRaw));
            console.log("squadNameToSquadsMap:" + squadNameToSquadsMap);
        }
    });

    redisClient.get("sentWarningMessagesMap", function (err, obj) {
        sentWarningMessagesMapRaw = obj;
        console.log("sentWarningMessagesMapRaw:" + sentWarningMessagesMapRaw);
        if (sentWarningMessagesMapRaw) {
            sentWarningMessagesMap = new Map(JSON.parse(sentWarningMessagesMapRaw));
            console.log("sentWarningMessagesMap:" + sentWarningMessagesMap);
        }
    });

}

let guilds = [];

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // checkMessages();
    client.guilds.cache.forEach(function (value, key) {
        guilds.push(value);
    });
})

setInterval(function () {
    let tempGuilds = [];
    client.guilds.cache.forEach(function (value, key) {
        tempGuilds.push(value);
    });
    guild = tempGuilds;
}, 1000 * 60 * 5);

client.on("message", msg => {
        if (!(msg.channel.type == "dm")) {
            if (msg.content.toLowerCase().trim().startsWith("!createsquad")) {

                const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!createsquad".length).split(' ');
                args.shift();
                const squadName = args.shift().trim();

                var exists = false;
                msg.channel.guild.roles.cache.forEach(function (value, key) {
                        if (value.name == squadName) {
                            exists = true;
                        }
                    }
                );

                if (exists) {
                    msg.channel.send("Squad already exists, please choose a different squad name.");
                    return;
                }

                let squad = new Squad();
                squad.name = squadName;
                squad.consensus = 1;
                squad.members = [];
                squad.members.push(msg.author.id);
                squadNameToSquadsMap.set(squadName, squad);
                if (process.env.REDIS_URL) {
                    redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                    });
                }

                var found = false;
                var parentChannel = null;
                msg.channel.guild.channels.cache.forEach(function (value, key) {
                        if (value.name == "squads") {
                            parentChannel = value;
                            found = true;
                        }
                    }
                );
                if (!found) {
                    msg.channel.guild.channels.create("squads", {
                        type: 'category'
                    }).then(function (c) {
                        msg.channel.guild.channels.create(squadName, {
                            reason: "create a new squad",
                            parent: c
                        })
                            .then(function (cnew) {
                                cnew.send("Welcome to your squad channel. You can add members to your squad with *!addMember @username*.")
                                msg.channel.send("Your new squad channel has been initialized. Here is a link to it <#" + cnew.id + ">");
                                msg.channel.guild.roles.create({
                                    data: {
                                        name: squadName,
                                        color: 'RANDOM',
                                    }, reason: "New Squad Role"
                                }).then(function (role) {
                                    msg.channel.guild.members.fetch(msg.author.id).then(function (m) {
                                        m.roles.add(role);
                                    })
                                }).catch(console.error);
                            })
                            .catch(console.error);
                    }).catch(console.error);
                } else {
                    msg.channel.guild.channels.create(squadName, {
                        reason: "create a new squad",
                        parent: parentChannel
                    })
                        .then(function (cnew) {
                            cnew.send("Welcome to your squad channel. You can add members to your squad with *!addMember @username*.")
                            msg.channel.send("Your new squad channel has been initialized. Here is a link to it <#" + cnew.id + ">.");
                            msg.channel.guild.roles.create({
                                data: {
                                    name: squadName,
                                    color: 'RANDOM',
                                }, reason: "New Squad Role"
                            }).then(function (role) {
                                msg.channel.guild.members.fetch(msg.author.id).then(function (m) {
                                    m.roles.add(role);
                                })
                            }).catch(console.error);
                        })
                        .catch(console.error);
                }
            }


            if (msg.content.toLowerCase().trim().startsWith("!addmember")) {
                try {

                    var squadrole = null;
                    msg.channel.guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }

                    var userIsInSquad = msg.member.roles.cache.find(r => r.name === squadrole.name) != null;

                    if (!userIsInSquad) {
                        msg.channel.send("Command can only be used by squad members!");
                        return;
                    }

                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!addmember".length).split(' ');
                    args.shift();
                    const member = args.shift().trim();
                    member.replace("<", "").replace(">", "").replace("!", "")
                    var memberid = member.replace("<", "").replace(">", "").replace("!", "").replace("@", "");

                    if (squadrole) {
                        msg.channel.guild.members.fetch(memberid).then(function (m) {
                            try {
                                var memberIsInSquad = m.roles.cache.find(r => r.name === squadrole.name) != null;
                                if (memberIsInSquad) {
                                    msg.channel.send("User is already a squad member!");
                                    return;
                                }
                                m.roles.add(squadrole);
                                let squad = squadNameToSquadsMap.get(msg.channel.name);
                                squad.members.push(memberid);
                                if (process.env.REDIS_URL) {
                                    redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                                    });
                                }
                                msg.channel.send(member + " added to the squad.");
                            } catch (e) {
                                msg.channel.send("Something went wrong. Make sure you have tagged the user properly.");
                            }
                        }).catch(console.error)
                    } else {
                        msg.channel.send("This is not a squad channel.");
                    }
                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you choose a valid user and tagged him with @.");
                }

            }

            if (msg.content.toLowerCase().trim().startsWith("!kickmember")) {
                try {

                    var squadrole = null;
                    msg.channel.guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }

                    var userIsInSquad = msg.member.roles.cache.find(r => r.name === squadrole.name) != null;

                    if (!userIsInSquad) {
                        msg.channel.send("Command can only be used by squad members!");
                        return;
                    }

                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!kickmember".length).split(' ');
                    args.shift();
                    const member = args.shift().trim();
                    var memberid = member.substring(3, 21);
                    if (squadrole) {
                        msg.channel.guild.members.fetch(memberid).then(function (m) {
                            var memberInSquad = m.roles.cache.find(r => r.name === squadrole.name) != null;
                            if (!memberInSquad) {
                                msg.channel.send("User is not part of the squad!");
                                return;
                            } else {
                                m.roles.remove(squadrole);
                                let squad = squadNameToSquadsMap.get(msg.channel.name);
                                if (squad.safe && usersToWalletsMap.get(m.id)) {
                                    msg.channel.send("Please use gnosis to remove squad members after the safe has been initialize.");
                                    return;
                                }
                                const index = squad.members.indexOf(memberid);
                                if (index > -1) {
                                    squad.members.splice(index, 1);
                                }
                                if (process.env.REDIS_URL) {
                                    redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                                    });
                                }
                                msg.channel.send(member + " Has been removed from the squad.");
                            }
                        }).catch(console.error)
                    } else {
                        msg.channel.send("This is not a squad channel.");
                    }
                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you choose a valid user and tagged him with @.");
                }

            }

            if (msg.content.toLowerCase().trim().startsWith("!setwallet")) {
                try {
                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!setwallet".length).split(' ');
                    args.shift();
                    const wallet = args.shift().trim();
                    if (!wallet.startsWith("0x") || wallet.length != 42) {
                        msg.channel.send("That is not a proper ETH wallet address.");
                        return;
                    }
                    usersToWalletsMap.set(msg.author.id, wallet);
                    if (process.env.REDIS_URL) {
                        redisClient.set("usersToWalletsMap", JSON.stringify([...usersToWalletsMap]), function () {
                        });
                    }
                    msg.reply("your account has been set.");

                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you provided a valid wallet.");
                }
            }

            if (msg.content.toLowerCase().trim().startsWith("!setconsensus")) {
                try {

                    var squadrole = null;
                    msg.channel.guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }

                    var userIsInSquad = msg.member.roles.cache.find(r => r.name === squadrole.name) != null;

                    if (!userIsInSquad) {
                        msg.channel.send("Command can only be used by squad members!");
                        return;
                    }

                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!setconsensus".length).split(' ');
                    args.shift();
                    const consensus = args.shift().trim();
                    if (isNaN(consensus) || (consensus % 1 != 0)) {
                        msg.channel.send("That is not a proper consensus number.");
                        return;
                    }

                    let squad = squadNameToSquadsMap.get(msg.channel.name);

                    if (squad.safe) {
                        msg.channel.send("Consensus can only be changed from gnosis app after the safe has been initialized.");
                        return;
                    }
                    if (squad.members.length < consensus) {
                        msg.channel.send("Consensus can't be higher than the number of members in the squad.");
                        return;
                    }


                    squad.consensus = consensus;
                    if (process.env.REDIS_URL) {
                        redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                        });
                    }
                    msg.channel.send("Squad multisig consensus has been set to " + consensus + ".");

                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you provided a valid wallet.");
                }
            }

            if (msg.content.toLowerCase().trim().startsWith("!initsafe")) {
                try {
                    var squadrole = null;
                    msg.channel.guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }

                    var userIsInSquad = msg.member.roles.cache.find(r => r.name === squadrole.name) != null;

                    if (!userIsInSquad) {
                        msg.channel.send("Command can only be used by squad members!");
                        return;
                    }
                    let squad = squadNameToSquadsMap.get(msg.channel.name);
                    if (squad.safe) {
                        msg.channel.send("Squad already has a safe. Use *!setSafe safeAddress* if you want to set a new safe address.");
                        return;
                    } else {
                        const exampleEmbed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .setTitle('Safe creation');
                        let proceed = true;
                        let membersOfSafe = [];
                        let messageOfMembersOfSafe = "";
                        squad.members.forEach(m => {
                            let memberOfSafe = new Object();
                            memberOfSafe.name = msg.channel.guild.members.cache.get(m).user.username;
                            if (!usersToWalletsMap.has(m)) {
                                msg.channel.send("***" +
                                    memberOfSafe.name + "*** does not have an assigned wallet. All squad members must have wallets assigned for a safe to be created. Use *!setWallet* from the corresponding discord account to assign wallet."
                                )
                                proceed = false;
                                return;
                            }
                            let userwallet = usersToWalletsMap.get(m);
                            memberOfSafe.wallet = userwallet;
                            membersOfSafe.push(memberOfSafe);
                            messageOfMembersOfSafe += memberOfSafe.name + " " + memberOfSafe.wallet + "\n";
                        });
                        if (proceed) {
                            exampleEmbed.addField("Init safe", "A gnosis safe transaction has been prepared for you with the parameters below.");
                            exampleEmbed.addField("Signers", messageOfMembersOfSafe);
                            exampleEmbed.addField("Consensus", squad.consensus);
                            var link = process.env.LINK;
                            link += "/" + squad.name + "/" + squad.consensus + "?";
                            membersOfSafe.forEach(m => {
                                link += "signers=" + m.wallet + "&";
                            });
                            exampleEmbed.addField("Link", "You can start the safe creation [here](" + link + ")");
                            msg.channel.send(exampleEmbed);
                        }
                    }


                } catch (e) {
                    msg.channel.send("Something went wrong.");
                    console.log(e);
                }
            }


            if (msg.content.toLowerCase().trim().startsWith("!squad")) {
                try {
                    var squadrole = null;
                    msg.channel.guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }
                    let squad = squadNameToSquadsMap.get(msg.channel.name);

                    const exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Squad');
                    let membersOfSafe = [];
                    let messageOfMembersOfSafe = "";
                    squad.members.forEach(m => {
                        let memberOfSafe = new Object();
                        memberOfSafe.name = msg.channel.guild.members.cache.get(m).user.username;
                        let userwallet = usersToWalletsMap.get(m);
                        memberOfSafe.wallet = userwallet != null ? userwallet : "";
                        membersOfSafe.push(memberOfSafe);
                        messageOfMembersOfSafe += memberOfSafe.name + " " + memberOfSafe.wallet + "\n";
                    });
                    exampleEmbed.addField("Name", squad.name);
                    exampleEmbed.addField("Members", messageOfMembersOfSafe);
                    exampleEmbed.addField("Consensus", squad.consensus);
                    exampleEmbed.addField("Safe", "[" + squad.safe + "](" + process.env.APP_LINK + ")");
                    msg.channel.send(exampleEmbed);


                } catch (e) {
                    msg.channel.send("Something went wrong.");
                    console.log(e);
                }
            }

            if (msg.content.toLowerCase().trim().startsWith("!setsafe")) {
                try {

                    var squadrole = null;
                    msg.channel.guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }

                    var userIsInSquad = msg.member.roles.cache.find(r => r.name === squadrole.name) != null;

                    if (!userIsInSquad) {
                        msg.channel.send("Command can only be used by squad members!");
                        return;
                    }

                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!setsafe".length).split(' ');
                    args.shift();
                    const safe = args.shift().trim();
                    if (!safe.startsWith("0x") || safe.length != 42) {
                        msg.channel.send("That is not a proper ETH safe address.");
                        return;
                    }

                    let squad = squadNameToSquadsMap.get(msg.channel.name);
                    squad.safe = safe;
                    value.setTopic("Safe: " + safe);
                    if (process.env.REDIS_URL) {
                        redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                        });
                    }
                    msg.channel.send("Safe address has been updated for your squad.");

                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you provided a valid safe.");
                }
            }


            if (msg.content.toLowerCase().trim().startsWith("!help")) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('DAOfirst bot');

                exampleEmbed.setDescription('List of commands:');
                exampleEmbed.addField("!createSquad squadName", "Creates a new squad, assigns it a channel and discord role. Adds the creators as the squad member.");
                exampleEmbed.addField("!addMember taggedUser", "Adds tagged user to the squad. To be used in the squad channel.");
                exampleEmbed.addField("!kickMember taggedUser", "Removes user from the squad. To be used in the squad channel.");
                exampleEmbed.addField("!setWallet walletAddress", "Assigns walletAddress to the discord user.");
                exampleEmbed.addField("!setConsensus", "Sets the squad multisig consensus. To be used in squad channel.");
                exampleEmbed.addField("!initSafe", "Prepares a transaction to create a Gnosis multisig safe for squad members. Sends back a link where the transaction can be started by squad members.");
                exampleEmbed.addField("!setSafe safeAddress", "Replaces squad safe address");
                exampleEmbed.addField("!squad ",
                    "Shows squad details.");

                msg.reply(exampleEmbed);
            }

        }


    }
)

const Web3 = require('web3');
let INFURA_URL = process.env.INFURA_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

function checkReceipt(hash, cb) {
    web3.eth.getTransactionReceipt(hash, function (err, receipt) {
        if (err) {
            console.error(err);
        }

        if (receipt !== null) {
            // Transaction went through
            if (cb) {
                cb(receipt);
            }
        }
    });
}

setInterval(function () {
    guilds.forEach(curGuild => {
        curGuild.channels.cache.forEach(function (value, key) {
                if (value.parent && value.parent.name == "squads") {
                    let squad = squadNameToSquadsMap.get(value.name);
                    try {
                        if (squad) {
                            if (squad.safe == null && squad.tx) {
                                var tx = squad.tx;
                                checkReceipt(tx, function (receipt) {
                                    var safe = "0x" + receipt.logs[0].data.substring(26);
                                    squad.safe = safe;
                                    value.setTopic("Safe: " + safe);
                                    if (process.env.REDIS_URL) {
                                        redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                                        });
                                    }
                                    const exampleEmbed = new Discord.MessageEmbed()
                                        .setColor('#0099ff')
                                        .setTitle('Safe').setDescription("Your safe has been initialized.");
                                    exampleEmbed.addField("Address", safe);
                                    exampleEmbed.addField("App", "[gnosis](" + process.env.APP_LINK + ")");
                                    value.send(exampleEmbed);
                                })

                            } else {
                                if (squad.safe) {
                                    checkSafe(squad.safe, squad);
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        );
    })
}, 1000 * 30);


function checkSafe(address, squad) {

    guilds.forEach(curGuild => {
        curGuild.channels.cache.forEach(function (value, key) {
            if (value.parent && value.parent.name == "squads") {
                if (value.name == squad.name) {
                    var squadrole = null;
                    curGuild.roles.cache.forEach(function (rolevalue, key) {
                            if (rolevalue.name == squad.name) {
                                squadrole = rolevalue;
                            }
                        }
                    );

                    const safecontract = new web3.eth.Contract([
                        {
                            "inputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "constructor"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                }
                            ],
                            "name": "AddedOwner",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": true,
                                    "internalType": "bytes32",
                                    "name": "approvedHash",
                                    "type": "bytes32"
                                },
                                {
                                    "indexed": true,
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                }
                            ],
                            "name": "ApproveHash",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "address",
                                    "name": "masterCopy",
                                    "type": "address"
                                }
                            ],
                            "name": "ChangedMasterCopy",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "uint256",
                                    "name": "threshold",
                                    "type": "uint256"
                                }
                            ],
                            "name": "ChangedThreshold",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "contract Module",
                                    "name": "module",
                                    "type": "address"
                                }
                            ],
                            "name": "DisabledModule",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "contract Module",
                                    "name": "module",
                                    "type": "address"
                                }
                            ],
                            "name": "EnabledModule",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "bytes32",
                                    "name": "txHash",
                                    "type": "bytes32"
                                },
                                {
                                    "indexed": false,
                                    "internalType": "uint256",
                                    "name": "payment",
                                    "type": "uint256"
                                }
                            ],
                            "name": "ExecutionFailure",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": true,
                                    "internalType": "address",
                                    "name": "module",
                                    "type": "address"
                                }
                            ],
                            "name": "ExecutionFromModuleFailure",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": true,
                                    "internalType": "address",
                                    "name": "module",
                                    "type": "address"
                                }
                            ],
                            "name": "ExecutionFromModuleSuccess",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "bytes32",
                                    "name": "txHash",
                                    "type": "bytes32"
                                },
                                {
                                    "indexed": false,
                                    "internalType": "uint256",
                                    "name": "payment",
                                    "type": "uint256"
                                }
                            ],
                            "name": "ExecutionSuccess",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": false,
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                }
                            ],
                            "name": "RemovedOwner",
                            "type": "event"
                        },
                        {
                            "anonymous": false,
                            "inputs": [
                                {
                                    "indexed": true,
                                    "internalType": "bytes32",
                                    "name": "msgHash",
                                    "type": "bytes32"
                                }
                            ],
                            "name": "SignMsg",
                            "type": "event"
                        },
                        {
                            "payable": true,
                            "stateMutability": "payable",
                            "type": "fallback"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "NAME",
                            "outputs": [
                                {
                                    "internalType": "string",
                                    "name": "",
                                    "type": "string"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "VERSION",
                            "outputs": [
                                {
                                    "internalType": "string",
                                    "name": "",
                                    "type": "string"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "_threshold",
                                    "type": "uint256"
                                }
                            ],
                            "name": "addOwnerWithThreshold",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "bytes32",
                                    "name": "hashToApprove",
                                    "type": "bytes32"
                                }
                            ],
                            "name": "approveHash",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "",
                                    "type": "address"
                                },
                                {
                                    "internalType": "bytes32",
                                    "name": "",
                                    "type": "bytes32"
                                }
                            ],
                            "name": "approvedHashes",
                            "outputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "",
                                    "type": "uint256"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "_masterCopy",
                                    "type": "address"
                                }
                            ],
                            "name": "changeMasterCopy",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "_threshold",
                                    "type": "uint256"
                                }
                            ],
                            "name": "changeThreshold",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "contract Module",
                                    "name": "prevModule",
                                    "type": "address"
                                },
                                {
                                    "internalType": "contract Module",
                                    "name": "module",
                                    "type": "address"
                                }
                            ],
                            "name": "disableModule",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "domainSeparator",
                            "outputs": [
                                {
                                    "internalType": "bytes32",
                                    "name": "",
                                    "type": "bytes32"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "contract Module",
                                    "name": "module",
                                    "type": "address"
                                }
                            ],
                            "name": "enableModule",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "enum Enum.Operation",
                                    "name": "operation",
                                    "type": "uint8"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "safeTxGas",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "baseGas",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "gasPrice",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "address",
                                    "name": "gasToken",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address",
                                    "name": "refundReceiver",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "_nonce",
                                    "type": "uint256"
                                }
                            ],
                            "name": "encodeTransactionData",
                            "outputs": [
                                {
                                    "internalType": "bytes",
                                    "name": "",
                                    "type": "bytes"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "enum Enum.Operation",
                                    "name": "operation",
                                    "type": "uint8"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "safeTxGas",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "baseGas",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "gasPrice",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "address",
                                    "name": "gasToken",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address payable",
                                    "name": "refundReceiver",
                                    "type": "address"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "signatures",
                                    "type": "bytes"
                                }
                            ],
                            "name": "execTransaction",
                            "outputs": [
                                {
                                    "internalType": "bool",
                                    "name": "success",
                                    "type": "bool"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "enum Enum.Operation",
                                    "name": "operation",
                                    "type": "uint8"
                                }
                            ],
                            "name": "execTransactionFromModule",
                            "outputs": [
                                {
                                    "internalType": "bool",
                                    "name": "success",
                                    "type": "bool"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "enum Enum.Operation",
                                    "name": "operation",
                                    "type": "uint8"
                                }
                            ],
                            "name": "execTransactionFromModuleReturnData",
                            "outputs": [
                                {
                                    "internalType": "bool",
                                    "name": "success",
                                    "type": "bool"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "returnData",
                                    "type": "bytes"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "bytes",
                                    "name": "message",
                                    "type": "bytes"
                                }
                            ],
                            "name": "getMessageHash",
                            "outputs": [
                                {
                                    "internalType": "bytes32",
                                    "name": "",
                                    "type": "bytes32"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "getModules",
                            "outputs": [
                                {
                                    "internalType": "address[]",
                                    "name": "",
                                    "type": "address[]"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "start",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "pageSize",
                                    "type": "uint256"
                                }
                            ],
                            "name": "getModulesPaginated",
                            "outputs": [
                                {
                                    "internalType": "address[]",
                                    "name": "array",
                                    "type": "address[]"
                                },
                                {
                                    "internalType": "address",
                                    "name": "next",
                                    "type": "address"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "getOwners",
                            "outputs": [
                                {
                                    "internalType": "address[]",
                                    "name": "",
                                    "type": "address[]"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "getThreshold",
                            "outputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "",
                                    "type": "uint256"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "enum Enum.Operation",
                                    "name": "operation",
                                    "type": "uint8"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "safeTxGas",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "baseGas",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "gasPrice",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "address",
                                    "name": "gasToken",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address",
                                    "name": "refundReceiver",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "_nonce",
                                    "type": "uint256"
                                }
                            ],
                            "name": "getTransactionHash",
                            "outputs": [
                                {
                                    "internalType": "bytes32",
                                    "name": "",
                                    "type": "bytes32"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                }
                            ],
                            "name": "isOwner",
                            "outputs": [
                                {
                                    "internalType": "bool",
                                    "name": "",
                                    "type": "bool"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "bytes",
                                    "name": "_data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "_signature",
                                    "type": "bytes"
                                }
                            ],
                            "name": "isValidSignature",
                            "outputs": [
                                {
                                    "internalType": "bytes4",
                                    "name": "",
                                    "type": "bytes4"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [],
                            "name": "nonce",
                            "outputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "",
                                    "type": "uint256"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "prevOwner",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "_threshold",
                                    "type": "uint256"
                                }
                            ],
                            "name": "removeOwner",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "enum Enum.Operation",
                                    "name": "operation",
                                    "type": "uint8"
                                }
                            ],
                            "name": "requiredTxGas",
                            "outputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "",
                                    "type": "uint256"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "handler",
                                    "type": "address"
                                }
                            ],
                            "name": "setFallbackHandler",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address[]",
                                    "name": "_owners",
                                    "type": "address[]"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "_threshold",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "address",
                                    "name": "to",
                                    "type": "address"
                                },
                                {
                                    "internalType": "bytes",
                                    "name": "data",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "address",
                                    "name": "fallbackHandler",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address",
                                    "name": "paymentToken",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "payment",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "address payable",
                                    "name": "paymentReceiver",
                                    "type": "address"
                                }
                            ],
                            "name": "setup",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "bytes",
                                    "name": "_data",
                                    "type": "bytes"
                                }
                            ],
                            "name": "signMessage",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "bytes32",
                                    "name": "",
                                    "type": "bytes32"
                                }
                            ],
                            "name": "signedMessages",
                            "outputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "",
                                    "type": "uint256"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "prevOwner",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address",
                                    "name": "oldOwner",
                                    "type": "address"
                                },
                                {
                                    "internalType": "address",
                                    "name": "newOwner",
                                    "type": "address"
                                }
                            ],
                            "name": "swapOwner",
                            "outputs": [],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        }
                    ], address);
                    safecontract.methods.getOwners().call((error, result) => {
                        if (result) {
                            console.log(result);
                            let membersOfSquadWallets = [];
                            squad.members.forEach(m => {
                                let memberOfSafe = new Object();
                                memberOfSafe.name = curGuild.members.cache.get(m).user.username;
                                memberOfSafe.id = curGuild.members.cache.get(m).id;
                                let userwallet = usersToWalletsMap.get(m);
                                memberOfSafe.wallet = userwallet != null ? userwallet : "";
                                if (memberOfSafe.wallet) {
                                    membersOfSquadWallets.push(memberOfSafe);
                                    let safeHasWallet = false;
                                    result.forEach(r => {
                                        if (r.toLowerCase() == memberOfSafe.wallet.toLowerCase()) {
                                            safeHasWallet = true;
                                            return;
                                        }
                                    })
                                    if (!safeHasWallet) {
                                        curGuild.members.fetch(memberOfSafe.id).then(function (m) {
                                            var memberInSquad = m.roles.cache.find(r => r.name === squadrole.name) != null;
                                            m.roles.remove(squadrole);
                                            const index = squad.members.indexOf(m.id);
                                            if (index > -1) {
                                                squad.members.splice(index, 1);
                                            }
                                            squadNameToSquadsMap.set(squad.name, squad);
                                            if (process.env.REDIS_URL) {
                                                redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                                                });
                                            }
                                            value.send("User " + memberOfSafe.name + " is not part of the gnosis safe signers. Removing him from the squad. Please first add his address to the safe in the gnosis app if you want to add him to the squad.");
                                        }).catch(console.error)
                                    }
                                }

                            });

                            result.forEach(r => {
                                let squadHasWallet = false;
                                membersOfSquadWallets.forEach(m => {
                                    if (r.toLowerCase() == m.wallet.toLowerCase()) {
                                        squadHasWallet = true;
                                        return;
                                    }
                                })
                                if (!squadHasWallet) {
                                    let message = "Gnosis safe has a signer: " + r + " who is not part of the squad here. Please add that squad member.";
                                    if (!sentWarningMessagesMap.has(message)) {
                                        value.send(message);
                                        sentWarningMessagesMap.set(message, true)
                                        if (process.env.REDIS_URL) {
                                            redisClient.set("sentWarningMessagesMap", JSON.stringify([...sentWarningMessagesMap]), function () {
                                            });
                                        }
                                    }
                                }

                            })
                        }
                    });
                    safecontract.methods.getThreshold().call((error, result) => {
                        console.log(result);
                        let safethreshold = result * 1;
                        if (safethreshold != squad.consensus) {
                            value.send("Safe threshold has been changed to " + safethreshold + " in the gnosis app.");
                            squad.consensus = safethreshold;
                            squadNameToSquadsMap.set(squad.name, squad);
                            if (process.env.REDIS_URL) {
                                redisClient.set("squadNameToSquadsMap", JSON.stringify([...squadNameToSquadsMap]), function () {
                                });
                            }
                        }
                    })

                }
            }
        })
    })
}


setInterval(function () {
    sentWarningMessagesMap.clear();
    if (process.env.REDIS_URL) {
        redisClient.set("sentWarningMessagesMap", JSON.stringify([...sentWarningMessagesMap]), function () {
        });
    }
}, 1000 * 60 * 60 * 24);

client.login(process.env.BOT_TOKEN);