# Stowage Service

This is a RESTful service to **store in a persistent way JSON/XML/etc. entities called "Elements" on the Cloud**  

In order to use the service, you need a Stowage account (username and password) and an online server running the service ({{url}})
Ask info@wondertechweb.com to get a valid account and a server URL.

## Versioning

[GitHub Repo](https://github.com/Atmosphere-IoT-Framework/stowage-service-api)

## Quick start

Clone code and run the container

    git clone https://github.com/Atmosphere-IoT-Framework/stowage-service-api
    docker-compose up  

## Usage

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

## Deploy

The Stowage Service is developed using [Node JS](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/). The following steps show how to deploy a complete Stowage API enviroment on a Ubuntu 16.04 server, using Docker. However it can be adapted also for MacOS or Windows operating systems.

[Install Docker](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04)
[Install Docker Compose](https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04)

Get the API

    cd ~
    mkdir ~/www
    cd ~/www
    sudo git clone https://github.com/Atmosphere-IoT-Framework/stowage-service-api api

Run API

    cd ~/www/api
    sudo docker-compose up -build

## Developer information

Stowage Service can run in tree different modes:

- "prod" (for production)
- "dev" (to run the code using the [nodemon](https://www.npmjs.com/package/nodemon) tool)
- "test" (to execute the unit test suite). 

It is possible to select the enviroment using a command line parameter:

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

### HTTPS Certificatesd

Stowage API can support both HTTP and HTTPS. Without certificate, the API starts using a self-signed certificate (stored in the resources forlder) or in HTTP (if also the self-signed certificate is missing). It is reccomended to get a valid certificate from a authority. 
In the following, we provide instruction to add a certificate from [Let's Encript](https://letsencrypt.org/), a free, automated and open Certificate Authority. Detailed instruction can be found at [Certbot instruction](https://certbot.eff.org/instructions)

Install Certbot

    sudo apt-get update
    sudo apt-get install software-properties-common
    sudo add-apt-repository universe
    sudo add-apt-repository ppa:certbot/certbot
    sudo apt-get update
    sudo apt-get install certbot

Use Certbot (modify in order to provide your domain)

    sudo ufw allow 80
    sudo certbot certonly --manual
    sudo certbot certonly --standalone --preferred-challenges http -d stowage.atmosphere.tools

Copy certificates

    sudo cp /etc/letsencrypt/live/stowage.atmosphere.tools/fullchain.pem ~/www/api/resources/certificare.pem
    sudo cp /etc/letsencrypt/live/stowage.atmosphere.tools/privkey.pem ~/www/api/resources/key.pem


----
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

