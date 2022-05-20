const axios = require('axios');
const config = require('./config');

const call = (customHeaders = null) => {
    let baseUrl = config.baseUrl.test + '/api';
    switch (process.env.NODE_ENV) {
        case 'development':
        case 'test':
            baseUrl = config.baseUrl.test + '/api';
            break;
        case 'staging':
            //TODO we need change baseURL when have server staging
            baseUrl = config.baseUrl.staging + '/api';
            break;
        case 'production':
            //TODO we need change baseURL when have server production
            baseUrl = config.baseUrl.production + '/api';
            break;
    }

    const http = axios.create({
        baseURL: baseUrl,
        headers: customHeaders ? customHeaders : {'Content-Type': 'application/json'},
    });

    return http;
}

exports.call = call;