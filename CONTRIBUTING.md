# Contributing to Happy Balance

First off, thank you for considering contributing to Happy Balance! It's people like you that make Happy Balance such a great tool for the privacy-conscious community.

## 🌟 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed and what behavior you expected
* Include screenshots if possible
* Include your environment details (OS, browser, Docker version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a detailed description of the suggested enhancement
* Provide specific examples to demonstrate the use case
* Explain why this enhancement would be useful to most Happy Balance users

### Bank Import Support

Want to add support for your bank's CSV format? We'd love your contribution!

1. Create an issue with your bank name
2. Provide a sample CSV format (with dummy data)
3. We'll work together to implement the import format

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Issue that pull request!

## 🚀 Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/happy-balance.git
cd happy-balance

# Install dependencies
pnpm install
cd backend && pnpm install

# Start development
pnpm dev
```

## 📋 Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### TypeScript Styleguide

* Use TypeScript for all new code
* Follow the existing code style
* Use meaningful variable names
* Add comments for complex logic
* Keep functions small and focused

### Documentation Styleguide

* Use Markdown for documentation
* Reference functions and classes in backticks: \`functionName()\`
* Include code examples when relevant

## 🌍 Translations

Want to help translate Happy Balance to your language?

1. Check the `src/lib/i18n` directory
2. Copy an existing language file
3. Translate all strings
4. Submit a PR with your translation

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🙋 Questions?

Feel free to open an issue with your question or reach out through our discussion forum.

## 🎉 Recognition

Contributors will be recognized in our README. Your contributions, no matter how small, are greatly appreciated!

---

Thank you for making Happy Balance better for everyone! 💚