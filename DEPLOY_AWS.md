# Deploying Smart Bio GPT to AWS — exact step-by-step

This guide deploys the **entire backend** (NGINX gateway, `auth-service`,
`bio-service`, `chat-service`, PostgreSQL, Redis, the schema migrator) **and** the
built frontend to **one AWS EC2 instance**, brought up with **one command**:

```bash
docker compose up -d --build
```

Everything runs in Docker on the instance exactly as it does on your laptop —
the only additions for production are a **Caddy TLS edge** (automatic HTTPS),
`restart: always`, log rotation and memory limits, all in
`docker-compose.prod.yml`.

> **Why EC2 and not ECS/Fargate?** You asked for the single-`docker compose`
> workflow to keep working in the cloud. EC2 + Docker Compose gives you exactly
> that. A managed path (ECS + RDS + ElastiCache + ALB) is in
> [Appendix A](#appendix-a--scaling-up-later) for when you outgrow one box.

---

## Contents

- [0. What you need before you start](#0-what-you-need-before-you-start)
- [1. Cost estimate](#1-cost-estimate)
- [2. Sizing — which instance to pick](#2-sizing--which-instance-to-pick)
- [3. Region](#3-step--choose-a-region)
- [4. Elastic IP](#4-step--allocate-an-elastic-ip)
- [5. Security group (firewall)](#5-step--create-a-security-group)
- [6. Launch the EC2 instance](#6-step--launch-the-ec2-instance-every-field)
- [7. Attach the Elastic IP](#7-step--associate-the-elastic-ip)
- [8. DNS — point your domain at the server](#8-step--point-dns-at-the-elastic-ip)
- [9. Connect over SSH](#9-step--connect-over-ssh)
- [10. Install Docker + Compose](#10-step--install-docker--the-compose-plugin)
- [11. Add swap](#11-step--add-swap-build-headroom)
- [12. Get the code and configure `.env`](#12-step--get-the-code-and-configure-env)
- [13. THE ONE COMMAND](#13-step--the-one-command)
- [14. Verify](#14-step--verify)
- [15. Point Google / OpenRouter / SMTP at the domain](#15-step--wire-google-oauth--openrouter--smtp)
- [16. Start on boot / survive reboots](#16-step--start-on-boot--survive-reboots)
- [17. Backups](#17-step--backups)
- [18. Updates / redeploy](#18-step--updates--redeploy)
- [19. Logs & monitoring](#19-step--logs--monitoring)
- [20. Security hardening checklist](#20-step--security-hardening-checklist)
- [21. Troubleshooting](#21-troubleshooting)
- [22. Teardown (stop billing)](#22-teardown-stop-all-billing)
- [Appendix A — scaling up later](#appendix-a--scaling-up-later)
- [Appendix B — CI/CD (optional)](#appendix-b--cicd-optional)

---

## 0. What you need before you start

| Thing | Notes |
|---|---|
| **AWS account** | with a payment method and permission to create EC2, VPC, EBS resources |
| **A domain name** | e.g. `yourdomain.com`. You'll use a subdomain like `api.yourdomain.com`. Needed for HTTPS. Route 53 or any registrar works. |
| **SSH client** | `ssh` (built into macOS/Linux/Windows 10+). On Windows you can also use PuTTY. |
| **Google OAuth client** | (optional) from Google Cloud Console — for "Continue with Google" |
| **OpenRouter API key** | (optional) from openrouter.ai — for real AI answers |
| **SMTP credentials** | (optional) e.g. a Gmail address + 16-char App Password — for welcome emails |
| **~30 minutes** | first deploy |

---

## 1. Cost estimate

Region **us-east-1**, on-demand, as of 2025. Your bill varies by region and usage.

| Item | Choice | Monthly (approx) |
|---|---|---|
| EC2 instance | `t3.medium` (2 vCPU, 4 GiB) | **~$30** |
| EC2 instance | `t3.large` (2 vCPU, 8 GiB) — *recommended* | **~$60** |
| EBS root volume | 40 GiB gp3 | **~$3.20** |
| Public IPv4 address | 1 Elastic IP (attached) | **~$3.60** |
| Data transfer out | first 100 GB/mo free, then ~$0.09/GB | **$0–5** |
| EBS snapshots (backups) | ~40 GiB, incremental | **~$2** |
| Route 53 hosted zone | (if you use it) | **$0.50** |
| **Total** | t3.medium | **~$40–45 / month** |
| **Total** | t3.large | **~$70–75 / month** |

> **Free-tier note:** the 12-month free tier only covers `t2.micro`/`t3.micro`
> (1 GiB RAM) — **too small** to build and run this stack. Use `t3.medium`+.
> A 3-year **Compute Savings Plan** cuts the instance cost ~40%.

---

## 2. Sizing — which instance to pick

The stack at idle uses ~1.3 GiB RAM. Building the frontend (Vite) needs ~1.5 GiB
on its own.

| Instance | vCPU | RAM | Use it if… | Verdict |
|---|---|---|---|---|
| `t3.small` | 2 | 2 GiB | never — can't build the images | ❌ |
| `t3.medium` | 2 | 4 GiB | demo / low traffic; add 2 GiB swap (Step 11) | ✅ **minimum** |
| `t3.large` | 2 | 8 GiB | real usage, comfortable builds, headroom | ✅ **recommended** |
| `t3.xlarge` | 4 | 16 GiB | heavier traffic, faster builds | 💰 if needed |
| `c7i.large` / `m7i.large` | 2 | 4–8 GiB | newer gen, slightly better price/perf | optional |

- **Storage:** 40 GiB `gp3` is plenty (images ~2 GiB, DB grows slowly). Never go
  below 20 GiB.
- **Burst credits:** `t3` is burstable. This workload is bursty (API calls), so
  `t3` is a good fit. If CPU sits pegged, move to `c7i.large`. Keep
  **"Unlimited" mode on** (the default) so you're never throttled — it bills a
  few cents/hour only when you sustain >baseline CPU.

---

## 3. STEP — Choose a region

1. Sign in to the [AWS Console](https://console.aws.amazon.com/).
2. Top-right region selector → pick the region **closest to your users**
   (e.g. `us-east-1` N. Virginia, `eu-west-1` Ireland, `ap-south-1` Mumbai).
3. **Do every step below in the same region.**

---

## 4. STEP — Allocate an Elastic IP

A static public IP so your domain keeps pointing at the server across reboots.

1. Console → **EC2** → left nav **Network & Security → Elastic IPs**.
2. **Allocate Elastic IP address**.
   - Network border group: *(default — your region)*
   - Public IPv4 address pool: **Amazon's pool of IPv4 addresses**
3. **Allocate**. Note the IP (e.g. `52.x.x.x`). You'll attach it to the instance
   in Step 7.

---

## 5. STEP — Create a security group

1. EC2 → **Network & Security → Security Groups** → **Create security group**.
2. **Basic details**
   - Security group name: `smartbiogpt-sg`
   - Description: `Smart Bio GPT edge`
   - VPC: **the default VPC** (there's exactly one unless you made others)
3. **Inbound rules** → Add rule (three rules):

   | Type | Protocol | Port range | Source | Description |
   |---|---|---|---|---|
   | SSH | TCP | 22 | **My IP** | admin access |
   | HTTP | TCP | 80 | Anywhere-IPv4 `0.0.0.0/0` | Caddy: ACME challenge + HTTP→HTTPS redirect |
   | HTTPS | TCP | 443 | Anywhere-IPv4 `0.0.0.0/0` | the app |

   Optionally add a 4th rule: **Custom UDP, port 443, `0.0.0.0/0`** (HTTP/3).

   > Do **not** open 5432 (Postgres), 6379 (Redis), 4001–4003 or 8080. They stay
   > inside the Docker network. Nothing but Caddy needs a host port.
4. **Outbound rules:** leave the default **All traffic → `0.0.0.0/0`** (the
   services call UniProt, OpenRouter, SMTP, etc.).
5. **Create security group.**

> When your home/office IP changes, edit the SSH rule's source. Or use
> **EC2 Instance Connect** / **SSM Session Manager** instead of opening 22 at all
> (see [Step 20](#20-step--security-hardening-checklist)).

---

## 6. STEP — Launch the EC2 instance (every field)

EC2 → **Instances → Launch instances**.

### Name and tags
- **Name:** `smartbiogpt-prod`

### Application and OS Images (AMI)
- Click **Ubuntu**.
- Select **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type**.
- Architecture: **64-bit (x86)**.
  *(Arm/Graviton `t4g` also works and is ~20% cheaper — but then pick the
  `64-bit (Arm)` AMI and a `t4g.medium`/`t4g.large` instance. The Docker images
  in this repo build fine on Arm.)*

### Instance type
- Choose **`t3.large`** (recommended) or **`t3.medium`** (minimum).

### Key pair (login)
- **Create new key pair.**
  - Name: `smartbiogpt-key`
  - Key pair type: **ED25519** (or RSA if your SSH client is old)
  - Private key file format: **.pem** (macOS/Linux or Windows OpenSSH) or
    **.ppk** (PuTTY)
- **Create key pair** → the file downloads. **Keep it safe — it's the only copy.**
  ```bash
  chmod 400 ~/Downloads/smartbiogpt-key.pem
  ```

### Network settings  → click **Edit**
- VPC: **default**
- Subnet: **No preference** (any AZ) — or pick one and remember it
- **Auto-assign public IP: Enable**
- Firewall (security groups): **Select existing security group** →
  **`smartbiogpt-sg`**

### Configure storage
- **1x  `40`  GiB  `gp3`  Root volume**
- Click the volume to expand:
  - IOPS: `3000` (free baseline)
  - Throughput: `125` MiB/s (free baseline)
  - Delete on termination: **Yes**
  - **Encrypted: Yes** → KMS key: `aws/ebs` (default)

### Advanced details  (scroll down; change only these)
- **Termination protection: Enable** (prevents an accidental delete)
- **Metadata version:** **V2 only (token required)** — IMDSv2, more secure
- **Detailed CloudWatch monitoring:** off (default; costs extra)
- Leave IAM instance profile empty for now (add one later if you want SSM/CloudWatch)
- **User data:** *(optional — installs Docker automatically on first boot; if you
  paste this you can skip Step 10)*
  ```bash
  #!/bin/bash
  set -e
  apt-get update -y
  apt-get install -y ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  usermod -aG docker ubuntu
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

### Summary panel (right side)
- Number of instances: **1**
- Click **Launch instance**.

Wait until **Instance state = Running** and **Status checks = 2/2 passed**
(~2 minutes).

---

## 7. STEP — Associate the Elastic IP

1. EC2 → **Elastic IPs** → select the one you allocated → **Actions → Associate
   Elastic IP address**.
2. Resource type: **Instance** → Instance: **`smartbiogpt-prod`** →
   Private IP: *(auto)*.
3. **Associate.**

The instance's public IP is now fixed to your Elastic IP.

---

## 8. STEP — Point DNS at the Elastic IP

You need a subdomain resolving to the Elastic IP **before** the first
`docker compose up` (Caddy validates the domain via an HTTP challenge).

### If your domain is on Route 53
1. Console → **Route 53 → Hosted zones** → your domain (create a hosted zone
   first if needed, and set the registrar's nameservers to the 4 NS records it
   gives you).
2. **Create record**
   - Record name: `api` (→ `api.yourdomain.com`)
   - Record type: **A**
   - Value: your **Elastic IP**
   - TTL: `300`
   - Routing policy: **Simple**
3. **Create records.**
4. (If the SPA is served from the same box, that's it. If you host the SPA
   separately, add an `app` A/CNAME record too.)

### If your domain is elsewhere (GoDaddy, Namecheap, Cloudflare, …)
- Add an **A record**: host `api`, value = Elastic IP, TTL 5 min.
- **Cloudflare users:** set the record to **DNS only (grey cloud)** for the first
  boot so Caddy can get its certificate. You can switch to proxied later, but
  then let Cloudflare handle TLS and Caddy will use its HTTP challenge via the
  grey-cloud record — simplest is to leave it grey.

### Verify DNS
```bash
dig +short api.yourdomain.com     # must print your Elastic IP
```
Wait until it does (can take a few minutes) before Step 13.

---

## 9. STEP — Connect over SSH

```bash
ssh -i ~/Downloads/smartbiogpt-key.pem ubuntu@api.yourdomain.com
# (or ubuntu@<ELASTIC_IP>)
```
Type `yes` at the fingerprint prompt. You're now on the server.

---

## 10. STEP — Install Docker + the Compose plugin

*Skip if you used the User-data script in Step 6 — just run `docker version` to
confirm, and `newgrp docker` or re-login so your user is in the `docker` group.*

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker            # apply group now (or log out and back in)

docker version           # client + server
docker compose version   # must be v2.24 or newer
```

---

## 11. STEP — Add swap (build headroom)

Essential on `t3.medium`, harmless on `t3.large`. Prevents the Vite build from
being OOM-killed.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h            # confirm Swap: 2.0Gi
```

---

## 12. STEP — Get the code and configure `.env`

```bash
cd ~
git clone https://github.com/saiprasad367/SmartBioGPT.git
cd SmartBioGPT

cp .env.production.example .env
```

Generate strong secrets:
```bash
echo "JWT_SECRET=$(openssl rand -base64 48)"
echo "INTERNAL_API_KEY=$(openssl rand -hex 24)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')"
echo "REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')"
```

Now edit `.env` (`nano .env`) and set **every** value:

| Key | Set to |
|---|---|
| `COMPOSE_FILE` | leave as `docker-compose.yml:docker-compose.prod.yml` |
| `PUBLIC_DOMAIN` | `api.yourdomain.com` |
| `ACME_EMAIL` | your real email (Let's Encrypt expiry notices) |
| `APP_PUBLIC_URL` | `https://api.yourdomain.com` |
| `CORS_ORIGINS` | `https://api.yourdomain.com` (add your SPA origin if separate, comma-separated) |
| `TRUST_PROXY` | `2` |
| `POSTGRES_PASSWORD`, `REDIS_PASSWORD` | the generated values |
| `JWT_SECRET`, `INTERNAL_API_KEY` | the generated values |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud Console (or leave blank) |
| `OPENROUTER_API_KEY` | from openrouter.ai (or leave blank → deterministic answers) |
| `SMTP_HOST`…`MAIL_FROM` | your SMTP (or blank `SMTP_HOST` → email disabled) |

Save (`Ctrl+O`, `Enter`, `Ctrl+X`).

> `.env` is `.gitignore`d — it never leaves this server. Verify:
> `git check-ignore .env` should print `.env`.

---

## 13. STEP — THE ONE COMMAND

```bash
docker compose up -d --build
```

Because `COMPOSE_FILE` is set in `.env`, this automatically merges
`docker-compose.yml` + `docker-compose.prod.yml`. It:

1. builds all 5 images (frontend, gateway, 3 services) — first run ~4–8 min,
2. starts Postgres + Redis, waits for them to be healthy,
3. runs the **migrator** (applies `db/schema.sql`, idempotent) and exits,
4. starts the 3 microservices + gateway + frontend,
5. starts **Caddy**, which fetches a Let's Encrypt certificate for
   `PUBLIC_DOMAIN` and begins serving HTTPS.

Watch it:
```bash
docker compose logs -f caddy      # look for "certificate obtained successfully"
# Ctrl+C to stop following (containers keep running)
docker compose ps                 # every row should be "Up ... (healthy)"
```

---

## 14. STEP — Verify

```bash
curl -s https://api.yourdomain.com/api/health           ; echo
curl -s https://api.yourdomain.com/api/auth/health      ; echo   # features: {google, mail}
curl -s https://api.yourdomain.com/api/chat/health      ; echo   # features: {ai, model}
curl -s https://api.yourdomain.com/api/bio/status       ; echo   # cache + circuit breakers
```

From your laptop, open **https://api.yourdomain.com** — the SPA loads over HTTPS
with a valid padlock.

End-to-end smoke test:
```bash
BASE=https://api.yourdomain.com
TOKEN=$(curl -s -X POST $BASE/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","password":"Passw0rd!23"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s -X POST $BASE/api/bio/search -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"query":"TP53"}' | head -c 300
# clean up:
docker exec smart-bio-gpt-postgres-1 psql -U smartbio -d smartbiogpt \
  -c "DELETE FROM users WHERE email='test@example.com';"
```

---

## 15. STEP — Wire Google OAuth / OpenRouter / SMTP

### Google
Google Cloud Console → **APIs & Services → Credentials** → your **OAuth 2.0
Client ID** (Web application):
- **Authorized JavaScript origins:** add `https://api.yourdomain.com`
  (and `https://app.yourdomain.com` if the SPA is on its own domain).
- Save. Put the Client ID in `.env` → `GOOGLE_CLIENT_ID`, then:
  ```bash
  docker compose up -d --build   # frontend must rebuild to bake in the client id
  ```

### OpenRouter
Put the key in `.env` → `OPENROUTER_API_KEY`. A key with **no credits** can only
use `:free` models (the default `OPENROUTER_MODEL` already is one). For reliable,
higher-quality answers, add credit at openrouter.ai and set
`OPENROUTER_MODEL=google/gemini-3.5-flash-lite`. Then:
```bash
docker compose up -d          # chat-service picks up the new env (no rebuild needed)
```

### SMTP (Gmail example)
`.env`: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`,
`SMTP_USER=you@gmail.com`, `SMTP_PASS=<16-char App Password>`,
`MAIL_FROM=Smart Bio GPT <you@gmail.com>` (must be the authenticated address).
```bash
docker compose up -d
docker compose logs auth-service | grep -i smtp   # expect "SMTP transport ready"
```

---

## 16. STEP — Start on boot / survive reboots

`docker-compose.prod.yml` already sets `restart: always` on every long-running
container, and Docker's service is enabled on boot by default:
```bash
sudo systemctl is-enabled docker      # -> enabled
```
So after a reboot or crash, the whole stack comes back on its own. Test it:
```bash
sudo reboot
# reconnect after ~30s, then:
docker compose ps                     # all healthy again
```

*(Optional)* an explicit systemd unit if you prefer managing it as a service:
```bash
sudo tee /etc/systemd/system/smartbiogpt.service >/dev/null <<'EOF'
[Unit]
Description=Smart Bio GPT
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/SmartBioGPT
ExecStart=/usr/bin/docker compose up -d --build
ExecStop=/usr/bin/docker compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable smartbiogpt
```

---

## 17. STEP — Backups

The database lives in the Docker volume `smart-bio-gpt_pgdata` on the EBS root
disk. Two layers:

### A. EBS snapshots (whole disk, automated)
1. Console → **EC2 → Elastic Block Store → Lifecycle Manager → Create lifecycle
   policy**.
2. Policy type: **EBS snapshot policy**.
3. Target resource tags: `Name = smartbiogpt-prod` (tag the instance's volume, or
   target by instance).
4. Schedule: **Daily**, start `03:00 UTC`, **Retain: 7** snapshots.
5. Enable **Copy tags**, create the default IAM role when prompted.
6. **Create policy.**

### B. Logical DB dump (portable, off-box)
```bash
mkdir -p ~/backups
docker exec smart-bio-gpt-postgres-1 pg_dump -U smartbio -d smartbiogpt \
  | gzip > ~/backups/sbg-$(date +%F).sql.gz
```
Automate + ship to S3:
```bash
aws s3 mb s3://your-sbg-backups            # once (needs AWS CLI + an IAM role/keys)
crontab -e
# add:
0 4 * * * docker exec smart-bio-gpt-postgres-1 pg_dump -U smartbio -d smartbiogpt | gzip | aws s3 cp - s3://your-sbg-backups/sbg-$(date +\%F).sql.gz
```

**Restore:**
```bash
gunzip -c ~/backups/sbg-2025-01-01.sql.gz \
  | docker exec -i smart-bio-gpt-postgres-1 psql -U smartbio -d smartbiogpt
```

---

## 18. STEP — Updates / redeploy

```bash
cd ~/SmartBioGPT
git pull
docker compose up -d --build       # rebuilds only what changed, recreates those containers
docker image prune -f              # reclaim space from old layers
```
Zero-downtime isn't guaranteed on a single box (a service restarts for a few
seconds). For true zero-downtime, see [Appendix A](#appendix-a--scaling-up-later).

Roll back:
```bash
git checkout <previous-commit>
docker compose up -d --build
```

---

## 19. STEP — Logs & monitoring

```bash
docker compose logs -f                     # everything
docker compose logs -f chat-service        # one service
docker compose logs --since 1h gateway
docker stats                               # live CPU/RAM per container
```
Logs are JSON with rotation (`max-size: 10m`, `max-file: 5`) — they can't fill
the disk.

*(Optional)* ship metrics/logs to **CloudWatch**:
1. Attach an IAM role to the instance with the
   **CloudWatchAgentServerPolicy** managed policy
   (EC2 → Instance → Actions → Security → Modify IAM role).
2. `sudo apt-get install -y amazon-cloudwatch-agent`, then configure with
   `amazon-cloudwatch-agent-config-wizard`.
3. Set a **billing alarm**: Console → **CloudWatch → Alarms → Create alarm →**
   metric `Billing / EstimatedCharges` → threshold e.g. `$60` → SNS email.

---

## 20. STEP — Security hardening checklist

- [x] Only 22/80/443 inbound; DB/Redis/services never exposed (done in Step 5).
- [ ] **Lock SSH to your IP** (Step 5) — or close 22 entirely and use **SSM
      Session Manager**: attach an IAM role with `AmazonSSMManagedInstanceCore`,
      then `aws ssm start-session --target <instance-id>`.
- [ ] `sudo apt-get install -y unattended-upgrades` — automatic security patches.
- [ ] Keep the `.pem` key offline and backed up; never commit it.
- [ ] Rotate `JWT_SECRET` / `INTERNAL_API_KEY` if ever exposed (`docker compose up -d`
      after editing `.env`; existing sessions are invalidated).
- [x] IMDSv2 required (Step 6) — blocks SSRF-to-credentials.
- [x] EBS encrypted at rest (Step 6).
- [ ] Enable **AWS GuardDuty** (Console → GuardDuty → Enable) — ~$1–4/mo, flags
      compromised-instance behaviour.
- [ ] `fail2ban`: `sudo apt-get install -y fail2ban` (bans SSH brute-forcers).
- [ ] Set the CloudWatch **billing alarm** (Step 19).
- [x] Caddy adds HSTS + security headers at the edge; services use Helmet.
- [ ] Restrict `CORS_ORIGINS` in `.env` to only the origins you actually serve.

---

## 21. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `docker compose` says `!reset` is invalid | Compose < 2.24. `sudo apt-get install --only-upgrade docker-compose-plugin`. |
| Caddy log: `could not get certificate` / `challenge failed` | DNS not pointing at the Elastic IP yet (`dig +short api.yourdomain.com`), or port 80 blocked in the security group, or Cloudflare proxy (orange cloud) on — set it grey. Caddy retries automatically. |
| `502` from the domain | A service isn't healthy yet. `docker compose ps`, `docker compose logs gateway auth-service`. |
| Build killed / `exit code 137` | Out of RAM. Add swap (Step 11) or use `t3.large`. |
| Frontend "Continue with Google" 400 | Add `https://api.yourdomain.com` to the OAuth client's Authorized JavaScript origins, then `docker compose up -d --build`. |
| Chat answers all `degraded: true` | No/empty `OPENROUTER_API_KEY`, or a paid model with a $0 key (402), or model 429. Use a `:free` model or fund the key. `docker compose logs chat-service`. |
| No welcome email | `SMTP_HOST` blank, `MAIL_FROM` ≠ authenticated address, wrong App Password. `docker compose logs auth-service | grep -i smtp`. |
| Disk full | `docker system prune -af --volumes` **(careful: `--volumes` deletes the DB if the stack is down — omit it, or stop only app services first)**. Better: `docker image prune -af`. Grow the EBS volume in the console, then `sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1`. |
| Reboot lost the containers | `docker compose ps` — `restart: always` should bring them back within a minute. If not: `cd ~/SmartBioGPT && docker compose up -d`. |
| Can't SSH after IP change | Update the SSH inbound rule's source in `smartbiogpt-sg`. |

---

## 22. Teardown (stop ALL billing)

```bash
# on the server
cd ~/SmartBioGPT && docker compose down -v      # -v also deletes the DB volume
```
Then in the Console:
1. **EC2 → Instances** → select `smartbiogpt-prod` → **Instance state →
   Terminate** (first: **Actions → Instance settings → Change termination
   protection** → disable).
2. **EC2 → Elastic IPs** → select yours → **Actions → Release** *(an unattached
   Elastic IP is billed — release it or attach it to something)*.
3. **EC2 → Volumes** → delete any leftover volume not deleted with the instance.
4. **EC2 → Snapshots** and **Lifecycle Manager** → delete the policy + snapshots.
5. **Route 53** → delete the record set (and hosted zone if unused — it's
   $0.50/mo).

Stopping (not terminating) the instance still bills the EBS volume + Elastic IP
(~$7/mo) but not the compute.

---

## Appendix A — scaling up later

When one box isn't enough, migrate piece by piece — the app already supports it:

| Bottleneck | Move to | Why it's easy here |
|---|---|---|
| Database load / you want automated failover + PITR | **Amazon RDS for PostgreSQL** (Multi-AZ, `db.t4g.medium`) | set `DATABASE_URL` in `.env` to the RDS endpoint, drop the `postgres` + `migrator` services (run `schema.sql` once against RDS), redeploy. |
| Cache / rate-limit state | **Amazon ElastiCache for Redis** | set `REDIS_URL` to the ElastiCache endpoint, drop the `redis` service. |
| Traffic > 1 instance, need zero-downtime deploys | **2+ EC2 instances behind an Application Load Balancer** + **ACM** cert on the ALB (drop Caddy; ALB terminates TLS, set `TRUST_PROXY=2`). The 3 services are stateless (`docker compose up -d --scale bio-service=3`). |
| Full managed containers | **ECS on Fargate** — one task def per service, an ALB, RDS, ElastiCache. Use `docker compose` locally still; translate to a task definition or use `ecs-cli`/Copilot. |
| Static SPA | **S3 + CloudFront** — build `bio-insight-ai-main` with `VITE_API_URL=https://api.yourdomain.com`, upload `dist/` to S3, serve via CloudFront on `app.yourdomain.com`; drop the `frontend` container. |

The `bio-service`, `auth-service` and `chat-service` are **stateless** and verify
JWTs locally, so horizontal scaling needs no code changes — just an external
Postgres + Redis.

---

## Appendix B — CI/CD (optional)

A minimal GitHub Actions deploy on push to `main` (SSH + `git pull` + rebuild):

```yaml
# .github/workflows/deploy.yml
name: deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}          # api.yourdomain.com
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}        # contents of smartbiogpt-key.pem
          script: |
            cd ~/SmartBioGPT
            git pull --ff-only
            docker compose up -d --build
            docker image prune -f
```
Add repo **Settings → Secrets and variables → Actions**: `EC2_HOST`, `EC2_SSH_KEY`.

---

*Questions or something out of date? Open an issue at
<https://github.com/saiprasad367/SmartBioGPT>.*
