from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
import requests
import json
from datetime import datetime
import hashlib
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import threading

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='public', static_url_path='/static')

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Define the Trip model
class Trip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    identifier = db.Column(db.String(100), unique=True, nullable=False)
    trip_type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    start_place = db.Column(db.String(100), nullable=False)
    end_place = db.Column(db.String(100), nullable=False)
    trip_focus = db.Column(db.String(200), nullable=False)
    trip_notes = db.Column(db.Text)
    html_content = db.Column(db.Text)
    status = db.Column(db.String(20), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def generate_prompt(itinerary_data):
    """Generate the prompt for DeepSeek API."""
    # Read the prompt template from file
    with open('prompt.txt', 'r', encoding='utf-8') as f:
        prompt_template = f.read()
    
    # Replace the variables in the template
    prompt = prompt_template.format(
        identifier=itinerary_data['identifier'],
        trip_type=itinerary_data['trip_type'],
        start_date=itinerary_data['start_date'],
        end_date=itinerary_data['end_date'],
        start_place=itinerary_data['start_place'],
        end_place=itinerary_data['end_place'],
        trip_focus=itinerary_data['trip_focus'],
        trip_notes=itinerary_data['trip_notes']
    )
    
    return prompt

def generate_trip_content(trip):
    """Generate trip content using DeepSeek API."""
    try:
        # Format dates for the prompt
        start_date = trip.start_date.strftime('%B %d, %Y %H:%M')
        end_date = trip.end_date.strftime('%B %d, %Y %H:%M')
        
        # Prepare data for prompt generation
        itinerary_data = {
            'identifier': trip.identifier,
            'trip_type': trip.trip_type,
            'start_date': start_date,
            'end_date': end_date,
            'start_place': trip.start_place,
            'end_place': trip.end_place,
            'trip_focus': trip.trip_focus,
            'trip_notes': trip.trip_notes or 'None'
        }
        
        # Generate the prompt using the template
        prompt = generate_prompt(itinerary_data)
        
        # Make the API request to DeepSeek
        response = requests.post(
            'https://api.deepseek.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {os.getenv("DEEPSEEK_API_KEY")}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'deepseek-chat',
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.7,
                'max_tokens': 4000
            }
        )
        
        # Check if the request was successful
        if response.status_code != 200:
            return None, f"API request failed with status code {response.status_code}"
        
        # Parse the response
        data = response.json()
        if "choices" not in data or not data["choices"]:
            return None, "No content generated from the API"
        
        # Extract the generated content
        generated_content = data["choices"][0]["message"]["content"]

        generated_content = generated_content.replace('```html', '').replace('```', '')
        
        # Return the generated content
        return generated_content, None
        
    except Exception as e:
        return None, f"Error generating content: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/trips', methods=['GET'])
def get_trips():
    trips = Trip.query.order_by(Trip.created_at.desc()).all()
    return jsonify([{
        'id': trip.id,
        'identifier': trip.identifier,
        'trip_type': trip.trip_type,
        'start_date': trip.start_date.strftime('%Y-%m-%dT%H:%M'),
        'end_date': trip.end_date.strftime('%Y-%m-%dT%H:%M'),
        'start_place': trip.start_place,
        'end_place': trip.end_place,
        'focus': trip.trip_focus,
        'additional_requirements': trip.trip_notes,
        'created_at': trip.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'status': trip.status
    } for trip in trips])

@app.route('/generate', methods=['POST'])
def generate_itinerary():
    """Generate a new trip itinerary."""
    try:
        data = request.json
        trip = Trip(
            trip_type=data["trip_type"],
            start_date=datetime.fromisoformat(data["start_date"]),
            end_date=datetime.fromisoformat(data["end_date"]),
            start_place=data["start_place"],
            end_place=data["end_place"],
            trip_focus=data["trip_focus"],
            trip_notes=data.get("trip_notes", ""),
            identifier=data.get("identifier", ""),
            status="Pending"
        )
        db.session.add(trip)
        db.session.commit()

        # Generate content using the abstracted function
        generated_content, error = generate_trip_content(trip)
        
        if error:
            trip.status = "Failed"
            db.session.commit()
            return jsonify({"error": error}), 500
        
        trip.html_content = generated_content
        trip.status = "Completed"
        db.session.commit()

        return jsonify({"trip_id": trip.id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/trip/<int:trip_id>', methods=['GET'])
def get_trip_html(trip_id):
    """Get the HTML content for a specific trip."""
    try:
        trip = Trip.query.get(trip_id)
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
            
        if not trip.html_content:
            return jsonify({
                'status': 'Pending',
                'message': 'Trip content is still being generated',
                'trip_id': trip.id
            })
            
        return jsonify({
            'html_content': trip.html_content,
            'status': 'Completed',
            'trip_id': trip.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/trip/<int:trip_id>/generate', methods=['POST'])
def regenerate_trip(trip_id):
    """Regenerate a trip's content."""
    try:
        trip = Trip.query.get_or_404(trip_id)
        
        # Generate content using the abstracted function
        generated_content, error = generate_trip_content(trip)
        
        if error:
            trip.status = "Failed"
            db.session.commit()
            return jsonify({"error": error}), 500
        
        trip.html_content = generated_content
        trip.status = "Completed"
        db.session.commit()

        return jsonify({"status": "Completed", "html_content": trip.html_content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/trip/<int:trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    """Delete a specific trip."""
    try:
        trip = Trip.query.get(trip_id)
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
            
        # Delete the trip from the database
        db.session.delete(trip)
        db.session.commit()
        
        return jsonify({
            'message': 'Trip deleted successfully',
            'trip_id': trip_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/trip/<int:trip_id>/content', methods=['PUT'])
def update_trip_content(trip_id):
    """Update a trip's HTML content and mark it as modified."""
    try:
        trip = Trip.query.get(trip_id)
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
            
        data = request.json
        if 'html_content' not in data:
            return jsonify({'error': 'HTML content is required'}), 400
            
        # Update the trip content and status
        trip.html_content = data['html_content']
        trip.status = 'Modified'
        trip.updated_at = datetime.utcnow()
        
        # Save changes to database
        db.session.commit()
        
        return jsonify({
            'message': 'Trip content updated successfully',
            'trip_id': trip_id,
            'status': 'Modified'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/trip/<int:trip_id>', methods=['PUT'])
def update_trip(trip_id):
    """Update a specific trip's details."""
    try:
        trip = Trip.query.get(trip_id)
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
            
        data = request.json
        
        # Update trip fields if provided
        if 'trip_type' in data:
            trip.trip_type = data['trip_type']
        if 'start_date' in data:
            trip.start_date = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
        if 'end_date' in data:
            trip.end_date = datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M')
        if 'start_place' in data:
            trip.start_place = data['start_place']
        if 'end_place' in data:
            trip.end_place = data['end_place']
        if 'trip_focus' in data:
            trip.trip_focus = data['trip_focus']
        if 'trip_notes' in data:
            trip.trip_notes = data['trip_notes']
            
        # Update the timestamp
        trip.updated_at = datetime.utcnow()
        
        # Save changes to database
        db.session.commit()
        
        return jsonify({
            'message': 'Trip updated successfully',
            'trip_id': trip_id
        })
        
    except ValueError as e:
        return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000) 