import multiprocessing

# Gunicorn config variables
# The socket to bind to, using all interfaces (0.0.0.0) on port 8000
bind = "0.0.0.0:8000"

# Number of worker processes - set to number of CPU cores
workers = multiprocessing.cpu_count()

# Type of worker process - sync is the default synchronous worker
worker_class = "sync"

# Maximum number of simultaneous connections for each worker
worker_connections = 1000

# Timeout for requests in seconds
timeout = 120

# How long to keep idle connections alive
keepalive = 2

# Log errors to stdout (-)
errorlog = "-"

# Logging level
loglevel = "info"

# Access log to stdout (-)
accesslog = "-"

# Format string for access logs
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Restart workers after this many requests to prevent memory leaks
max_requests = 1000

# Add random jitter to max_requests to prevent all workers restarting at once
max_requests_jitter = 50

# How long to wait for workers to finish serving requests before force killing
graceful_timeout = 120

# Load application code before worker processes are forked
preload_app = True

# Allow forwarded requests from any IP
forwarded_allow_ips = '*'

# Enable PROXY protocol support
proxy_protocol = True

# Allow proxy requests from any IP
proxy_allow_ips = '*'