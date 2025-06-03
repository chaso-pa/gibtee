# Docker Setup and Usage

## 🐳 Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/chaso-pa/gibtee.git
cd gibtee
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your actual values
# Required: LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, AWS credentials, etc.
```

3. **Start all services**
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

4. **Access the application**
- Admin Panel: http://localhost (port 80)
- LINE Bot API: http://localhost:3000
- Image Processor API: http://localhost:4000

### Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │    LINE Bot      │    │ Image Processor │
│   (React/Nginx) │◄──►│ (Node.js/Express)│◄──►│ (Node.js/Sharp) │
│     Port: 80    │    │    Port: 3000    │    │   Port: 4000    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                          ┌───────▼───────┐
                          │  MySQL DB     │
                          │  Port: 3306   │
                          └───────────────┘
```

### Individual Service Commands

#### Build specific service
```bash
# Build LINE Bot service
docker-compose build line-bot

# Build Image Processor service
docker-compose build image-processor

# Build Admin Panel service
docker-compose build admin-panel
```

#### Run specific service
```bash
# Start only LINE Bot and dependencies
docker-compose up line-bot

# Start only Image Processor and dependencies
docker-compose up image-processor

# Start only Admin Panel and dependencies
docker-compose up admin-panel
```

#### Development Commands
```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f line-bot

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart specific service
docker-compose restart line-bot
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot access token | ✅ |
| `LINE_CHANNEL_SECRET` | LINE Bot channel secret | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | ✅ |
| `AWS_S3_BUCKET` | S3 bucket name for image storage | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for image processing | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | ✅ |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | ❌ |
| `MYSQL_PASSWORD` | Database password | ✅ |

### Troubleshooting

#### Service won't start
```bash
# Check service status
docker-compose ps

# Check service logs
docker-compose logs service-name

# Rebuild without cache
docker-compose build --no-cache service-name
```

#### Database connection issues
```bash
# Wait for MySQL to be ready
docker-compose exec mysql mysqladmin ping -h localhost

# Access MySQL directly
docker-compose exec mysql mysql -u gibtee -p gibtee
```

#### Port conflicts
```bash
# Check which ports are in use
netstat -tulpn | grep :3000

# Modify ports in docker-compose.yml if needed
```

### Production Deployment

#### Security Considerations
- Use strong passwords in production
- Enable SSL/TLS certificates
- Configure firewall rules
- Use Docker secrets for sensitive data
- Enable resource limits

#### Scaling
```bash
# Scale specific service
docker-compose up --scale image-processor=3

# Use Docker Swarm for production scaling
docker swarm init
docker stack deploy -c docker-compose.yml gibtee
```

### Health Checks

All services include health check endpoints:
- LINE Bot: `GET /health`
- Image Processor: `GET /health`
- Admin Panel: `GET /health`

### Backup and Recovery

#### Database Backup
```bash
# Create database backup
docker-compose exec mysql mysqldump -u root -p gibtee > backup.sql

# Restore database backup
docker-compose exec -T mysql mysql -u root -p gibtee < backup.sql
```

#### Volume Backup
```bash
# Backup all volumes
docker run --rm -v gibtee_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .
```

---

For more detailed configuration, see individual service documentation in their respective directories.
