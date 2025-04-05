import multiprocessing

# Gunicorn config variables
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count()
worker_class = "sync"
worker_connections = 1000
timeout = 600
keepalive = 2
errorlog = "-"
loglevel = "info"
accesslog = "-"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
max_requests = 1000
max_requests_jitter = 50
graceful_timeout = 600
preload_app = True
forwarded_allow_ips = '*'
proxy_protocol = True
proxy_allow_ips = '*'