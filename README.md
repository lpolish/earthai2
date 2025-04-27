# EarthAI 2.0 🌍

[![Build Status](https://github.com/lpolish/earthai2/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lpolish/earthai2/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.x-blue)](https://pnpm.io/)

A location-aware AI assistant that provides contextual information about geographic locations through an interactive map interface.

## Features

- Interactive map interface with location awareness
- Real-time chat with location context
- Reverse geocoding for human-readable location descriptions
- Responsive design with Tailwind CSS
- Edge runtime for fast API responses

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Leaflet.js for maps
- Google Gemini AI
- OpenStreetMap Nominatim for geocoding

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/lpolish/earthai2.git
   cd earthai2
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file with your API keys:
   ```
   GOOGLE_API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Navigate the map to your area of interest
2. Use the chat interface to ask questions about the current location
3. The AI will provide context-aware responses based on your map view

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenStreetMap for map data
- Google for the Gemini AI API
- The Next.js team for the amazing framework
