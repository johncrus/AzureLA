var express = require('express');
var bodyParser = require('body-parser')
var router = express.Router();
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const msRestAzure = require('ms-rest-azure');
const SearchManagement = require('azure-arm-search');
let https = require('https');

let subscriptionKey = 'a47f6e92fc3a4e00ba878e629bfba840';
let host = 'api.cognitive.microsoft.com';
let path = '/bing/v7.0/search';

let term = 'ceapa cu cartofi';

function spellCheck(res,parameter){
    console.log("spellcheck");
    let host = 'api.cognitive.microsoft.com';
    let pathsp = '/bing/v7.0/spellcheck';

    let key = 'a47f6e92fc3a4e00ba878e629bfba840';

    let mkt = "en-US";
    let mode = "proof";
    let text = parameter;
    let query_string = "?mkt=" + mkt + "&mode=" + mode;

    let request_params = {
        method : 'POST',
        hostname : host,
        path : pathsp + query_string,
        headers : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : text.length + 5,
            'Ocp-Apim-Subscription-Key' : key,
//        'X-Search-Location' : CLIENT_LOCATION,
//        'X-MSEdge-ClientID' : CLIENT_ID,
//        'X-MSEdge-ClientIP' : CLIENT_ID,
        }
    };
    let paramdata="";
    let response_handler = function (response) {

        let body = '';
        response.on ('data', function (d) {
            body += d;
        });
        response.on ('end', function () {
            let body_ = JSON.parse (body);
            let body__ = JSON.stringify (body_, null, '  ');
            let data=body_["flaggedTokens"];

            for (let i in data){
                let y=data[i];
                parameter=parameter.replace(String(y.token),String(y.suggestions[0].suggestion));
            }

        });
        response.on ('error', function (e) {
            console.log ('Error: ' + e.message);
        });

    };
    setTimeout(function(){
        database_query(res,parameter);
    }, 3000);
    let req = https.request (request_params, response_handler);
    req.write ("text=" + text);
    req.end ();
}
function keyWords(res,parameter){
    console.log("keywords");
    let accessKey = 'd9586edd1f974fb9b37ae22add5a0f23';

    let uri = 'westcentralus.api.cognitive.microsoft.com';
    let patha = '/text/analytics/v2.0/keyPhrases';

    let response_handler = function (response) {
        let body = '';
        response.on ('data', function (d) {
            body += d;
        });
        response.on ('end', function () {
            let body_ = JSON.parse (body);
            let body__ = JSON.stringify (body_, null, '  ');
            let data=body_["documents"];

            for (let i in data){
                var data1=data[i]["keyPhrases"];
                let result="";
                for (let x in data1 )
                {
                    result+=data1[x]+" ";
                }
                web_search(res,result);
            }

        });
        response.on ('error', function (e) {
            console.log ('Error: ' + e.message);
        });
    };

    let get_key_phrases = function (documents) {
        let body = JSON.stringify (documents);

        let request_params = {
            method : 'POST',
            hostname : uri,
            path : patha,
            headers : {
                'Ocp-Apim-Subscription-Key' : accessKey,
            }
        };

        let req = https.request (request_params, response_handler);
        req.write (body);
        req.end ();
    }

    let documents = { 'documents': [
            { 'id': '1', 'language': 'en', 'text': parameter }
        ]};

    get_key_phrases (documents);
}
let a=[];
function web_search(res, param){
    console.log("web_search");
    while(a.length > 0) {
        a.pop();
    }
    a.push(param);
    let response_handler = function (response) {
        let body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            console.log('\nRelevant Headers:\n');
            for (var header in response.headers)
                // header keys are lower-cased by Node.js
                if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
                    console.log(header + ": " + response.headers[header]);
            let body_ = JSON.parse (body);
            let body__ = JSON.stringify (body_, null, '  ');

            let data=body_["webPages"];
            let data1=data["value"]
            let prevs="1"
            for (let x in data1){
                let y= data1[x];
                for (let u in y)
                {
                    if (prevs !== y["url"])
                    {
                    let push_string="<a href="+y["url"]+">"+y["snippet"]+"</a>";
                        a.push(push_string);

                    }
                    prevs=y["url"];
                }
            }
            res.render('details',{dataArray:a})

        });
        response.on('error', function (e) {
            console.log('Error: ' + e.message);
        });
    };

    let bing_web_search = function (search) {
        console.log('Searching the Web for: ' + param);
        let request_params = {
            method : 'GET',
            hostname : host,
            path : path + '?q=' + encodeURIComponent(search),
            headers : {
                'Ocp-Apim-Subscription-Key' : subscriptionKey,
            }
        };

        let req = https.request(request_params, response_handler);
        req.end();
    }

    if (subscriptionKey.length === 32) {
        bing_web_search(param);
    } else {
        console.log('Invalid Bing Search API subscription key!');
        console.log('Please paste yours into the source code.');
    }

}
function database_query(res,parameter){
    console.log("database");
    const connection = new Connection(config);
    connection.on('connect', err => {
        err ? console.log(err) : executeStatement();
    });


    const query = 'select description from SalesLT.ProductDescription where lower(description) like \'%'+parameter+'%\'';
    const executeStatement = () => {
        const request = new Request(query, (err, rowCount) => {
            err ? console.log(err) : console.log(rowCount);
        });

        request.on('row', columns => {
            var result="";
            columns.forEach(function (column) {

                    result+=column.value+" ";

                }
            )

            arr.push(result);
        });

        connection.execSql(request);
    };
    setTimeout(function(){
        if (arr.length>0)
            res.render('data', { title: 'User Comments', dataArray : arr });
        else
            res.render('data', { title: 'No product description for '+parameter+', search in web', dataArray : [parameter] });
    }, 5000);
}
var arr=[];
const config = {
    userName: 'Sefu',
    password: 'Sef963852741',
    server: 'hellowordl1122.database.windows.net',
    options: {
        database: 'helloworld',
        encrypt: true
    }
};


router.get('/',function (req,res,next) {
    res.render('index', { title: 'Search in comments' });
});


router.post('/data', function(req, res, next) {
    while(arr.length > 0) {
        arr.pop();
    }
    spellCheck(res,req.body.name);

});


router.post('/details',function (req,res,next) {
    keyWords(res,req.body.object)
});


module.exports = router;
