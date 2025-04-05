#!/bin/bash
flask db upgrade
exec gunicorn --config gunicorn_config.py app:app 