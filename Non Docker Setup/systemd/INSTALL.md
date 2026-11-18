# Install systemd timer (optional)

```bash
sudo cp /opt/fbreelz/systemd/fbreelz_refresh.service /etc/systemd/system/
sudo cp /opt/fbreelz/systemd/fbreelz_refresh.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now fbreelz_refresh.timer
systemctl list-timers | grep fbreelz
```

> Edit `--http-base` in the service `ExecStart` to match your server IP or hostname.
