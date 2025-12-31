# TimeNexa Troubleshooting Guide

This document outlines common issues and their resolutions for the TimeNexa AMS.

## 1. Device Connectivity Issues

### Symptom: Device Logic "Offline" in Dashboard
*   **Cause 1: Network Reachability.** The server cannot reach the device, or the device cannot reach the server (Push/ADMS mode).
    *   **Fix:** Ping the device IP from the server. Ensure the device Gateway is set correctly.
*   **Cause 2: Incorrect Server IP in Device.**
    *   **Fix:** On the physical device menu, go to `Comm.` -> `Cloud Server` / `ADMS`. Ensure `Server Addr` matches your deployment server IP and `Server Port` is 3001.
*   **Cause 3: Firewall Blocking.**
    *   **Fix:** Ensure port `3001` (or your configured ADMS port) is open in the server's firewall (UFW/AWS Security Group).

### Symptom: "Punch logs not syncing"
*   **Check:** Look at the `Server Logs`. If you see "heartbeat" but no "attendance", the device might have the records marked as "sent" already.
*   **Action:** Truncate (delete) logs on the device if it's a test device, or use the "Re-upload" command from the Device Management page.

## 2. Server & Database Issues

### Error: `EADDRINUSE: address already in use`
*   **Cause:** Another process is using port 3001.
*   **Fix:**
    ```bash
    # Find the process
    lsof -i :3001
    # Kill it
    kill -9 <PID>
    ```

### Error: `Connection refused` (Database)
*   **Cause:** PostgreSQL is not running or credentials in `.env` are wrong.
*   **Fix:**
    1.  Check Postgres status: `sudo systemctl status postgresql`
    2.  Check `.env` file credentials.
    3.  Ensure `pg_hba.conf` allows connection (especially if using Docker/Remote DB).

## 3. Frontend/UI Issues

### Error: "Network Error" / API Failures
*   **Cause:** The frontend cannot reach the backend API.
*   **Fix:**
    *   Check if the variable `VITE_API_URL` (if used) points to the correct backend IP.
    *   In Nginx, verify the `/api` proxy pass configuration.
    *   Check browser Console (F12) for CORS errors.

### Issue: "White Screen" after deployment
*   **Cause:** Routing issue in SPA (Single Page Application).
*   **Fix:** Ensure Nginx is configured with `try_files $uri $uri/ /index.html;` so that React Router handles the paths, not the web server.

## 4. Docker Specifics

### Issue: Containers keep restarting
*   **Action:** Check logs: `docker-compose logs --tail=100`.
*   **Common Cause:** Database is not ready when Server tries to connect. (The `depends_on` in compose only waits for the container to start, not the DB to be ready to accept connections. The app handles this with retry logic, but sometimes it times out).
*   **Fix:** Restart the server container: `docker-compose restart server`.

### Issue: Data lost after restart
*   **Cause:** Docker volume not mapped correctly.
*   **Fix:** Ensure the `volumes: - pgdata:/var/lib/postgresql/data` section exists in `docker-compose.yml`.
