var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
const path = require('path');

function templateHTML(title, list, body, control){
    return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body>
      <h1><a href="/">WEB</a></h1>
      ${list}
      ${control}
      ${body}
    </body>
    </html>`;
}

function templateList(filelist){
    var list = '<ul>';
    var i = 0;
    while (i < filelist.length){
        list = list + `<li> <a href = "/?id=${filelist[i]}">${filelist[i]}</a></li>`;
        i += 1;
    }
    list = list + '</ul>';
    return list
}

var app = http.createServer(function(request,response){
    var url_1 = request.url;
    var querydata = url.parse(url_1,true).query;
    var pathname = url.parse(url_1,true).pathname;
    if (pathname === '/'){
        if (querydata.id === undefined){
            fs.readdir('./data',function(err,filelist){
                var title = 'First Page';
                var description = `
                <p> 게임방법을 안내해 드리겠습니다.</p>
                <p> 아래 여러분의 게임 아이디와 비밀번호를 입력하세요.</p>
                `;
                var list = templateList(filelist);
                var template = templateHTML(title, list,
                    `<h2>${title}</h2>${description}`,
                    `<a href = "/create">create</a>`);
                response.writeHead(200);
                response.end(template);
            });
        }else {
            fs.readdir('./data',function(err,filelist){
                fs.readFile(`data/${querydata.id}`,'utf8', function(err,description){
                    var title = querydata.id;
                    var list = templateList(filelist);
                    var template = templateHTML(title, list, 
                        `<h2>${title}</h2>${description}`,
                        `<a href = "/create">create</a>
                         <a href = "/update?id=${title}">update</a>
                         <form action = "delete_process" method = "post">
                            <input type ="hidden" name = "id" value ="${title}"
                            <input type ="submit" value = "delete">
                         </form>`
                    );
                    response.writeHead(200);
                    response.end(template);
                });
            });
        }
    }else if(pathname === '/create'){
        fs.readdir('./data', function(err, filelist){
            var title = '회원 등록';
            var list = templateList(filelist);
            var template = templateHTML(title, list, `
                <form action = "/create_process" method = "post">
                    <p><input type ="text" name ="title" placeholder ="title"></p>
                    <p>
                        <textarea name = "description" placeholder ="description"></textarea>
                    </p>
                    <p>
                        <input type ="submit">
                    <p>
                </form>`,"");
            response.writeHead(200);
            response.end(template);
        })
    }else if(pathname === '/create_process'){
        var body = "";
        request.on('data',function(data){
            body = body + data;
        });
        request.on('end',function(){
            var post = qs.parse(body);
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8',function(err){
                response.writeHead(302, {Location : `/?id=${title}`});
                response.end();
            })
        });
    }else if(pathname === '/update'){
        fs.readdir('./data', function(err,filelist){
            fs.readFile(`data/${querydata.id}`,"utf8",function(err,description){
                var title = querydata.id;
                var list = templateList(filelist);
                var template = templateHTML(title,list,`
                <form action = "/update_process" method = "post">
                    <input type ="hidden" name = "id" value ="${title}">
                    <p><input type ="text" name = "title" placeholder ="title" value ="${title}"></p>
                    <p>
                        <textarea name ="description" placeholder = "description">${description}</textarea>
                    </p>
                    <p>
                        <input type = "submit">
                    </p>
                </form>`,
                `
                <a href = "/create">create</a> <a href = "/update?id=${title}">update</a>`
                );
                response.writeHead(200);
                response.end(template);
            });    
        });
    } else if (pathname === "/update_process"){
        var body = '';
        request.on('data',function(data){
            body = body + data;
        });
        request.on('end',function(){
            var post = qs.parse(body);
            var id = post.id;
            var title = post.title;
            var description = post.description;
            fs.rename(`data/${id}`,`data/${title}`, function(err){
                fs.writeFile(`data/${title}`,description,'utf8',function(err){
                    response.writeHead(302, {Location : `/?id=${title}`});
                    response.end();
                });
            });
        });
    }else if(pathname === '/delete_process'){
        var body = "";
        request.on('data',function(data){
            body = body + data;
        });
        request.on('end', function(){
            var post = qs.parse(body);
            var id = post.id;
            fs.unlink(`data/${id}`, function(err){
                response.writeHead(302, {Location : `/`});
                response.end();
            })
        });
    }else{
        response.writeHead(404);
        response.end("Not Found");
    }
});

app.listen(3000);