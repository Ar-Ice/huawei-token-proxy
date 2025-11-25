// api/token.js - 优化版本
const https = require('https');

module.exports = async (req, res) => {
  // 立即设置响应头，避免超时
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 设置超时保护
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: '请求超时，请重试'
      });
    }
  }, 8000); // 8秒超时

  try {
    console.log('开始获取华为云Token...');
    
    // 华为云认证信息 - 请确保这里填写正确
    const requestData = JSON.stringify({
      "auth": {
        "identity": {
          "methods": ["password"],
          "password": {
            "user": {
              "name": "13427903529", // 确保格式正确
              "password": "h20060917",
              "domain": {
                "name": "hw_008613427903529_01" // 确保格式正确
              }
            }
          }
        },
        "scope": {
          "project": {
            "name": "cn-south-1"
          }
        }
      }
    });

    // 使用 Promise 包装 https 请求
    const token = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'iam.cn-south-1.myhuaweicloud.com',
        port: 443,
        path: '/v3/auth/tokens',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        },
        timeout: 5000 // 5秒超时
      };

      const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log('华为云响应状态:', response.statusCode);
          
          if (response.statusCode === 201) {
            const token = response.headers['x-subject-token'];
            if (token) {
              resolve(token);
            } else {
              reject(new Error('响应中未找到Token'));
            }
          } else {
            reject(new Error(`华为云错误: ${response.statusCode}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('华为云API请求超时'));
      });

      request.write(requestData);
      request.end();
    });

    clearTimeout(timeout);
    
    res.status(200).json({
      success: true,
      token: token,
      message: 'Token获取成功'
    });

  } catch (error) {
    clearTimeout(timeout);
    console.error('获取Token失败:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
