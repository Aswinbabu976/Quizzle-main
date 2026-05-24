<div align="center">
  <img src="landing/public/quizzle-title.png" alt="Quizzle Logo" width="400"/>
  
  **A free, open-source quiz platform for schools**
  
  *Self-hosted • Data privacy compliant • No monthly costs*
  
  [![GitHub stars](https://img.shields.io/github/stars/gnmyt/Quizzle?style=for-the-badge)](https://github.com/gnmyt/Quizzle/stargazers)
  [![GitHub license](https://img.shields.io/github/license/gnmyt/Quizzle?style=for-the-badge)](https://github.com/gnmyt/Quizzle/blob/main/LICENSE)
  [![Docker Pulls](https://img.shields.io/docker/pulls/germannewsmaker/quizzle?style=for-the-badge)](https://hub.docker.com/r/germannewsmaker/quizzle)
  
</div>

---

## What is Quizzle?

Quizzle is a self-hosted quiz platform designed for classrooms and learning environments. 
You can host live quizzes directly in the classroom or provide practice quizzes for independent preparation.

* **Live Quizzes:** Students join instantly via QR code without needing to create an account.
* **Practice Quizzes:** Designed for self-paced independent preparation.
* **Self-Hosted:** Runs locally on your own server, ensuring full control over your data.
* **Free & Open Source:** Complete access to all features without any subscription models.
* **Mobile Friendly:** Works seamlessly on smartphones, tablets, and desktops.

## Quick Start with Docker

## Features

- Interactive quiz system
- AI-assisted learning experience
- Modern responsive UI
- Docker support
- Fast frontend performance
- User-friendly design

---

## Technologies Used

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

### Backend / Tools
- Docker
- Node.js
- GitHub Actions

---

## Project Structure

```text
Quizzle-main/
├── src/               # Main application source code
├── public/            # Static files
├── content/           # Branding and configuration
├── landing/           # Landing page files
├── .github/workflows/ # CI/CD workflows
├── Dockerfile         # Docker configuration
└── README.md

```bash
# docker-compose.yml anlegen
version: '3.8'
services:
  quizzle:
    image: germannewsmaker/quizzle:latest
    ports:
      - "6412:6412"
    volumes:
      - ./data:/quizzle/data
    environment:
      - TZ=Europe/Berlin
    restart: unless-stopped

# starten
docker-compose up -d
```

## Entwicklung

```bash
# Repository klonen
git clone https://github.com/gnmyt/Quizzle.git
cd Quizzle

# Backend starten
yarn install
yarn run dev

# Frontend (neues Terminal)
cd webui
yarn install  
yarn run dev
```

## Contributing

Contributions are always welcome!

* **Report Bugs:** Open an [Issue](https://github.com/gnmyt/Quizzle/issues) to report any bugs.
* **Suggest Features:** Submit your ideas and feature requests.
* **Contribute Code:** Open a Pull Request to contribute directly.

## License

This project is licensed under the [MIT License](LICENSE).
