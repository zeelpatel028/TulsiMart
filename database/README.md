# Tulsi Mart Database Architecture

This directory contains database schemas, migrations, and seeding scripts for Tulsi Mart POS & ERP System.

## Structure
- `schema/`: PostgreSQL SQL creation queries and DDL for all 24 production tables.
- `seeds/`: Operational data seeding scripts.
- `migrations/`: Raw migration scripts.

## Database Systems Supported
- **PostgreSQL**: Production Cloud Database (Render / Aiven)
- **MySQL**: Managed Cloud MySQL Database (Aiven Cloud)
- **SQLite**: Local Offline / Development Database (`tulsimart.sqlite3`)
