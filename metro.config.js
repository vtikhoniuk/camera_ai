const { getDefaultConfig } = require('expo/metro-config');

// Load environment variables from .env file
require('dotenv').config();

const config = getDefaultConfig(__dirname);

// Enable hot reload for web development
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Settings for fast reload
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable CORS for hot reload
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

// Enable watch for all files
config.watchFolders = [__dirname];

module.exports = config; 