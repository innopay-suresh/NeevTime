# Production Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## Pre-Deployment

### Environment Setup
- [ ] Server/VM provisioned with required resources
- [ ] Static IP address assigned
- [ ] Domain name configured (if applicable)
- [ ] DNS records updated
- [ ] Firewall rules configured
- [ ] SSL certificate obtained (Let's Encrypt or commercial)

### Software Installation
- [ ] Node.js 18.x or 20.x LTS installed
- [ ] PostgreSQL 15.x installed and running
- [ ] Nginx installed and configured
- [ ] PM2 installed (for traditional deployment)
- [ ] Docker installed (for containerized deployment)
- [ ] Git installed

### Application Files
- [ ] Application code deployed to server
- [ ] All dependencies installed (`npm install`)
- [ ] Frontend built for production (`npm run build`)
- [ ] Environment variables configured (`.env` file)
- [ ] Database credentials verified

### Database
- [ ] PostgreSQL service running
- [ ] Database created (`attendance_db`)
- [ ] Database user created with proper permissions
- [ ] Schema initialized (all SQL files executed)
- [ ] Test data removed (if any)
- [ ] Database backup strategy configured

### Security
- [ ] Strong database password set
- [ ] JWT secret changed from default
- [ ] CORS configured for production domain only
- [ ] HTTPS/SSL certificate installed
- [ ] Firewall configured (ports 22, 80, 443, 3001, 8080)
- [ ] Unnecessary ports closed
- [ ] SSH key authentication enabled (disable password auth)
- [ ] Root login disabled (if applicable)

### Configuration
- [ ] Server URL updated in `.env`
- [ ] API URL configured in frontend
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] PM2 configuration saved (`pm2 save`)
- [ ] Log rotation configured
- [ ] Backup scripts created and tested

## Deployment

### Services Start
- [ ] PostgreSQL service started
- [ ] Backend server started (PM2 or Docker)
- [ ] Nginx service started
- [ ] All services verified running
- [ ] Health checks passing

### Verification
- [ ] Frontend accessible via browser
- [ ] API endpoints responding
- [ ] WebSocket connections working
- [ ] Database queries executing
- [ ] Login functionality working
- [ ] Device connection test successful

### Testing
- [ ] Create test employee
- [ ] Test device synchronization
- [ ] Test attendance logging
- [ ] Test report generation
- [ ] Test file upload/download
- [ ] Test real-time updates

## Post-Deployment

### Monitoring
- [ ] Log monitoring set up
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Disk space monitoring
- [ ] Database connection monitoring
- [ ] Device connectivity monitoring

### Documentation
- [ ] Deployment date documented
- [ ] Server credentials secured
- [ ] Access credentials shared with team
- [ ] Backup location documented
- [ ] Recovery procedures documented

### Maintenance
- [ ] Backup schedule configured
- [ ] Log rotation configured
- [ ] Update schedule planned
- [ ] Maintenance window scheduled
- [ ] Support contact information shared

## Rollback Plan

### If Issues Occur
- [ ] Backup available for restoration
- [ ] Rollback procedure documented
- [ ] Previous version accessible
- [ ] Database backup available
- [ ] Configuration backup available

## Sign-Off

- [ ] All checklist items completed
- [ ] Application tested and verified
- [ ] Team notified of deployment
- [ ] Monitoring active
- [ ] Support ready

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  
**Status**: ☐ Ready for Production

