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

router.get('/rebatesFinish.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/rebatesFinish.js'));
});

router.get('/verify.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/verify.js'));
});

router.get('/web3.min.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/web3.min.js'));
});

app.post("/safetx", async (req, res) => {
        try {
            let tx = req.body.value.tx;
            let squad = req.body.value.squad;

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


