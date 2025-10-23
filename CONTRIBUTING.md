# Contributing to USF Preschool Autopay Extension

Thank you for your interest in contributing to the USF Preschool Autopay Extension! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists
2. Search through closed issues
3. Ensure you're using the latest version

When creating an issue, please include:
- Browser version and OS
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Suggesting Features

We welcome feature suggestions! Please:
1. Check existing feature requests
2. Provide a clear description
3. Explain the use case
4. Consider implementation complexity

### Code Contributions

#### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/usf-preschool-autopay.git
   cd usf-preschool-autopay
   ```

2. **Load the extension in developer mode**
   - Chrome: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked"
   - Firefox: Go to `about:debugging`, click "Load Temporary Add-on"

3. **Make your changes**
   - Follow the coding standards below
   - Test thoroughly
   - Update documentation if needed

4. **Submit a pull request**
   - Create a descriptive title
   - Explain what changes were made
   - Reference any related issues

#### Coding Standards

- **JavaScript**: Use ES6+ features, follow standard conventions
- **HTML**: Use semantic HTML, proper indentation
- **CSS**: Use consistent naming, avoid inline styles where possible
- **Comments**: Add comments for complex logic
- **Error Handling**: Include proper error handling and logging

#### File Structure

```
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── popup.html            # Popup interface
├── popup.js              # Popup logic
├── icons/                # Extension icons
├── README.md             # Documentation
├── LICENSE               # License file
└── CONTRIBUTING.md       # This file
```

#### Testing

Before submitting:
- Test in Chrome, Edge, and Firefox
- Verify all features work as expected
- Check for console errors
- Test edge cases and error conditions
- Ensure no security vulnerabilities

## 📋 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of changes"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use the provided template
   - Include screenshots if UI changes
   - Reference related issues

## 🐛 Bug Reports

When reporting bugs, please include:

### Required Information
- **Browser**: Chrome/Edge/Firefox version
- **OS**: Windows/Mac/Linux version
- **Extension Version**: Current version number
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens

### Optional Information
- Screenshots or screen recordings
- Console error messages
- Network tab information
- Related issues or discussions

## 💡 Feature Requests

When suggesting features:

### Required Information
- **Use Case**: Why is this feature needed?
- **Description**: Clear description of the feature
- **Acceptance Criteria**: How to know when it's complete
- **Priority**: High/Medium/Low

### Optional Information
- Mockups or wireframes
- Implementation suggestions
- Related features or extensions
- User research or feedback

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email security concerns to: [security@example.com]
3. Include detailed information about the vulnerability
4. Allow time for response before public disclosure

## 📝 Documentation

When contributing documentation:

- Use clear, concise language
- Include code examples where helpful
- Update related sections
- Follow the existing style guide
- Test all instructions

## 🏷️ Release Process

Releases are managed by maintainers:

1. Version numbers follow semantic versioning
2. Changelog is updated for each release
3. Releases are tagged in Git
4. Chrome Web Store is updated (when applicable)

## ❓ Questions?

If you have questions about contributing:

- Check existing issues and discussions
- Create a new issue with the "question" label
- Contact maintainers directly

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or inappropriate comments
- Personal attacks or political discussions
- Public or private harassment
- Publishing private information without permission
- Other unprofessional conduct

### Enforcement

Project maintainers will:
- Remove inappropriate content
- Warn or ban repeat offenders
- Report serious violations to appropriate authorities

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to the USF Preschool Autopay Extension! 🎉
