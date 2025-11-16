// MongoDB 初始化脚本
// 创建 Twikoo 数据库和用户

db = db.getSiblingDB('twikoo');

// 创建 Twikoo 用户
db.createUser({
  user: 'twikoo',
  pwd: 'twikoo123',
  roles: [
    {
      role: 'readWrite',
      db: 'twikoo'
    }
  ]
});

// 创建初始集合（可选）
db.createCollection('comments');
db.createCollection('config');
db.createCollection('counters');

// 创建索引
db.comments.createIndex({ "id": 1 }, { unique: true });
db.comments.createIndex({ "url": 1 });
db.comments.createIndex({ "created": 1 });

print('MongoDB initialized for Twikoo');