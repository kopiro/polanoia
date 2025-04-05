from flask_migrate import Migrate, upgrade
from app import app, db

def init_db():
    """Initialize the database with migrations."""
    with app.app_context():
        # Run any pending migrations
        upgrade()
        print("Database migrations applied successfully.")

if __name__ == "__main__":
    init_db() 