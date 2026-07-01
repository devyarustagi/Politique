# Politique
HOW TO RUN:
1. Docker and git must be installed on your system.
2. Clone the github repo onto your device.
3. cd into the project directory.
4. Run the following commands:- 
```bash
cp .env.sample.backend ./backend/.env
cp .env.sample.frontend ./frontend/.env
cp .env.sample.database ./.env
docker compose up --build
```
5. Open `http://localhost:3000/register` in your browser.

DUMMY ACCOUNTS:
There are 4 dummy accounts -> player1/2/3/4 . The password for each account is admin123.