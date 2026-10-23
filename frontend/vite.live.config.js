import config from './vite.config.js';

config.server.proxy['/api'] = {
  ...config.server.proxy['/api'],
  target: 'http://127.0.0.1:5001',
};

export default config;
