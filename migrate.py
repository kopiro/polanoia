import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models
from app import Trip

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate.py [init|migrate|upgrade|downgrade]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "init":
        # Initialize migrations
        os.system("flask db init")
    elif command == "migrate":
        # Create a new migration
        message = sys.argv[2] if len(sys.argv) > 2 else "migration"
        os.system(f"flask db migrate -m '{message}'")
    elif command == "upgrade":
        # Apply migrations
        os.system("flask db upgrade")
    elif command == "downgrade":
        # Rollback migrations
        os.system("flask db downgrade")
    else:
        print("Invalid command. Use: init, migrate, upgrade, or downgrade")
        sys.exit(1) 