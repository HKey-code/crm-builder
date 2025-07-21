# CRM Builder

[![Tests](https://github.com/{owner}/{repo}/workflows/Run%20Tests/badge.svg)](https://github.com/{owner}/{repo}/actions/workflows/test.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/{owner}/{repo}/actions/workflows/test.yml)
[![Deploy Infrastructure](https://github.com/{owner}/{repo}/workflows/Deploy%20Azure%20Infrastructure/badge.svg)](https://github.com/{owner}/{repo}/actions/workflows/deploy-infra.yml)
[![Deploy Application](https://github.com/{owner}/{repo}/workflows/Deploy%20Application/badge.svg)](https://github.com/{owner}/{repo}/actions/workflows/deploy-app.yml)

A modern, multi-tenant CRM application built with NestJS backend and React frontend, featuring automated testing, CI/CD pipelines, and Azure cloud infrastructure.

## 🚀 Features

- **Multi-tenant Architecture**: Isolated environments for different tenants
- **Modern Tech Stack**: NestJS backend with React frontend
- **Automated Testing**: Comprehensive test suite with coverage reporting
- **CI/CD Pipelines**: Automated deployment to Azure with GitHub Actions
- **Infrastructure as Code**: Azure Bicep templates for reproducible infrastructure
- **Security First**: Azure Key Vault integration and secure secret management

## 🏗️ Architecture

```
├── apps/
│   ├── backend/          # NestJS API server
│   └── frontend/         # React web application
├── libs/                 # Shared libraries
├── devops/               # Infrastructure and deployment
│   └── iac/             # Azure Bicep templates
└── .github/workflows/    # GitHub Actions CI/CD
```

## 🧪 Testing

The project includes comprehensive automated testing:

- **Backend Tests**: Jest-based unit and integration tests
- **Frontend Tests**: Unit tests with optional E2E testing via Playwright
- **Coverage Reporting**: Detailed coverage reports for both applications
- **Automated CI**: Tests run on every push and pull request

### Running Tests Locally

```bash
# Backend tests
cd apps/backend
npm test

# Frontend tests
cd apps/frontend
npm test

# With coverage
npm run test:cov
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Azure subscription (for deployment)

### Environment Setup

1. Copy the example environment file and configure your local environment:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)
   - `AZURE_*`: Azure AD/Entra ID credentials (for future authentication)
   - `JWT_SECRET`: A secure random string for JWT token signing

3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```

### Development

```bash
# Install all dependencies
npm install

# Start backend development server
cd apps/backend && npm run start:dev

# Start frontend development server
cd apps/frontend && npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🚀 Deployment

### Automated Deployment

The project includes comprehensive CI/CD pipelines:

- **Infrastructure Deployment**: Automated Azure resource provisioning
- **Application Deployment**: Automated app deployment to Azure App Services
- **Multi-Environment Support**: Dev, staging, and production environments
- **Change Detection**: Only deploys applications that have changed

### Manual Deployment

See [`.github/workflows/README.md`](.github/workflows/README.md) for detailed deployment instructions.

## 📊 Monitoring & Observability

- **Application Insights**: Built-in monitoring and logging
- **Test Coverage**: Comprehensive coverage reporting
- **Deployment Tracking**: Detailed deployment logs and artifacts
- **Error Reporting**: Automated error detection and reporting

## 🔒 Security

- **Azure Key Vault**: Secure secret management
- **Environment Isolation**: Separate resources per environment
- **RBAC**: Role-based access control
- **Network Security**: Private endpoints and firewall rules
- **Dependency Scanning**: Automated vulnerability detection

## 📚 Documentation

- [Infrastructure Documentation](devops/iac/README.md)
- [CI/CD Workflows](.github/workflows/README.md)
- [API Documentation](apps/backend/README.md)
- [Frontend Documentation](apps/frontend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review [existing issues](https://github.com/{owner}/{repo}/issues)
- Create a [new issue](https://github.com/{owner}/{repo}/issues/new)# Deployment trigger - Sun Jul 20 21:45:17 CDT 2025
# Test deployment with secrets
