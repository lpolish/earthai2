# EarthAI 2.0 🌍


[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.x-blue)](https://pnpm.io/)
[![Security Audit](https://github.com/lpolish/earthai2/actions/workflows/security-audit.yml/badge.svg)](https://github.com/lpolish/earthai2/actions/workflows/security-audit.yml)
[![Build Status](https://github.com/lpolish/earthai2/actions/workflows/build.yml/badge.svg)](https://github.com/lpolish/earthai2/actions/workflows/build.yml)
[![Deploy with Vercel](https://img.shields.io/badge/deploy%20with-vercel-black)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flpolish%2Fearthai2)

A location-aware AI assistant that provides contextual information about geographic locations through an interactive map interface.

## Features

- 🗺️ Interactive map interface with location awareness
- 💬 Real-time chat with location context
- 🔐 Google OAuth and email/password authentication
- 🏗️ User account management and session persistence
- 🌍 Reverse geocoding for human-readable location descriptions
- 📱 Responsive design with Tailwind CSS
- ⚡ Edge runtime for fast API responses
- 🎯 Context-aware AI responses based on map location

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Maps**: Leaflet.js with OpenStreetMap
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: Google Gemini Pro API
- **Database**: PostgreSQL with Drizzle ORM
- **Geocoding**: OpenStreetMap Nominatim API
- **Deployment**: Vercel-ready with edge runtime

## Getting Started

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lpolish/earthai2.git
   cd earthai2
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up database schema:**
   ```bash
   ./setup-auth.sh
   ```

4. **Run the development server:**
   ```bash
   pnpm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

### Authentication Setup

**Environment Variables (via Vercel):**
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console  
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_API_KEY` - For Gemini AI API

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://yourdomain.com/api/auth/callback/google`

## Usage

1. **Navigate the map** to your area of interest
2. **Sign in** using Google OAuth or create an account with email/password
3. **Use the chat interface** to ask questions about the current location
4. **Get AI responses** that are context-aware based on your map view
5. **Explore different locations** - the AI adapts its responses to each area

### Chat Features
- 🔗 **Map Links**: AI responses include clickable links that navigate the map
- 📍 **Location Context**: Questions are automatically enhanced with current map location
- 💾 **Persistent Sessions**: Your conversations are saved and restored
- 🎯 **Smart Responses**: AI provides relevant information about geography, culture, history, and more

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
