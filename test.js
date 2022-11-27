const CircuitBreaker = require('opossum');

const axios = require('axios');
// function asyncFunctionThatCouldFail(data) {
//     return new Promise((resolve, reject) => {
//         console.log("inasybncfunc")
//         if (!data) {
//             setTimeout(() => { resolve("resolve after 5 sec") }, 5000)
//         } else {
//             setTimeout(() => { resolve("resolve after 2 sec") }, 2000)
//         }

//     });
// }

const options = {
    timeout: 2000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 10000 // After 30 seconds, try again.
};

const breaker = new CircuitBreaker(callStrikeironAPI, options);

breaker.on('success',
    () => { console.log("result success") });

breaker.fallback(() => 'Sorry, out of service right now');

function callStrikeironAPI(emailAddress) {
    const funcName = 'strikeironAPIValidation'
    console.log(`[IndividualService]: Entered ${funcName}`)
    const options = {
        method: 'get',
        url: 'http://ws.strikeiron.com/StrikeIron/emv6Hygiene/EMV6Hygiene/VerifyEmail',
        params: {
            'LicenseInfo.RegisteredUser.UserID': 'caesars@strikeiron.com',
            'LicenseInfo.RegisteredUser.Password': 'strike@1',
            'VerifyEmail.Email': emailAddress,
            'VerifyEmail.Timeout': '10',
            'format': 'JSON'
        },
        headers: {
            'Content-Type': 'application/json',
        }
    }
    /* strikeiron API  */
    return axios(options)
        .then((strikeIronResponse) => {
            const statusCode = strikeIronResponse.data.WebServiceResponse.VerifyEmailResponse.VerifyEmailResult.ServiceStatus.StatusNbr;
            const strikeIronError = strikeIronResponse.data.WebServiceResponse.VerifyEmailResponse.VerifyEmailResult.ServiceStatus.StatusDescription;

            if (statusCode != 210) {
                throw new Error(strikeIronError)
            }
            console.log(`[IndividualService]: Existing ${funcName}`)
        })
        .catch((err) => {
            console.error(`[IndividualService]: Error in ${funcName}`, err)
            throw err
        })
}

async function callCircuitBreaker(emailAddress) {
    breaker.fire(emailAddress)
        .then((data) => {
            console.log("data:", data)
        })
        .catch((err) => {
            console.error("error in fire----------- ", err)
        });

}

let current = 0

setInterval(() => {

    if (!current) {
        callCircuitBreaker('a@a.com')
        current = 1
    } else {
        callCircuitBreaker('a@abc.com')
    }

}, 2000)