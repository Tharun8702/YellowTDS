# VPS Installation

YellowTDS can be installed on a clean Debian/Ubuntu VPS with `install.sh`. The script installs nginx, PHP-FPM, an HTTPS certificate, the MaxMind C extension for faster GeoLite2 database reads, and blocks external access to private runtime files such as SQLite databases, logs, temp files, settings, MaxMind databases, and repository metadata.

## Short Command

```bash
curl -fsSL https://raw.githubusercontent.com/Tharun8702/YellowTDS/multipleconfigs/install.sh | sudo bash
```

The script asks for the primary domain. Before issuing the certificate, it verifies that the domain DNS points to the VPS public IP. If the domain is not pointed yet, installation stops and shows the expected IP and currently resolved IPs.

## What the Installer Does

- installs nginx, PHP 8.4 FPM/CLI, SQLite, curl, mbstring, zip/xml, and certbot;
- installs `libmaxminddb` and the PECL `maxminddb` extension;
- enables `maxminddb` for PHP CLI and FPM and verifies the extension is loaded;
- asks for a MaxMind license key to download `GeoLite2-Country.mmdb` and `GeoLite2-ASN.mmdb` into `bases/`;
- if the MaxMind key is skipped, warns that both database files must be placed in `bases/` manually;
- configures writable permissions for `db/`, `logs/`, `ycclogs/`, `tmp/`, `caching/`, and `bases/`;
- creates the nginx config and issues an HTTPS certificate with certbot.

## Adding Domains

To add domains to an existing instance without creating a new database:

```bash
curl -fsSL https://raw.githubusercontent.com/Tharun8702/YellowTDS/multipleconfigs/install.sh | sudo bash -s -- --add-domain
```

The script asks for the existing YellowTDS installation directory and comma-separated domains:

```text
tds1.example.com,tds2.example.com,track.example.net
```

Each domain is checked through DNS, gets its own nginx config and HTTPS certificate, and points to the same YellowTDS directory and SQLite database.

## Environment Variables

For automation, pass values non-interactively:

```bash
curl -fsSL https://raw.githubusercontent.com/Tharun8702/YellowTDS/multipleconfigs/install.sh \
  | sudo YELLOWTDS_DOMAIN=tds.example.com MAXMIND_LICENSE_KEY=your_maxmind_key bash
```

For batch domain additions:

```bash
curl -fsSL https://raw.githubusercontent.com/Tharun8702/YellowTDS/multipleconfigs/install.sh \
  | sudo YELLOWTDS_APP_DIR=/var/www/tds.example.com YELLOWTDS_DOMAINS=tds1.example.com,tds2.example.com bash -s -- --add-domain
```

Supported variables:

- `YELLOWTDS_DOMAIN` — primary domain for full install;
- `YELLOWTDS_DOMAINS` — comma-separated domains for `--add-domain`;
- `YELLOWTDS_APP_DIR` — install directory or existing instance directory;
- `YELLOWTDS_REPO_ZIP` — repository ZIP URL when a custom source is needed;
- `MAXMIND_LICENSE_KEY` — MaxMind key for GeoLite2 downloads;
- `SKIP_SSL=1` — skip certbot in test environments.

## Private File Protection

The installer nginx config denies direct access to:

- SQLite/data files: `.db`, `.sqlite`, `.sqlite3`, `.db-wal`, `.db-shm`;
- `settings.php`, `.env`, `.git`, SQL, log/cache/backup files;
- `db/`, `logs/`, `ycclogs/`, `tmp/`;
- private cache folders: `caching/devices`, `caching/currency`, `caching/whites_curl`;
- `bases/*.mmdb`, `bases/*.phar`, `bases/*.txt`;
- `composer.json`, `composer.lock`, `phpunit.xml`, `agents.md`, `AGENTS.md`.

Public entrypoints, admin assets, JS assets, landing/white static assets, thank-you assets, and direct-load routing remain available.
