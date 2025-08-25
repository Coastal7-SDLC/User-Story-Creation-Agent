// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Create the database
db = db.getSiblingDB('user_stories_db');

// Create a collection for user stories
db.createCollection('user_stories');

// Create indexes for better performance
db.user_stories.createIndex({ "created_at": -1 });
db.user_stories.createIndex({ "requirements": "text" });

// Create a user for the application (optional)
db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: [
    {
      role: "readWrite",
      db: "user_stories_db"
    }
  ]
});

print("MongoDB initialized successfully!");
