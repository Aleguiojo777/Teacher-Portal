# Maintenance Checklist & Documentation

## Weekly Checklist
- [ ] Check server is running without errors
- [ ] Verify database is accessible
- [ ] Review user login activity
- [ ] No unusual error messages in logs

## Monthly Checklist
- [ ] Backup database file
- [ ] Review and audit user accounts
- [ ] Check npm dependencies for security updates
  ```bash
  cd backend
  npm audit
  ```
- [ ] Review attendance and student records for integrity

## Quarterly Checklist
- [ ] Update npm packages
  ```bash
  npm update
  npm audit fix
  ```
- [ ] Test database backup restoration
- [ ] Security review of authentication
- [ ] Performance optimization review

## Yearly Checklist
- [ ] Rotate JWT_SECRET (create new, migrate to it, then remove old)
- [ ] Full security audit
- [ ] Upgrade Node.js to latest LTS
- [ ] Archive old data if needed
- [ ] Documentation review and update

## Performance Optimization

### Database Optimization
1. Regularly backup and compact database
2. Monitor query performance
3. Index frequently searched columns

### Backend Performance
1. Enable compression in Express
2. Use caching for static files
3. Monitor memory usage
4. Set appropriate database connection limits

### Frontend Performance
1. Minify CSS and JavaScript
2. Optimize image sizes
3. Use browser caching

## Security Best Practices

### Authentication
- [ ] JWT_SECRET is complex (min 32 characters)
- [ ] Passwords are hashed with bcrypt
- [ ] JWT expiry is set appropriately (7 days default)

### API Security
- [ ] CORS is properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented if needed

### Infrastructure
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Backup strategy in place

## Backup Strategy

### Daily
- Automated database backup (recommended)
- Store in separate location

### Weekly
- Manual backup for verification
- Test restoration process

### Monthly
- Off-site backup copy
- Verify backup integrity

## Disaster Recovery

### Database Recovery
1. Stop the server
2. Restore from backup
3. Verify data integrity
4. Restart server

### Full System Recovery
1. Restore from version control (git)
2. Restore database backup
3. Reinstall node_modules
4. Verify configuration in .env
5. Restart services

## Common Issues & Solutions

### Issue: Server won't start
**Solution:**
- Check .env file exists
- Verify PORT is not in use
- Check database path exists
- Review error logs

### Issue: Slow performance
**Solution:**
- Check database file size
- Monitor server CPU/memory
- Review active user count
- Check network connectivity

### Issue: Users can't login
**Solution:**
- Verify JWT_SECRET is set
- Check database has users
- Review CORS_ORIGIN setting
- Check browser console for errors

### Issue: Database locked
**Solution:**
- Restart the server
- If persists, delete database and restore backup
- Check no multiple instances running

## Logging & Monitoring

### Log Locations
- Server logs: Console output
- Database logs: Check database file
- Browser logs: Browser DevTools Console

### Useful Commands
```bash
# View server process
ps aux | grep node

# Check port usage
netstat -ano | findstr :3000

# View disk usage
du -sh backend/database/

# Monitor real-time
npm install -g pm2
pm2 monit
```

## Update Dependencies

### Check for Updates
```bash
npm outdated
```

### Safe Update Process
1. Create backup
2. Run `npm update`
3. Test thoroughly
4. If issues, rollback from git

### Force Major Version Update
```bash
npm install express@5
```

## Documentation Updates
- [ ] Update this file after major changes
- [ ] Keep DEPENDENCIES.md current
- [ ] Document custom configurations
- [ ] Note any deviations from standard setup
