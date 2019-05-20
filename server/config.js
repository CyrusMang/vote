module.export = {
    port: 8080,
    queue_limit: 1000,
    database: {
        options: {
            host: 'mysql',
            user: 'vote',
            password: 'i348yr3894769487r907340uf90',
            database: 'vote',
        },
        retry: 3,
    },
};