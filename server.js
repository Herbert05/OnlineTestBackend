import http from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import { validateReq, getBody, extractToken, getLocalUser } from './request.js';
import fs from 'fs'
var questionsPath = '/Users/herbert.temba/Desktop/SimpliLearn/JS MEAN/CourseOne/Backend/data/questions.json';
var adminsPath = '/Users/herbert.temba/Desktop/SimpliLearn/JS MEAN/CourseOne/Backend/data/admins.json';

var protectedEndPoints = [
    "/profile/*",
    "/questions/*",
    "/candidates/*",
    "/answers/*",
];

var server = http.createServer(async (req, res) => { //create web server
    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }

    const data =  getBody(req, buffers);
    var parsedUrl = url.parse(req.url, true);
    var pathname = parsedUrl.pathname;
    var queryParams = parsedUrl.query;

    if(!validateReq(req, pathname, protectedEndPoints)){
        res.writeHead(403, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({ "status": "Failed", "message": "Not authenticated" }));
        res.end();
        return;
    }

    if (pathname == '/') { //check the URL of the current request
        // set response header
        res.writeHead(200, { 'Content-Type': 'application/json' }); 
        // set response content
        let r = `{ "application-name": "Online Test Application" }`;
        res.write(r);
        res.end();
    }
    else if (pathname == "/login") {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        var users = JSON.parse(
            await readFile(
            new URL('./data/candidates.json', import.meta.url)
            )
        );
        let authUser = users.find(user => user.username.toLowerCase() == data.username.toLowerCase());
        if(authUser == undefined){
            res.write(JSON.stringify({ "status": "Failed", "message": "Invalid user provided" }));
            res.end();
        }
        delete authUser.password;
        jwt.sign({ user: authUser }, secretKey, (err, token) => {
            authUser.token = token;
            if(err){
                res.writeHead(400, JSON.stringify({
                    status: "Failed",
                    message: "Some error occurred"
                }))
                res.end();
            }else{
                res.write(JSON.stringify(authUser));
                res.end();
            }
        });
    }
    else if (pathname == "/profile") {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        var localUser = getLocalUser(req);
        if(userData == null){
            res.writeHead(403, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({ "status": "Failed", "message": "Not authenticated" }));
            res.end();
            return;
        }
        res.write(JSON.stringify(localUser));
        res.end();
    }
    else if (pathname == "/questions") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        var questions = JSON.parse(
            await readFile(
            new URL('./data/questions.json', import.meta.url)
            )
        );
        if(queryParams.id !== undefined){
            let index = questions.findIndex(qns => qns.id == queryParams.id);
            if(index == -1){
                res.write(JSON.stringify({ "status": "Failed", "message": "The specified question id is not a valid one." }));
                res.end();
            }
            res.write(JSON.stringify(questions[index]));
            res.end();
        }
        res.write(JSON.stringify(questions));
        res.end();
    }
    else if (pathname == "/questions/save") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        var questions = JSON.parse(
            await readFile(
            new URL('./data/questions.json', import.meta.url)
            )
        );
        questions.push(data);
        fs = require('fs')
        fs.writeFile(questionsPath, JSON.stringify(questions), function (err,data) {
            if (err) {
                return console.log(err);
            }
            console.log(data);
        });
        res.write(JSON.stringify(questions));
        res.end();
    }
    else if (pathname == "/questions/remove") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        var questions = JSON.parse(
            await readFile(
            new URL('./data/questions.json', import.meta.url)
            )
        );
        questions.push(data);
        if(queryParams == undefined){
            res.write(JSON.stringify({ "status": "Failed", "message": "You are required to specify id of question to remove" }));
            res.end();
        }
        let index = questions.findIndex(qns => qns.id == queryParams.id);
        if(index == -1){
            res.write(JSON.stringify({ "status": "Failed", "message": "The specified question id is not a valid one." }));
            res.end();
        }
        questions.splice(index, 1);
        fs = require('fs')
        fs.writeFile(questionsPath, JSON.stringify(questions), function (err,data) {
            if (err) {
                return console.log(err);
            }
            console.log(data);
        });
        res.write(JSON.stringify(questions));
        res.end();
    }
    else if (pathname == "/questions/answer") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        var localUser = getLocalUser(req);
        if(userData == null){
            res.writeHead(403, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({ "status": "Failed", "message": "Not authenticated" }));
            res.end();
            return;
        }
        var questions = JSON.parse(
            await readFile(
            new URL('./data/questions.json', import.meta.url)
            )
        );
        var ansPath = `/data/answers/${localUser.username}.json`;
        if(!fs.existsSync(ansPath)){
            fs.writeFileSync(ansPath, "[]");
        }
        var answers = JSON.parse(
            await readFile(
            new URL(ansPath, import.meta.url)
            )
        );
        if(queryParams == undefined){
            res.write(JSON.stringify({ "status": "Failed", "message": "You are required to specify id of question to answer" }));
            res.end();
        }
        let index = questions.findIndex(qns => qns.id == queryParams.question_id);
        if(index == -1){
            res.write(JSON.stringify({ "status": "Failed", "message": "The specified question id is not a valid one." }));
            res.end();
        }
        var ansIndex = answers.findIndex(ans => ans.question_id == queryParams.question_id);
        if(ansIndex == -1){
            answers.push({
                question_id: queryParams.question_id,
                answer: JSON.stringify(data)
            })
        }else {
            answers[ansIndex] = {
                question_id: queryParams.question_id,
                answer: JSON.stringify(data)
            };
        }
        fs = require('fs')
        fs.writeFile(ansPath, JSON.stringify(answers), function (err,data) {
            if (err) {
                return console.log(err);
            }
        });
        res.write(JSON.stringify(answers));
        res.end();
    }
    else{
        res.end('Invalid Request!');
    }
});
server.listen(4000, '127.0.0.1');
console.log('Started server');