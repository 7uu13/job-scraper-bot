FROM node:18-slim

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends

# Install Chromium browser
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb || apt-get install -fy

# Clean up unnecessary packages
RUN apt-get purge --auto-remove -y wget && apt-get clean

# Set environment variables for Puppeteer to use headless Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY index.js .

# Command to run the app (e.g., your index.js file)
CMD ["node", "index.js"]
