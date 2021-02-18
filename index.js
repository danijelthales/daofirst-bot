require("dotenv").config()

var express = require("express");
var app = express();

const path = require("path");
const router = express.Router();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

router.get("/createsafe/:squad/:consensus", (req, res) => {
    let signers = req.query.signers;
    res.render("verify", {squad: req.params.squad, consensus: req.params.consensus, signers: signers});
});

router.get('/table-sort.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/table-sort.js'));
});

router.get('/finish.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/finish.js'));
});

router.get('/verify.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/verify.js'));
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
            guild.channels.cache.forEach(function (value, key) {
                    if (value.name == squadname) {
                        let squad = JSON.parse(value.topic);
                        squad.tx = tx;
                        value.setTopic(JSON.stringify(squad)).then(value.send("Listening to safe creation tx with hash: `" + tx + "`"));
                    }
                }
            );
        } catch (e) {
            console.log(e);
        }
    }
);
app.use("/", router);

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port " + (process.env.PORT || 3000));
});

//
// const {SynthetixJs} = require('synthetix-js');
// const snxjs = new SynthetixJs(); //uses default ContractSettings - ethers.js default provider, mainnet

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

const Squad = class {
    name;
    members = [];
    consensus;
    safe;
    tx;
};

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

}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // checkMessages();
    client.guilds.cache.forEach(function (value, key) {
        if (value.name.toLowerCase().includes('barnbridge') || value.name.toLowerCase().includes('playground')) {
            guild = value;
        }
    });
})

client.on("message", msg => {
        if (!(msg.channel.type == "dm")) {
            if (msg.content.toLowerCase().trim().startsWith("!createsquad")) {

                const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!createsquad".length).split(' ');
                args.shift();
                const squadName = args.shift().trim();

                var exists = false;
                guild.roles.cache.forEach(function (value, key) {
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

                var found = false;
                var parentChannel = null;
                guild.channels.cache.forEach(function (value, key) {
                        if (value.name == "squads") {
                            parentChannel = value;
                            found = true;
                        }
                    }
                );
                if (!found) {
                    guild.channels.create("squads", {
                        type: 'category'
                    }).then(function (c) {
                        guild.channels.create(squadName, {
                            reason: "create a new squad",
                            topic: JSON.stringify(squad),
                            parent: c
                        })
                            .then(function (cnew) {
                                cnew.send("Welcome to your squad channel. You can add members to your squad with *!addMember @username*.")
                                msg.channel.send("Your new squad channel has been initialized. Here is a link to it <#" + cnew.id + ">");
                                guild.roles.create({
                                    data: {
                                        name: squadName,
                                        color: 'BLUE',
                                    }, reason: "New Squad Role"
                                }).then(function (role) {
                                    guild.members.fetch(msg.author.id).then(function (m) {
                                        m.roles.add(role);
                                    })
                                }).catch(console.error);
                            })
                            .catch(console.error);
                    }).catch(console.error);
                } else {
                    guild.channels.create(squadName, {
                        reason: "create a new squad",
                        topic: JSON.stringify(squad),
                        parent: parentChannel
                    })
                        .then(function (cnew) {
                            cnew.send("Welcome to your squad channel. You can add members to your squad with *!addMember @username*.")
                            msg.channel.send("Your new squad channel has been initialized. Here is a link to it <#" + cnew.id + ">.");
                            guild.roles.create({
                                data: {
                                    name: squadName,
                                    color: 'BLUE',
                                }, reason: "New Squad Role"
                            }).then(function (role) {
                                guild.members.fetch(msg.author.id).then(function (m) {
                                    m.roles.add(role);
                                })
                            }).catch(console.error);
                        })
                        .catch(console.error);
                }
            }


            if (msg.content.toLowerCase().trim().startsWith("!addmember")) {
                try {
                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!addmember".length).split(' ');
                    args.shift();
                    const member = args.shift().trim();
                    var memberid = member.substring(3, 21);
                    var squadrole = null;
                    guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole) {
                        guild.members.fetch(memberid).then(function (m) {
                            m.roles.add(squadrole);
                            let squad = JSON.parse(msg.channel.topic);
                            squad.members.push(memberid);
                            msg.channel.setTopic(JSON.stringify(squad));
                            msg.channel.send(member + " added to the squad.");
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
                    msg.reply("your account has been set.");

                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you provided a valid wallet.");
                }
            }

            if (msg.content.toLowerCase().trim().startsWith("!setconsensus")) {
                try {
                    const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("!setconsensus".length).split(' ');
                    args.shift();
                    const consensus = args.shift().trim();
                    if (isNaN(consensus)) {
                        msg.channel.send("That is not a proper consensus number.");
                        return;
                    }
                    var squadrole = null;
                    guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }


                    let squad = JSON.parse(msg.channel.topic);
                    squad.consensus = consensus;
                    msg.channel.setTopic(JSON.stringify(squad));
                    msg.channel.send("Squad multisig consensus has been set to " + consensus);

                } catch (e) {
                    msg.channel.send("Something went wrong. Please make sure you provided a valid wallet.");
                }
            }

            if (msg.content.toLowerCase().trim().startsWith("!initsafe")) {
                try {
                    var squadrole = null;
                    guild.roles.cache.forEach(function (value, key) {
                            if (value.name == msg.channel.name) {
                                squadrole = value;
                            }
                        }
                    );
                    if (squadrole == null) {
                        msg.channel.send("This is not a squad channel.");
                        return;
                    }
                    let squad = JSON.parse(msg.channel.topic);
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
                            memberOfSafe.name = guild.members.cache.get(m).user.username;
                            if (!usersToWalletsMap.has(m)) {
                                msg.channel.send("***" +
                                    memberOfSafe.name + "*** does not have an assigned wallet. All squad members must have wallets assigned for a safe to be created. Use !setWallet from the corresponding discord account to assign wallet."
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
    guild.channels.cache.forEach(function (value, key) {
            if (value.parent && value.parent.name == "squads") {
                let squad = JSON.parse(value.topic);
                if (squad.safe == null && squad.tx) {
                    var tx = squad.tx;
                    checkReceipt(tx, function (receipt) {
                        var safe = "0x" + receipt.logs[0].data.substring(26);
                        squad.safe = safe;
                        value.setTopic(JSON.stringify(squad)).then(value.send("Your safe has now been initialized with the address:`" + safe + "`"));
                    })

                }
            }
        }
    );
}, 1000 * 30);

client.login(process.env.BOT_TOKEN);