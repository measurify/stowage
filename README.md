# Stowage Service

This is a RESTful service to **store in a persistent way JSON/XML/etc. entities called "Elements" on the Cloud**  

In order to use the service, you need a Stowage account (username and password) and an online server running the service ({{url}})
Ask info@wondertechweb.com to get a valid account and a server URL.

## Quick start

Build Docker image and run the container

    docker-compose up  

## Use

Resources can be accessed with a token than can be obtained with the following call:

    POST {{url}}/stowage
    body:
    {
        {"username" : "username",  
        "password" : "password"
    }

Then you get a token to be used for all other requests. Use it as a header parameter:

    Authorization: {{token}}

To store an element, you have to provide a unique ID and the JSON/XML/etc content:

    POST {{url}}/v1/elements
    body:
    {
        "_id": "my-element-id",
        "content": "my content string"
    }

Then it is possible to retrieve a single element:

    GET {{url}}/v1/elements/{{element}}
    answer:
    {
        "_id": "my-element-id",
        "content": "my content string",
        "owner": {
            "_id": "5e84afc882beff32f57e1b5f",
            "username": "user-username-normal-1",
            "type": "normal"
        }
    }

or a list of (paginated) elements:

    GET {{url}}/v1/elements?limit=2&page=1
    answer:
    {
        "docs": [
            {
                "_id": "tagged-tag-4",
                "owner": {
                    "_id": "5e8499321b1f672e8cdbecd6",
                    "username": "admin",
                    "type": "admin",
                }
            },
            ...
    ],
        "totalDocs": 4,
        "limit": 10,
        "totalPages": 1,
        "page": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": false,
        "prevPage": null,
        "nextPage": null
    }

The answer is paginated and you get information on the total number of elements, the current requested page and other useful information.
Obviously, the user gets the list of his own elements.

In order to clustering elements, it is possible to define tags and associate them to elements. 

To define a new tag:

    POST {{url}}/v1/tags
    body:
    { 
        "_id": "my-tag"
    }

Users share tags created by other users.

You can get a list of (paginated) tags:

    GET {{url}}/v1/tags?limit=2&page=1

To create an element with a list of tags:

    POST {{url}}/v1/elements
    body:
    {
        "_id": "my-element-id",
        "content": "my content string",
        "tags": ["{{tag1}}", "{{tag2}}"]
    }

Also tags can be tagged:

    POST {{url}}/v1/tags
    body:
    { 
        "_id": "my-tag",
        "tags": ["{{tag1}}", "{{tag2}}"]
    }

Users can delete the owned tags and elements, but tags have to be not already used:

    DELETE {{url}}/v1/tags/{{tag}}
    DELETE {{url}}/v1/elements/{{element}}

Also users can modify elements to add or remove tags or to change the contets:

    PUT {{url}}/v1/elements/{{element}}
    body:
    {
        "content": "my new content",
        "tags": {
            "add": ["{{tag3}}", "{{tag4}}"],
            "remove": ["{{tag1}}", "{{tag2}}"]
        }
    }

Finally, queries on list of elements can be filtered using tags:

    GET {{url}}/v1/elements?limit=2&page=1&filter={"tags":"{{tag}}"}

The uses has the possibility to build lists of tags or elements with just one request:

    POST {{url}}/v1/elements
    body:
    [
        { "_id": "my-element-id-test-1", "content":"my content 1", "tags": ["{{tag1}}", "{{tag2}}"] },
        { "_id": "my-element-id-test-2", "content":"my content 2", "tags": ["{{tag2}}"] },
        { "_id": "my-element-id-test-3", "content":"my content 3", "tags": ["{{tag1}}"] },
        { "_id": "my-element-id-test-4", "content":"my content 1", "tags": ["{{tag1}}", "{{tag2}}"] }
    ]

The answer has two lists, one for the created elements and one for the elements with errors:

    {
        "elements": [
                "_id": "my-element-id-test-1s",
                "content": "my content 1",
            }
        ],
        "errors": [
            "Index: 1 (Element validation failed: the _id is already used (my-element-id-test-2))",
            "Index: 2 (Element validation failed: the _id is already used (my-element-id-test-3))",
            "Index: 3 (Element validation failed: the _id is already used (my-element-id-test-4))"
        ]
    }

In case of a request with errors, Stowage response is filled with a specil error id. The list of all possible errors can be accessed as:

    GET {{url}}/v1/errors

Other informations (like API version, type of environment, etc) can be obtained with the following resources:

    GET {{url}}/v1/info
    GET {{url}}/v1/version

Finally, every Stowage implementation has a special user (administrator) who can create other users and access the Stowage logs.

To create a new user:

    POST {{url}}/v1/users
    body:
    {
        "username" : "user-username-normal-1",
        "password" : "user-password-normal-1",
        "type" : "normal"   
    }

To get the list of (paginated) users:

    GET {{url}}/v1/users

To access the Stowage log:

    GET {{url}}/v1/log

## Versioning

[GitHub Repo](https://bitbucket.org/iuscapto/nlp-entitty-extractor-service/src)

## Installation

The Stowage Service is developed using [Node JS](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/). The following steps show how to deploy a complete Stowage API enviroment on a Ubuntu 16.04 server, however it can be adapted also for MacOS or Windows operating systems.

### Istall MongoDB and NodeJS

Install Mongo DB

Start Mongo DB as a service

    sudo service mongod start

Verify that MongoDB has started successfully

    tail /var/log/mongodb/mongod.log
    check for "[initandlisten] waiting for connections on port 27017"

Run MongoDB at startup

    sudo systemctl enable mongod.service NodeJS 

Install NodeJS and NPM

### Install the API

Make a web folder

    cd ~
    mkdir ~/www
    cd ~/www

Install forever globally

    cd ~
    sudo npm install -g forever

Forward the port from 8084 to 80

    export PORT=8084
    sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8084 
    sudo apt-get install iptables-persistent

Get Atmosphere API code

    cd ~/www
    sudo git clone https://github.com/Atmosphere-IoT-Framework/api.git
    cd api/
    sudo npm install
    npm run-script prod

Setup environments

Stowage can run in tree different modes: "prod" (for production), "dev" (to run the code using the [nodemon](https://www.npmjs.com/package/nodemon) tool) and "test" (to execute the unit test suite). It is possible to select the enviroment using a command line parameter:

    npm run test
    npm run dev
    npm run prod

Each environment has a configuration file "variable.dev.env", "variables.prod.env", "variables.test.env" which can be edited in order to specify several features:

    VERSION=v1
    ENV=production
    DATABASE=mongodb://localhost:27017/stowage-prod
    PORT=8084
    ADMIN_USERNAME=admin 
    ADMIN_PASSWORD=admin 
    PASSWORDHASH=true
    JWTSECRET=secret
    HTTPSSECRET=password
    EXPIRATIONTIME=300m  
    LOG=enabled

In particular, the connection string with the database and administrator credential (at startup Stowage will create a admin user with these credential), the expiration time of tokens, the log level, the secret word for the HTTPS certificate file and the secret word for the JWT token.

Setup to run the API in production

We suggest to use a process manager for NodeJS, like [pm2](https://pm2.keymetrics.io/)

    sudo npm install -g pm2 
    sudo pm2 start api.js -- prod 
    sudo pm2 show api 
    sudo pm2 save 
    sudo pm2 startup

Check if it's working

    curl localhost
    curl localhost 8084

### HTTPS Setup

Stowage API can support both HTTP and HTTPS. Without certificate, the API starts using HTTP. However we reccomend to get a valid certificate from a authority. In the following we provide instruction to add a certificate from [Let's Encript](https://letsencrypt.org/), a free, automated and open Certificate Authority.
Detailed instruction can be found at [Certbot instruction](https://certbot.eff.org/instructions)

Add Certbot PPA

    sudo apt-get update
    sudo apt-get install software-properties-common
    sudo add-apt-repository universe
    sudo add-apt-repository ppa:certbot/certbot
    sudo apt-get update

Install Certbot

    sudo apt-get install certbot

Run API, it should run on HTTP, check if it is true

    sudo netstat -tulpn 

Use Certbot

    sudo certbot certonly --manual

provide your domain name: (e.g. my.stowage.com)

Provide a file for the authority

    cd ~/www/api/public/.well-known/acme-challenge/
    sudo nano [the file name provided by certbot]
    copy contents provided by certbot inside the previously created file

Copy certificates

    sudo cp /etc/letsencrypt/live/my.stowage.com/fullchain.pem ~/www/api/resources/fullchain.pem
    sudo cp /etc/letsencrypt/live/my.stowage.com/privkey.pem ~/www/api/resources/privkey.pem

Restart API

    sudo pm2 stop api
    sudo pm2 start api
    It should run on HTTPS: sudo netstat -tulpn

### Useful Commands

    Stop MongoDB: sudo service mongod stop  
    Restart MongoDB: sudo service mongod restart
    Start API: sudo pm2 stop api
    Stop API: sudo pm2 start api
    Check API: sudo pm2 show api

## Host on Heroku

    heroku login
    heroku container:login
    heroku create stowage --region eu
    heroku container:push web --app stowage  
    heroku container:release web --app stowage

<http://stowage.herokuapp.com>
