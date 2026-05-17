// Initialize MongoDB with user database
db = db.getSiblingDB('gigflow-db');

// Create application user
db.createUser({
    user: 'gigflow-user',
    pwd: 'gigflow-password',
    roles: [
        { role: 'readWrite', db: 'gigflow-db' },
        { role: 'dbAdmin', db: 'gigflow-db' }
    ]
});

// Create collections
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                _id: { bsonType: 'objectId' },
                name: { bsonType: 'string' },
                email: { bsonType: 'string' },
                password: { bsonType: 'string' },
                role: {
                    enum: ['admin', 'sales'],
                    description: 'User role'
                },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('leads', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email'],
            properties: {
                _id: { bsonType: 'objectId' },
                name: { bsonType: 'string' },
                email: { bsonType: 'string' },
                status: {
                    enum: ['New', 'Contacted', 'Qualified', 'Lost'],
                    description: 'Lead status'
                },
                source: {
                    enum: ['Website', 'Instagram', 'Referral'],
                    description: 'Lead source'
                },
                createdBy: { bsonType: 'objectId' },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' }
            }
        }
    }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.leads.createIndex({ createdBy: 1 });
db.leads.createIndex({ status: 1 });
db.leads.createIndex({ source: 1 });
db.leads.createIndex({ createdAt: -1 });

print('MongoDB initialization completed successfully!');
