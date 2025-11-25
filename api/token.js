// api/token.js - 华为云Token获取代理
const https = require('https');

module.exports = async (req, res) => {
  // 设置CORS头，允许小程序访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('开始获取华为云Token...');
    
    // 华为云认证信息 - 在这里修改为你的实际信息
    const requestData = JSON.stringify({
      "auth": {
        "identity": {
          "methods": ["password"],
          "password": {
            "user": {
              "name": "13427903529", // 改为你的手机号，如：13812345678
              "password": "h20060917", // 改为你的华为云密码
              "domain": {
                "name": "hw_008613427903529_01" // 改为：hw_008613812345678
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

    console.log('请求数据:', requestData);

    // 调用华为云IAM接口
    const token = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'iam.cn-south-1.myhuaweicloud.com',
        port: 443,
        path: '/v3/auth/tokens',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        }
      };

      const req = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log('华为云响应状态码:', response.statusCode);
          console.log('华为云响应头:', response.headers);
          
          if (response.statusCode === 201) {
            const token = response.headers['x-subject-token'];
            if (token) {
              resolve(token);
            } else {
              reject(new Error('Token在响应头中未找到'));
            }
          } else {
            reject(new Error(`华为云API错误: ${response.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestData);
      req.end();
    });

    // 返回成功响应
    res.status(200).json({
      success: true,
      token: token,
      message: 'Token获取成功'
    });

  } catch (error) {
    console.error('获取Token失败:', error);
    
    // 返回错误响应
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
